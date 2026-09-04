import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../lib/cart';
import './Nav.css';

const NAV_LINKS = [
  { to: '/catalog', label: 'The Collection' },
  { to: '/shop', label: 'The Crate' },
  { to: '/about', label: 'About' },
];

export default function Nav() {
  const { pathname } = useLocation();
  const { count } = useCart();

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <img src="/logo-white.png" alt="Vide Verum" className="nav-logo-img" />
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${pathname.startsWith(link.to) ? 'active' : ''}`}
            >
              {link.label}
              {link.to === '/shop' && count > 0 && (
                <span className="nav-crate-count">{count}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
