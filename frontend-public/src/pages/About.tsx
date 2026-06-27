import './About.css';

const SOURCING_HIERARCHY = [
  {
    tier: '01',
    label: 'Primary Government',
    desc: 'Direct agency documents from AARO, the Pentagon UAP Task Force, war.gov/UFO, vault.fbi.gov, cia.gov/readingroom, catalog.archives.gov, and congress.gov testimony. These are the evidentiary floor.',
  },
  {
    tier: '02',
    label: 'Foreign Government Bodies',
    desc: 'Official disclosure agencies with documented investigative mandates: France\'s GEIPAN, Chile\'s CEFAA, and equivalent bodies operating under formal government authorization.',
  },
  {
    tier: '03',
    label: 'Academic & Peer-Reviewed',
    desc: 'Published research in credentialed journals. Radar data, sensor analysis, and atmospheric studies that bear on incident documentation.',
  },
  {
    tier: '04',
    label: 'Serious Investigative Journalism',
    desc: 'Reporting from outlets with documented editorial standards and named sourcing: NYT, Washington Post, The Intercept. Used for corroboration, never as primary sourcing.',
  },
  {
    tier: '05',
    label: 'Document Archives',
    desc: 'The Black Vault and equivalent FOIA repositories are used only as document-access layers when no direct government link exists. Editorial commentary from these sources is never cited.',
  },
];

export default function About() {
  return (
    <main className="about">
      <div className="about-inner">
        <header className="about-header">
          <p className="about-eyebrow">About Vide Verum</p>
          <h1 className="about-title">
            An encyclopedia of documented encounters.<br />
            <em>Not a sightings database.</em>
          </h1>
        </header>

        <div className="about-body">
          <section className="about-section">
            <p>
              Vide Verum is a curated reference for UAP encounters that meet a specific threshold:
              documentation traceable to government records, credentialed witnesses, or peer-reviewed
              analysis. The catalog covers roughly 200–500 canonical encounters. Every entry is
              authored by a human curator who verifies sources before publication.
            </p>
            <p>
              The name is Latin. It means <em>see the truth</em>. The project exists because the
              subject has always attracted the opposite — circular citation, embellishment, and
              sources that cite sources that cite nothing real. We built a different model.
            </p>
          </section>

          <section className="about-section">
            <h2 className="about-section-title">Editorial Standards</h2>
            <p>
              Each entry requires all six criteria before publication: traceable primary source,
              geographic specificity, temporal specificity, named or credentialed witness,
              documentation independent of the witness account, and no fabricated or circular citation.
            </p>
            <p>
              Every entry carries a credibility score from 1 (unverified) to 5 (government-confirmed
              or declassified). Featured entries receive a dedicated page with full narrative,
              sourcing, and a curator's note explaining our editorial judgment. Verified entries
              appear in the catalog with an expandable curator's note. Neither tier tolerates
              speculation presented as fact.
            </p>
          </section>

          <section className="about-section">
            <h2 className="about-section-title">Sourcing Hierarchy</h2>
            <div className="sourcing-list">
              {SOURCING_HIERARCHY.map(item => (
                <div key={item.tier} className="sourcing-item">
                  <div className="sourcing-tier">{item.tier}</div>
                  <div className="sourcing-content">
                    <h3 className="sourcing-label">{item.label}</h3>
                    <p className="sourcing-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section">
            <h2 className="about-section-title">What this is not</h2>
            <p>
              Vide Verum does not document every reported UAP sighting. It does not cite Wikipedia.
              It does not reproduce editorial commentary from aggregator sites without independent
              verification. Unresolved status does not make something a hoax — it means documentation
              is insufficient. We say so explicitly.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
