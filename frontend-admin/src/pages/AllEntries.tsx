import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from "../lib/api"
import type { Incident } from '../lib/api'

export default function AllEntries() {
  const [items, setItems] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.list({ limit: '200' }).then(r => setItems(r.items)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = filter ? items.filter(i => i.tier === filter || i.status === filter) : items
  const tierColor = (t: string) => t === 'featured' ? '#a78bfa' : t === 'verified' ? '#22c55e' : '#f59e0b'

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>All entries ({items.length})</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['', 'featured', 'verified', 'pending'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'rgba(167,139,250,0.12)' : 'transparent', border: `1px solid ${filter === f ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.1)'}`, color: filter === f ? '#a78bfa' : 'rgba(255,255,255,0.4)', borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {loading ? <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Loading...</div> :
         filtered.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>No entries found</div> :
         filtered.map(inc => (
          <div key={inc.incident_id} onClick={() => nav(`/entries/${inc.incident_id}/edit`)} style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', marginBottom: 6, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: `${tierColor(inc.tier)}22`, color: tierColor(inc.tier), letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{inc.tier}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{inc.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{inc.date_display} · {inc.location_name} · {inc.era}</div>
            </div>
            <div style={{ fontSize: 10, color: inc.status === 'published' ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>{inc.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
