import { useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import IncidentCard from '../components/IncidentCard';
import { Skeleton, ErrorState, EmptyState } from '../components/States';
import './Collection.css';

const DECADES = ['1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

const DECADE_CONTEXT: Record<string, string> = {
  '1940s': 'The dawn of the modern UAP era. Roswell, the Arnold sighting, and the first government investigations.',
  '1950s': "Cold War skies and civilian mass sightings. The Air Force's Project Blue Book launches.",
  '1960s': 'Congressional hearings, the Condon Committee, and encounters that defied conventional explanation.',
  '1970s': 'Military encounters multiply. Pilot testimonies begin to accumulate in official records.',
  '1980s': 'Rendlesham Forest, the Cash-Landrum case, and the emergence of civilian investigative organizations.',
  '1990s': 'Belgian wave, the Phoenix Lights, and new declassification under FOIA.',
  '2000s': 'USS Nimitz and the rise of the advanced aerospace threat identification program.',
  '2010s': 'The New York Times breaks the AATIP story. Tic Tac footage declassified.',
  '2020s': 'Congressional UAP hearings, the AARO, and the first formal non-human intelligence claims under oath.',
};

function decadeOf(dateSort: string): string | null {
  const year = parseInt(dateSort?.slice(0, 4), 10);
  if (!year) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

export default function Collection() {
  const [selectedDecade, setSelectedDecade] = useState('1940s');
  const [search, setSearch] = useState('');

  const { data, loading, error } = useAsync(() => api.listIncidents({ limit: 200 }), []);

  const items = data?.items ?? [];

  const inDecade = items.filter(i => decadeOf(i.date_sort) === selectedDecade);

  const filtered = search.trim()
    ? inDecade.filter(i => {
        const q = search.toLowerCase();
        return i.title.toLowerCase().includes(q)
          || i.hook?.toLowerCase().includes(q)
          || i.location_name?.toLowerCase().includes(q);
      })
    : inDecade;

  const sorted = [...filtered].sort((a, b) => (a.date_sort || '').localeCompare(b.date_sort || ''));

  return (
    <main className="collection">
      <div className="collection-inner">
        <div className="collection-header">
          <h1 className="collection-title">The Collection</h1>
          <p className="collection-desc">
            {data ? `${data.count} documented encounter${data.count !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>

        <div className="decade-nav" role="tablist" aria-label="Select decade">
          {DECADES.map(decade => (
            <button
              key={decade}
              role="tab"
              aria-selected={decade === selectedDecade}
              className={`decade-tab ${decade === selectedDecade ? 'active' : ''}`}
              onClick={() => setSelectedDecade(decade)}
            >
              {decade}
            </button>
          ))}
        </div>

        {DECADE_CONTEXT[selectedDecade] && (
          <p className="decade-context">{DECADE_CONTEXT[selectedDecade]}</p>
        )}

        <div className="filters" role="search" aria-label="Filter encounters">
          <input
            className="filter-search"
            type="search"
            placeholder="Search this decade…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search encounters"
          />
        </div>

        {loading && <Skeleton count={4} />}
        {error && <ErrorState message={`Failed to load ${selectedDecade} entries: ${error}`} />}

        {!loading && !error && (
          sorted.length === 0
            ? <EmptyState message={search ? `No entries match "${search}".` : `No entries documented for the ${selectedDecade} yet.`} />
            : (
              <div className="collection-list">
                {sorted.map(incident => (
                  <IncidentCard key={incident.incident_id} incident={incident} variant="list" />
                ))}
              </div>
            )
        )}
      </div>
    </main>
  );
}
