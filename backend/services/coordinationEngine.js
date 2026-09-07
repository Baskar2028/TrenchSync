const {
  parseDate,
  daysBetween,
  getOverlapDays,
  getSpatialRelationship,
  getTemporalRelationship,
  detectConflicts,
} = require("./conflictEngine");

const WORK_TYPE_ICONS = {
  Water: "💧",
  Telecom: "📡",
  Electricity: "⚡",
  Sewerage: "🟢",
  "Road Resurfacing": "🛣️",
  Drainage: "🔴",
};

function checkHardConstraints(works) {
  const violations = [];
  for (const work of works) {
    if (work.priority === "Emergency") {
      violations.push({
        work_id: work.id,
        constraint: "Emergency project",
        type: "hard",
      });
    }
    const start = parseDate(work.start_date);
    const end = parseDate(work.end_date);
    if (end < start) {
      violations.push({
        work_id: work.id,
        constraint: "Invalid dates",
        type: "hard",
      });
    }
  }

  const starts = works.map((w) => parseDate(w.start_date));
  const ends = works.map((w) => parseDate(w.end_date));
  const commonStart = new Date(Math.max(...starts.map((d) => d.getTime())));
  const commonEnd = new Date(Math.min(...ends.map((d) => d.getTime())));
  if (commonEnd < commonStart) {
    violations.push({
      constraint: "Completely incompatible schedule",
      type: "hard",
    });
  }

  return violations;
}

function getRoadHistoryScore(roadName, history) {
  const roadHistory = history.filter(
    (h) => h.road_name.toLowerCase() === roadName.toLowerCase(),
  );
  if (roadHistory.length === 0)
    return { score: 5, reason: "No recent road history" };
  if (roadHistory.length >= 3)
    return { score: 15, reason: "Road has upcoming excavation activity" };
  if (roadHistory.length >= 1)
    return { score: 12, reason: "Road has recent intervention history" };
  return { score: 8, reason: "Limited road history" };
}

function getScheduleScore(works) {
  if (works.length < 2) return { score: 0, reason: "Single project" };

  let totalOverlap = 0;
  let pairCount = 0;
  for (let i = 0; i < works.length; i++) {
    for (let j = i + 1; j < works.length; j++) {
      const temporal = getTemporalRelationship(works[i], works[j]);
      totalOverlap += temporal.overlap;
      pairCount++;
    }
  }
  const avgOverlap = pairCount > 0 ? totalOverlap / pairCount : 0;
  const maxDuration = Math.max(...works.map((w) => w.duration));

  let score = 0;
  if (avgOverlap >= maxDuration * 0.7) score = 25;
  else if (avgOverlap >= maxDuration * 0.4) score = 20;
  else if (avgOverlap >= 2) score = 15;
  else if (avgOverlap >= 1) score = 10;
  else score = 5;

  return {
    score,
    reason: `${Math.round(avgOverlap)}-day schedule overlap`,
    overlapDays: avgOverlap,
  };
}

function getSpatialScore(works) {
  if (works.length < 2) return { score: 0, reason: "Single project" };

  let maxScore = 0;
  let bestLabel = "Same road";
  for (let i = 0; i < works.length; i++) {
    for (let j = i + 1; j < works.length; j++) {
      const spatial = getSpatialRelationship(works[i], works[j]);
      if (spatial && spatial.score > maxScore) {
        maxScore = spatial.score;
        bestLabel = spatial.label;
      }
    }
  }
  return { score: maxScore, reason: bestLabel };
}

function getDurationScore(works) {
  const durations = works.map((w) => w.duration);
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const ratio = min / max;
  if (ratio >= 0.7) return { score: 10, reason: "Compatible work duration" };
  if (ratio >= 0.4)
    return { score: 7, reason: "Moderately compatible duration" };
  return { score: 4, reason: "Duration mismatch" };
}

