import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from "../lib/api"
import type { Incident } from '../lib/api'
import EntryForm from '../components/EntryForm'

export default function EditEntry() {
  const { id } = useParams()
  const nav = useNavigate()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) api.get(id).then(setIncident).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleSave = async (data: Incident) => {
    setSaving(true)
    try { await api.update(id!, data) }
    finally { setSaving(false) }
  }

  const handlePublish = async (data: Incident) => {
    setSaving(true)
    try {
      await api.update(id!, data)
      await api.publish(id!)
      nav('/dashboard')
    } finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading...</div>
  if (!incident) return <div style={{ padding: 40, color: '#ef4444', fontSize: 13 }}>Entry not found</div>

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Edit entry</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incident.title}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {incident.status === 'published' && (
            <button onClick={() => api.unpublish(id!).then(() => nav('/dashboard'))} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '5px 11px', fontSize: 11, cursor: 'pointer' }}>
              Unpublish
            </button>
          )}
        </div>
      </div>
      <EntryForm initial={incident} onSave={handleSave} onPublish={handlePublish} saving={saving} />
    </div>
  )
}
