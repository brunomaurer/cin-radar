// Process pipeline — Scout -> Cluster -> Rate -> Initiative
import { Fragment, useState, useEffect } from 'react';
import { Icon, BarMeter, DimensionDot } from './ui.jsx';
import { Radar, Matrix, Timeline, Funnel } from './viz.jsx';
import { RelationsView } from './relations-view.jsx';
import { useLocalStorage } from './useLocalStorage.js';
import { conceptsApi, clustersApi, clusterToTrendApi, signalsApi } from './api.js';

export const ProcessPipeline = ({ data, campaignsData, campaigns, stage, setStage, onOpenCampaign, onOpenCluster, onOpenCapture, onOpenInitiative, onLaunchInitiative, onReviewAsTrend, onOpenClusterDetail }) => {
  const [initiatives, setInitiatives] = useState(null);
  const [campaignFilter, setCampaignFilter] = useState('');
  useEffect(() => {
    let cancel = false;
    conceptsApi.list()
      .then(r => { if (!cancel) setInitiatives(r.concepts || []); })
      .catch(() => { if (!cancel) setInitiatives([]); });
    return () => { cancel = true; };
  }, []);

  const initiativeCount = initiatives == null ? '…' : initiatives.length;
  const stages = [
    { k: "scout",      l: "Scout",      n: 1840, c: "#34D399", sub: "Capture from all channels" },
    { k: "cluster",    l: "Cluster",    n: 204,  c: "#A78BFA", sub: "AI groups similar signals" },
    { k: "rate",       l: "Rate",       n: 48,   c: "#F59E0B", sub: "Validate & prioritize" },
    { k: "initiative", l: "Initiative", n: initiativeCount,  c: "#60A5FA", sub: "MVP & build" },
  ];
  const [view, setView] = useState("pipeline");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "10px 20px 0", borderBottom: "none" }}>
        <select className="btn sm" value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">Alle Kampagnen</option>
          {(campaigns || []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line-1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--fg-0)" }}>Innovation pipeline</h1>
          <span className="chip mono">signal → initiative</span>
          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: 2, marginRight: 8 }}>
            {[["pipeline","Pipeline","funnel"],["board","Board","board"]].map(([k, l, i]) => (
              <button key={k} onClick={() => setView(k)} style={{ padding: "5px 12px", fontSize: 12, borderRadius: 4, background: view === k ? "var(--bg-3)" : "transparent", color: view === k ? "var(--fg-0)" : "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name={i} size={12}/> {l}
              </button>
            ))}
          </div>
          <button className="btn ai sm" onClick={onOpenCapture}><Icon name="sparkles" size={13}/> Capture</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {stages.map((s, i) => (
            <Fragment key={s.k}>
              <button onClick={() => setStage(s.k)} style={{
                flex: "1 1 160px",
                minWidth: 140,
                padding: "12px 14px", borderRadius: 8,
                background: stage === s.k ? `${s.c}22` : "var(--bg-1)",
                border: `1px solid ${stage === s.k ? s.c + '80' : 'var(--line-1)'}`,
                textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: s.c }}/>
                  <span style={{ fontSize: 10.5, color: s.c, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>0{i+1} {s.l}</span>
                </div>
                <div className="mono" style={{ fontSize: 22, color: "var(--fg-0)", fontWeight: 600 }}>{typeof s.n === 'number' ? s.n.toLocaleString() : s.n}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>{s.sub}</div>
              </button>
              {i < stages.length - 1 && <div style={{ display: "flex", alignItems: "center", color: "var(--fg-4)", flexShrink: 0 }}><Icon name="chevronRight" size={14}/></div>}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto" }}>
        {view === "board" ? (
          <PipelineBoard data={data} campaignsData={campaignsData} stages={stages} initiatives={initiatives} onOpenInitiative={onOpenInitiative} onOpenCluster={onOpenCluster}/>
        ) : (
          <Fragment>
            {stage === "scout" && <ScoutStage campaigns={campaignsData.campaigns} onOpenCampaign={onOpenCampaign} onOpenCapture={onOpenCapture}/>}
            {stage === "cluster" && <ClusterStage clusters={campaignsData.clusters} ideas={campaignsData.ideas} onOpenCluster={onOpenCluster} onReviewAsTrend={onReviewAsTrend} onOpenClusterDetail={onOpenClusterDetail}/>}
            {stage === "rate" && <RateStage trends={data.trends} onLaunch={onLaunchInitiative}/>}
            {stage === "initiative" && <InitiativeStage initiatives={initiatives} trends={data.trends} onOpen={onOpenInitiative} onGoToRate={() => setStage('rate')}/>}
          </Fragment>
        )}
      </div>
    </div>
  );
};

const ScoutStage = ({ campaigns, onOpenCampaign, onOpenCapture }) => (
  <div style={{ padding: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Capture channels</div>
        {[
          ["Browser extension", "342 / mo", "ok"],
          ["Slack & Teams bot", "124 / mo", "ok"],
          ["Email forwarding", "88 / mo", "ok"],
          ["Voice note (mobile)", "21 / mo", "ok"],
          ["Custom RSS (34 feeds)", "auto", "warn"],
        ].map(([n, s, st], i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--line-1)" : "none" }}>
            <span className={"dot " + (st === "ok" ? "ok" : "warn")}/>
            <span style={{ fontSize: 12.5, color: "var(--fg-1)", flex: 1 }}>{n}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{s}</span>
          </div>
        ))}
        <button className="btn sm ai" style={{ marginTop: 10 }} onClick={onOpenCapture}><Icon name="sparkles" size={12}/> Capture now</button>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Active campaigns</div>
        {campaigns.filter(c => c.status !== "Closed").slice(0, 4).map(c => (
          <div key={c.id} onClick={() => onOpenCampaign(c.id)} style={{ padding: "10px 0", borderBottom: "1px solid var(--line-1)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span className="chip ok"><span className="dot ok"/>{c.status}</span>
              <div style={{ flex: 1 }}/>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{c.signals} signals · closes {c.closes}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-0)" }}>{c.title}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NewClusterDialog = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ label: '', description: '' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      const res = await clustersApi.create({ ...form, origin: 'manual' });
      onCreated(res.cluster || res);
      onClose();
      setForm({ label: '', description: '' });
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }} onClick={onClose}>
      <div className="card" style={{ width: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--fg-0)' }}>Neuer Cluster</h3>
        <input className="input" placeholder="Label *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} autoFocus style={{ marginBottom: 10, width: '100%' }} />
        <textarea className="input" placeholder="Beschreibung" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical', width: '100%', height: 'auto', fontFamily: 'inherit', fontSize: 13, padding: '10px 12px' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn sm" onClick={onClose}>Abbrechen</button>
          <button className="btn ai sm" onClick={handleSave} disabled={saving || !form.label.trim()}>
            {saving ? 'Erstellen…' : 'Cluster erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ClusterStage = ({ clusters: mockClusters, ideas, onOpenCluster, onReviewAsTrend, onOpenClusterDetail }) => {
  const [newClusterOpen, setNewClusterOpen] = useState(false);
  const [generating, setGenerating] = useState(null); // clusterId currently being generated
  const [apiClusters, setApiClusters] = useState([]);

  useEffect(() => {
    clustersApi.list()
      .then(list => setApiClusters(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  // Merge mock clusters with API clusters (API clusters have origin field)
  const clusters = [...mockClusters, ...apiClusters.filter(ac => !mockClusters.some(mc => mc.id === ac.id))];

  const handleReviewAsTrend = async (cl) => {
    if (!onReviewAsTrend) { onOpenCluster(cl.id); return; }
    setGenerating(cl.id);
    try {
      const signals = ideas.filter(i => i.cluster === cl.id).map(i => ({
        title: i.text,
        summary: null,
        source: i.url || i.author || null,
      }));
      const prefill = await clusterToTrendApi.generate({ cluster: cl, signals });
      onReviewAsTrend(prefill);
    } catch (e) {
      alert('AI-Generierung fehlgeschlagen: ' + e.message);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14 }}>AI groups incoming signals into semantic clusters. Clusters with ≥ 3 signals and ≥ 0.8 confidence become candidate trends.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {clusters.map(cl => {
          const count = ideas.filter(i => i.cluster === cl.id).length;
          const isGenerating = generating === cl.id;
          return (
            <div key={cl.id} className="card" style={{ padding: 14, borderLeft: `3px solid ${cl.color || '#A78BFA'}`, cursor: 'pointer' }} onClick={() => onOpenClusterDetail?.(cl.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{count} signals</span>
                <div style={{ flex: 1 }}/>
                <span className="mono" style={{ fontSize: 11, color: (cl.confidence || 0) > 0.85 ? "#34D399" : "#F59E0B" }}>{cl.confidence != null ? (cl.confidence*100).toFixed(0) + '%' : '—'}</span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--fg-0)", fontWeight: 500, marginBottom: 10 }}>{cl.label}</div>
              {cl.proposed ? (
                <button
                  className="btn ai sm"
                  style={{ width: "100%" }}
                  disabled={isGenerating}
                  onClick={(e) => { e.stopPropagation(); handleReviewAsTrend(cl); }}
                >
                  <Icon name="sparkles" size={12}/>
                  {isGenerating ? ' Generiere…' : ' Review as trend'}
                </button>
              ) : (
                <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>needs more signals</div>
              )}
            </div>
          );
        })}
      </div>
      <button className="btn sm" style={{ width: '100%', marginTop: 12, borderStyle: 'dashed' }} onClick={() => setNewClusterOpen(true)}>
        + Neuer Cluster
      </button>
      <NewClusterDialog open={newClusterOpen} onClose={() => setNewClusterOpen(false)} onCreated={(c) => { setApiClusters(prev => [c, ...prev]); }} />
    </div>
  );
};

const RateStage = ({ trends, onLaunch }) => {
  const top = trends.slice(0, 5);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14 }}>Accepted clusters are validated and rated: confirm evidence & duplicates, estimate team fit, let AI rate market momentum. "Launch" erzeugt eine Initiative mit vorgefülltem MVP-Brief.</div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 120px 90px 140px 140px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--line-1)", fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Rank</span><span>Trend</span><span>Evidence</span><span>Dup check</span><span>Team fit</span><span>AI market rate</span><span>Composite</span><span/>
        </div>
        {top.map((t, i) => {
          const team = 50 + ((t.impact * 7) % 40);
          const ai = Math.round(t.impact * 0.9);
          const composite = Math.round((team + ai) / 2);
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr 120px 90px 140px 140px 120px 100px", padding: "12px 16px", borderBottom: "1px solid var(--line-1)", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 16, color: i === 0 ? "#FBBF24" : "var(--fg-2)", fontWeight: 600 }}>#{i+1}</span>
              <div>
                <div style={{ fontSize: 13, color: "var(--fg-0)" }}>{t.title}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2 }}>{t.dim} · {t.horizon.split(" · ")[0]}</div>
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-1)" }}>{t.signals} sig · {t.sources || 30} src</span>
              <span className="chip ai mono" style={{ fontSize: 10 }}>✓ no dup</span>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ width: 14, height: 14, borderRadius: 3, background: n <= Math.round(team/20) ? "var(--accent)" : "var(--bg-3)" }}/>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BarMeter value={ai} color="var(--ai)"/>
                <span className="mono" style={{ fontSize: 11, color: "var(--ai)", width: 28, textAlign: "right" }}>{ai}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BarMeter value={composite} color="#34D399"/>
                <span className="mono" style={{ fontSize: 11, color: "#34D399", width: 28, textAlign: "right" }}>{composite}</span>
              </div>
              <button className="btn primary sm" style={{ height: 26 }} onClick={() => onLaunch?.(t)}><Icon name="bolt" size={11}/> Launch</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InitiativeStage = ({ initiatives, trends, onOpen, onGoToRate }) => {
  if (initiatives == null) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>Lade Initiativen…</div>;
  }
  if (initiatives.length === 0) {
    return (
      <div style={{ padding: 40, display: "grid", placeItems: "center" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg,#34D399,#60A5FA)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
            <Icon name="bolt" size={22}/>
          </div>
          <h2 style={{ margin: "0 0 8px", color: "var(--fg-0)", fontSize: 17, fontWeight: 600 }}>Noch keine Initiativen</h2>
          <p style={{ color: "var(--fg-2)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Eine Initiative entsteht, indem du in der Stage <b>Rate</b> auf einen priorisierten Trend "Launch" klickst.
            Dann wird ein MVP-Konzept mit vorgefülltem Brief angelegt.
          </p>
          <button className="btn" onClick={onGoToRate}><Icon name="arrowLeft" size={12}/> Zur Rate-Stage</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14 }}>
        Initiativen, die aus einem priorisierten Trend hervorgegangen sind. Click → MVP-Werkstatt (Brief, Artefakte, AI-Coach).
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {initiatives.map(c => {
          const trend = c.trendId ? trends.find(x => x.id === c.trendId) : null;
          return (
            <div key={c.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => onOpen(c.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {c.hasArtefacts
                  ? <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/> Artefakte bereit</span>
                  : <span className="chip mono" style={{ fontSize: 10 }}>Draft</span>}
                <div style={{ flex: 1 }}/>
                <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{formatAge(c.updatedAt)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-0)", marginBottom: 10 }}>{c.title || "Ohne Titel"}</div>
              {trend && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <DimensionDot dim={trend.dim}/>
                  <span style={{ fontSize: 11.5, color: "var(--fg-2)" }}>aus Trend: {trend.title}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatAge(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'eben';
  if (ms < 3600_000) return Math.floor(ms/60_000) + ' min';
  if (ms < 86_400_000) return Math.floor(ms/3_600_000) + ' h';
  if (ms < 30 * 86_400_000) return Math.floor(ms/86_400_000) + ' d';
  return new Date(iso).toLocaleDateString('de-CH');
}

const PipelineBoard = ({ data, campaignsData, stages, initiatives, onOpenInitiative, onOpenCluster }) => {
  const initiativeCards = (initiatives || []).map(c => ({
    id: "i" + c.id,
    origin: "initiative",
    title: c.title || "Ohne Titel",
    sub: (c.hasArtefacts ? "Artefakte bereit" : "Draft"),
    color: "#34D399",
    onClick: () => onOpenInitiative(c.id),
  }));
  const allCards = [
    ...campaignsData.ideas.slice(0, 8).map(i => ({ id: "s" + i.id, origin: "scout",      title: i.text,  sub: "signal · " + (i.source || "web"),                     color: "#60A5FA" })),
    ...campaignsData.clusters.slice(0, 6).map(cl => ({ id: "c" + cl.id, origin: "cluster", title: cl.label, sub: `${cl.confidence*100|0}% conf · AI cluster`,           color: cl.color, ai: true, onClick: () => onOpenCluster(cl.id) })),
    ...data.trends.slice(0, 7).map(t => ({ id: "r" + t.id, origin: "rate",     title: t.title, sub: `${t.signals} sig · team ${60+(t.impact*3)%30} · AI ${Math.round(t.impact*0.9)}`, color: "#F59E0B" })),
    ...initiativeCards,
  ];
  const cardsById = Object.fromEntries(allCards.map(c => [c.id, c]));

  const makeInitial = () => {
    const b = Object.fromEntries(stages.map(s => [s.k, []]));
    for (const c of allCards) b[c.origin].push(c.id);
    return b;
  };

  const [stored, setStored] = useLocalStorage("cin-pipeline-board", makeInitial);
  const [dragging, setDragging] = useState(null);
  const [hoverStage, setHoverStage] = useState(null);
  const [hoverCard, setHoverCard] = useState(null);

  // Auto-heal: add new cards to origin, drop unknown ids
  const board = (() => {
    const result = Object.fromEntries(stages.map(s => [s.k, (stored[s.k] || []).filter(id => cardsById[id])]));
    const seen = new Set(Object.values(result).flat());
    for (const c of allCards) {
      if (!seen.has(c.id)) {
        if (!result[c.origin]) result[c.origin] = [];
        result[c.origin].push(c.id);
      }
    }
    return result;
  })();

  const findStageOf = (id) => stages.find(s => board[s.k]?.includes(id))?.k;

  const moveCard = (cardId, toStage, targetIdx, pos) => {
    setStored(prev => {
      const safe = Object.fromEntries(stages.map(s => [s.k, (prev[s.k] || []).filter(id => cardsById[id])]));
      const seenIds = new Set(Object.values(safe).flat());
      for (const c of allCards) {
        if (!seenIds.has(c.id)) safe[c.origin] = [...(safe[c.origin] || []), c.id];
      }
      const fromStage = stages.find(s => safe[s.k].includes(cardId))?.k;
      if (!fromStage) return prev;
      const next = Object.fromEntries(stages.map(s => [s.k, [...safe[s.k]]]));
      const fromIdx = next[fromStage].indexOf(cardId);
      next[fromStage].splice(fromIdx, 1);
      let insert = targetIdx ?? next[toStage].length;
      if (pos === "after") insert += 1;
      if (fromStage === toStage && fromIdx < insert) insert -= 1;
      insert = Math.max(0, Math.min(insert, next[toStage].length));
      next[toStage].splice(insert, 0, cardId);
      return next;
    });
    setDragging(null);
    setHoverStage(null);
    setHoverCard(null);
  };

  const handleDropOnColumn = (toStage) => {
    if (!dragging) return;
    if (hoverCard && hoverCard.stage === toStage) {
      moveCard(dragging.id, toStage, hoverCard.idx, hoverCard.pos);
    } else {
      moveCard(dragging.id, toStage);
    }
  };

  const resetBoard = () => setStored(makeInitial());
  const hasChanges = allCards.some(c => findStageOf(c.id) !== c.origin);
  const changedCount = allCards.filter(c => findStageOf(c.id) !== c.origin).length;

  return (
    <div style={{ padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 12.5, color: "var(--fg-2)", flex: 1 }}>
          Ziehe Karten zwischen und innerhalb der Spalten. Reihenfolge und Stage werden lokal gespeichert.
        </div>
        {hasChanges && <button className="btn ghost sm" onClick={resetBoard}><Icon name="x" size={11}/> Reset ({changedCount})</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, flex: 1, minHeight: 0 }}>
        {stages.map(s => {
          const cards = (board[s.k] || []).map(id => cardsById[id]).filter(Boolean);
          const isHover = hoverStage === s.k;
          return (
            <div key={s.k}
              onDragOver={e => { if (!dragging) return; e.preventDefault(); if (hoverStage !== s.k) setHoverStage(s.k); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) { setHoverStage(null); setHoverCard(null); } }}
              onDrop={() => handleDropOnColumn(s.k)}
              style={{
                background: isHover ? "var(--bg-2)" : "var(--bg-1)",
                border: "1px solid " + (isHover ? s.c + "80" : "var(--line-1)"),
                boxShadow: isHover ? `inset 0 0 0 1px ${s.c}40` : "none",
                transition: "background 120ms, border-color 120ms, box-shadow 120ms",
                borderRadius: 10, display: "flex", flexDirection: "column", minHeight: 0,
              }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: s.c }}/>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-0)" }}>{s.l}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{cards.length}</span>
                <div style={{ flex: 1 }}/>
                <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{s.n.toLocaleString()}</span>
              </div>
              <div className="scroll" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "auto" }}>
                {cards.map((c, idx) => {
                  const isMe = dragging?.id === c.id;
                  const showBefore = hoverCard?.stage === s.k && hoverCard.idx === idx && hoverCard.pos === "before" && !isMe;
                  const showAfter  = hoverCard?.stage === s.k && hoverCard.idx === idx && hoverCard.pos === "after"  && !isMe;
                  const moved = findStageOf(c.id) !== c.origin;
                  return (
                    <Fragment key={c.id}>
                      {showBefore && <div style={{ height: 2, background: s.c, borderRadius: 2, margin: "-3px 4px" }}/>}
                      <div
                        draggable
                        onDragStart={e => { setDragging(c); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setDragging(null); setHoverStage(null); setHoverCard(null); }}
                        onDragOver={e => {
                          if (!dragging) return;
                          e.preventDefault();
                          e.stopPropagation();
                          if (hoverStage !== s.k) setHoverStage(s.k);
                          const r = e.currentTarget.getBoundingClientRect();
                          const pos = (e.clientY - r.top) < r.height / 2 ? "before" : "after";
                          if (!hoverCard || hoverCard.stage !== s.k || hoverCard.idx !== idx || hoverCard.pos !== pos) {
                            setHoverCard({ stage: s.k, idx, pos });
                          }
                        }}
                        onClick={c.onClick}
                        style={{
                          padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8,
                          cursor: c.onClick ? "pointer" : "grab",
                          borderLeft: `3px solid ${c.color}`,
                          opacity: isMe ? 0.4 : 1,
                          transform: isMe ? "rotate(-1.5deg)" : "none",
                          transition: "opacity 120ms, transform 120ms",
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                          {c.ai && <span className="chip ai mono" style={{ fontSize: 9.5, padding: "1px 5px" }}><Icon name="sparkles" size={9}/>AI</span>}
                          {moved && <span className="chip mono" style={{ fontSize: 9.5, padding: "1px 5px", color: "var(--accent-2)" }}>moved</span>}
                          <div style={{ flex: 1 }}/>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--fg-0)", lineHeight: 1.4, marginBottom: 6 }}>{c.title}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{c.sub}</div>
                      </div>
                      {showAfter && <div style={{ height: 2, background: s.c, borderRadius: 2, margin: "-3px 4px" }}/>}
                    </Fragment>
                  );
                })}
                {cards.length === 0 && (
                  <div style={{ padding: 16, textAlign: "center", color: "var(--fg-3)", fontSize: 11, border: "1px dashed var(--line-2)", borderRadius: 6 }}>
                    hierhin ziehen
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ClusterDetail = ({ clusterId, onBack, onReviewAsTrend, campaignsData }) => {
  const [cluster, setCluster] = useState(null);
  const [linkedSignals, setLinkedSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      clustersApi.get(clusterId).catch(() => null),
      signalsApi.list().catch(() => []),
    ]).then(([cl, sigs]) => {
      const resolved = cl?.cluster || cl || (campaignsData?.clusters || []).find(c => c.id === clusterId) || null;
      setCluster(resolved);
      const allSigs = Array.isArray(sigs) ? sigs : [];
      setLinkedSignals(allSigs.filter(s => (s.clusterIds || []).includes(clusterId) || s.clusterId === clusterId));
    }).finally(() => setLoading(false));
  }, [clusterId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>Loading cluster…</div>;
  if (!cluster) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>Cluster not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn ghost sm" onClick={onBack}><Icon name="arrowLeft" size={13} /> Back</button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--fg-0)' }}>{cluster.label || 'Cluster'}</h1>
        <div style={{ flex: 1 }} />
        {onReviewAsTrend && (
          <button className="btn ai sm" onClick={() => onReviewAsTrend(cluster)}>
            <Icon name="sparkles" size={12} /> Review as Trend
          </button>
        )}
      </div>
      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 16px', fontSize: 13 }}>
            <span style={{ color: 'var(--fg-3)' }}>Label</span>
            <span style={{ color: 'var(--fg-0)', fontWeight: 500 }}>{cluster.label}</span>
            <span style={{ color: 'var(--fg-3)' }}>Description</span>
            <span style={{ color: 'var(--fg-1)' }}>{cluster.description || '—'}</span>
            <span style={{ color: 'var(--fg-3)' }}>Origin</span>
            <span className="chip mono" style={{ fontSize: 10.5, width: 'fit-content' }}>{cluster.origin || 'unknown'}</span>
            <span style={{ color: 'var(--fg-3)' }}>Confidence</span>
            <span className="mono" style={{ color: cluster.confidence > 0.85 ? '#34D399' : '#F59E0B' }}>
              {cluster.confidence != null ? (cluster.confidence * 100).toFixed(0) + '%' : '—'}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          Linked Signals ({linkedSignals.length})
        </div>
        {linkedSignals.length === 0 && (
          <div style={{ color: 'var(--fg-3)', fontSize: 12, padding: '12px 0' }}>No signals linked to this cluster yet.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {linkedSignals.map(s => (
            <div key={s.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: { manual: '#3B82F6', url: '#10B981', pdf: '#F59E0B', 'ai-scout': '#A78BFA' }[s.channel] || 'var(--fg-3)' }} />
                <span style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 500, flex: 1 }}>{s.title}</span>
              </div>
              {s.source && <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{s.source}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AnalyticsHub = ({ t, data, onOpenTrend, view = "radar", setView }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--fg-0)" }}>Analytics</h1>
        <div style={{ flex: 1 }}/>
        <div style={{ display: "flex", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: 2 }}>
          {[["radar","Radar","radar"],["matrix","Matrix","matrix"],["timeline","Timeline","timeline"],["funnel","Funnel","funnel"],["relations","Relations","link"]].map(([k, l, i]) => (
            <button key={k} onClick={() => setView?.(k)} style={{ padding: "5px 12px", fontSize: 12, borderRadius: 4, background: view === k ? "var(--bg-3)" : "transparent", color: view === k ? "var(--fg-0)" : "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name={i} size={12}/> {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {view === "radar" && <Radar t={t} data={data} onOpenTrend={onOpenTrend}/>}
        {view === "matrix" && <Matrix data={data} onOpenTrend={onOpenTrend}/>}
        {view === "timeline" && <Timeline data={data} onOpenTrend={onOpenTrend}/>}
        {view === "funnel" && <Funnel data={data}/>}
        {view === "relations" && <RelationsView data={data} onOpenTrend={onOpenTrend}/>}
      </div>
    </div>
  );
};
