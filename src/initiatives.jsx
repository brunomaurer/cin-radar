import { useState, useEffect, useRef } from 'react';
import { Icon } from './ui.jsx';
import { conceptsApi, chatApi, generateApi, ARTEFACT_META, ARTEFACT_IDS } from './api.js';

// ========== List view ==========

export const ConceptList = ({ onOpen, onCreate }) => {
  const [concepts, setConcepts] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const r = await conceptsApi.list();
      setConcepts(r.concepts);
    } catch (e) {
      setError(e.message);
      setConcepts([]);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      const r = await conceptsApi.create({ title: 'Neues MVP-Konzept' });
      onOpen(r.concept.id);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Konzept wirklich löschen?')) return;
    try {
      await conceptsApi.remove(id);
      setConcepts(cs => cs.filter(c => c.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24 }} className="scroll">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 1 }}>MVP-Werkstatt</div>
          <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 600, color: 'var(--fg-0)' }}>Initiativen</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--fg-2)', fontSize: 13.5, maxWidth: 640, lineHeight: 1.55 }}>
            Aus einer Idee einen schlanken MVP machen. Brief ausfüllen, sechs MD-Artefakte generieren lassen
            (CLAUDE.md, PRD, Tech-Spec, Deck, Prompt, Email), mit dem MVP-Coach diskutieren.
          </p>
        </div>
        <button className="btn ai" onClick={create} disabled={creating}>
          <Icon name="sparkles" size={14}/> {creating ? 'Erstelle…' : 'Neues Konzept'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.08)' }}>
          <div style={{ fontSize: 12, color: '#FFB9C5', fontWeight: 600, marginBottom: 4 }}>Backend nicht erreichbar</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>{error}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 8, lineHeight: 1.5 }}>
            Prüfe in Vercel → Settings → Environment Variables, dass <span className="mono">ANTHROPIC_API_KEY</span> und
            <span className="mono"> REDIS_URL</span> gesetzt sind.
          </div>
        </div>
      )}

      {concepts === null && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 12 }}>Lade…</div>
      )}

      {concepts && concepts.length === 0 && !error && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#A78BFA,#3B82F6)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Icon name="sparkles" size={26}/>
          </div>
          <h2 style={{ margin: '0 0 8px', color: 'var(--fg-0)', fontSize: 18, fontWeight: 600 }}>Noch keine Konzepte</h2>
          <p style={{ color: 'var(--fg-2)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 20, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Starte mit einer Idee. Du beschreibst Problem, Zielgruppe und Metrik — der MVP-Coach macht daraus sechs konkrete Artefakte
            für Claude Code, dein Team und die Stakeholder.
          </p>
          <button className="btn ai" onClick={create} disabled={creating}>
            <Icon name="sparkles" size={14}/> {creating ? 'Erstelle…' : 'Erstes Konzept anlegen'}
          </button>
        </div>
      )}

      {concepts && concepts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {concepts.map(c => (
            <div key={c.id} className="card" style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onClick={() => onOpen(c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                {c.hasArtefacts
                  ? <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/> Artefakte bereit</span>
                  : <span className="chip mono" style={{ fontSize: 10 }}>Draft</span>}
                <div style={{ flex: 1 }}/>
                <button className="btn ghost icon sm" onClick={(e) => { e.stopPropagation(); remove(c.id); }} title="Löschen">
                  <Icon name="x" size={12}/>
                </button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)', marginBottom: 6, lineHeight: 1.35 }}>{c.title || 'Ohne Titel'}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>
                Aktualisiert {formatRelative(c.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function formatRelative(iso) {
  if (!iso) return '—';
  const now = new Date();
  const then = new Date(iso);
  const ms = now - then;
  if (ms < 60_000) return 'eben';
  if (ms < 3600_000) return Math.floor(ms/60_000) + ' min';
  if (ms < 86_400_000) return Math.floor(ms/3_600_000) + ' h';
  if (ms < 30 * 86_400_000) return Math.floor(ms/86_400_000) + ' d';
  return then.toLocaleDateString('de-CH');
}

// ========== Workspace ==========

export const ConceptWorkspace = ({ id, trends, onBack }) => {
  const [concept, setConcept] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('brief'); // 'brief' | 'artefacts' | 'artefact'
  const [activeArtefact, setActiveArtefact] = useState(null);
  const [generating, setGenerating] = useState(null); // { current, done, total }
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await conceptsApi.get(id);
        if (cancelled) return;
        if (!r || !r.concept) {
          setError('Antwort ohne concept-Feld: ' + JSON.stringify(r)?.slice(0, 200));
          return;
        }
        setConcept(r.concept);
        if (r.concept.artefacts && Object.keys(r.concept.artefacts).length > 0) setMode('artefacts');
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const save = (patch, immediate = false) => {
    setConcept(c => ({ ...c, ...patch }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const run = async () => {
      try {
        await conceptsApi.update(id, patch);
        setSavedAt(new Date());
      } catch (e) {
        setError(e.message);
      }
    };
    if (immediate) run(); else saveTimer.current = setTimeout(run, 800);
  };

  const updateBrief = (field, value) => {
    const brief = { ...concept.brief, [field]: value };
    save({ brief });
  };

  const updateTitle = (value) => save({ title: value });

  const generate = async () => {
    if (!concept || generating) return;
    const trend = concept.trendId ? trends.find(t => t.id === concept.trendId) : null;
    const artefacts = { ...(concept.artefacts || {}) };
    try {
      for (const aid of ARTEFACT_IDS) {
        setGenerating({ current: aid, done: Object.keys(artefacts).filter(k => ARTEFACT_IDS.includes(k)).length, total: ARTEFACT_IDS.length });
        const r = await generateApi.artefact({ brief: concept.brief, trend, artefact: aid });
        artefacts[aid] = { id: aid, body: r.body, words: r.words };
        setConcept(c => ({ ...c, artefacts: { ...artefacts } }));
      }
      setGenerating(null);
      await conceptsApi.update(id, { artefacts });
      setSavedAt(new Date());
      setMode('artefacts');
    } catch (e) {
      setGenerating(null);
      setError('Generieren fehlgeschlagen: ' + e.message);
    }
  };

  const saveArtefact = (aid, body) => {
    const words = body.split(/\s+/).filter(Boolean).length;
    const artefacts = { ...concept.artefacts, [aid]: { id: aid, body, words } };
    save({ artefacts });
  };

  if (error && !concept) {
    return (
      <div style={{ padding: 24 }}>
        <button className="btn sm" onClick={onBack}><Icon name="arrowLeft" size={12}/> Zurück</button>
        <div className="card" style={{ padding: 14, marginTop: 16, borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.08)' }}>
          <div style={{ fontSize: 12, color: '#FFB9C5', fontWeight: 600, marginBottom: 4 }}>Konnte Konzept nicht laden</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>{error}</div>
        </div>
      </div>
    );
  }
  if (!concept) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)' }}>Lade…</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--line-1)' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} className="btn ghost sm"><Icon name="arrowLeft" size={12}/> Alle Konzepte</button>
          <input
            value={concept.title}
            onChange={e => updateTitle(e.target.value)}
            className="input"
            style={{ flex: 1, background: 'var(--bg-1)', fontSize: 14, fontWeight: 600 }}
          />
          <div style={{ display: 'flex', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 6, padding: 2 }}>
            {[['brief','Brief','edit'],['artefacts','Artefakte','sparkles']].map(([k,l,i]) => (
              <button key={k} onClick={() => { setMode(k); setActiveArtefact(null); }}
                style={{ padding: '5px 12px', fontSize: 12, borderRadius: 4, background: mode === k ? 'var(--bg-3)' : 'transparent', color: mode === k ? 'var(--fg-0)' : 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name={i} size={12}/> {l}
              </button>
            ))}
          </div>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', minWidth: 80, textAlign: 'right' }}>
            {savedAt ? 'gespeichert ' + formatRelative(savedAt.toISOString()) : ''}
          </span>
        </div>

        {error && (
          <div style={{ padding: '8px 20px', background: 'rgba(244,63,94,0.12)', borderBottom: '1px solid rgba(244,63,94,0.3)', fontSize: 12, color: '#FFB9C5' }}>
            ⚠ {error}
          </div>
        )}

        <div className="scroll" style={{ flex: 1, overflow: 'auto' }}>
          {mode === 'brief' && (
            <BriefPanel concept={concept} trends={trends} updateBrief={updateBrief}
              setTrendId={(tid) => save({ trendId: tid })}
              onGenerate={generate} generating={generating}
              hasArtefacts={concept.artefacts && Object.keys(concept.artefacts).length > 0}/>
          )}
          {mode === 'artefacts' && !activeArtefact && (
            <ArtefactGrid concept={concept} onOpen={setActiveArtefact} onGenerate={generate} generating={generating}/>
          )}
          {mode === 'artefacts' && activeArtefact && (
            <ArtefactEditor
              artefact={concept.artefacts[activeArtefact]}
              onChange={(body) => saveArtefact(activeArtefact, body)}
              onBack={() => setActiveArtefact(null)}/>
          )}
        </div>
      </div>

      <ChatPanel concept={concept} activeArtefact={activeArtefact ? concept.artefacts[activeArtefact] : null}
        onSave={(chat) => save({ chat }, true)}/>
    </div>
  );
};

// ========== Brief ==========

const BRIEF_FIELDS = [
  ['problem', 'Problem', 'Was ist kaputt oder fehlt? 1–2 Sätze.', 3],
  ['audience', 'Zielgruppe', 'Wer profitiert? Primary + Secondary.', 2],
  ['metric', 'Erfolgs-Metrik', 'Woran messen wir, dass es funktioniert?', 2],
  ['timeframe', 'Zeitrahmen', 'Dauer + Meilensteine.', 2],
  ['budget', 'Budget', 'Gesamtes Budget-Envelope.', 1],
];

const BriefPanel = ({ concept, trends, updateBrief, setTrendId, onGenerate, generating, hasArtefacts }) => (
  <div style={{ padding: 24, maxWidth: 820, margin: '0 auto' }}>
    <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginBottom: 16, lineHeight: 1.6 }}>
      Fülle den Brief. Je konkreter, desto bessere Artefakte. Der MVP-Coach rechts hilft dir beim Schärfen —
      klick oder schreib ihm einfach an.
    </div>

    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
        Trend verknüpfen (optional)
      </label>
      <select value={concept.trendId || ''} onChange={e => setTrendId(e.target.value || null)} className="input" style={{ width: '100%', maxWidth: 420 }}>
        <option value="">— kein Trend —</option>
        {trends.map(t => <option key={t.id} value={t.id}>{t.title} ({t.dim})</option>)}
      </select>
    </div>

    {BRIEF_FIELDS.map(([k, l, h, rows]) => (
      <div key={k} style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{l}</label>
        <textarea
          value={(concept.brief && concept.brief[k]) || ''}
          onChange={e => updateBrief(k, e.target.value)}
          rows={rows}
          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 8, color: 'var(--fg-0)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
        />
        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 3 }}>{h}</div>
      </div>
    ))}

    <div style={{ display: 'flex', gap: 8, marginTop: 20, alignItems: 'center' }}>
      <button className="btn ai" onClick={onGenerate} disabled={!!generating}>
        <Icon name="sparkles" size={14}/>
        {generating
          ? `Generiere ${generating.done + 1}/${generating.total} · ${ARTEFACT_META[generating.current]?.label}…`
          : hasArtefacts ? '6 Artefakte neu generieren' : '6 Artefakte generieren'}
      </button>
      {generating && (
        <div style={{ flex: 1, display: 'flex', gap: 4 }}>
          {ARTEFACT_IDS.map((aid, i) => {
            const done = i < generating.done;
            const current = aid === generating.current;
            return <div key={aid} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? '#34D399' : current ? 'var(--accent)' : 'var(--bg-3)', transition: 'background 200ms' }}/>;
          })}
        </div>
      )}
    </div>
  </div>
);

// ========== Artefact grid + editor ==========

const ArtefactGrid = ({ concept, onOpen, onGenerate, generating }) => {
  const has = concept.artefacts && Object.keys(concept.artefacts).length > 0;
  if (!has && !generating) {
    return (
      <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#A78BFA,#3B82F6)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Icon name="sparkles" size={26}/>
          </div>
          <h2 style={{ margin: '0 0 8px', color: 'var(--fg-0)', fontSize: 18, fontWeight: 600 }}>Noch keine Artefakte</h2>
          <p style={{ color: 'var(--fg-2)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
            Fülle den Brief aus und lass den MVP-Coach sechs Artefakte generieren:
            CLAUDE.md, PRD mit Gherkin-Kriterien, Tech-Spec, 6-Slide Deck, Prototyp-Prompt, Kickoff-Mail.
          </p>
          <button className="btn ai" onClick={onGenerate}>
            <Icon name="sparkles" size={14}/> Artefakte generieren
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>
          Klick ein Artefakt zum Bearbeiten. Änderungen werden automatisch gespeichert.
        </div>
        <div style={{ flex: 1 }}/>
        <button className="btn sm" onClick={onGenerate} disabled={!!generating}>
          <Icon name="sparkles" size={12}/> {generating ? `Generiere ${generating.done + 1}/${generating.total}…` : 'Neu generieren'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {ARTEFACT_IDS.map(aid => {
          const meta = ARTEFACT_META[aid];
          const art = concept.artefacts?.[aid];
          const isGenerating = generating?.current === aid;
          return (
            <button key={aid} onClick={() => art && onOpen(aid)} className="card"
              style={{ padding: 0, textAlign: 'left', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: art ? 'pointer' : 'default', opacity: art ? 1 : 0.5 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-3)', color: 'var(--accent-2)', display: 'grid', placeItems: 'center' }}>
                  <Icon name={meta.icon} size={14}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--fg-0)', fontWeight: 500 }}>{meta.label}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{meta.ext}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{meta.sub}</div>
                </div>
                {isGenerating && <span className="chip ai mono" style={{ fontSize: 10 }}><span className="spin" style={{ display: 'inline-block' }}><Icon name="sparkles" size={10}/></span></span>}
                {art && !isGenerating && <Icon name="arrowRight" size={14}/>}
              </div>
              <div style={{ padding: 14, fontFamily: meta.lang === 'markdown' || meta.lang === 'text' ? 'var(--font-mono)' : 'inherit', fontSize: 11, color: 'var(--fg-2)', lineHeight: 1.5, maxHeight: 140, overflow: 'hidden', position: 'relative', background: 'var(--bg-1)' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {isGenerating ? 'Claude schreibt gerade…' : art ? (art.body || '').slice(0, 260) + '…' : 'Noch nicht generiert'}
                </pre>
                {art && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, var(--bg-1))' }}/>}
              </div>
              {art && (
                <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderTop: '1px solid var(--line-1)', background: 'var(--bg-2)' }}>
                  <span className="chip mono" style={{ fontSize: 10 }}>{art.words} Worte</span>
                  <div style={{ flex: 1 }}/>
                  <span className="chip mono" style={{ fontSize: 10 }}>editieren</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ArtefactEditor = ({ artefact, onChange, onBack }) => {
  const meta = ARTEFACT_META[artefact.id];
  const copy = async () => { try { await navigator.clipboard.writeText(artefact.body); } catch {} };
  const download = () => {
    const blob = new Blob([artefact.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (artefact.id === 'claude' ? 'CLAUDE' : artefact.id.toUpperCase()) + meta.ext;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} className="btn ghost sm"><Icon name="arrowLeft" size={12}/> Alle Artefakte</button>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-3)', color: 'var(--accent-2)', display: 'grid', placeItems: 'center' }}>
          <Icon name={meta.icon} size={13}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--fg-0)', fontWeight: 600 }}>{meta.label}<span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginLeft: 6 }}>{meta.ext}</span></div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{meta.sub}</div>
        </div>
        <span className="chip mono" style={{ fontSize: 10 }}>{artefact.words} Worte</span>
        <button className="btn sm" onClick={copy}><Icon name="link" size={12}/> Kopieren</button>
        <button className="btn sm" onClick={download}><Icon name="download" size={12}/> Download</button>
      </div>
      <textarea
        value={artefact.body}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1, padding: 24, background: 'var(--bg-0)', border: 'none', color: 'var(--fg-0)', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7, resize: 'none', outline: 'none' }}
      />
    </div>
  );
};

// ========== Chat panel ==========

const ChatPanel = ({ concept, activeArtefact, onSave }) => {
  const [chat, setChat] = useState(concept.chat || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [chat.length, sending]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    const next = [...chat, { role: 'user', content: msg }];
    setChat(next);
    setInput('');
    setSending(true);
    try {
      const ctx = { brief: concept.brief };
      if (activeArtefact) ctx.artefact = activeArtefact;
      const r = await chatApi.send({ messages: next, context: ctx });
      const final = [...next, { role: 'assistant', content: r.reply }];
      setChat(final);
      onSave(final);
    } catch (e) {
      const final = [...next, { role: 'assistant', content: '⚠ Fehler: ' + e.message }];
      setChat(final);
    } finally {
      setSending(false);
    }
  };

  const quickPrompts = activeArtefact
    ? ['Dieser Artefakt ist zu lang — kürze ihn', 'Was fehlt hier?', 'Schlag konkrete Sätze vor', 'Mach es weniger buzzwordig']
    : ['Was ist die schwächste Stelle im Brief?', 'Welche Tech-Stack-Optionen?', 'Welche Risiken siehst du?', 'Scope-Cut Vorschläge'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0, height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#A78BFA,#3B82F6)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="sparkles" size={14}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>MVP-Coach</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeArtefact ? 'refined · ' + ARTEFACT_META[activeArtefact.id]?.label : 'Kontext: Brief'}
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {chat.length === 0 && (
          <div style={{ padding: '20px 8px', color: 'var(--fg-3)', fontSize: 12.5, lineHeight: 1.6 }}>
            Hey! Ich bin dein MVP-Coach. Ich lese deinen Brief mit und helfe dir beim Scharfstellen.
            Frag mich alles — oder tippe eine der Vorschläge unten.
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
            <div style={{
              padding: '8px 12px', borderRadius: 10,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-2)',
              color: m.role === 'user' ? 'white' : 'var(--fg-1)',
              fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55,
              border: m.role === 'assistant' ? '1px solid var(--line-2)' : 'none',
            }}>{m.content}</div>
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--line-2)', fontSize: 12, color: 'var(--fg-3)' }}>
            <span className="ai-shimmer">denkt nach…</span>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--line-1)', display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
        {quickPrompts.map(p => (
          <button key={p} className="chip" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => send(p)} disabled={sending}>{p}</button>
        ))}
      </div>

      <div style={{ padding: 10, borderTop: '1px solid var(--line-1)', display: 'flex', gap: 6, flexShrink: 0 }}>
        <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="Frag den Coach…" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={sending}/>
        <button className="btn ai sm" onClick={() => send()} disabled={sending || !input.trim()}>
          <Icon name="arrowRight" size={12}/>
        </button>
      </div>
    </div>
  );
};
