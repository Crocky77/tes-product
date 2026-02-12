// ================================
// TES PRO – Training Efficiency Score
// NT Analytics Panel (UI/Mock engine)
// ================================

(function () {
  const TES_ID = "tes-module";
  const TES_STYLE_ID = "tes-module-style";

  const TES_MODES = {
    MOCK: "MOCK",
    FREE_TRACKER: "FREE_TRACKER",
    GLOBAL_PRO: "GLOBAL_PRO",
    GLOBAL_FREE: "GLOBAL_FREE",
  };

  // Runtime mode switch (for now without API / billing integration).
  const TES_RUNTIME = {
    mode: TES_MODES.MOCK,
    version: "v1.0 PRO",
    trendPercent: 0,
  };

  function isPlayerDetailsPage() {
    const path = (window.location.pathname || "").toLowerCase();
    return path.includes("/club/players/player.aspx");
  }

  function removeExistingTES() {
    const old = document.getElementById(TES_ID);
    if (old) old.remove();
  }

  function clamp01(value) {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  function clamp100(value) {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function getScoreColor(score) {
    if (score <= 49) return "#c0392b";
    if (score <= 74) return "#e6a23c";
    if (score <= 89) return "#2c7a3f";
    return "#1f5e2e";
  }

  function getClassification(score) {
    if (score >= 90) return "ELITE NT PROFILE";
    if (score >= 80) return "HIGH EFFICIENCY";
    if (score >= 65) return "OPTIMAL DEVELOPMENT";
    if (score >= 45) return "INEFFICIENT TRAINING";
    return "TRAINING WASTE RISK";
  }

  function getROIClass(score) {
    if (score >= 90) return "ELITE ROI";
    if (score >= 75) return "STRONG ROI";
    if (score >= 55) return "STABLE ROI";
    return "LOW ROI";
  }

  function getNTSuitability(ageEfficiencyFactor) {
    if (ageEfficiencyFactor >= 0.85) return "U21 Window";
    if (ageEfficiencyFactor >= 0.65) return "Senior NT Window";
    return "Outside NT Peak";
  }

  function getBarColor(value01) {
    const percent = value01 * 100;
    if (percent >= 80) return "#1f5e2e";
    if (percent >= 60) return "#2c7a3f";
    if (percent >= 40) return "#e6a23c";
    return "#c0392b";
  }

  function ensureStyle() {
    if (document.getElementById(TES_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = TES_STYLE_ID;
    style.textContent = `
      #tes-module {
        border: 1px solid #c7d6cb;
        background: #ffffff;
        padding: 10px;
        margin: 10px 0;
        width: 100%;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #233128;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      #tes-module .tes-title-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 1px solid #dbe6df;
        padding-bottom: 6px;
        margin-bottom: 8px;
      }

      #tes-module .tes-title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: #1f5e2e;
        text-transform: uppercase;
      }

      #tes-module .tes-version {
        font-size: 11px;
        color: #5d6f62;
        font-weight: 600;
      }

      #tes-module .tes-kpi-grid {
        display: grid;
        grid-template-columns: 90px 1fr 90px;
        gap: 8px;
        align-items: center;
        background: #e9f2ec;
        border: 1px solid #d4e2d8;
        padding: 8px;
      }

      #tes-module .tes-score {
        font-size: 34px;
        font-weight: 800;
        line-height: 1;
      }

      #tes-module .tes-score-label {
        font-size: 10px;
        color: #5d6f62;
        margin-top: 2px;
      }

      #tes-module .tes-classification {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #1f5e2e;
      }

      #tes-module .tes-trend {
        font-size: 12px;
        font-weight: 700;
        text-align: right;
      }

      #tes-module .tes-trend.up { color: #1f5e2e; }
      #tes-module .tes-trend.down { color: #c0392b; }
      #tes-module .tes-trend.neutral { color: #5d6f62; }

      #tes-module .tes-core {
        margin-top: 10px;
      }

      #tes-module .tes-section-title {
        font-size: 11px;
        font-weight: 700;
        color: #30453a;
        text-transform: uppercase;
        margin-bottom: 6px;
      }

      #tes-module .tes-factor-row {
        display: grid;
        grid-template-columns: 145px 1fr 70px;
        gap: 8px;
        align-items: center;
        margin-bottom: 5px;
      }

      #tes-module .tes-factor-name {
        font-size: 11px;
        color: #33453b;
      }

      #tes-module .tes-bar-bg {
        height: 8px;
        background: #edf3ef;
        border: 1px solid #d8e3dc;
      }

      #tes-module .tes-bar-fill {
        height: 100%;
      }

      #tes-module .tes-factor-impact {
        text-align: right;
        font-size: 11px;
        font-weight: 700;
      }

      #tes-module .tes-advanced {
        margin-top: 10px;
        border-top: 1px solid #dbe6df;
        padding-top: 8px;
        position: relative;
      }

      #tes-module .tes-diagnostic-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
      }

      #tes-module .tes-footer {
        margin-top: 8px;
        text-align: right;
      }

      #tes-module .tes-status {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      #tes-module .tes-status.mock { color: #c0392b; }
      #tes-module .tes-status.free-tracker { color: #2c7a3f; }
      #tes-module .tes-status.global-pro { color: #1f5e2e; }
      #tes-module .tes-status.global-free { color: #5d6f62; }

      #tes-module .tes-lock {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px dashed #c7d6cb;
        font-size: 11px;
        font-weight: 700;
        color: #41554a;
      }

      @media (max-width: 500px) {
        #tes-module .tes-kpi-grid {
          grid-template-columns: 1fr;
        }

        #tes-module .tes-trend {
          text-align: left;
        }

        #tes-module .tes-factor-row {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        #tes-module .tes-factor-impact {
          text-align: left;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function buildModel() {
    // Current version (without API) – calibrated mock inputs.
    const factors = {
      TrainingIntensityFactor: clamp01(0.95),
      AgeEfficiencyFactor: clamp01(0.88),
      StaminaAllocationFactor: clamp01(0.72),
      PrimarySkillAlignmentFactor: clamp01(0.92),
      MinutesFactor: clamp01(0.96),
    };

    const weighted =
      factors.TrainingIntensityFactor * 0.25 +
      factors.AgeEfficiencyFactor * 0.2 +
      factors.StaminaAllocationFactor * 0.15 +
      factors.PrimarySkillAlignmentFactor * 0.25 +
      factors.MinutesFactor * 0.15;

    const score = Math.round(clamp100(weighted * 100));

    const coreFactorRows = [
      {
        name: "Training Impact",
        value01: factors.TrainingIntensityFactor,
        impact: `+${Math.round(factors.TrainingIntensityFactor * 15)}%`,
      },
      {
        name: "Age Curve Efficiency",
        value01: factors.AgeEfficiencyFactor,
        impact: `+${Math.round(factors.AgeEfficiencyFactor * 13)}%`,
      },
      {
        name: "Stamina Allocation",
        value01: factors.StaminaAllocationFactor,
        impact: `+${Math.round(factors.StaminaAllocationFactor * 10)}%`,
      },
      {
        name: "Primary Skill Focus",
        value01: factors.PrimarySkillAlignmentFactor,
        impact: factors.PrimarySkillAlignmentFactor >= 0.8 ? "Optimal" : "Partial",
      },
      {
        name: "Training Minutes",
        value01: factors.MinutesFactor,
        impact: `${Math.round(factors.MinutesFactor * 100)}%`,
      },
    ];

    return {
      score,
      factors,
      coreFactorRows,
      classification: getClassification(score),
      roiClass: getROIClass(score),
      ntSuitability: getNTSuitability(factors.AgeEfficiencyFactor),
    };
  }

  function getTrendData(mode) {
    if (mode === TES_MODES.GLOBAL_PRO || mode === TES_MODES.FREE_TRACKER) {
      const t = TES_RUNTIME.trendPercent;
      if (t > 0) return { label: `↑ +${t.toFixed(1)}%`, cls: "up" };
      if (t < 0) return { label: `↓ ${t.toFixed(1)}%`, cls: "down" };
      return { label: "→ 0.0%", cls: "neutral" };
    }

    if (mode === TES_MODES.MOCK) {
      return { label: "→ MOCK", cls: "neutral" };
    }

    return { label: "—", cls: "neutral" };
  }

  function getStatus(mode) {
    if (mode === TES_MODES.MOCK) return { text: "MOCK MODE", cls: "mock" };
    if (mode === TES_MODES.FREE_TRACKER) return { text: "TRACKER FREE MODE", cls: "free-tracker" };
    if (mode === TES_MODES.GLOBAL_PRO) return { text: "GLOBAL PRO ACTIVE", cls: "global-pro" };
    return { text: "FREE MODE", cls: "global-free" };
  }

  function createFactorRow(row) {
    const barColor = getBarColor(row.value01);
    const width = Math.round(row.value01 * 100);

    return `
      <div class="tes-factor-row">
        <div class="tes-factor-name">${row.name}</div>
        <div class="tes-bar-bg">
          <div class="tes-bar-fill" style="width: ${width}%; background: ${barColor};"></div>
        </div>
        <div class="tes-factor-impact">${row.impact}</div>
      </div>
    `;
  }

  function createTESModule() {
    const model = buildModel();
    const scoreColor = getScoreColor(model.score);
    const trend = getTrendData(TES_RUNTIME.mode);
    const status = getStatus(TES_RUNTIME.mode);

    const isLimited = TES_RUNTIME.mode === TES_MODES.GLOBAL_FREE;
    const factorsToRender = isLimited ? model.coreFactorRows.slice(0, 2) : model.coreFactorRows;

    const wrapper = document.createElement("div");
    wrapper.id = TES_ID;

    wrapper.innerHTML = `
      <div class="tes-title-row">
        <span class="tes-title">Training Efficiency Score</span>
        <span class="tes-version">${TES_RUNTIME.version}</span>
      </div>

      <div class="tes-kpi-grid">
        <div>
          <div class="tes-score" style="color: ${scoreColor};">${model.score}</div>
          <div class="tes-score-label">TES SCORE</div>
        </div>

        <div class="tes-classification">${model.classification}</div>

        <div class="tes-trend ${trend.cls}">${trend.label}</div>
      </div>

      <div class="tes-core">
        <div class="tes-section-title">Core Factors</div>
        ${factorsToRender.map(createFactorRow).join("")}
      </div>

      <div class="tes-advanced">
        <div class="tes-section-title">Development Diagnostics</div>
        <div class="tes-diagnostic-row"><span>Age Efficiency Ratio</span><span>${Math.round(model.factors.AgeEfficiencyFactor * 100)}%</span></div>
        <div class="tes-diagnostic-row"><span>Skill Growth Projection</span><span>~4.2 weeks (mock)</span></div>
        <div class="tes-diagnostic-row"><span>Efficiency Classification</span><span>${model.roiClass}</span></div>
        <div class="tes-diagnostic-row"><span>NT Suitability Flag</span><span>${model.ntSuitability}</span></div>
        ${isLimited ? '<div class="tes-lock">Upgrade to PRO</div>' : ""}
      </div>

      <div class="tes-footer">
        <span class="tes-status ${status.cls}">${status.text}</span>
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

  console.log("[TES] PRO panel loaded", window.location.href, "playerPage:", isPlayerDetailsPage(), "mode:", TES_RUNTIME.mode);
})();
