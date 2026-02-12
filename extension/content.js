// ================================
// TES – Training Efficiency Score
// UI v1.0 mock module
// ================================

(function () {
  const TES_ID = "tes-module";
  const TES_STYLE_ID = "tes-module-style";

  const TES_CONFIG = {
    version: "v1.0",
    status: "MOCK",
    score: 99,
    breakdown: {
      formFactor: "+12%",
      staminaFactor: "+8%",
      primarySkillWeight: "High",
    },
  };

  function isPlayerDetailsPage() {
    const path = (window.location.pathname || "").toLowerCase();
    return path.includes("/club/players/player.aspx");
  }

  function removeExistingTES() {
    const old = document.getElementById(TES_ID);
    if (old) old.remove();
  }

  function clampScore(value) {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function getScoreColor(score) {
    if (score <= 49) return "#a33";
    if (score <= 74) return "#d9822b";
    if (score <= 89) return "#2c7a2c";
    return "#1b5e20";
  }

  function ensureStyle() {
    if (document.getElementById(TES_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = TES_STYLE_ID;
    style.textContent = `
      #tes-module {
        border: 1px solid #cfcfcf;
        background: #ffffff;
        padding: 12px;
        margin: 10px 0;
        width: 100%;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 13px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      #tes-module .tes-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      #tes-module .tes-title {
        font-weight: bold;
        color: #2d2d2d;
      }

      #tes-module .tes-version {
        font-size: 11px;
        color: #777;
      }

      #tes-module .tes-main {
        display: flex;
        gap: 15px;
        align-items: center;
      }

      #tes-module .tes-score-block {
        text-align: center;
        min-width: 56px;
      }

      #tes-module .tes-score-value {
        font-size: 28px;
        font-weight: bold;
        line-height: 1;
      }

      #tes-module .tes-score-label {
        font-size: 11px;
        color: #555;
      }

      #tes-module .tes-bar-wrapper {
        flex: 1;
        min-width: 200px;
      }

      #tes-module .tes-bar-bg {
        width: 200px;
        max-width: 100%;
        height: 10px;
        background: #e5e5e5;
        position: relative;
      }

      #tes-module .tes-bar-fill {
        height: 100%;
        background: linear-gradient(to right, #7bbf6a, #2c7a2c);
      }

      #tes-module .tes-bar-scale {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #777;
        margin-top: 3px;
      }

      #tes-module .tes-details {
        margin-top: 10px;
        border-top: 1px solid #eee;
        padding-top: 6px;
      }

      #tes-module .tes-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-bottom: 2px;
      }

      #tes-module .tes-footer {
        margin-top: 6px;
        text-align: right;
      }

      #tes-module .tes-status.mock {
        font-size: 10px;
        color: #a33;
      }

      #tes-module .tes-status.live {
        font-size: 10px;
        color: #2c7a2c;
      }

      @media (max-width: 500px) {
        #tes-module .tes-main {
          flex-direction: column;
          align-items: flex-start;
        }

        #tes-module .tes-bar-wrapper {
          width: 100%;
          min-width: 0;
        }

        #tes-module .tes-bar-bg {
          width: 100%;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function createTESModule() {
    const score = clampScore(TES_CONFIG.score);
    const scoreColor = getScoreColor(score);

    const wrapper = document.createElement("div");
    wrapper.id = TES_ID;

    const statusClass = TES_CONFIG.status.toLowerCase() === "live" ? "live" : "mock";
    const statusText = statusClass === "live" ? "LIVE MODE" : "MOCK MODE";

    wrapper.innerHTML = `
      <div class="tes-header">
        <span class="tes-title">Training Efficiency Score</span>
        <span class="tes-version">${TES_CONFIG.version}</span>
      </div>

      <div class="tes-main">
        <div class="tes-score-block">
          <div class="tes-score-value" style="color: ${scoreColor};">${score}</div>
          <div class="tes-score-label">TES</div>
        </div>

        <div class="tes-bar-wrapper">
          <div class="tes-bar-bg">
            <div class="tes-bar-fill" style="width: ${score}%;"></div>
          </div>
          <div class="tes-bar-scale">
            <span>0</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      <div class="tes-details">
        <div class="tes-row">
          <span>Form factor</span>
          <span>${TES_CONFIG.breakdown.formFactor}</span>
        </div>
        <div class="tes-row">
          <span>Stamina factor</span>
          <span>${TES_CONFIG.breakdown.staminaFactor}</span>
        </div>
        <div class="tes-row">
          <span>Primary skill weight</span>
          <span>${TES_CONFIG.breakdown.primarySkillWeight}</span>
        </div>
      </div>

      <div class="tes-footer">
        <span class="tes-status ${statusClass}">${statusText}</span>
      </div>
    `;

    return wrapper;
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

  function attachFallback(module) {
    const content = document.querySelector("#main, #ctl00_cpContent, .main, #content");
    if (content) {
      content.prepend(module);
      return;
    }

    if (document.body) {
      document.body.prepend(module);
    }
  }

  function injectTES() {
    removeExistingTES();
    if (!isPlayerDetailsPage()) return;

    ensureStyle();
    const module = createTESModule();

    const psicoTSI = findPsicoTSIBlock();
    if (psicoTSI && psicoTSI.parentNode) {
      psicoTSI.parentNode.insertBefore(module, psicoTSI);
      return;
    }

    const tabs = findTabsBlock();
    if (tabs && tabs.parentNode) {
      tabs.parentNode.insertBefore(module, tabs);
      return;
    }

    attachFallback(module);
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

  console.log("[TES] module loaded", window.location.href, "playerPage:", isPlayerDetailsPage());
})();
