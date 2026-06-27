import type { Incident, IncidentListResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // List published incidents — filterable by tier, era, theme
  listIncidents: (params?: {
    tier?: string;
    era?: string;
    theme?: string;
    limit?: number;
    last_key?: string;
  }): Promise<IncidentListResponse> => {
    const q = new URLSearchParams({ status: 'published' });
    if (params?.tier) q.set('tier', params.tier);
    if (params?.era) q.set('era', params.era);
    if (params?.theme) q.set('theme', params.theme);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.last_key) q.set('last_key', params.last_key);
    return request(`/incidents?${q}`);
  },

  // Get single incident by slug (public endpoint)
  getBySlug: (slug: string): Promise<Incident> =>
    request(`/incidents/slug/${slug}`),

  // Get single incident by ID
  getById: (id: string): Promise<Incident> =>
    request(`/incidents/${id}`),

  // Featured entries (tier=featured, published)
  getFeatured: (): Promise<IncidentListResponse> =>
    request('/incidents?status=published&tier=featured&limit=6'),

  // Stats for homepage
  getStats: (): Promise<{ total: number; featured: number; verified: number; eras: number }> =>
    request('/stats'),
};
