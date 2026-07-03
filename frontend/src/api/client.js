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

export function generateLinkedInMessage(researchBrief, contactIndex) {
  return request('/research/linkedin', {
    method: 'POST',
    body: JSON.stringify({
      research_brief: researchBrief,
      contact_index: contactIndex,
    }),
  });
}

export function getLeadScore(domain) {
  return request(`/research/score?domain=${encodeURIComponent(domain)}`, {
    method: 'POST',
  });
}

export function getAnalytics() {
  return request('/research/analytics');
}

export function getFavorites() {
  return request('/favorites');
}

export function addFavorite(domain, notes = '') {
  return request('/favorites', {
    method: 'POST',
    body: JSON.stringify({ domain, notes }),
  });
}

export function updateFavorite(domain, notes) {
  return request(`/favorites/${encodeURIComponent(domain)}`, {
    method: 'PUT',
    body: JSON.stringify({ domain, notes }),
  });
}

export function removeFavorite(domain) {
  return request(`/favorites/${encodeURIComponent(domain)}`, {
    method: 'DELETE',
  });
}

export function compareCompanies(domains) {
  return request(`/research/compare?domains=${encodeURIComponent(domains.join(','))}`);
}

export function generateEmailSequence(researchBrief, angleIndex) {
  return request('/research/email-sequence', {
    method: 'POST',
    body: JSON.stringify({
      research_brief: researchBrief,
      angle_index: angleIndex,
    }),
  });
}

export function getPipeline() {
  return request('/pipeline');
}

export function addToPipeline(domain, companyName, stage = 'new') {
  return request('/pipeline', {
    method: 'POST',
    body: JSON.stringify({ domain, company_name: companyName, stage }),
  });
}

export function updatePipelineStage(domain, stage, notes = null) {
  return request(`/pipeline/${encodeURIComponent(domain)}`, {
    method: 'PUT',
    body: JSON.stringify({ stage, notes }),
  });
}

export function removeFromPipeline(domain) {
  return request(`/pipeline/${encodeURIComponent(domain)}`, {
    method: 'DELETE',
  });
}

export function getPipelineStats() {
  return request('/pipeline/stats');
}

export function rerunResearch(url) {
  return request('/research/rerun', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export function exportCsv() {
  window.open('/api/research/export/csv', '_blank');
}
