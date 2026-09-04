export type Tier = 'featured' | 'verified' | 'pending';
export type Status = 'published' | 'pending' | 'draft';

export interface Source {
  type: string;
  title: string;
  url: string;
  verified: boolean;
}

export interface Incident {
  incident_id: string;
  title: string;
  hook: string;
  date_display: string;
  date_sort: string;
  date_precision: string;
  location_name: string;
  country: string;
  lat?: string;
  lng?: string;
  era: string;
  source_type: string;
  narrative: string;
  curator_notes: string;
  credibility_score: number;
  tier: Tier;
  status: Status;
  criteria_met: string[];
  themes: string[];
  sources: Source[];
  slug: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface IncidentListResponse {
  items: Incident[];
  count: number;
  last_key?: string;
}
