const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || data.errors?.join(", ") || "Request failed");
  return data;
}

export const api = {
  getWorks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/works${qs ? "?" + qs : ""}`);
  },
  getWork: (id) => request(`/works/${id}`),
  createWork: (data) =>
    request("/works", { method: "POST", body: JSON.stringify(data) }),
  updateWorkStatus: (id, status) =>
    request(`/works/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  getAgencies: () => request("/agencies"),
  getConflicts: () => request("/conflicts"),
  getOpportunities: () => request("/coordination/opportunities"),
  analyzeCoordination: (data) =>
    request("/coordination/analyze", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProposals: () => request("/coordination/proposals"),
  createProposal: (data) =>
    request("/coordination/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProposal: (id, data) =>
    request(`/coordination/proposals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getRoadHistory: (roadName) =>
    request(`/roads/${encodeURIComponent(roadName)}/history`),
  getRoads: () => request("/roads"),
  getDashboardStats: () => request("/dashboard/stats"),
};

export const WORK_TYPE_COLORS = {
  Water: "#00bcd4",
  Telecom: "#9c27b0",
  Electricity: "#ffc107",
  Sewerage: "#4caf50",
  "Road Resurfacing": "#ff9800",
  Drainage: "#e91e63",
};

export const WORK_TYPE_ICONS = {
  Water: "💧",
  Telecom: "📡",
  Electricity: "⚡",
  Sewerage: "🟢",
  "Road Resurfacing": "🛣️",
  Drainage: "🔴",
};

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getScoreClass(score) {
  if (score >= 85) return "score-very-high";
  if (score >= 70) return "score-high";
  if (score >= 40) return "score-moderate";
  return "score-low";
}

export function getScoreLabel(score) {
  if (score >= 85) return "Very High coordination opportunity";
  if (score >= 70) return "High coordination opportunity";
  if (score >= 40) return "Moderate coordination opportunity";
  return "Low coordination opportunity";
}
