import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import IncidentCard from '../components/IncidentCard';
import { Skeleton, ErrorState, EmptyState } from '../components/States';
import './Catalog.css';

const TIERS = [
  { value: '', label: 'All tiers' },
  { value: 'featured', label: 'Featured' },
  { value: 'verified', label: 'Verified' },
];

const ERAS = [
  { value: '', label: 'All eras' },
  '1940s','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s',
].map(e => typeof e === 'string' ? { value: e, label: e } : e);

export default function Catalog() {
  const [tier, setTier] = useState('');
  const [era, setEra] = useState('');
  const [search, setSearch] = useState('');

  const fetcher = useCallback(
    () => api.listIncidents({ tier: tier || undefined, era: era || undefined, limit: 50 }),
    [tier, era]
  );

  const { data, loading, error } = useAsync(fetcher, [tier, era]);

  const incidents = data?.incidents ?? [];

  const filtered = search.trim()
    ? incidents.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.hook?.toLowerCase().includes(search.toLowerCase()) ||
        i.location_name?.toLowerCase().includes(search.toLowerCase())
      )
    : incidents;

  return (
    <main className="catalog">
      <div className="catalog-inner">
        <div className="catalog-header">
          <h1 className="catalog-title">Encounter Catalog</h1>
          <p className="catalog-desc">
            {data ? `${data.count} documented encounter${data.count !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>

        {/* Filters */}
        <div className="filters" role="search" aria-label="Filter encounters">
          <input
            className="filter-search"
            type="search"
            placeholder="Search by name, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search encounters"
          />

          <div className="filter-selects">
            <select
              className="filter-select"
              value={tier}
              onChange={e => setTier(e.target.value)}
              aria-label="Filter by tier"
            >
              {TIERS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={era}
              onChange={e => setEra(e.target.value)}
              aria-label="Filter by era"
            >
              {ERAS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading && <Skeleton count={6} />}
        {error && <ErrorState message={`Failed to load catalog: ${error}`} />}

        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <EmptyState
                message={search ? `No entries match "${search}".` : 'No entries in this category yet.'}
              />
            ) : (
              <div className="catalog-list">
                {filtered.map(incident => (
                  <IncidentCard key={incident.id} incident={incident} variant="list" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
