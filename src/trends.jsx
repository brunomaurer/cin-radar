import { useState, useEffect } from 'react';
import { Icon, DimensionDot, StageBadge } from './ui.jsx';
import { trendsApi } from './api.js';

// ========== Slider component ==========

export const EditableBar = ({ value, color = 'var(--accent)', onChange, disabled }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <input
      type="range"
      min="0"
      max="100"
      value={v}
      disabled={disabled}
      onChange={e => onChange(parseInt(e.target.value, 10))}
      className="bar"
      style={{
        width: '100%',
        background: `linear-gradient(to right, ${color} 0%, ${color} ${v}%, var(--bg-3) ${v}%, var(--bg-3) 100%)`,
        '--thumb-color': color,
      }}
    />
  );
};

// ========== New Trend Dialog ==========

const EMPTY = {
  title: '',
  dim: 'Technology',
  horizon: 'H2 · 2–5 yrs',
  stage: 'Signal',
  owner: 'Ich',
  impact: 50,
  novelty: 50,
  maturity: 50,
  tags: '',
  summary: '',
};

export const NewTrendDialog = ({ open, onClose, onCreated, dimensions, horizons, stages }) => {
  const [form, setForm] = useState(EMPTY);
  const [subscribed, setSubscribed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setForm(EMPTY); setSubscribed(false); setError(null); setSaving(false); }
  }, [open]);

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { setError('Titel ist erforderlich'); return; }
    setSaving(true); setError(null);
    try {
      const r = await trendsApi.create({ ...form, subscribed });
      onCreated?.(r.trend);
      onClose();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'grid', placeItems: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: 720, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', overflow: 'hidden', boxShadow: 'var(--shadow-pop)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#3B82F6,#A78BFA)', display: 'grid', placeItems: 'center' }}>
            <Icon name="plus" size={14}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>Neuer Trend</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>Felder ausfüllen und speichern — Trend erscheint im Explorer.</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll" style={{ padding: 18, overflow: 'auto', flex: 1, minHeight: 0 }}>
          {error && (
            <div style={{ padding: 10, marginBottom: 12, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6, fontSize: 12, color: '#FFB9C5' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <Label>Titel*</Label>
            <input className="input" style={{ width: '100%', height: 36 }} placeholder="z.B. Autonomous Logistics in DACH"
              value={form.title} onChange={e => set('title', e.target.value)} autoFocus/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <Label>Dimension</Label>
              <Select value={form.dim} onChange={v => set('dim', v)} options={dimensions.map(d => [d, d])}/>
            </div>
            <div>
              <Label>Horizont</Label>
              <Select value={form.horizon} onChange={v => set('horizon', v)} options={horizons.map(h => [h, h])}/>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onChange={v => set('stage', v)} options={stages.map(s => [s, s])}/>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Owner</Label>
            <input className="input" style={{ width: '100%', height: 36 }}
              value={form.owner} onChange={e => set('owner', e.target.value)}/>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Rating</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 40px', rowGap: 10, columnGap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Impact</span>
              <EditableBar value={form.impact} color="var(--accent)" onChange={v => set('impact', v)}/>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)', textAlign: 'right' }}>{form.impact}</span>

              <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Novelty</span>
              <EditableBar value={form.novelty} color="var(--ai)" onChange={v => set('novelty', v)}/>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)', textAlign: 'right' }}>{form.novelty}</span>

              <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Maturity</span>
              <EditableBar value={form.maturity} color="#F59E0B" onChange={v => set('maturity', v)}/>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)', textAlign: 'right' }}>{form.maturity}</span>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Tags (Komma-getrennt)</Label>
            <input className="input" style={{ width: '100%', height: 36 }} placeholder="z.B. AI, automation, b2b"
              value={form.tags} onChange={e => set('tags', e.target.value)}/>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Zusammenfassung</Label>
            <textarea
              value={form.summary} onChange={e => set('summary', e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 8, color: 'var(--fg-0)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
              placeholder="1-3 Sätze, was genau dieser Trend ist und warum er wichtig wird."
            />
          </div>
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line-1)', display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <button className="btn ghost" onClick={onClose} disabled={saving}>Abbrechen</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12.5, color: 'var(--fg-1)', cursor: 'pointer' }}>
            <input type="checkbox" checked={subscribed} onChange={e => setSubscribed(e.target.checked)} />
            Signal-Abonnierung aktivieren (AI Scout sammelt automatisch Signale)
          </label>
          <div style={{ flex: 1 }}/>
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? 'Speichere…' : <><Icon name="check" size={13}/> Speichern</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const Label = ({ children }) => (
  <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{children}</label>
);

const Select = ({ value, onChange, options }) => (
  <div style={{ position: 'relative' }}>
    <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ appearance: 'none', paddingRight: 26, width: '100%', background: 'var(--bg-2)', height: 36 }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--fg-3)' }}>
      <Icon name="chevronDown" size={12}/>
    </div>
  </div>
);
