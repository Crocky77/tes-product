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
    if (age <= 30.5) return "Peak Age Range";
    return "Post-Peak Phase";
  }

  function toPercent(value) {
    return Math.round(clamp(value * 100, 0, 100));
  }

  function skillStructureLabel(ratio) {
    if (ratio >= 0.85) return "Balanced";
    if (ratio >= 0.7) return "Slight Deviation";
    return "Unbalanced";
  }

  function readinessLabel(score) {
    if (score >= 80) return "Optimal";
    if (score >= 60) return "Adequate";
    return "Below Optimal";
  }

  function utilizationLabel(score) {
    if (score >= 80) return "High";
    if (score >= 55) return "Moderate";
    return "Low";
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
    const normalizedContribution = primary.realContribution / eliteBenchmark;
    const tesRaw = normalizedContribution * 100;
    const tesScore = Math.round(clamp(tesRaw, 0, 100));

    const ageBenchmarkRatio = toPercent(primary.realContribution / minBenchmark);
    const positionalImpact = toPercent(normalizedContribution);

    const secondaryRatio = primary.realContribution > 0
      ? clamp(primary.secondaryContribution / primary.realContribution, 0, 1)
      : 1;

    const staminaScore = Number.isFinite(input.staminaScore) ? clamp(input.staminaScore, 0, 100) : 65;
    const formScore = Number.isFinite(input.formScore) ? clamp(input.formScore, 0, 100) : 65;
    const physicalReadinessScore = Math.round((staminaScore + formScore) / 2);

    const matchUtilizationScore = Number.isFinite(input.matchUtilizationScore)
      ? clamp(input.matchUtilizationScore, 0, 100)
      : 62;

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
        skillStructureBalanceLabel: skillStructureLabel(secondaryRatio),
        physicalReadinessValue: physicalReadinessScore,
        physicalReadinessLabel: readinessLabel(physicalReadinessScore),
        matchUtilizationValue: matchUtilizationScore,
        matchUtilizationLabel: utilizationLabel(matchUtilizationScore),
      },
      advanced: {
        normalizedContributionScore: toPercent(normalizedContribution),
        secondaryPositionScore: primary.secondaryContribution,
      },
    };
  }

  global.TESEngine = {
    calculateTES,
  };
})(window);
