import { Link, useLocation } from 'react-router-dom';
import './Nav.css';

const NAV_LINKS = [
  { to: '/catalog', label: 'Catalog' },
  { to: '/eras', label: 'By Era' },
  { to: '/about', label: 'About' },
];

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-vv">VV</span>
          <span className="nav-logo-text">VIDE VERUM</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${pathname.startsWith(link.to) ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
