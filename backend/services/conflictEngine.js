function normalizeRoad(name) {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseDate(str) {
  return new Date(str + 'T00:00:00');
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function getOverlapDays(start1, end1, start2, end2) {
  const s = Math.max(start1.getTime(), start2.getTime());
  const e = Math.min(end1.getTime(), end2.getTime());
  if (e < s) return 0;
  return daysBetween(new Date(s), new Date(e)) + 1;
}

function getSpatialRelationship(workA, workB) {
  const roadA = normalizeRoad(workA.road_name);
  const roadB = normalizeRoad(workB.road_name);

  if (roadA === roadB) {
    const locA = normalizeRoad(workA.location);
    const locB = normalizeRoad(workB.location);
    if (locA === locB) return { type: 'same_segment', score: 30, label: 'Same road segment' };
    if (locA.includes(locB) || locB.includes(locA)) return { type: 'same_corridor', score: 27, label: 'Same corridor' };
    return { type: 'same_road', score: 25, label: 'Same road' };
  }

  const locA = normalizeRoad(workA.location);
  const locB = normalizeRoad(workB.location);
  if (locA && locB && (locA.includes(roadB) || locB.includes(roadA))) {
    return { type: 'nearby', score: 15, label: 'Nearby location' };
  }

  return null;
}

function getTemporalRelationship(workA, workB) {
  const startA = parseDate(workA.start_date);
  const endA = parseDate(workA.end_date);
  const startB = parseDate(workB.start_date);
  const endB = parseDate(workB.end_date);

  const overlap = getOverlapDays(startA, endA, startB, endB);
  if (overlap <= 0) return { type: 'no_overlap', overlap: 0, label: 'No schedule overlap' };

  const totalSpan = Math.max(daysBetween(startA, endA), daysBetween(startB, endB));
  const ratio = overlap / totalSpan;

  if (ratio >= 0.8) return { type: 'full_overlap', overlap, label: `${overlap}-day schedule overlap` };
  if (ratio >= 0.5) return { type: 'significant_overlap', overlap, label: `${overlap}-day schedule overlap` };
  return { type: 'partial_overlap', overlap, label: `${overlap}-day schedule overlap` };
}

function groupWorksByRoad(works) {
  const groups = {};
  for (const work of works) {
    const key = normalizeRoad(work.road_name);
    if (!groups[key]) groups[key] = { road_name: work.road_name, works: [] };
    groups[key].works.push(work);
  }
  return Object.values(groups);
}

function findOverlapClusters(works) {
  if (works.length < 2) return [];

  const n = works.length;
  const parent = works.map((_, i) => i);

  function find(i) {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  function union(i, j) {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  }

  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const spatial = getSpatialRelationship(works[i], works[j]);
      const temporal = getTemporalRelationship(works[i], works[j]);
      if (spatial && temporal.overlap > 0) {
        union(i, j);
        pairs.push({ workA: works[i], workB: works[j], spatial, temporal });
      }
    }
  }

  const clusters = {};
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!clusters[root]) clusters[root] = [];
    clusters[root].push(works[i]);
  }

  return Object.values(clusters)
    .filter(cluster => cluster.length >= 2)
    .map(cluster => ({
      works: cluster,
      pairs: pairs.filter(p =>
        cluster.some(w => w.id === p.workA.id) && cluster.some(w => w.id === p.workB.id)
      )
    }));
}

function detectConflicts(works) {
  const conflicts = [];
  const roadGroups = groupWorksByRoad(works);

  for (const group of roadGroups) {
    const clusters = findOverlapClusters(group.works);

    clusters.forEach((cluster, index) => {
      const clusterWorks = cluster.works;
      const workTypes = clusterWorks.map(w => w.work_type);
      const workIds = clusterWorks.map(w => w.id);
      const slug = normalizeRoad(group.road_name).replace(/\s/g, '-');

      conflicts.push({
        id: `conflict-${slug}${clusters.length > 1 ? `-${index + 1}` : ''}`,
        road_name: group.road_name,
        works: clusterWorks,
        work_ids: workIds,
        pair_count: cluster.pairs.length,
        project_count: clusterWorks.length,
        type: clusterWorks.length >= 3 ? 'multi_project' : 'conflict',
        label: clusterWorks.length >= 3
          ? 'MULTI-PROJECT COORDINATION OPPORTUNITY'
          : 'CONFLICT DETECTED',
        message: clusterWorks.length >= 3
          ? `${clusterWorks.length} projects planned on ${group.road_name} with overlapping schedules.`
          : `${workTypes.join(' and ')} works are planned on the same road with overlapping schedules.`,
        has_temporal_overlap: true,
        pairs: cluster.pairs
      });
    });
  }

  return conflicts.sort((a, b) => b.project_count - a.project_count);
}

module.exports = {
  normalizeRoad,
  parseDate,
  daysBetween,
  getOverlapDays,
  getSpatialRelationship,
  getTemporalRelationship,
  groupWorksByRoad,
  detectConflicts
};
