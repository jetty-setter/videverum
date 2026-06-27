import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Entry from './pages/Entry';
import Eras from './pages/Eras';
import About from './pages/About';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/entry/:slug" element={<Entry />} />
        <Route path="/eras" element={<Eras />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <main style={{ padding: '5rem 2rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
        404 — Entry not found.
      </p>
      <a href="/" style={{ color: 'var(--violet)', fontSize: '0.875rem', marginTop: '1rem', display: 'inline-block' }}>
        Return home
      </a>
    </main>
  );
}
