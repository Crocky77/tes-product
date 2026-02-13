// ================================
// TES – Talent Evaluation Score
// CHPP-compliant evaluation snapshot
// ================================

(function () {
  const PLAYER_PAGE_PATH = "/club/players/player.aspx";
  const BENCHMARKS_URL = chrome.runtime.getURL("benchmarks.json");
  const U21_TARGETS_URL = chrome.runtime.getURL("u21_targets.json");
  const NT_TARGETS_URL = chrome.runtime.getURL("nt_targets.json");
  const PANEL_ID = "tes-module";

  let lastRenderKey = "";
  let resourceCache = null;

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

    const shortHr = text.match(/(\d+)\s*godin[aie]?/i);
    if (shortHr) {
      const years = Number(shortHr[1]);
      if (Number.isFinite(years)) return years;
    }

    return null;
  }

  function normalizePosition(raw) {
    if (!raw) return null;
    const key = raw.trim().toLowerCase();

    if (/vrat|goal/.test(key)) return "GK";
    if (/stoper|bran|defend|central defender/.test(key)) return "CD";
    if (/wingback|boč|boc|bek/.test(key)) return "WB";
    if (/krilo|winger/.test(key)) return "W";
    if (/vez|mid/.test(key)) return "IM";
    if (/napad|strik|forward|attacker/.test(key)) return "FW";

    return null;
  }

  function parseContributionByPositionFromTable(values) {
    const headings = [...document.querySelectorAll("h2,h3,h4,.boxTitle")];
    const contribHeading = headings.find((h) => /doprinos\s+pozicije|position\s+contribution/i.test(h.textContent || ""));

    let scope = null;
    if (contribHeading) {
      scope = contribHeading.closest("div") || contribHeading.parentElement;
    }

    const rows = (scope || document).querySelectorAll("table tr");

    for (const row of rows) {
      const cells = row.querySelectorAll("th, td");
      if (cells.length < 2) continue;

      const posText = (cells[0].textContent || "").trim();
      const pos = normalizePosition(posText);
      if (!pos) continue;

      const numMatch = (cells[1].textContent || "").match(/(\d+[.,]\d+)/);
      if (!numMatch) continue;

      const value = Number(numMatch[1].replace(",", "."));
      if (!Number.isFinite(value)) continue;

      values[pos] = Math.max(values[pos] || 0, value);
    }
  }

  function parseContributionByPositionFromText(text, values) {
    const regex = /(vratar|stoper|branič|branic|wingback|bek|krilo|vezni|napadač|napadac|goalkeeper|defender|midfielder|winger|forward)\s*[\-:]?\s*(\d+[.,]\d+)/gi;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const pos = normalizePosition(m[1]);
      const value = Number(m[2].replace(",", "."));
      if (pos && Number.isFinite(value)) values[pos] = Math.max(values[pos] || 0, value);
    }

    const bestPosMatch = text.match(/najbolja\s+pozicija\s*:\s*([^\n(]+)\((\d+[.,]\d+)\)/i);
    if (bestPosMatch) {
      const pos = normalizePosition(bestPosMatch[1]);
      const value = Number(bestPosMatch[2].replace(",", "."));
      if (pos && Number.isFinite(value)) values[pos] = Math.max(values[pos] || 0, value);
    }
  }

  function parseContributionByPosition(text) {
    const values = {};
    parseContributionByPositionFromTable(values);
    parseContributionByPositionFromText(text, values);
    return Object.keys(values).length ? values : null;
  }

  function parseSkillNumbers(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    const skillMap = {
      goalkeeping: /na\s+vratima|goalkeeping/i,
      defending: /obrana|defending/i,
      playmaking: /kreiranje|playmaking/i,
      winger: /krilo|winger/i,
      passing: /proigravanje|passing/i,
      scoring: /napad|scoring/i,
      setPieces: /prekid|set\s*pieces?/i,
      stamina: /izdr[žz]ljivost|stamina/i,
      form: /forma|form/i,
    };

    const result = {};

    for (const line of lines) {
      for (const [key, rx] of Object.entries(skillMap)) {
        if (!rx.test(line)) continue;
        const m = line.match(/(\d{1,2})\s*$/);
        if (m) {
          const val = Number(m[1]);
          if (Number.isFinite(val)) result[key] = val;
        }
      }
    }

    return result;
  }

  function parseMinutesRatio(text) {
    const rows = [...text.matchAll(/\((\d{1,3})'\)/g)];
    if (!rows.length) return null;

    const last5 = rows.slice(-5).map((m) => Number(m[1])).filter(Number.isFinite);
    if (!last5.length) return null;

    const avg = last5.reduce((a, b) => a + b, 0) / last5.length;
    return avg / 90;
  }

  async function loadResources() {
    if (resourceCache) return resourceCache;

    const [benchRes, u21Res, ntRes] = await Promise.all([
      fetch(BENCHMARKS_URL),
      fetch(U21_TARGETS_URL),
      fetch(NT_TARGETS_URL),
    ]);

    if (!benchRes.ok) throw new Error("Failed to load benchmarks.json");
    if (!u21Res.ok) throw new Error("Failed to load u21_targets.json");
    if (!ntRes.ok) throw new Error("Failed to load nt_targets.json");

    resourceCache = {
      benchmarks: await benchRes.json(),
      u21Targets: await u21Res.json(),
      ntTargets: await ntRes.json(),
    };

    return resourceCache;
  }

  function findPsicoTSIBlock() {
    const headers = document.querySelectorAll("h3, h2, .boxTitle");
    for (const h of headers) {
      const headerText = (h.textContent || "").toLowerCase();
      if (headerText.includes("psicotsi")) return h.closest("div");
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

  function stableRender(result) {
    const key = JSON.stringify({
      p: result.primaryPosition,
      c: result.realContribution,
      a: Number(result.age.toFixed(2)),
      s: result.tesScore,
      t: result.performanceTier,
    });

    if (key === lastRenderKey && document.getElementById(PANEL_ID)) {
      return;
    }

    lastRenderKey = key;
    window.TESUI.removePanel();
    attachPanel(window.TESUI.createPanel(result));
  }

  async function injectTES() {
    if (!isPlayerDetailsPage()) {
      window.TESUI.removePanel();
      lastRenderKey = "";
      return;
    }

    const text = document.body ? document.body.innerText : "";
    const ageYears = parseAgeYears(text);
    const contributionByPosition = parseContributionByPosition(text);
    const skills = parseSkillNumbers(text);
    const minutesRatio = parseMinutesRatio(text);

    if (!Number.isFinite(ageYears) || !contributionByPosition) return;

    const { benchmarks, u21Targets, ntTargets } = await loadResources();
    const result = window.TESEngine.calculateTES(
      {
        ageYears,
        contributionByPosition,
        skills,
        stamina: skills.stamina,
        form: skills.form,
        minutesRatio,
      },
      benchmarks,
      { u21: u21Targets, nt: ntTargets }
    );

    if (!result) return;

    window.TESUI.ensureStyle();
    stableRender(result);
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
    }, 160);
  }

  const observer = new MutationObserver((mutations) => {
    const externalChange = mutations.some((m) => {
      const t = m.target;
      return !(t && t.closest && t.closest(`#${PANEL_ID}`));
    });

    if (externalChange) scheduleInject();
  });

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
