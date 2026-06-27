import { Link } from 'react-router-dom';
import type { Incident } from '../types';
import './IncidentCard.css';

interface Props {
  incident: Incident;
  variant?: 'featured' | 'list';
}

const CREDIBILITY_LABEL: Record<number, string> = {
  1: 'Unverified', 2: 'Disputed', 3: 'Plausible', 4: 'Credible', 5: 'Definitive',
};

export default function IncidentCard({ incident, variant = 'list' }: Props) {
  const isFeatured = incident.tier === 'featured';

  const card = (
    <article
      className={`card card--${variant} card--tier-${incident.tier}`}
      aria-label={incident.title}
    >
      <div className="card-header">
        <div className="card-meta">
          <span className="card-date">{incident.date_display}</span>
          {incident.location_name && (
            <>
              <span className="card-sep">·</span>
              <span className="card-location">{incident.location_name}</span>
            </>
          )}
        </div>

        <div className="card-badges">
          {isFeatured && <span className="badge badge--featured">Featured</span>}
          {incident.tier === 'verified' && <span className="badge badge--verified">Verified</span>}
          <span className="badge badge--score" title="Credibility score">
            {CREDIBILITY_LABEL[incident.credibility_score] ?? `Score ${incident.credibility_score}`}
          </span>
        </div>
      </div>

      <h2 className="card-title">
        {incident.title}
      </h2>

      {incident.hook && (
        <p className="card-hook">{incident.hook}</p>
      )}

      {incident.tier === 'verified' && incident.curator_notes && (
        <ExpandableNote note={incident.curator_notes} />
      )}

      {incident.themes?.length > 0 && (
        <div className="card-themes">
          {incident.themes.slice(0, 4).map(t => (
            <span key={t} className="theme-tag">{t}</span>
          ))}
        </div>
      )}

      {isFeatured && (
        <div className="card-cta">
          Read full entry <span aria-hidden>→</span>
        </div>
      )}
    </article>
  );

  return isFeatured ? (
    <Link to={`/entry/${incident.slug}`} className="card-link" aria-label={`Read entry: ${incident.title}`}>
      {card}
    </Link>
  ) : card;
}

function ExpandableNote({ note }: { note: string }) {
  return (
    <details className="curator-note">
      <summary className="curator-note-trigger">
        <span className="curator-note-icon">◈</span>
        Curator's note
      </summary>
      <p className="curator-note-body">{note}</p>
    </details>
  );
}
