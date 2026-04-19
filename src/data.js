// Mock data for CIN Radar — Cross Innovation Network

export const CIN_DATA = (function () {
  const dimensions = [
    "Technology", "Society", "Economy", "Ecology", "Politics", "Values"
  ];

  const horizons = ["H1 · 0–2 yrs", "H2 · 2–5 yrs", "H3 · 5–10 yrs"];
  const stages = ["Signal", "Emerging", "Trend", "Mainstream", "Fading"];

  const trends = [
    { id: "40cg", title: "Synthetic Biology for Materials", dim: "Technology", horizon: "H2 · 2–5 yrs", stage: "Emerging", impact: 82, novelty: 74, maturity: 38, signals: 214, sources: 47, owner: "L. Meier", updated: "2d", ai: 0.92, tags: ["biotech", "materials", "circular"], summary: "Engineered microbes producing textile fibres, leather alternatives and structural composites at pre-industrial scale." },
    { id: "44",   title: "Agentic AI in the Enterprise", dim: "Technology", horizon: "H1 · 0–2 yrs", stage: "Trend", impact: 91, novelty: 66, maturity: 54, signals: 612, sources: 128, owner: "A. Koch", updated: "5h", ai: 0.97, tags: ["AI", "automation", "b2b"], summary: "Autonomous multi-agent systems executing multi-step work across SaaS, replacing RPA and parts of outsourcing." },
    { id: "38",   title: "Post-Ownership Mobility", dim: "Economy", horizon: "H2 · 2–5 yrs", stage: "Emerging", impact: 64, novelty: 58, maturity: 44, signals: 178, sources: 62, owner: "S. Rüegg", updated: "1d", ai: 0.71, tags: ["mobility", "subscription"], summary: "Vehicle access as a stacked subscription — OEMs become service operators, dealers become fulfillment." },
    { id: "41",   title: "Climate-Adaptive Urban Design", dim: "Ecology", horizon: "H2 · 2–5 yrs", stage: "Emerging", impact: 78, novelty: 52, maturity: 32, signals: 241, sources: 71, owner: "P. Huber", updated: "3d", ai: 0.84, tags: ["urban", "climate"], summary: "Passive cooling, sponge cities, bio-based retrofits — shifting from mitigation-only to adaptation spend." },
    { id: "37",   title: "Trust Infrastructure for AI Content", dim: "Society", horizon: "H1 · 0–2 yrs", stage: "Trend", impact: 73, novelty: 61, maturity: 48, signals: 403, sources: 94, owner: "N. Fischer", updated: "9h", ai: 0.89, tags: ["AI", "provenance", "policy"], summary: "C2PA-style provenance becomes table-stakes; media and regulators push cryptographic signing of content." },
    { id: "52",   title: "Small Modular Reactors", dim: "Technology", horizon: "H3 · 5–10 yrs", stage: "Signal", impact: 70, novelty: 48, maturity: 22, signals: 96, sources: 33, owner: "R. Bosshard", updated: "6d", ai: 0.64, tags: ["energy", "infrastructure"] },
    { id: "55",   title: "Longevity as a Consumer Category", dim: "Values", horizon: "H2 · 2–5 yrs", stage: "Emerging", impact: 58, novelty: 69, maturity: 35, signals: 289, sources: 58, owner: "J. Keller", updated: "12h", ai: 0.81, tags: ["health", "dtc"] },
    { id: "61",   title: "Regulatory Sandboxes for Finance", dim: "Politics", horizon: "H1 · 0–2 yrs", stage: "Mainstream", impact: 52, novelty: 30, maturity: 72, signals: 134, sources: 41, owner: "L. Meier", updated: "4d", ai: 0.55, tags: ["fintech", "regulation"] },
    { id: "68",   title: "Ambient Computing Beyond Smartphones", dim: "Technology", horizon: "H3 · 5–10 yrs", stage: "Signal", impact: 66, novelty: 77, maturity: 18, signals: 144, sources: 52, owner: "A. Koch", updated: "1d", ai: 0.78, tags: ["HCI", "wearables"] },
    { id: "71",   title: "Circular Electronics Mandates", dim: "Politics", horizon: "H2 · 2–5 yrs", stage: "Emerging", impact: 61, novelty: 44, maturity: 39, signals: 167, sources: 48, owner: "P. Huber", updated: "2d", ai: 0.73, tags: ["circular", "regulation"] },
    { id: "74",   title: "Declining Trust in Institutions", dim: "Society", horizon: "H1 · 0–2 yrs", stage: "Mainstream", impact: 69, novelty: 22, maturity: 81, signals: 512, sources: 156, owner: "N. Fischer", updated: "7h", ai: 0.42, tags: ["society", "politics"] },
    { id: "77",   title: "Biophilic Workplace Design", dim: "Values", horizon: "H1 · 0–2 yrs", stage: "Mainstream", impact: 41, novelty: 18, maturity: 74, signals: 88, sources: 29, owner: "J. Keller", updated: "2w", ai: 0.35, tags: ["workplace", "wellbeing"] },
    { id: "80",   title: "Protein Diversification", dim: "Ecology", horizon: "H2 · 2–5 yrs", stage: "Trend", impact: 67, novelty: 51, maturity: 46, signals: 321, sources: 87, owner: "S. Rüegg", updated: "1d", ai: 0.76, tags: ["food", "climate"] },
    { id: "83",   title: "Neurotech for Productivity", dim: "Technology", horizon: "H3 · 5–10 yrs", stage: "Signal", impact: 55, novelty: 88, maturity: 12, signals: 62, sources: 24, owner: "A. Koch", updated: "3d", ai: 0.69, tags: ["neuro", "hci"] },
    { id: "87",   title: "De-Globalising Supply Chains", dim: "Economy", horizon: "H2 · 2–5 yrs", stage: "Trend", impact: 76, novelty: 33, maturity: 58, signals: 278, sources: 74, owner: "R. Bosshard", updated: "5h", ai: 0.71, tags: ["supply", "policy"] },
    { id: "91",   title: "Digital Sovereignty", dim: "Politics", horizon: "H1 · 0–2 yrs", stage: "Trend", impact: 72, novelty: 39, maturity: 61, signals: 356, sources: 98, owner: "L. Meier", updated: "11h", ai: 0.82, tags: ["cloud", "regulation"] },
    { id: "94",   title: "Gen Alpha Attention Economics", dim: "Society", horizon: "H2 · 2–5 yrs", stage: "Emerging", impact: 63, novelty: 57, maturity: 36, signals: 192, sources: 54, owner: "J. Keller", updated: "2d", ai: 0.74, tags: ["media", "youth"] },
    { id: "98",   title: "Room-Temperature Superconductors", dim: "Technology", horizon: "H3 · 5–10 yrs", stage: "Signal", impact: 49, novelty: 94, maturity: 8, signals: 41, sources: 19, owner: "A. Koch", updated: "3w", ai: 0.58, tags: ["energy", "materials"] },
  ];

  const signals = [
    { id: "s1", trendId: "44", title: "OpenAI releases enterprise agent SDK with billing controls", source: "TechCrunch", date: "2 d ago", lang: "EN", strength: 0.94, type: "Product" },
    { id: "s2", trendId: "44", title: "Deloitte study: 38% of Fortune 500 pilot agentic workflows", source: "Deloitte Insights", date: "5 d ago", lang: "EN", strength: 0.88, type: "Research" },
    { id: "s3", trendId: "44", title: "EU AI Act Annex III revision flags autonomous agents", source: "EUR-Lex", date: "1 w ago", lang: "EN", strength: 0.82, type: "Policy" },
    { id: "s4", trendId: "40cg", title: "Bolt Threads closes $120M round for Mylo mycelium leather", source: "Axios", date: "3 d ago", lang: "EN", strength: 0.79, type: "Funding" },
    { id: "s5", trendId: "40cg", title: "Givaudan invests in precision fermentation flavours", source: "Press release", date: "6 d ago", lang: "EN", strength: 0.71, type: "Corp" },
    { id: "s6", trendId: "37", title: "BBC rolls out C2PA labels across all news video", source: "BBC", date: "1 d ago", lang: "EN", strength: 0.86, type: "Adoption" },
    { id: "s7", trendId: "41", title: "Zurich unveils 2040 Sponge City master plan", source: "NZZ", date: "4 d ago", lang: "DE", strength: 0.77, type: "Policy" },
    { id: "s8", trendId: "38", title: "Sixt+ subscription growth outpaces classic rental", source: "Handelsblatt", date: "1 w ago", lang: "DE", strength: 0.68, type: "Market" },
  ];

  const aiInbox = [
    { id: "n1", title: "Anthropic publishes Claude Code SDK — developers can orchestrate long-running agents", source: "anthropic.com", matchedTrend: "Agentic AI in the Enterprise", confidence: 0.96, date: "12 min ago", lang: "EN" },
    { id: "n2", title: "MIT paper: scalable mycelium composites match MDF in compression tests", source: "Nature Materials", matchedTrend: "Synthetic Biology for Materials", confidence: 0.91, date: "1 h ago", lang: "EN" },
    { id: "n3", title: "Bundesrat diskutiert 'Recht auf analoge Verwaltung' als Grundrecht", source: "admin.ch", matchedTrend: null, proposedTrend: "Digital Refusal Rights", confidence: 0.74, date: "3 h ago", lang: "DE", new: true },
    { id: "n4", title: "Walmart pilots drone delivery fleets with route-learning AI", source: "Reuters", matchedTrend: "Agentic AI in the Enterprise", confidence: 0.62, date: "5 h ago", lang: "EN" },
    { id: "n5", title: "YouGov: Gen Z trust in AI-generated news drops to 18%", source: "YouGov", matchedTrend: "Trust Infrastructure for AI Content", confidence: 0.88, date: "6 h ago", lang: "EN" },
    { id: "n6", title: "EU Commission draft: mandatory eco-score on consumer electronics by 2028", source: "EUR-Lex", matchedTrend: "Circular Electronics Mandates", confidence: 0.93, date: "8 h ago", lang: "EN" },
  ];

  const projects = [
    { id: "p1", title: "Mycelium packaging pilot with Migros", stage: "Prototyping", trends: ["40cg"], lead: "L. Meier", progress: 62 },
    { id: "p2", title: "Agentic procurement copilot — internal", stage: "Ideation", trends: ["44"], lead: "A. Koch", progress: 18 },
    { id: "p3", title: "Zurich Sponge Block feasibility", stage: "Research", trends: ["41"], lead: "P. Huber", progress: 34 },
    { id: "p4", title: "Content provenance for corporate comms", stage: "Scaling", trends: ["37"], lead: "N. Fischer", progress: 81 },
  ];

  const funnelStages = [
    { key: "signals",    label: "Signals",     count: 1840 },
    { key: "reviewed",   label: "Reviewed",    count: 612 },
    { key: "clustered",  label: "Clustered",   count: 204 },
    { key: "trends",     label: "Trends",      count: 48 },
    { key: "prioritized",label: "Prioritized", count: 12 },
    { key: "projects",   label: "Projects",    count: 4 },
  ];

  const owners = [...new Set(trends.map(t => t.owner))];

  return { dimensions, horizons, stages, trends, signals, aiInbox, projects, funnelStages, owners };
})();
