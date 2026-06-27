const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Source {
  type: string
  title: string
  url: string
  verified: boolean
}

export interface Incident {
  incident_id?: string
  title: string
  hook: string
  date_display: string
  date_sort: string
  date_precision: string
  location_name: string
  country: string
  lat?: string
  lng?: string
  era: string
  source_type: string
  narrative: string
  curator_notes: string
  credibility_score: number
  tier: string
  status: string
  criteria_met: string[]
  themes: string[]
  physical_evidence: boolean
  cover_up_indicators: boolean
  sources: Source[]
  related_incidents: string[]
  ai_drafted?: boolean
  verify_flags?: string[]
  created_at?: string
  updated_at?: string
  published_at?: string
}

export const EMPTY_INCIDENT: Incident = {
  title: '', hook: '', date_display: '', date_sort: '', date_precision: 'exact',
  location_name: '', country: '', era: '', source_type: 'military',
  narrative: '', curator_notes: '', credibility_score: 3, tier: 'pending',
  status: 'pending', criteria_met: [], themes: [], physical_evidence: false,
  cover_up_indicators: false, sources: [], related_incidents: [],
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  stats: () => req<Record<string, number>>('/stats'),
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return req<{ items: Incident[]; count: number }>(`/incidents${qs}`)
  },
  get: (id: string) => req<Incident>(`/incidents/${id}`),
  create: (data: Incident) => req<Incident>('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Incident) => req<Incident>(`/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publish: (id: string) => req<{ status: string }>(`/incidents/${id}/publish`, { method: 'POST' }),
  unpublish: (id: string) => req<{ status: string }>(`/incidents/${id}/unpublish`, { method: 'POST' }),
  delete: (id: string) => req<{ deleted: string }>(`/incidents/${id}`, { method: 'DELETE' }),
  draft: (case_name: string) => req<Partial<Incident>>('/ai/draft', { method: 'POST', body: JSON.stringify({ case_name }) }),
}
