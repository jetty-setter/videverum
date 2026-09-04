import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { Skeleton, ErrorState } from '../components/States';
import './Entry.css';

const CREDIBILITY: Record<number, { label: string; desc: string }> = {
  1: { label: 'Unverified', desc: 'Single uncorroborated source' },
  2: { label: 'Disputed', desc: 'Conflicting accounts exist' },
  3: { label: 'Plausible', desc: 'Consistent accounts, limited documentation' },
  4: { label: 'Credible', desc: 'Multiple independent sources' },
  5: { label: 'Definitive', desc: 'Government-confirmed or declassified' },
};

export default function Entry() {
  const { slug } = useParams<{ slug: string }>();
  const { data: incident, loading, error } = useAsync(
    () => api.getBySlug(slug!),
    [slug]
  );

  if (loading) {
    return (
      <main className="entry">
        <div className="entry-inner"><Skeleton count={1} /></div>
      </main>
    );
  }

  if (error || !incident) {
    return (
      <main className="entry">
        <div className="entry-inner">
          <ErrorState message={error ?? 'Entry not found.'} />
          <Link to="/catalog" className="back-link">← Back to the collection</Link>
        </div>
      </main>
    );
  }

  const credibility = CREDIBILITY[incident.credibility_score];
  const pubDate = incident.published_at
    ? new Date(incident.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <main className="entry">
      <div className="entry-inner">
        <nav className="entry-breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">Vide Verum</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <Link to="/catalog" className="breadcrumb-link">The Collection</Link>
          <span className="breadcrumb-sep" aria-hidden>›</span>
          <span className="breadcrumb-current">{incident.title}</span>
        </nav>

        <header className="entry-header">
          <div className="entry-meta">
            {incident.tier === 'featured' && <span className="entry-tier">Featured</span>}
            {incident.era && (
              <>
                {incident.tier === 'featured' && <span className="entry-meta-sep">·</span>}
                <span className="entry-era">{incident.era}</span>
              </>
            )}
          </div>
          <h1 className="entry-title">{incident.title}</h1>
          <div className="entry-locus">
            {incident.date_display && (
              <span className="locus-item">
                <span className="locus-icon" aria-hidden>◷</span>
                {incident.date_display}
              </span>
            )}
            {incident.location_name && (
              <span className="locus-item">
                <span className="locus-icon" aria-hidden>◎</span>
                {incident.location_name}{incident.country && `, ${incident.country}`}
              </span>
            )}
          </div>
          {incident.hook && <p className="entry-hook">{incident.hook}</p>}
          {credibility && (
            <p className="entry-credibility-line">
              {credibility.label} — {credibility.desc}
            </p>
          )}
        </header>

        <div className="entry-divider" aria-hidden />

        {incident.narrative && (
          <section aria-label="Incident narrative">
            <h2 className="narrative-heading">Account</h2>
            <div className="narrative-body">
              {incident.narrative.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}

        {incident.curator_notes && (
          <section className="entry-curator" aria-label="Curator's note">
            <div className="curator-header">
              <span className="curator-icon" aria-hidden>◈</span>
              <h2 className="curator-title">Curator's Note</h2>
            </div>
            <p className="curator-body">{incident.curator_notes}</p>
          </section>
        )}

        {incident.sources?.length > 0 && (
          <section aria-label="Primary sources">
            <h2 className="sources-heading">Primary Sources</h2>
            <ul className="sources-list">
              {incident.sources.map((src, i) => (
                <li key={i} className="source-item">
                  <div className="source-meta">
                    <span className="source-type">{src.type}</span>
                    {src.verified && <span className="source-verified">✓</span>}
                  </div>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="source-title">
                    {src.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="entry-footer">
          {pubDate && <p className="entry-pub-date">Published {pubDate}</p>}
          <Link to="/catalog" className="back-link">← Back to the collection</Link>
        </div>
      </div>
    </main>
  );
}
