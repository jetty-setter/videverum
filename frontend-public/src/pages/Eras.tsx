import { useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import IncidentCard from '../components/IncidentCard';
import { Skeleton, ErrorState, EmptyState } from '../components/States';
import './Eras.css';

const ERA_LIST = ['1940s','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];

const ERA_CONTEXT: Record<string, string> = {
  '1940s': 'The dawn of the modern UAP era. Roswell, the Arnold sighting, and the first government investigations.',
  '1950s': 'Cold War skies and civilian mass sightings. The Air Force\'s Project Blue Book launches.',
  '1960s': 'Congressional hearings, the Condon Committee, and encounters that defied conventional explanation.',
  '1970s': 'Military encounters multiply. Pilot testimonies begin to accumulate in official records.',
  '1980s': 'Rendlesham Forest, the Cash-Landrum case, and the emergence of civilian investigative organizations.',
  '1990s': 'Belgian wave, the Phoenix Lights, and new declassification under FOIA.',
  '2000s': 'USS Nimitz and the rise of the advanced aerospace threat identification program.',
  '2010s': 'The New York Times breaks the AATIP story. Tic Tac footage declassified.',
  '2020s': 'Congressional UAP hearings, the AARO, and the first formal non-human intelligence claims under oath.',
};

export default function Eras() {
  const [selectedEra, setSelectedEra] = useState('1940s');

  const { data, loading, error } = useAsync(
    () => api.listIncidents({ era: selectedEra, limit: 50 }),
    [selectedEra]
  );

  return (
    <main className="eras">
      <div className="eras-inner">
        <header className="eras-header">
          <h1 className="eras-title">Encounters by Era</h1>
          <p className="eras-desc">Eight decades of documented aerial phenomena.</p>
        </header>

        <div className="era-nav" role="tablist" aria-label="Select decade">
          {ERA_LIST.map(era => (
            <button
              key={era}
              role="tab"
              aria-selected={era === selectedEra}
              className={`era-tab ${era === selectedEra ? 'active' : ''}`}
              onClick={() => setSelectedEra(era)}
            >
              {era}
            </button>
          ))}
        </div>

        {ERA_CONTEXT[selectedEra] && (
          <p className="era-context">{ERA_CONTEXT[selectedEra]}</p>
        )}

        <div className="era-results">
          {loading && <Skeleton count={4} />}
          {error && <ErrorState message={`Failed to load ${selectedEra} entries: ${error}`} />}
          {!loading && !error && (
            data?.incidents.length === 0
              ? <EmptyState message={`No entries documented for the ${selectedEra} yet.`} />
              : (
                <div className="era-list">
                  {data?.incidents.map(incident => (
                    <IncidentCard key={incident.id} incident={incident} variant="list" />
                  ))}
                </div>
              )
          )}
        </div>
      </div>
    </main>
  );
}
