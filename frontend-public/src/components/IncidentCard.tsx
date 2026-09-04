import { Link } from 'react-router-dom';
import type { Incident } from '../types';
import './IncidentCard.css';

interface Props {
  incident: Incident;
  variant?: 'featured' | 'list';
}

export default function IncidentCard({ incident, variant = 'list' }: Props) {
  const isFeatured = incident.tier === 'featured';

  const card = (
    <article
      className={`card card--${variant} card--tier-${incident.tier}`}
      aria-label={incident.title}
    >
      <div className="card-meta">
        <span className="card-date">{incident.date_display}</span>
        {incident.location_name && (
          <>
            <span className="card-sep">·</span>
            <span className="card-location">{incident.location_name}</span>
          </>
        )}
        {isFeatured && (
          <>
            <span className="card-sep">·</span>
            <span className="card-tier">Featured</span>
          </>
        )}
        {incident.tier === 'verified' && (
          <>
            <span className="card-sep">·</span>
            <span className="card-tier">Verified</span>
          </>
        )}
      </div>

      <h2 className="card-title">{incident.title}</h2>

      {incident.hook && <p className="card-hook">{incident.hook}</p>}

      {incident.tier === 'verified' && incident.curator_notes && (
        <details className="curator-note">
          <summary className="curator-note-trigger">
            <span className="curator-note-icon">◈</span>
            Curator's note
          </summary>
          <p className="curator-note-body">{incident.curator_notes}</p>
        </details>
      )}

      {isFeatured && (
        <div className="card-cta">Read full entry <span aria-hidden>→</span></div>
      )}
    </article>
  );

  return (
    <Link to={`/entry/${incident.slug}`} className="card-link" aria-label={`Read entry: ${incident.title}`}>
      {card}
    </Link>
  );
}
