import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from "../lib/api"
import type { Incident } from '../lib/api'
import EntryForm from '../components/EntryForm'

export default function AddEntry() {
  const [saving, setSaving] = useState(false)
  const nav = useNavigate()

  const handleSave = async (data: Incident) => {
    setSaving(true)
    try {
      const created = await api.create({ ...data, status: 'pending', tier: data.tier || 'pending' })
      nav(`/entries/${created.incident_id}/edit`)
    } finally { setSaving(false) }
  }

  const handlePublish = async (data: Incident) => {
    setSaving(true)
    try {
      const created = await api.create({ ...data, status: 'pending' })
      await api.publish(created.incident_id!)
      nav('/dashboard')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em' }}>Add entry</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>New encyclopedia entry for Vide Verum</div>
        </div>
      </div>
      <EntryForm onSave={handleSave} onPublish={handlePublish} saving={saving} />
    </div>
  )
}
