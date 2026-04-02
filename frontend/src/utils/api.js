// Em produção, REACT_APP_API_URL aponta para o backend no Railway
// Em desenvolvimento, usa o proxy do react-scripts (localhost:3001)
const BASE = (process.env.REACT_APP_API_URL || '') + '/api';

export async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erro desconhecido');
  }
  return res.json();
}

export const api = {
  getProjects: () => apiFetch('/projects'),
  createProject: (data) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),

  getMetrics: (projectId) => apiFetch(projectId ? `/metrics/${projectId}` : '/metrics'),
  saveMetrics: (data) => apiFetch('/metrics', { method: 'POST', body: JSON.stringify(data) }),
  deleteMetric: (id) => apiFetch(`/metrics/${id}`, { method: 'DELETE' }),

  exportUrl: (projectId) => `${BASE}/export${projectId ? `?project_id=${projectId}` : ''}`,
};

export async function parseFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload/parse`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erro no upload');
  }
  return res.json();
}

export async function processData(rawData, mapping) {
  const res = await fetch(`${BASE}/upload/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_data: rawData, mapping }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error);
  }
  return res.json();
}
