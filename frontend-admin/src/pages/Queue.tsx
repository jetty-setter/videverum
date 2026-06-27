import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from "../lib/api"
import type { Incident } from '../lib/api'

export default function Queue() {
  const [items, setItems] = useState<Incident[]>([])
  const nav = useNavigate()

  useEffect(() => {
    api.list({ status: 'pending', limit: '50' }).then(r => setItems(r.items)).catch(console.error)
  }, [])

  const needs = (inc: Incident) => {
    const flags: string[] = []
    if (!inc.curator_notes) flags.push("Needs curator's note")
    if ((inc.criteria_met || []).length < 2) flags.push('Needs ≥2 criteria')
    if (!inc.sources?.length) flags.push('Needs sources')
    return flags
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Review queue</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{items.length} entries need attention before publishing</div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {items.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, padding: '20px 0' }}>Queue is empty — all entries reviewed ✓</div>
        ) : items.map(inc => {
          const flags = needs(inc)
          return (
            <div key={inc.incident_id} onClick={() => nav(`/entries/${inc.incident_id}/edit`)} style={{ background: '#0e0e0e', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 8, padding: '12px 14px', marginBottom: 6, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{inc.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{inc.date_display} · {inc.location_name}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {flags.map((f, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 500 }}>{f}</span>
                  ))}
                  {flags.length === 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 500 }}>Ready to publish</span>}
                </div>
              </div>
              <button style={{ background: flags.length === 0 ? '#a78bfa' : 'rgba(245,158,11,0.15)', color: flags.length === 0 ? '#fff' : '#f59e0b', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                {flags.length === 0 ? 'Publish →' : 'Complete →'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
