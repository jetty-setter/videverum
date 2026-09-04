import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Collection from './pages/Collection';
import Entry from './pages/Entry';
import About from './pages/About';
import Shop from './pages/Shop';
import { CartProvider } from './lib/cart';
import './index.css';

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Collection />} />
          <Route path="/eras" element={<Navigate to="/catalog" replace />} />
          <Route path="/entry/:slug" element={<Entry />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

function NotFound() {
  return (
    <main style={{ padding: '5rem 2rem', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
        404 — Entry not found.
      </p>
      <a href="/" style={{ color: 'var(--green)', fontSize: '0.875rem', marginTop: '1rem', display: 'inline-block' }}>
        Return home
      </a>
    </main>
  );
}
