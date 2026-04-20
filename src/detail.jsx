// Steckbrief — Trend detail page
import { useState, useEffect } from 'react';
import { Icon, BarMeter, StageBadge, DimensionDot } from './ui.jsx';
import { EditableBar } from './trends.jsx';
import { relationsApi } from './api.js';

export const TrendDetail = ({ t, data, trendId, onBack, onUpdate, onOpenTrend }) => {
  const trend = data.trends.find(x => x.id === trendId) || data.trends[0];
  const [tab, setTab] = useState("overview");
  const signals = data.signals.filter(s => s.trendId === trend.id);

  // AI-ranked related trends
  const [relInfo, setRelInfo] = useState({ loading: true, error: null, items: [] });
  useEffect(() => {
    let cancel = false;
    setRelInfo({ loading: true, error: null, items: [] });
    const candidates = data.trends
      .filter(x => x.id !== trend.id)
      .map(x => ({ id: x.id, title: x.title, dim: x.dim, tags: x.tags || [], summary: x.summary || '' }));
    relationsApi.rank({
      trend: { id: trend.id, title: trend.title, dim: trend.dim, tags: trend.tags || [], summary: trend.summary || '' },
      candidates,
    })
      .then(r => { if (!cancel) setRelInfo({ loading: false, error: null, items: r.related || [] }); })
      .catch(e => { if (!cancel) setRelInfo({ loading: false, error: e.message, items: [] }); });
    return () => { cancel = true; };
  }, [trend.id]);

  const related = relInfo.items
    .map(r => {
      const t = data.trends.find(x => x.id === r.id);
      return t ? { ...t, score: r.score, reason: r.reason } : null;
    })
    .filter(Boolean);

  const tabs = [
    { id: "overview", label: t("overview") },
    { id: "evidence", label: `${t("evidence")} · ${trend.signals || 0}` },
    { id: "implications", label: t("implications") },
    { id: "related", label: t("related") },
    { id: "history", label: t("history") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 11.5, marginBottom: 10 }}>
          <button onClick={onBack} style={{ color: "var(--fg-2)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="arrowLeft" size={12}/> {t("back_to_explorer")}</button>
          <span>/</span>
          <DimensionDot dim={trend.dim}/>
          <span>{trend.dim}</span>
          <span>/</span>
          <span className="mono">#{trend.id}</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <StageBadge stage={trend.stage}/>
              <span className="chip mono">{trend.horizon}</span>
              {trend.ai > 0.9 && <span className="chip ai"><Icon name="sparkles" size={10}/> AI enriched</span>}
              {(trend.tags || []).map(tag => <span key={tag} className="chip"><Icon name="hash" size={10}/>{tag}</span>)}
            </div>
            <h1 style={{ margin: 0, color: "var(--fg-0)", fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>{trend.title}</h1>
            {trend.summary && <p style={{ margin: "8px 0 0", color: "var(--fg-2)", fontSize: 13.5, maxWidth: 820, lineHeight: 1.55 }}>{trend.summary}</p>}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button className="btn sm"><Icon name="star" size={13}/> Watch</button>
              <button className="btn sm"><Icon name="link" size={13}/> Share</button>
              <button
                className={`btn sm${trend.subscribed ? ' ai' : ''}`}
                onClick={() => onUpdate(trend.id, { subscribed: !trend.subscribed })}
                style={{ fontSize: 11 }}
              >
                {trend.subscribed ? '✓ Subscribed' : '☆ Subscribe'}
              </button>
            </div>
          </div>
          <TrendImage trend={trend} onUpdate={onUpdate} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 16 }}>
          {[
            { key: "impact",   label: t("impact"),   val: trend.impact,   color: "var(--accent)", editable: true },
            { key: "novelty",  label: t("novelty"),  val: trend.novelty,  color: "var(--ai)",     editable: true },
            { key: "maturity", label: t("maturity"), val: trend.maturity, color: "#F59E0B",       editable: true },
            { key: "signals",  label: t("signals"),  val: trend.signals,  raw: true, color: "var(--fg-2)" },
            { key: "sources",  label: t("sources"),  val: trend.sources,  raw: true, color: "var(--fg-2)" },
          ].map(m => (
            <div key={m.label} className="card" style={{ padding: 12 }}>
              <div style={{ color: "var(--fg-3)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{m.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="mono" style={{ color: "var(--fg-0)", fontSize: 22, fontWeight: 600 }}>{m.val ?? 0}</span>
                {!m.raw && <span className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>/100</span>}
              </div>
              {!m.raw && (
                <div style={{ marginTop: 10 }}>
                  {m.editable && onUpdate
                    ? <EditableBar value={m.val ?? 0} color={m.color} onChange={v => onUpdate(trend.id, { [m.key]: v })}/>
                    : <BarMeter value={m.val ?? 0} color={m.color} height={3}/>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 2, padding: "0 20px", borderBottom: "1px solid var(--line-1)" }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: "10px 14px", fontSize: 12.5,
            color: tab === tb.id ? "var(--fg-0)" : "var(--fg-3)",
            borderBottom: "2px solid " + (tab === tb.id ? "var(--accent)" : "transparent"),
            marginBottom: -1,
          }}>{tb.label}</button>
        ))}
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {tab === "overview" && <OverviewTab trend={trend} t={t} signals={signals} related={related} relLoading={relInfo.loading}/>}
        {tab === "evidence" && <EvidenceTab signals={signals}/>}
        {tab === "implications" && <ImplicationsTab/>}
        {tab === "related" && <RelatedTab related={related} loading={relInfo.loading} onOpenTrend={onOpenTrend}/>}
        {tab === "history" && <HistoryTab trend={trend}/>}
      </div>
    </div>
  );
};

const TrendImage = ({ trend, onUpdate }) => {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trend.title, dim: trend.dim, summary: trend.summary || '' }),
      });
      const data = await r.json();
      if (data.url) onUpdate(trend.id, { imageUrl: data.url });
    } catch {} finally {
      setGenerating(false);
    }
  };

  if (trend.imageUrl) {
    return (
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <img src={trend.imageUrl} alt="" style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 8 }} />
        <button className="btn sm ghost" onClick={generate} disabled={generating}
          style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          {generating ? '…' : '↻'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: 150, height: 200, flexShrink: 0, background: 'var(--bg-2)', borderRadius: 8, border: '1px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <button className="btn ai sm" onClick={generate} disabled={generating} style={{ fontSize: 11 }}>
        {generating ? 'Generiere…' : 'Bild generieren'}
      </button>
    </div>
  );
};

