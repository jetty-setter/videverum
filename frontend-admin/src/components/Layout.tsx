import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function Layout() {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    api.stats().then(s => setPendingCount(s.pending || 0)).catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080808', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: 200, borderRight: '1px solid rgba(255,255,255,0.06)', background: '#0e0e0e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Vide <span style={{ color: '#a78bfa', fontStyle: 'italic' }}>Verum</span>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 400, marginTop: 1 }}>Admin</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 0', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.12)', padding: '0 14px', marginBottom: 4 }}>Overview</div>
          {[
            { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
            { to: '/entries/new', label: 'Add entry', icon: '+' },
            { to: '/queue', label: `Queue${pendingCount ? ` (${pendingCount})` : ''}`, icon: '⏱' },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px',
                fontSize: 12, color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                textDecoration: 'none', borderLeft: isActive ? '2px solid #a78bfa' : '2px solid transparent',
                background: isActive ? 'rgba(167,139,250,0.07)' : 'transparent',
                transition: 'all .12s', letterSpacing: '-0.01em',
              })}
            >
              <span style={{ fontSize: 13, width: 16, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.12)', padding: '12px 14px 4px' }}>Content</div>
          {[
            { to: '/entries', label: 'All entries', icon: '≡' },
            { to: '/entries?tier=featured', label: 'Featured', icon: '⭐' },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px',
                fontSize: 12, color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                textDecoration: 'none', borderLeft: '2px solid transparent',
                transition: 'all .12s', letterSpacing: '-0.01em',
              })}
            >
              <span style={{ fontSize: 13, width: 16, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2.5s ease-in-out infinite' }}></div>
            videverum.com · live
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }
        * { box-sizing: border-box; }
        input, select, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}
