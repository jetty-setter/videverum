import { useState } from 'react'
import { api } from '../lib/api'
import type { Incident, Source } from '../lib/api'

const EMPTY_INCIDENT: Incident = {
  title: '', hook: '', date_display: '', date_sort: '', date_precision: 'exact',
  location_name: '', country: '', era: '', source_type: 'military',
  narrative: '', curator_notes: '', credibility_score: 3, tier: 'pending',
  status: 'pending', criteria_met: [], themes: [], physical_evidence: false,
  cover_up_indicators: false, sources: [], related_incidents: [],
}

const CRITERIA = [
  { key: 'multiple_witnesses', label: 'Multiple independent witnesses' },
  { key: 'physical_evidence', label: 'Physical evidence (radar, photo, material, EM)' },
  { key: 'official_documentation', label: 'Official government / military documentation' },
  { key: 'credentialed_investigation', label: 'Credentialed investigation — no conventional explanation' },
  { key: 'congressional_testimony', label: 'Congressional testimony or official acknowledgment' },
  { key: 'sensor_corroboration', label: 'Independent sensor corroboration (radar, FLIR, satellite)' },
]

const SOURCE_TYPES = ['Congressional','DoD / Pentagon','AARO','FBI Vault','CIA Reading Room','NARA','FOIA release','Academic paper','Military report','Foreign government','News / journalism','Book']
const SCORE_LABELS = ['','Single credible witness','Multiple witnesses, limited documentation','Multiple sources, official record','Multi-sensor, official acknowledgment','Exceptional — radar, video, pilot testimony, Pentagon confirmation, congressional record']

interface Props {
  initial?: Incident
  onSave: (data: Incident) => Promise<void>
  onPublish: (data: Incident) => Promise<void>
  saving?: boolean
}

