import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from "../lib/api"
import type { Incident } from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<Incident[]>([])
  const [pending, setPending] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([
      api.stats(),
      api.list({ limit: '5' }),
      api.list({ status: 'pending', limit: '5' }),
    ]).then(([s, r, p]) => {
      setStats(s)
      setRecent(r.items)
      setPending(p.items)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const tierColor = (tier: string) => tier === 'featured' ? '#a78bfa' : tier === 'verified' ? '#22c55e' : '#f59e0b'

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em' }}>Dashboard</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Vide Verum content overview</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => nav('/queue')} style={ghostBtn}>Review queue {stats.pending ? `(${stats.pending})` : ''}</button>
          <button onClick={() => nav('/entries/new')} style={primaryBtn}>+ Add entry</button>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Total entries', val: stats.total || 0, delta: '' },
            { label: 'Featured', val: stats.featured || 0, color: '#a78bfa' },
            { label: 'Pending review', val: stats.pending || 0, color: '#f59e0b' },
            { label: 'Published', val: stats.published || 0, color: '#22c55e' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', color: s.color || '#fff', lineHeight: 1 }}>{loading ? '—' : s.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Pending review ({pending.length})
            </div>
            {pending.map(inc => (
              <div key={inc.incident_id} onClick={() => nav(`/entries/${inc.incident_id}/edit`)} style={{ background: '#0e0e0e', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 8, padding: '12px 14px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{inc.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{inc.date_display} · {inc.location_name}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                  {!inc.curator_notes ? 'Needs curator note' : 'Ready to publish'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Recently added</div>
          {loading ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', padding: '20px 0' }}>Loading...</div>
          ) : recent.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', padding: '20px 0' }}>
              No entries yet. <span style={{ color: '#a78bfa', cursor: 'pointer' }} onClick={() => nav('/entries/new')}>Add your first entry →</span>
            </div>
          ) : recent.map(inc => (
            <div key={inc.incident_id} onClick={() => nav(`/entries/${inc.incident_id}/edit`)} style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color .12s' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${tierColor(inc.tier)}22`, color: tierColor(inc.tier), letterSpacing: '0.06em', textTransform: 'uppercase' }}>{inc.tier}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{inc.title}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{inc.date_display} · {inc.location_name}</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Edit →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const primaryBtn: React.CSSProperties = { background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }
