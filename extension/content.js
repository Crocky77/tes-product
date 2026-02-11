// ================================
// TES – Training Efficiency Score
// Stable content script for Hattrick
// ================================

(function () {
  const TES_ID = "tes-widget";
  const TES_VALUE = "99 (mock)";

  // ---------- helpers ----------

  function removeExistingTES() {
    const old = document.getElementById(TES_ID);
    if (old) old.remove();
  }

  function createTESBlock() {
    const wrapper = document.createElement("div");
    wrapper.id = TES_ID;
    wrapper.style.margin = "8px 0";
    wrapper.style.padding = "6px 10px";
    wrapper.style.border = "1px solid #c88";
    wrapper.style.background = "#fff5f5";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "10px";
    wrapper.style.maxWidth = "420px";

    const label = document.createElement("strong");
    label.textContent = "TES";
    label.style.color = "#b00000";

    const value = document.createElement("span");
    value.textContent = TES_VALUE;
    value.style.border = "1px solid #c88";
    value.style.padding = "2px 6px";
    value.style.background = "#fff";
    value.style.fontWeight = "bold";

    wrapper.appendChild(label);
    wrapper.appendChild(value);

    return wrapper;
  }

  // ---------- anchor detection ----------

  function findPsicoTSIBlock() {
    // Foxtrick PsicoTSI block has a stable table header structure
    const headers = document.querySelectorAll("h3, h2, .boxTitle");
    for (const h of headers) {
      if (h.textContent && h.textContent.toLowerCase().includes("psicotsi")) {
        return h.closest("div");
      }
    }
    return null;
  }

  function findTabsBlock() {
    // Tabs block (Utakmice / Transferi / ...)
    const tabs = document.querySelector("table.tabs, ul.tabs, .tabs");
    return tabs;
  }

  // ---------- injection logic ----------

  function injectTES() {
    removeExistingTES();

    const tesBlock = createTESBlock();

    // 1️⃣ PRIMARY: above PsicoTSI (Foxtrick ON)
    const psicoTSI = findPsicoTSIBlock();
    if (psicoTSI && psicoTSI.parentNode) {
      psicoTSI.parentNode.insertBefore(tesBlock, psicoTSI);
      return;
    }

    // 2️⃣ FALLBACK: above tabs (Foxtrick OFF)
    const tabs = findTabsBlock();
    if (tabs && tabs.parentNode) {
      tabs.parentNode.insertBefore(tesBlock, tabs);
      return;
    }

    // 3️⃣ LAST RESORT: do nothing (fail safe)
  }

  // ---------- observers ----------

  let scheduled = false;
  function scheduleInject() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      injectTES();
    }, 50);
  }

  const observer = new MutationObserver(scheduleInject);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // initial run
  scheduleInject();
})();