export default function EntryForm({ initial, onSave, onPublish, saving }: Props) {
  const [form, setForm] = useState<Incident>(initial || { ...EMPTY_INCIDENT })
  const [caseName, setCaseName] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftStatus, setDraftStatus] = useState('')
  const [toast, setToast] = useState<{ msg: string; color?: string } | null>(null)
  const [aiGen, setAiGen] = useState(false)
  const [verifyFlags, setVerifyFlags] = useState<string[]>([])

  const showToast = (msg: string, color = '#22c55e') => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const set = (key: keyof Incident, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const toggleCrit = (key: string) => {
    const cur = form.criteria_met || []
    set('criteria_met', cur.includes(key) ? cur.filter((k: string) => k !== key) : [...cur, key])
  }

  const addSource = () => set('sources', [...(form.sources || []), { type: 'Military report', title: '', url: '', verified: false }])

  const updateSrc = (i: number, field: keyof Source, val: unknown) => {
    const s = [...(form.sources || [])]
    s[i] = { ...s[i], [field]: val }
    set('sources', s)
  }

  const draftWithAI = async () => {
    if (!caseName.trim()) { showToast('Enter a case name first', '#f59e0b'); return }
    setDrafting(true)
    const msgs = ['Searching primary sources...', 'Drafting narrative...', 'Pre-filling source URLs...', 'Flagging verification items...']
    let si = 0
    setDraftStatus(msgs[0])
    const iv = setInterval(() => { si = (si + 1) % msgs.length; setDraftStatus(msgs[si]) }, 1000)
    try {
      const draft = await api.draft(caseName)
      clearInterval(iv)
      setForm(f => ({ ...f, ...draft, sources: (draft.sources as Source[]) || [] }))
      setAiGen(true)
      const flags = (draft.verify_flags as string[]) || []
      setVerifyFlags(flags)
      showToast(flags.length ? `Draft complete — ${flags.length} items to verify` : "Entry drafted — add your curator note and publish", flags.length ? '#f59e0b' : '#22c55e')
    } catch (e: unknown) {
      clearInterval(iv)
      showToast('AI draft failed: ' + (e as Error).message, '#ef4444')
    } finally {
      setDrafting(false)
      setDraftStatus('')
    }
  }

  const handleSave = async () => {
    if (!form.title) { showToast('Add a title first', '#ef4444'); return }
    try {
      await onSave({ ...form, ai_drafted: aiGen, verify_flags: verifyFlags })
      showToast('Saved as pending')
    } catch (e: unknown) {
      showToast((e as Error).message, '#ef4444')
    }
  }

  const handlePublish = async () => {
    if (!form.title) { showToast('Add a title first', '#ef4444'); return }
    if (!form.curator_notes) { showToast("Add your curator note before publishing", '#f59e0b'); return }
    if ((form.criteria_met || []).length < 2) { showToast('Must meet at least 2 curation criteria', '#ef4444'); return }
    try {
      await onPublish({ ...form, ai_drafted: aiGen, verify_flags: verifyFlags })
      showToast('Published to Vide Verum')
    } catch (e: unknown) {
      showToast((e as Error).message, '#ef4444')
    }
  }

  const metCount = (form.criteria_met || []).length
  const inp: React.CSSProperties = { width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '7px 9px', fontSize: 12, color: '#fff', outline: 'none' }
  const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none' }

  return (
    <div style={{ padding: '16px 20px 40px', maxWidth: 860 }}>

      <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.06),rgba(96,165,250,0.04))', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>+</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Draft with AI</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Enter a case name to draft a full entry with sources</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={caseName} onChange={e => setCaseName(e.target.value)} onKeyDown={e => e.key === 'Enter' && draftWithAI()} placeholder="e.g. USS Nimitz, Rendlesham Forest, Malmstrom AFB..." style={{ ...inp, flex: 1 }} />
          <button onClick={draftWithAI} disabled={drafting} style={{ ...btn, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.22)', opacity: drafting ? 0.7 : 1 }}>
            {drafting ? 'Drafting...' : 'Draft entry'}
          </button>
        </div>
        {drafting && <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{draftStatus}</div>}
        {verifyFlags.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>VERIFY BEFORE PUBLISHING</div>
            {verifyFlags.map((f, i) => <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>- {f}</div>)}
          </div>
        )}
      </div>

      <Sec title="Core details">
        <F label="Title"><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Full descriptive title including location" style={inp} /></F>
        <F label="One-line hook"><input value={form.hook} onChange={e => set('hook', e.target.value)} placeholder="The sentence that makes a visitor click" style={inp} /></F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <F label="Date"><input value={form.date_display} onChange={e => set('date_display', e.target.value)} placeholder="e.g. Nov 14, 2004" style={inp} /></F>
          <F label="Era">
            <select value={form.era} onChange={e => set('era', e.target.value)} style={inp}>
              <option value="">Select era</option>
              <option>Pre-modern (before 1947)</option>
              <option>Cold War (1947-1969)</option>
              <option>Dark years (1970-2000)</option>
              <option>Re-disclosure (2001-present)</option>
            </select>
          </F>
          <F label="Location"><input value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="Specific location" style={inp} /></F>
          <F label="Country"><input value={form.country} onChange={e => set('country', e.target.value)} style={inp} /></F>
          <F label="Latitude"><input value={form.lat || ''} onChange={e => set('lat', e.target.value)} placeholder="e.g. 32.8744" style={inp} /></F>
          <F label="Longitude"><input value={form.lng || ''} onChange={e => set('lng', e.target.value)} placeholder="e.g. -117.7083" style={inp} /></F>
          <F label="Source type">
            <select value={form.source_type} onChange={e => set('source_type', e.target.value)} style={inp}>
              {['military','government','civilian','congressional','intelligence','academic'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </F>
        </div>
      </Sec>

      <Sec title="Narrative and editorial">
        <F label="Full narrative">
          <textarea value={form.narrative} onChange={e => set('narrative', e.target.value)} placeholder="The documented account. AI drafts this; you edit and approve." style={{ ...inp, minHeight: 160, resize: 'vertical', lineHeight: 1.7 }} />
        </F>
        <F label="Curator note (required to publish)">
          <textarea value={form.curator_notes} onChange={e => set('curator_notes', e.target.value)} placeholder="Why does this case matter? Your editorial voice." style={{ ...inp, minHeight: 100, resize: 'vertical', lineHeight: 1.7 }} />
        </F>
      </Sec>

      <Sec title="Sources and links">
        {(form.sources || []).map((src, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 180px 26px 26px', gap: 6, alignItems: 'center' }}>
            <select value={src.type} onChange={e => updateSrc(i, 'type', e.target.value)} style={{ ...inp, fontSize: 11, padding: '6px 8px' }}>
              {SOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input value={src.title} onChange={e => updateSrc(i, 'title', e.target.value)} placeholder="Title" style={inp} />
            <input value={src.url} onChange={e => updateSrc(i, 'url', e.target.value)} placeholder="https://..." style={{ ...inp, color: '#60a5fa', fontSize: 11 }} />
            <button onClick={() => updateSrc(i, 'verified', !src.verified)} style={{ width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, background: src.verified ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: src.verified ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>{src.verified ? 'v' : '?'}</button>
            <button onClick={() => set('sources', (form.sources||[]).filter((_,idx)=>idx!==i))} style={{ width: 26, height: 26, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>x</button>
          </div>
        ))}
        <button onClick={addSource} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}>+ Add source</button>
      </Sec>

      <Sec title="Credibility score">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#a78bfa' }}>{form.credibility_score}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(n => <div key={n} onClick={() => set('credibility_score', n)} style={{ width: 22, height: 6, borderRadius: 3, cursor: 'pointer', background: n <= form.credibility_score ? '#a78bfa' : 'rgba(255,255,255,0.1)' }} />)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{SCORE_LABELS[form.credibility_score]}</div>
        </div>
      </Sec>

      <Sec title="Curation criteria — must meet 2 or more to publish">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {CRITERIA.map(c => {
            const met = (form.criteria_met||[]).includes(c.key)
            return (
              <div key={c.key} onClick={() => toggleCrit(c.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: met ? 'rgba(34,197,94,0.04)' : '#141414', border: `1px solid ${met ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: met ? '#22c55e' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <div style={{ fontSize: 11, color: met ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', lineHeight: 1.35 }}>{c.label}</div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: metCount < 2 ? '#ef4444' : 'rgba(255,255,255,0.25)' }}>
          {metCount} of 6 criteria met
        </div>
      </Sec>

      <Sec title="Publication tier">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { val:'featured', label:'Featured', desc:'Full page treatment', color:'#a78bfa' },
            { val:'verified', label:'Verified', desc:'Compact row', color:'#22c55e' },
            { val:'pending', label:'Pending', desc:'Hidden — finish later', color:'#f59e0b' },
          ].map(t => (
            <div key={t.val} onClick={() => set('tier', t.val)} style={{ border: `1px solid ${form.tier===t.val ? t.color+'66' : 'rgba(255,255,255,0.1)'}`, background: form.tier===t.val ? t.color+'11' : 'transparent', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'center' as const }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.color, marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </Sec>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          {!form.curator_notes && "Curator note required"}
          {!form.curator_notes && metCount < 2 && ' · '}
          {metCount < 2 && 'Needs 2+ criteria'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...btn, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>Save as pending</button>
          <button onClick={handlePublish} disabled={saving} style={{ ...btn, background: '#a78bfa', color: '#fff' }}>Publish entry</button>
        </div>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a1a', border: `1px solid ${toast.color}44`, borderRadius: 8, padding: '10px 16px', fontSize: 12, color: toast.color, zIndex: 999 }}>{toast.msg}</div>}
    </div>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>{children}</div>
    </div>
  )
}

function F({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>{label}</label>
      {children}
    </div>
  )
}
