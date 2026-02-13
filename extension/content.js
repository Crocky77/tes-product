// ================================
// TES – Talent Evaluation Score
// CHPP-compliant evaluation snapshot
// ================================

(function () {
  const PLAYER_PAGE_PATH = "/club/players/player.aspx";
  const BENCHMARKS_URL = chrome.runtime.getURL("benchmarks.json");

  function isPlayerDetailsPage() {
    return (window.location.pathname || "").toLowerCase().includes(PLAYER_PAGE_PATH);
  }

  function parseAgeYears(text) {
    const hr = text.match(/(\d+)\s*godin[aie]?\s*i\s*(\d+)\s*dana/i);
    if (hr) {
      const years = Number(hr[1]);
      const days = Number(hr[2]);
      if (Number.isFinite(years) && Number.isFinite(days)) return years + days / 112;
    }

    const en = text.match(/(\d+)\s*years?\s*and\s*(\d+)\s*days?/i);
    if (en) {
      const years = Number(en[1]);
      const days = Number(en[2]);
      if (Number.isFinite(years) && Number.isFinite(days)) return years + days / 112;
    }

    return null;
  }

  function normalizePosition(raw) {
    if (!raw) return null;
    const key = raw.trim().toLowerCase();

    if (/vrat|goal/.test(key)) return "GK";
    if (/stoper|bran|defend/.test(key)) return "CD";
    if (/wingback|boč|boc/.test(key)) return "WB";
    if (/krilo|winger/.test(key)) return "W";
    if (/vez|mid/.test(key)) return "IM";
    if (/napad|strik|forward/.test(key)) return "FW";

    return null;
  }

  function parseContributionByPosition(text) {
    const values = {};

    const bestPosMatch = text.match(/najbolja\s+pozicija\s*:\s*([^\n(]+)\((\d+[.,]\d+)\)/i);
    if (bestPosMatch) {
      const pos = normalizePosition(bestPosMatch[1]);
      const value = Number(bestPosMatch[2].replace(",", "."));
      if (pos && Number.isFinite(value)) values[pos] = value;
    }

    // Optional secondary extraction from lines: "<position> (x.xx)"
    const regex = /(vratar|stoper|branič|branic|wingback|krilo|vezni|napadač|napadac|goalkeeper|defender|midfielder|winger|forward)\s*\((\d+[.,]\d+)\)/gi;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const pos = normalizePosition(m[1]);
      const value = Number(m[2].replace(",", "."));
      if (pos && Number.isFinite(value)) values[pos] = Math.max(values[pos] || 0, value);
    }

    return Object.keys(values).length > 0 ? values : null;
  }

  function levelToScore(level) {
    const map = {
      katastrofalan: 20,
      slab: 40,
      nedovoljan: 55,
      prolazan: 70,
      dobar: 82,
      odlican: 90,
      odličan: 90,
      vrhunski: 96,
      weak: 40,
      inadequate: 55,
      passable: 70,
      solid: 82,
      excellent: 90,
      formidable: 96,
    };
    return map[level.toLowerCase()] ?? null;
  }

  function parsePhysicalSignals(text) {
    const staminaMatch = text.match(/izdr[žz]ljivost\s+([a-zčćžšđ]+)/i);
    const formMatch = text.match(/forma\s+([a-zčćžšđ]+)/i);

    const staminaScore = staminaMatch ? levelToScore(staminaMatch[1]) : null;
    const formScore = formMatch ? levelToScore(formMatch[1]) : null;

    return { staminaScore, formScore };
  }

  function parseMatchUtilizationScore(text) {
    const minutesMatch = text.match(/(\d{2,3})\s*\/\s*90/);
    if (minutesMatch) {
      const val = Number(minutesMatch[1]);
      if (Number.isFinite(val)) return Math.max(0, Math.min(100, Math.round((val / 90) * 100)));
    }
    return null;
  }

  async function loadBenchmarks() {
    const res = await fetch(BENCHMARKS_URL);
    if (!res.ok) throw new Error("Failed to load benchmarks.json");
    return res.json();
  }

  function findPsicoTSIBlock() {
    const headers = document.querySelectorAll("h3, h2, .boxTitle");
    for (const h of headers) {
      const text = (h.textContent || "").toLowerCase();
      if (text.includes("psicotsi")) return h.closest("div");
    }
    return null;
  }

  function findTabsBlock() {
    return document.querySelector("table.tabs, ul.tabs, .tabs");
  }

  function attachPanel(panel) {
    const psicoTSI = findPsicoTSIBlock();
    if (psicoTSI && psicoTSI.parentNode) {
      psicoTSI.parentNode.insertBefore(panel, psicoTSI);
      return;
    }

    const tabs = findTabsBlock();
    if (tabs && tabs.parentNode) {
      tabs.parentNode.insertBefore(panel, tabs);
      return;
    }

    const content = document.querySelector("#main, #ctl00_cpContent, .main, #content");
    if (content) {
      content.prepend(panel);
      return;
    }

    if (document.body) document.body.prepend(panel);
  }

  async function injectTES() {
    window.TESUI.removePanel();
    if (!isPlayerDetailsPage()) return;

    const text = document.body ? document.body.innerText : "";
    const ageYears = parseAgeYears(text);
    const contributionByPosition = parseContributionByPosition(text);
    const { staminaScore, formScore } = parsePhysicalSignals(text);
    const matchUtilizationScore = parseMatchUtilizationScore(text);

    if (!Number.isFinite(ageYears) || !contributionByPosition) return;

    const benchmarks = await loadBenchmarks();
    const result = window.TESEngine.calculateTES(
      { ageYears, contributionByPosition, staminaScore, formScore, matchUtilizationScore },
      benchmarks
    );

    if (!result) return;

    window.TESUI.ensureStyle();
    attachPanel(window.TESUI.createPanel(result));
  }

  let scheduled = false;
  function scheduleInject() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(async () => {
      scheduled = false;
      try {
        await injectTES();
      } catch (err) {
        console.warn("[TES] inject failed", err);
      }
    }, 120);
  }

  const observer = new MutationObserver(scheduleInject);

  function startObserver() {
    if (!document.body) return false;
    observer.observe(document.body, { childList: true, subtree: true });
    return true;
  }

  if (!startObserver()) {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        startObserver();
        scheduleInject();
      },
      { once: true }
    );
  }

  scheduleInject();
})();
