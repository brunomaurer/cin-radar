async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const conceptsApi = {
  list: () => request('/api/concepts'),
  create: (body) => request('/api/concepts', { method: 'POST', body: JSON.stringify(body) }),
  get: (id) => request('/api/concepts?id=' + encodeURIComponent(id)),
  update: (id, patch) => request('/api/concepts?id=' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id) => request('/api/concepts?id=' + encodeURIComponent(id), { method: 'DELETE' }),
};

export const trendsApi = {
  list: () => request('/api/trends'),
  create: (body) => request('/api/trends', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, patch) => request('/api/trends?id=' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id) => request('/api/trends?id=' + encodeURIComponent(id), { method: 'DELETE' }),
  dedupePreview: () => request('/api/trends-dedupe'),
  dedupe: (body) => request('/api/trends-dedupe', { method: 'POST', body: JSON.stringify(body || {}) }),
};

export const signalsApi = {
  list: () => request('/api/signals').then(r => r.signals || []),
  create: (body) => request('/api/signals', { method: 'POST', body: JSON.stringify(body) }),
  get: (id) => request('/api/signals?id=' + encodeURIComponent(id)),
  update: (id, patch) => request('/api/signals?id=' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id) => request('/api/signals?id=' + encodeURIComponent(id), { method: 'DELETE' }),
};

export const campaignsApi = {
  list: () => request('/api/campaigns').then(r => r.campaigns || []),
  create: (body) => request('/api/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  get: (id) => request('/api/campaigns?id=' + encodeURIComponent(id)),
  update: (id, patch) => request('/api/campaigns?id=' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id) => request('/api/campaigns?id=' + encodeURIComponent(id), { method: 'DELETE' }),
};

export const clustersApi = {
  list: () => request('/api/clusters').then(r => r.clusters || []),
  create: (body) => request('/api/clusters', { method: 'POST', body: JSON.stringify(body) }),
  get: (id) => request('/api/clusters?id=' + encodeURIComponent(id)),
  update: (id, patch) => request('/api/clusters?id=' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(patch) }),
  remove: (id) => request('/api/clusters?id=' + encodeURIComponent(id), { method: 'DELETE' }),
};

export const relationsApi = {
  rank: ({ trend, candidates, force }) =>
    request('/api/relations', { method: 'POST', body: JSON.stringify({ trend, candidates, force }) }),
};

export const chatApi = {
  send: ({ messages, system, context }) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify({ messages, system, context }) }),
};

export const generateApi = {
  artefact: ({ brief, trend, artefact }) =>
    request('/api/generate', { method: 'POST', body: JSON.stringify({ brief, trend, artefact }) }),
};

export const crawlApi = {
  crawl: (trend) => request('/api/crawl-signals', { method: 'POST', body: JSON.stringify({ trend }) }),
};

export const notificationsApi = {
  list: () => request('/api/notifications'),
  markRead: () => request('/api/notifications', { method: 'PUT' }),
};

export const clusterToTrendApi = {
  generate: (body) => request('/api/cluster-to-trend', { method: 'POST', body: JSON.stringify(body) }),
};

export const generateProposalsApi = {
  generate: (body) => request('/api/generate-proposals', { method: 'POST', body: JSON.stringify(body) }),
};

export const summaryApi = {
  generate: (trends) => request('/api/summary', { method: 'POST', body: JSON.stringify({ trends }) }),
};

export const generateIdeasApi = {
  generate: (body) => request('/api/generate-ideas', { method: 'POST', body: JSON.stringify(body) }),
};

export const ARTEFACT_META = {
  claude: { label: 'CLAUDE.md',       sub: 'Instructions für AI-Coding-Agent',  icon: 'bolt',     lang: 'markdown', ext: '.md' },
  prd:    { label: 'PRD',             sub: 'Product Requirements + Gherkin',    icon: 'book',     lang: 'markdown', ext: '.md' },
  tech:   { label: 'Tech Spec',       sub: 'Data Model, API, Components',       icon: 'grid',     lang: 'markdown', ext: '.md' },
  deck:   { label: 'Management Deck', sub: '6 Slides für Stakeholder',          icon: 'chart',    lang: 'markdown', ext: '.md' },
  prompt: { label: 'Prototype Prompt',sub: 'Copy-Paste in Claude Code / v0',    icon: 'sparkles', lang: 'text',     ext: '.txt' },
  email:  { label: 'Kickoff Email',   sub: 'Stakeholder-Alignment-Mail',        icon: 'message',  lang: 'markdown', ext: '.md' },
};

export const ARTEFACT_IDS = Object.keys(ARTEFACT_META);