function getTrafficScore(works) {
  const fullClosures = works.filter((w) => w.closure_type === "Full").length;
  const partialClosures = works.filter(
    (w) => w.closure_type === "Partial",
  ).length;
  if (fullClosures >= 2)
    return { score: 4, reason: "Multiple full road closures" };
  if (fullClosures === 1 && partialClosures >= 1)
    return { score: 6, reason: "Mixed closure types" };
  if (partialClosures >= 2)
    return { score: 7, reason: "Partial closures manageable" };
  return { score: 8, reason: "Low traffic disruption potential" };
}

function getPriorityScore(works) {
  const priorities = works.map((w) => w.priority);
  if (priorities.includes("Emergency"))
    return { score: 2, reason: "Emergency priority present" };
  const highCount = priorities.filter((p) => p === "High").length;
  if (highCount >= 2)
    return { score: 6, reason: "Multiple high-priority projects" };
  if (highCount === 1) return { score: 8, reason: "One high-priority project" };
  return { score: 10, reason: "Compatible priority levels" };
}

function getScoreLevel(score) {
  if (score >= 85) return "Very High coordination opportunity";
  if (score >= 70) return "High coordination opportunity";
  if (score >= 40) return "Moderate coordination opportunity";
  return "Low coordination opportunity";
}

function getRecommendedWindow(works) {
  const starts = works.map((w) => parseDate(w.start_date));
  const ends = works.map((w) => parseDate(w.end_date));
  const commonStart = new Date(Math.max(...starts.map((d) => d.getTime())));
  const commonEnd = new Date(Math.min(...ends.map((d) => d.getTime())));

  if (commonEnd >= commonStart) {
    return {
      start: commonStart.toISOString().split("T")[0],
      end: commonEnd.toISOString().split("T")[0],
    };
  }

  const allStart = new Date(Math.min(...starts.map((d) => d.getTime())));
  const allEnd = new Date(Math.max(...ends.map((d) => d.getTime())));
  const midStart = new Date((commonStart.getTime() + allStart.getTime()) / 2);
  const midEnd = new Date((commonEnd.getTime() + allEnd.getTime()) / 2);
  return {
    start: midStart.toISOString().split("T")[0],
    end: midEnd.toISOString().split("T")[0],
  };
}

