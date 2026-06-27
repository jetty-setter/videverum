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
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">A curated record of unexplained aerial phenomena</p>
          <h1 className="hero-headline">
            See the truth.<br />
            <em>Where it's been documented.</em>
          </h1>
          <p className="hero-sub">
            Vide Verum is an encyclopedia of rigorously sourced UAP encounters —
            military records, government disclosures, and credentialed witness accounts.
            No speculation. No aggregation. Primary sources only.
          </p>
          <div className="hero-actions">
            <Link to="/catalog" className="btn btn--primary">Browse the catalog</Link>
            <Link to="/about" className="btn btn--ghost">Our editorial standards</Link>
          </div>
        </div>
        <div className="hero-rule" aria-hidden />
      </section>

      {/* Stats bar */}
      {stats && (
        <section className="stats-bar" aria-label="Collection statistics">
          <div className="stats-inner">
            <div className="stat">
              <span className="stat-num">{stats.total}</span>
              <span className="stat-label">Documented entries</span>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat">
              <span className="stat-num">{stats.featured}</span>
              <span className="stat-label">Featured encounters</span>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat">
              <span className="stat-num">{stats.verified}</span>
              <span className="stat-label">Verified accounts</span>
            </div>
            <div className="stat-divider" aria-hidden />
            <div className="stat">
              <span className="stat-num">{stats.eras}</span>
              <span className="stat-label">Decades covered</span>
            </div>
          </div>
        </section>
      )}

      {/* Featured entries */}
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
              {featured.incidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} variant="featured" />
              ))}
            </div>
          )}

          <div className="featured-footer">
            <Link to="/catalog" className="btn btn--ghost">
              View all entries →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p className="footer-name">Vide Verum</p>
          <p className="footer-tagline">
            Latin: <em>See the Truth</em>
          </p>
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
