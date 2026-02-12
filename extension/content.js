// ================================
// TES – Training Efficiency Score
// Stable content script for Hattrick
// ================================

(function () {
  const TES_ID = "tes-widget";
  const TES_VALUE = "99 (mock)";


  function isPlayerDetailsPage() {
    const path = (window.location.pathname || "").toLowerCase();
    return path.includes("/club/players/player.aspx");
  }

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
    wrapper.style.borderRadius = "6px";
    wrapper.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
    wrapper.style.zIndex = "2147483647";

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

  function findPsicoTSIBlock() {
    const headers = document.querySelectorAll("h3, h2, .boxTitle");
    for (const h of headers) {
      if (h.textContent && h.textContent.toLowerCase().includes("psicotsi")) {
        return h.closest("div");
      }
    }
    return null;
  }

  function findTabsBlock() {
    return document.querySelector("table.tabs, ul.tabs, .tabs");
  }

  function attachFloatingFallback(tesBlock) {
    tesBlock.style.position = "fixed";
    tesBlock.style.top = "12px";
    tesBlock.style.right = "12px";
    tesBlock.style.margin = "0";

    if (document.body) {
      document.body.appendChild(tesBlock);
    }
  }

  function injectTES() {
    removeExistingTES();

    if (!isPlayerDetailsPage()) return;

    const tesBlock = createTESBlock();

    const psicoTSI = findPsicoTSIBlock();
    if (psicoTSI && psicoTSI.parentNode) {
      psicoTSI.parentNode.insertBefore(tesBlock, psicoTSI);
      return;
    }

    const tabs = findTabsBlock();
    if (tabs && tabs.parentNode) {
      tabs.parentNode.insertBefore(tesBlock, tabs);
      return;
    }

    attachFloatingFallback(tesBlock);
  }

  let scheduled = false;
  function scheduleInject() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      injectTES();
    }, 75);
  }

  const observer = new MutationObserver(scheduleInject);

  function startObserver() {
    if (!document.body) return false;

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
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

  console.log("[TES] content script loaded", window.location.href, "playerPage:", isPlayerDetailsPage());
})();
