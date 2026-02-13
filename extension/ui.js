(function (global) {
  const PANEL_ID = "tes-module";
  const STYLE_ID = "tes-module-style";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #tes-module {
        border: 1px solid #c7d6cb;
        background: #fff;
        margin: 10px 0;
        padding: 10px;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #223229;
      }
      #tes-module .tes-head { display:flex; justify-content:space-between; gap:10px; margin-bottom:8px; }
      #tes-module .tes-title { font-size:13px; font-weight:700; text-transform:uppercase; color:#1f5e2e; }
      #tes-module .tes-subtitle { font-size:10px; color:#5b6b61; margin-top:2px; }
      #tes-module .tes-version { color:#5d6f62; font-size:11px; font-weight:700; white-space:nowrap; }
      #tes-module .tes-info { color:#5d6f62; margin-left:6px; cursor:help; }

      #tes-module .tes-score-wrap {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:14px;
        border:1px solid #d4e2d8;
        background:#e9f2ec;
        padding:8px;
      }
      #tes-module .tes-score-left { display:flex; gap:12px; align-items:center; }
      #tes-module .tes-score { font-size:34px; font-weight:800; line-height:1; }
      #tes-module .tes-score-label { font-size:10px; color:#5d6f62; }
      #tes-module .tes-tier { font-weight:700; text-transform:uppercase; }
      #tes-module .tes-tier-sub { font-size:10px; color:#5d6f62; }

      #tes-module .tes-section { margin-top:10px; border-top:1px solid #dbe6df; padding-top:8px; }
      #tes-module .tes-section-title { font-size:11px; font-weight:700; text-transform:uppercase; color:#30453a; }
      #tes-module .tes-section-desc { font-size:10px; color:#627269; margin-top:2px; margin-bottom:6px; }

      #tes-module .tes-factor { margin-bottom:6px; }
      #tes-module .tes-factor-row { display:flex; justify-content:space-between; gap:8px; align-items:center; }
      #tes-module .tes-factor-name { font-weight:700; }
      #tes-module .tes-factor-help { font-size:10px; color:#627269; margin-top:2px; }
      #tes-module .tes-factor-value { font-weight:700; white-space:nowrap; }

      #tes-module .tes-bar-bg { height:8px; background:#edf3ef; border:1px solid #d8e3dc; margin-top:4px; }
      #tes-module .tes-bar-fill { height:100%; background:linear-gradient(to right,#8ebd94,#2c7a3f); }

      #tes-module .tes-grid .tes-row { display:flex; justify-content:space-between; margin-bottom:3px; }
      #tes-module .tes-label { color:#4a5c52; }
      #tes-module .tes-value { font-weight:700; }
      #tes-module .ok { color:#1f5e2e; }
      #tes-module .bad { color:#c0392b; }

      #tes-module details { margin-top:8px; }
      #tes-module summary { cursor:pointer; font-weight:700; }
      #tes-module .tes-note { margin-top:8px; text-align:right; font-size:10px; color:#5d6f62; }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function scoreColor(score) {
    if (score >= 90) return "#1f5e2e";
    if (score >= 80) return "#2c7a3f";
    if (score >= 70) return "#7b9f2a";
    if (score >= 60) return "#e6a23c";
    return "#c0392b";
  }

  function removePanel() {
    const old = document.getElementById(PANEL_ID);
    if (old) old.remove();
  }

  function factorBlock(name, desc, valueLabel, valuePct) {
    const bar = Math.max(0, Math.min(100, Number(valuePct) || 0));
    return `
      <div class="tes-factor">
        <div class="tes-factor-row">
          <span class="tes-factor-name">${name}</span>
          <span class="tes-factor-value">${valueLabel}</span>
        </div>
        <div class="tes-factor-help">${desc}</div>
        <div class="tes-bar-bg"><div class="tes-bar-fill" style="width:${bar}%;"></div></div>
      </div>
    `;
  }

  function createPanel(result) {
    const wrap = document.createElement("div");
    wrap.id = PANEL_ID;

    const tooltip = "TES (Talent Evaluation Score) analyzes visible player attributes and produces a normalized performance score based on positional contribution and age comparison. TES does not simulate training, predict skill increases, or calculate development schedules. TES is a benchmarking and evaluation tool only.";

    const positionLong = {
      GK: "Goalkeeper (GK)",
      CD: "Central Defender (CD)",
      WB: "Wing Back (WB)",
      IM: "Inner Midfielder (IM)",
      W: "Winger (W)",
      FW: "Forward (FW)",
    }[result.primaryPosition] || result.primaryPosition;

    wrap.innerHTML = `
      <div class="tes-head">
        <div>
          <div class="tes-title">TES – Talent Evaluation Score <span class="tes-info" title="${tooltip}">ⓘ</span></div>
          <div class="tes-subtitle">Positional Performance & Age Benchmark Analysis</div>
        </div>
        <div class="tes-version">v1.0 PRO</div>
      </div>

      <div class="tes-score-wrap">
        <div class="tes-score-left">
          <div>
            <div class="tes-score" style="color:${scoreColor(result.tesScore)}">${result.tesScore}</div>
            <div class="tes-score-label">TES SCORE</div>
          </div>
        </div>
        <div>
          <div class="tes-tier">${result.performanceTier}</div>
          <div class="tes-tier-sub">NT Benchmark Level</div>
        </div>
      </div>

      <div class="tes-section">
        <div class="tes-section-title">Performance Factors</div>
        <div class="tes-section-desc">Breakdown of positional contribution and age-adjusted evaluation metrics.</div>

        ${factorBlock(
          "Positional Impact",
          "Normalized contribution strength for detected primary position.",
          `+${result.factors.positionalImpact}%`,
          result.factors.positionalImpact
        )}

        ${factorBlock(
          "Age Efficiency Index",
          "Comparison of current performance against age-based benchmark values.",
          `${result.factors.ageEfficiencyIndex}%`,
          result.factors.ageEfficiencyIndex
        )}

        ${factorBlock(
          "Skill Structure Balance",
          "Distribution quality of primary and secondary skills for detected position.",
          result.factors.skillStructureBalanceLabel,
          result.factors.skillStructureBalanceValue
        )}

        ${factorBlock(
          "Physical Readiness",
          "Evaluation of visible stamina and form in relation to positional demands.",
          result.factors.physicalReadinessLabel,
          result.factors.physicalReadinessValue
        )}

        ${factorBlock(
          "Match Utilization",
          "Assessment based on recent match participation history.",
          result.factors.matchUtilizationLabel,
          result.factors.matchUtilizationValue
        )}
      </div>

      <div class="tes-section tes-grid">
        <div class="tes-section-title">Performance Diagnostics</div>
        <div class="tes-section-desc">Advanced analytical indicators based on current player state.</div>

        <div class="tes-row"><span class="tes-label">Primary Position</span><span class="tes-value">${positionLong}</span></div>
        <div class="tes-section-desc">Detected via highest normalized contribution value.</div>

        <div class="tes-row"><span class="tes-label">Age Benchmark Ratio</span><span class="tes-value">${result.factors.ageEfficiencyIndex}%</span></div>
        <div class="tes-row"><span class="tes-label">Evaluation Tier</span><span class="tes-value">${result.evaluationTier}</span></div>
        <div class="tes-row"><span class="tes-label">Competitive Window</span><span class="tes-value">${result.competitiveWindow}</span></div>
        <div class="tes-row"><span class="tes-label">U21 Target Fit</span><span class="tes-value">${result.targetFit?.u21Score ?? 0}%${result.targetFit?.u21Profile ? ` · ${result.targetFit.u21Profile}` : ""}</span></div>
        <div class="tes-row"><span class="tes-label">NT Target Fit</span><span class="tes-value">${result.targetFit?.ntScore ?? 0}%${result.targetFit?.ntProfile ? ` · ${result.targetFit.ntProfile}` : ""}</span></div>
        <div class="tes-row"><span class="tes-label">NT Minimum</span><span class="tes-value ${result.meetsMinimum ? "ok" : "bad"}">${result.minBenchmark.toFixed(2)} ${result.meetsMinimum ? "✓" : "✕"}</span></div>
      </div>

      <details>
        <summary>Advanced Metrics</summary>
        <div class="tes-grid" style="margin-top:6px;">
          <div class="tes-row"><span class="tes-label">Raw Contribution Value</span><span class="tes-value">${result.realContribution.toFixed(2)}</span></div>
          <div class="tes-row"><span class="tes-label">Age-adjusted Benchmark Value</span><span class="tes-value">${result.minBenchmark.toFixed(2)}</span></div>
          <div class="tes-row"><span class="tes-label">Normalized Contribution Score</span><span class="tes-value">${result.advanced.normalizedContributionScore}%</span></div>
          <div class="tes-row"><span class="tes-label">Secondary Position Score</span><span class="tes-value">${result.advanced.secondaryPositionScore.toFixed(2)}</span></div>
          <div class="tes-row"><span class="tes-label">Elite Benchmark</span><span class="tes-value">${result.eliteBenchmark.toFixed(2)}</span></div>
        </div>
      </details>

      <div class="tes-note">Evaluation-only analytics • CHPP compliant</div>
    `;

    return wrap;
  }

  global.TESUI = {
    ensureStyle,
    removePanel,
    createPanel,
  };
})(window);