const OverviewTab = ({ trend, t, signals, related, relLoading }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 16, background: "linear-gradient(180deg, rgba(167,139,250,0.07), transparent 80%)", borderColor: "rgba(167,139,250,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--ai-soft)", color: "var(--ai)", display: "grid", placeItems: "center" }}>
            <Icon name="sparkles" size={13}/>
          </div>
          <span className="ai-shimmer" style={{ fontWeight: 600, fontSize: 13 }}>{t("ai_summary")}</span>
          <span className="chip ai mono" style={{ fontSize: 10 }}>Claude Haiku 4.5 · 2 min ago</span>
          <div style={{ flex: 1 }}/>
          <button className="btn sm ghost"><Icon name="bolt" size={12}/> Regenerate</button>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--fg-1)" }}>
          <b style={{ color: "var(--fg-0)" }}>{trend.title}</b> is moving from pilot to production.
          Across <b style={{ color: "var(--fg-0)" }}>{trend.sources}</b> sources this quarter, investment signals dominate (42%), followed by policy (23%) and corporate announcements (19%). Momentum is strongest in <b style={{ color: "var(--fg-0)" }}>DACH and North America</b>, with a notable acceleration in the last 30 days (<span style={{ color: "#34D399" }}>+38% signal volume</span>).
          Key drivers: falling compute costs, regulatory clarity in the EU, and three new Fortune-500 buyers.
          Key risks: talent bottleneck, consolidation of incumbents, and unclear liability frameworks.
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {["Rising momentum", "Industry: manufacturing", "Regulatory tailwind", "Supply-side constrained"].map(x => (
            <span key={x} className="chip">{x}</span>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13 }}>Signal momentum</div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", gap: 4 }}>
            {["7d","30d","90d","1y","All"].map((p, i) => (
              <button key={p} className="btn sm ghost" style={{ height: 24, padding: "0 8px", background: i === 2 ? "var(--bg-3)" : "transparent" }}>{p}</button>
            ))}
          </div>
        </div>
        <SignalChart trend={trend}/>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center" }}>
          <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13 }}>Recent signals</div>
          <div style={{ flex: 1 }}/>
          <a style={{ color: "var(--accent-2)", fontSize: 12 }}>View all →</a>
        </div>
        <div>
          {signals.map((s, i) => (
            <div key={s.id} style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 12, alignItems: "center", borderBottom: i < signals.length - 1 ? "1px solid var(--line-1)" : "none" }}>
              <div style={{ position: "relative", width: 8, height: 8 }}>
                <span className="dot accent"/>
              </div>
              <div>
                <div style={{ color: "var(--fg-0)", fontSize: 13 }}>{s.title}</div>
                <div style={{ color: "var(--fg-3)", fontSize: 11, marginTop: 2 }} className="mono">{s.source} · {s.date} · {s.lang}</div>
              </div>
              <span className="chip">{s.type}</span>
              <div style={{ width: 64 }}><BarMeter value={s.strength * 100} color="var(--accent)"/></div>
              <button className="btn ghost icon sm"><Icon name="ext" size={12}/></button>
            </div>
          ))}
          {signals.length === 0 && <div style={{ padding: 24, color: "var(--fg-3)", fontSize: 12, textAlign: "center" }}>No captured signals yet.</div>}
        </div>
      </div>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8 }}>{t("related")}</span>
          <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/>AI</span>
        </div>
        {relLoading && <div style={{ fontSize: 12, color: "var(--fg-3)", padding: "8px 0" }}>Analysiere Ähnlichkeiten…</div>}
        {!relLoading && related.length === 0 && <div style={{ fontSize: 12, color: "var(--fg-3)", padding: "8px 0" }}>Keine thematisch nahen Trends gefunden.</div>}
        {related.map(r => (
          <div key={r.id}
               onClick={() => onOpenTrend?.(r.id)}
               style={{ padding: "10px 0", borderBottom: "1px solid var(--line-1)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DimensionDot dim={r.dim}/>
              <span style={{ fontSize: 12.5, color: "var(--fg-1)", flex: 1 }}>{r.title}</span>
              <span className="mono" style={{ fontSize: 10.5, color: "#34D399" }}>{Math.round((r.score || 0) * 100)}%</span>
            </div>
            {r.reason && <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4, lineHeight: 1.4, paddingLeft: 14 }}>{r.reason}</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Metadata</div>
        <Field label={t("owner")} value={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><span style={{ width: 18, height: 18, borderRadius: 999, background: "#3B82F6", color: "white", fontSize: 10, display: "grid", placeItems: "center", fontWeight: 600 }}>{(trend.owner || '?').split(" ").map(x => x[0]).join("")}</span>{trend.owner || '—'}</span>}/>
        <Field label="Dimension" value={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><DimensionDot dim={trend.dim}/>{trend.dim}</span>}/>
        <Field label={t("horizon")} value={<span className="mono">{trend.horizon}</span>}/>
        <Field label={t("stage")} value={<StageBadge stage={trend.stage}/>}/>
        <Field label={t("updated")} value={<span className="mono" style={{ color: "var(--fg-2)" }}>{trend.updated}</span>} last/>
      </div>
    </div>
  </div>
);

const Field = ({ label, value, last }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: last ? "none" : "1px solid var(--line-1)" }}>
    <span style={{ color: "var(--fg-3)", fontSize: 11.5 }}>{label}</span>
    <span style={{ color: "var(--fg-1)", fontSize: 12.5 }}>{value}</span>
  </div>
);

const SignalChart = ({ trend }) => {
  const months = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];
  const vals = months.map((_, i) => 10 + i * 3 + Math.sin(i + trend.impact) * 6 + (i > 8 ? i * 3 : 0));
  const max = Math.max(...vals);
  const W = 640, H = 160, pad = { l: 30, r: 10, t: 10, b: 22 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const x = i => pad.l + (i / (vals.length - 1)) * innerW;
  const y = v => pad.t + innerH - (v / max) * innerH;
  const areaD = `M ${x(0)} ${y(vals[0])} ${vals.map((v, i) => `L ${x(i)} ${y(v)}`).join(" ")} L ${x(vals.length - 1)} ${pad.t + innerH} L ${x(0)} ${pad.t + innerH} Z`;
  const lineD = `M ${x(0)} ${y(vals[0])} ${vals.map((v, i) => `L ${x(i)} ${y(v)}`).join(" ")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0,0.25,0.5,0.75,1].map(g => (
        <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + innerH * g} y2={pad.t + innerH * g} stroke="var(--line-1)" strokeDasharray="2 3"/>
      ))}
      <path d={areaD} fill="url(#g1)"/>
      <path d={lineD} fill="none" stroke="#60A5FA" strokeWidth="1.8"/>
      {vals.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#60A5FA"/>)}
      {months.map((m, i) => (
        <text key={m} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">{m}</text>
      ))}
      <line x1={x(9)} x2={x(9)} y1={pad.t} y2={pad.t + innerH} stroke="var(--ai)" strokeDasharray="3 3" strokeWidth="1"/>
      <rect x={x(9) - 52} y={pad.t + 2} width="52" height="16" rx="3" fill="var(--ai-soft)" stroke="var(--ai)" strokeWidth="0.5"/>
      <text x={x(9) - 48} y={pad.t + 13} fontSize="9.5" fill="#C4B5FD" fontFamily="var(--font-mono)">⟡ AI inflection</text>
    </svg>
  );
};

const EvidenceTab = ({ signals }) => (
  <div className="card" style={{ padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Icon name="info" size={14}/>
      <span style={{ fontSize: 12.5, color: "var(--fg-2)" }}>All signals feeding this trend, ranked by AI relevance.</span>
    </div>
    {signals.map(s => (
      <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line-1)", display: "grid", gridTemplateColumns: "24px 1fr auto 80px auto", alignItems: "center", gap: 10 }}>
        <span className="mono" style={{ color: "var(--fg-3)", fontSize: 10 }}>{s.lang}</span>
        <div>
          <div style={{ color: "var(--fg-0)", fontSize: 13 }}>{s.title}</div>
          <div className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>{s.source} · {s.date}</div>
        </div>
        <span className="chip">{s.type}</span>
        <BarMeter value={s.strength * 100} color="var(--accent)"/>
        <button className="btn ghost icon sm"><Icon name="ext" size={12}/></button>
      </div>
    ))}
  </div>
);

const ImplicationsTab = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
    {[
      { title: "Opportunities", color: "var(--ok)", items: [
        "Partner with a materials supplier to pilot before 2027",
        "Licensable IP around bio-reactor calibration",
        "Position as category lead in DACH for mid-market"
      ]},
      { title: "Risks", color: "var(--hot)", items: [
        "Regulatory lag in CH vs EU",
        "Cost parity not expected before 2028",
        "Customer education required"
      ]},
      { title: "Adjacent plays", color: "var(--accent)", items: [
        "Bundled circularity reporting",
        "Training programs for designers",
        "B2B marketplace for certified output"
      ]},
      { title: "Do-not-do", color: "var(--warn)", items: [
        "Own the production capacity",
        "Compete head-on with scale incumbents",
        "Premium-only pricing"
      ]},
    ].map(b => (
      <div key={b.title} className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: b.color }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-0)" }}>{b.title}</span>
          <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/>AI</span>
        </div>
        {b.items.map((x, i) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: i < b.items.length - 1 ? "1px solid var(--line-1)" : "none", fontSize: 12.5, color: "var(--fg-1)", display: "flex", gap: 8 }}>
            <span className="mono" style={{ color: "var(--fg-3)", minWidth: 18 }}>{String(i + 1).padStart(2, "0")}</span>
            <span>{x}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
);

const RelatedTab = ({ related, loading, onOpenTrend }) => {
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>Claude analysiert Ähnlichkeiten…</div>;
  if (related.length === 0) return <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>Keine thematisch nahen Trends gefunden.</div>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12, color: "var(--fg-2)" }}>
        <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/>AI-ranked</span>
        <span>Thematische Nähe nach Titel, Dimension, Tags und Summary. Kandidaten kommen aus deinem Trend-Pool.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {related.map(r => (
          <div key={r.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => onOpenTrend?.(r.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <DimensionDot dim={r.dim}/>
              <span className="mono" style={{ color: "var(--fg-3)", fontSize: 10.5 }}>#{r.id}</span>
              <div style={{ flex: 1 }}/>
              <span className="mono" style={{ fontSize: 11, color: "#34D399" }}>{Math.round((r.score || 0) * 100)}%</span>
              <StageBadge stage={r.stage}/>
            </div>
            <div style={{ color: "var(--fg-0)", fontWeight: 500, marginBottom: 8 }}>{r.title}</div>
            {r.reason && <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, padding: "8px 10px", background: "var(--ai-soft)", borderRadius: 6, borderLeft: "2px solid var(--ai)" }}>{r.reason}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryTab = ({ trend }) => (
  <div className="card" style={{ padding: 16 }}>
    {[
      { t: "5 min ago", who: "AI Scout", what: "Added 2 new signals from Reuters and Nature." },
      { t: "2 d ago", who: trend.owner, what: "Moved stage from Emerging to Trend." },
      { t: "1 w ago", who: trend.owner, what: "Updated summary; linked 1 project." },
      { t: "2 w ago", who: "AI Scout", what: "Clustered 8 related signals and proposed this trend." },
      { t: "3 w ago", who: "System", what: "Trend created from cluster #c2108." },
    ].map((e, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 120px 1fr", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--line-1)" : "none", fontSize: 12.5 }}>
        <span className="mono" style={{ color: "var(--fg-3)" }}>{e.t}</span>
        <span style={{ color: "var(--fg-1)" }}>{e.who}{e.who === "AI Scout" && <span className="chip ai mono" style={{ marginLeft: 6, fontSize: 9 }}>AI</span>}</span>
        <span style={{ color: "var(--fg-2)" }}>{e.what}</span>
      </div>
    ))}
  </div>
);