function formatDate(dateStr) {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function analyzeCoordination(works, roadHistory = []) {
  const hardViolations = checkHardConstraints(works);
  const hasEmergencyOnly = hardViolations.every(
    (v) => v.constraint === "Emergency project",
  );
  const hasBlockingHard = hardViolations.some(
    (v) =>
      v.constraint === "Invalid dates" ||
      v.constraint === "Completely incompatible schedule",
  );

  const spatial = getSpatialScore(works);
  const schedule = getScheduleScore(works);
  const history = getRoadHistoryScore(works[0]?.road_name || "", roadHistory);
  const duration = getDurationScore(works);
  const traffic = getTrafficScore(works);
  const priority = getPriorityScore(works);

  let total =
    spatial.score +
    schedule.score +
    history.score +
    duration.score +
    traffic.score +
    priority.score;

  if (hasEmergencyOnly && !hasBlockingHard) {
    total = Math.max(total - 15, 0);
  }
  if (hasBlockingHard) {
    total = Math.min(total, 20);
  }

  total = Math.round(Math.min(total, 100));

  const reasons = [];
  if (spatial.score >= 25) reasons.push(`✓ ${spatial.reason}`);
  if (schedule.score >= 15) reasons.push(`✓ ${schedule.reason}`);
  if (duration.score >= 7) reasons.push(`✓ ${duration.reason}`);
  if (works.length >= 3) reasons.push("✓ Multiple planned works");
  if (history.score >= 12) reasons.push(`✓ ${history.reason}`);
  if (priority.score >= 8) reasons.push("✓ Compatible priority levels");
  if (traffic.score >= 7)
    reasons.push("✓ Reduced traffic disruption potential");

  const window = getRecommendedWindow(works);
  const workTypes = works.map((w) => w.work_type);
  const agencies = [...new Set(works.map((w) => w.agency_name))];

  return {
    work_ids: works.map((w) => w.id),
    road_name: works[0]?.road_name,
    total_score: total,
    level: getScoreLevel(total),
    hard_violations: hardViolations,
    can_coordinate: !hasBlockingHard,
    breakdown: {
      spatial: {
        score: spatial.score,
        max: 30,
        label: "Spatial compatibility",
      },
      schedule: {
        score: schedule.score,
        max: 25,
        label: "Schedule compatibility",
      },
      history: { score: history.score, max: 15, label: "Road history" },
      duration: {
        score: duration.score,
        max: 10,
        label: "Duration compatibility",
      },
      traffic: { score: traffic.score, max: 10, label: "Traffic impact" },
      priority: {
        score: priority.score,
        max: 10,
        label: "Priority compatibility",
      },
    },
    reasons,
    recommended_window: window,
    recommended_window_label: `${formatDate(window.start)} – ${formatDate(window.end)}`,
    potential_action: `Coordinate ${workTypes.join(" + ")} within a common work window.`,
    participating_agencies: agencies,
    work_types: workTypes,
  };
}

function generateScenarios(works, roadHistory = []) {
  const scenarios = [];

  const current = analyzeCoordination(works, roadHistory);
  scenarios.push({
    id: "A",
    name: "Keep Current Schedules",
    description: "No coordination — each agency proceeds independently.",
    works: works.map((w) => ({
      id: w.id,
      work_type: w.work_type,
      start: w.start_date,
      end: w.end_date,
    })),
    score: Math.max(Math.round(current.total_score * 0.45), 20),
    disruption: "Higher disruption",
    recommended: false,
  });

  if (works.length >= 2) {
    const pair = works.slice(0, 2);
    const pairAnalysis = analyzeCoordination(pair, roadHistory);
    scenarios.push({
      id: "B",
      name: `Coordinate ${pair.map((w) => w.work_type).join(" + ")}`,
      description: `Align ${pair.length} projects on shared work window.`,
      works: pair.map((w) => ({ id: w.id, work_type: w.work_type })),
      score: Math.min(pairAnalysis.total_score, 85),
      window: pairAnalysis.recommended_window,
      disruption: "Moderate improvement",
      recommended: works.length === 2,
    });
  }

  if (works.length >= 3) {
    const fullAnalysis = analyzeCoordination(works, roadHistory);
    scenarios.push({
      id: "C",
      name: `Coordinate ${works.map((w) => w.work_type).join(" + ")}`,
      description: "Full multi-agency coordination on common window.",
      works: works.map((w) => ({ id: w.id, work_type: w.work_type })),
      score: fullAnalysis.total_score,
      window: fullAnalysis.recommended_window,
      disruption: "Maximum excavation reduction",
      recommended: true,
    });
  }

  return scenarios.sort((a, b) => b.score - a.score);
}

function findCoordinationOpportunities(works, roadHistory = []) {
  const conflicts = detectConflicts(works);
  const opportunities = [];

  for (const conflict of conflicts) {
    const analysis = analyzeCoordination(conflict.works, roadHistory);
    const scenarios = generateScenarios(conflict.works, roadHistory);

    opportunities.push({
      ...conflict,
      coordination_score: analysis.total_score,
      score_level: analysis.level,
      analysis,
      scenarios,
      recommended_scenario:
        scenarios.find((s) => s.recommended) || scenarios[0],
    });
  }

  return opportunities.sort(
    (a, b) => b.coordination_score - a.coordination_score,
  );
}

module.exports = {
  WORK_TYPE_ICONS,
  checkHardConstraints,
  analyzeCoordination,
  generateScenarios,
  findCoordinationOpportunities,
  getScoreLevel,
  getRecommendedWindow,
};
