const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export function researchCompany(url) {
  return request('/research', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export function researchBatch(urls) {
  return request('/research/batch', {
    method: 'POST',
    body: JSON.stringify({ urls }),
  });
}

export function getRecentSearches() {
  return request('/research/recent');
}

export function getResearchByDomain(domain) {
  return request(`/research/${encodeURIComponent(domain)}`);
}

export function generateColdEmail(researchBrief, angleIndex) {
  return request('/research/email', {
    method: 'POST',
    body: JSON.stringify({
      research_brief: researchBrief,
      angle_index: angleIndex,
    }),
  });
}
