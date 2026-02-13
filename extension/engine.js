(function (global) {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function interpolate(points, age) {
    if (!Array.isArray(points) || points.length === 0) return null;

    const sorted = [...points].sort((a, b) => a.age - b.age);
    if (age <= sorted[0].age) return sorted[0].value;
    if (age >= sorted[sorted.length - 1].age) return sorted[sorted.length - 1].value;

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const left = sorted[i];
      const right = sorted[i + 1];
      if (age >= left.age && age <= right.age) {
        const ratio = (age - left.age) / (right.age - left.age);
        return left.value + ratio * (right.value - left.value);
      }
    }

    return null;
  }

  function detectPrimaryPosition(contributionByPosition) {
    const entries = Object.entries(contributionByPosition || {}).filter(
      ([, value]) => Number.isFinite(value)
    );

    if (entries.length === 0) return null;

    entries.sort((a, b) => b[1] - a[1]);
    const [primaryPosition, realContribution] = entries[0];

    const secondaryPosition = entries[1] ? entries[1][0] : primaryPosition;
    const secondaryContribution = entries[1] ? entries[1][1] : realContribution;

    return { primaryPosition, realContribution, secondaryPosition, secondaryContribution };
  }

  function performanceTier(tes) {
    if (tes >= 90) return "Elite Tier";
    if (tes >= 80) return "High Performance";
    if (tes >= 70) return "Competitive Level";
    if (tes >= 60) return "Developing";
    return "Below Benchmark";
  }

  function evaluationTier(tes) {
    if (tes >= 90) return "Elite Tier";
    if (tes >= 80) return "NT Competitive";
    if (tes >= 70) return "High Club Level";
    return "Developmental";
  }

  function competitiveWindow(age) {
    if (age < 22) return "U21 Eligible";
    if (age <= 27.5) return "NT Prime Window";
    if (age <= 31.0) return "Peak Age Range";
    return "Post-Peak Phase";
  }

  function toPercent(value) {
    return Math.round(clamp(value * 100, 0, 100));
  }

  function skillStructureCheck(primaryPosition, skills) {
    const fallback = { score: 0, label: "Balanced" };
    if (!skills) return fallback;

    const { defending = 0, playmaking = 0, passing = 0, scoring = 0, winger = 0 } = skills;

    if (primaryPosition === "CD") {
      if (defending >= 16 && playmaking >= 10 && passing >= 8) return { score: 0, label: "Balanced" };
      if (defending >= 14 && playmaking >= 8 && passing >= 6) return { score: -4, label: "Slight Deviation" };
      return { score: -9, label: "Unbalanced" };
    }

    if (primaryPosition === "IM") {
      // IM with very low defending/winger gets penalized harder at NT level.
      if (playmaking >= 16 && passing >= 10 && defending >= 7 && winger >= 5) {
        return { score: 0, label: "Balanced" };
      }
      if (playmaking >= 14 && passing >= 8 && defending >= 6) {
        return { score: -5, label: "Slight Deviation" };
      }
      return { score: -10, label: "Unbalanced" };
    }

    if (primaryPosition === "FW") {
      if (scoring >= 15 && passing >= 8 && playmaking >= 6) return { score: 0, label: "Balanced" };
      if (scoring >= 13 && passing >= 6) return { score: -4, label: "Slight Deviation" };
      return { score: -8, label: "Unbalanced" };
    }

    if (primaryPosition === "WB" || primaryPosition === "W") {
      if (winger >= 14 && passing >= 8 && defending >= 8) return { score: 0, label: "Balanced" };
      if (winger >= 12 && passing >= 6) return { score: -4, label: "Slight Deviation" };
      return { score: -8, label: "Unbalanced" };
    }

    return fallback;
  }

  function physicalModifier(stamina, form) {
    const s = Number.isFinite(stamina) ? clamp(stamina, 1, 20) : 7;
    const f = Number.isFinite(form) ? clamp(form, 1, 20) : 7;

    const weighted = s * 0.45 + f * 0.55;
    if (weighted >= 8.5) return { score: 1, label: "Optimal" };
    if (weighted >= 6.5) return { score: 0, label: "Adequate" };
    return { score: -3, label: "Below Optimal" };
  }

  function matchUsageModifier(minutesRatio) {
    if (!Number.isFinite(minutesRatio)) return { score: 0, label: "Moderate", value: 60 };
    const ratio = clamp(minutesRatio, 0, 1.2);
    const percent = Math.round(ratio * 100);

    if (ratio >= 0.95) return { score: 1, label: "High", value: percent };
    if (ratio >= 0.65) return { score: 0, label: "Moderate", value: percent };
    return { score: -3, label: "Low", value: percent };
  }

  function eliteCapAllowed(age, realContribution, eliteBenchmark) {
    if (!Number.isFinite(age) || !Number.isFinite(realContribution) || !Number.isFinite(eliteBenchmark)) {
      return false;
    }

    return age >= 28 && age <= 31 && realContribution >= eliteBenchmark * 1.03;
  }

  function applyBenchmarkCaps(score, benchmarkRatio) {
    let adjusted = score;

    // If player is below NT minimum, prevent high labels.
    if (benchmarkRatio < 1.0 && adjusted > 79) adjusted = 79;
    // If clearly below minimum, cap to developing range.
    if (benchmarkRatio < 0.9 && adjusted > 69) adjusted = 69;
    // Very far from minimum should not look competitive.
    if (benchmarkRatio < 0.8 && adjusted > 59) adjusted = 59;

    return adjusted;
  }

  function calculateTES(input, benchmarks) {
    const age = input.ageYears;
    const primary = detectPrimaryPosition(input.contributionByPosition);

    if (!Number.isFinite(age) || !primary) return null;

    const bench = benchmarks[primary.primaryPosition];
    if (!bench || !Array.isArray(bench.min)) return null;

    const minBenchmark = interpolate(bench.min, age);
    if (!Number.isFinite(minBenchmark) || minBenchmark <= 0) return null;

    const eliteBenchmark = minBenchmark / 0.9;

    const benchmarkRatio = primary.realContribution / minBenchmark;
    const cappedRatio = clamp(benchmarkRatio, 0, 1.15);
    const tesRaw = cappedRatio * 100;

    const structure = skillStructureCheck(primary.primaryPosition, input.skills);
    const physical = physicalModifier(input.stamina, input.form);
    const usage = matchUsageModifier(input.minutesRatio);

    const agePenalty = age > 31 ? -2 : 0;

    let tesAdjusted = tesRaw + structure.score + physical.score + usage.score + agePenalty;

    tesAdjusted = applyBenchmarkCaps(tesAdjusted, benchmarkRatio);

    if (!eliteCapAllowed(age, primary.realContribution, eliteBenchmark) && tesAdjusted > 96) {
      tesAdjusted = 96;
    }

    const tesScore = Math.round(clamp(tesAdjusted, 0, 100));

    const ageBenchmarkRatio = Math.round(benchmarkRatio * 100);
    const positionalImpact = Math.round(clamp((primary.realContribution / eliteBenchmark) * 100, 0, 100));

    const secondaryRatio = primary.realContribution > 0
      ? clamp(primary.secondaryContribution / primary.realContribution, 0, 1)
      : 1;

    return {
      age,
      primaryPosition: primary.primaryPosition,
      realContribution: primary.realContribution,
      minBenchmark,
      eliteBenchmark,
      tesScore,
      meetsMinimum: primary.realContribution >= minBenchmark,
      performanceTier: performanceTier(tesScore),
      evaluationTier: evaluationTier(tesScore),
      competitiveWindow: competitiveWindow(age),
      factors: {
        positionalImpact,
        ageEfficiencyIndex: ageBenchmarkRatio,
        skillStructureBalanceValue: Math.round(secondaryRatio * 100),
        skillStructureBalanceLabel: structure.label,
        physicalReadinessValue: Math.round(((input.stamina ?? 7) + (input.form ?? 7)) / 2 * 5),
        physicalReadinessLabel: physical.label,
        matchUtilizationValue: usage.value,
        matchUtilizationLabel: usage.label,
      },
      advanced: {
        normalizedContributionScore: toPercent(primary.realContribution / eliteBenchmark),
        secondaryPositionScore: primary.secondaryContribution,
        modifiers: {
          structure: structure.score,
          physical: physical.score,
          usage: usage.score,
          age: agePenalty,
        },
      },
    };
  }

  global.TESEngine = {
    calculateTES,
  };
})(window);
