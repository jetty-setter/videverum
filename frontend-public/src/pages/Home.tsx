import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import IncidentCard from '../components/IncidentCard';
import { Skeleton, ErrorState } from '../components/States';
import './Home.css';

export default function Home() {
  const { data: featured, loading, error } = useAsync(() => api.getFeatured(), []);
  const { data: stats } = useAsync(() => api.getStats(), []);

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">The vetted UAP record — 75 years documented</p>
          <h1 className="hero-headline">
            See the truth.<br />
            <em>Where it's been</em><br />
            documented.
          </h1>
          <p className="hero-sub">
            Vide Verum is an encyclopedia of rigorously sourced UAP encounters —
            military records, government disclosures, and credentialed witness accounts.
            No speculation. No aggregation. Primary sources only.
          </p>
          <div className="hero-actions">
            <Link to="/catalog" className="btn btn--primary">Browse the collection</Link>
            <Link to="/about" className="btn btn--ghost">Editorial standards</Link>
          </div>
        </div>
        <div className="hero-rule" aria-hidden />
      </section>

      {stats && (
        <section className="collection-note" aria-label="About the collection">
          <p className="collection-note-text">
            {stats.total} cases in the permanent collection, spanning {stats.eras} eras of documented encounters —
            each admitted only after independent review.
          </p>
        </section>
      )}

      <section className="featured-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Featured Encounters</h2>
            <p className="section-desc">
              The most thoroughly documented cases in the record.
              Each entry carries a dedicated page with full narrative and source verification.
            </p>
          </div>

          {loading && <Skeleton count={3} />}
          {error && <ErrorState message={`Could not load entries: ${error}`} />}

          {featured && (
            <div className="featured-grid">
              {featured.items.map(incident => (
                <IncidentCard key={incident.incident_id} incident={incident} variant="featured" />
              ))}
            </div>
          )}

          <div className="featured-footer">
            <Link to="/catalog" className="btn btn--ghost">View all entries →</Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <p className="footer-name">Vide Verum</p>
          <p className="footer-tagline">A small museum for UAP testimony.</p>
          <p className="footer-note">
            All entries are sourced from government documents, declassified records,
            and credentialed witness testimony. Editorial standards are published{' '}
            <Link to="/about" className="footer-link">here</Link>.
          </p>
        </div>
      </footer>
    </main>
  );
}
