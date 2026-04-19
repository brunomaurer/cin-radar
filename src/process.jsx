// Process pipeline — Scout -> Cluster -> Validate -> Rate -> Initiative
import { Fragment, useState } from 'react';
import { Icon, BarMeter, DimensionDot } from './ui.jsx';
import { Radar, Matrix, Timeline, Funnel } from './viz.jsx';
import { useLocalStorage } from './useLocalStorage.js';

export const ProcessPipeline = ({ data, campaignsData, stage, setStage, onOpenCampaign, onOpenCluster, onOpenCapture, onOpenInitiative }) => {
  const stages = [
    { k: "scout",      l: "Scout",      n: 1840, c: "#60A5FA", sub: "Capture from the world" },
    { k: "cluster",    l: "Cluster",    n: 204,  c: "#A78BFA", sub: "AI groups similar signals" },
    { k: "validate",   l: "Validate",   n: 48,   c: "#F472B6", sub: "Human confirms signal" },
    { k: "rate",       l: "Rate",       n: 12,   c: "#FBBF24", sub: "Business + AI market rate" },
    { k: "initiative", l: "Initiative", n: 4,    c: "#34D399", sub: "MVP, spec, build" },
  ];
  const [view, setView] = useState("pipeline");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length}, 1fr) 40px`, gap: 4, marginTop: 14 }}>
          {stages.map((s, i) => (
            <Fragment key={s.k}>
              <button onClick={() => setStage(s.k)} style={{
                padding: "10px 12px", borderRadius: 8,
                background: stage === s.k ? `${s.c}22` : "var(--bg-1)",
                border: `1px solid ${stage === s.k ? s.c + '80' : 'var(--line-1)'}`,
                textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: s.c }}/>
                  <span style={{ fontSize: 10.5, color: s.c, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>0{i+1} {s.l}</span>
                </div>
                <div className="mono" style={{ fontSize: 18, color: "var(--fg-0)", fontWeight: 600 }}>{s.n.toLocaleString()}</div>
                <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2 }}>{s.sub}</div>
              </button>
              {i < stages.length - 1 && <div style={{ display: "grid", placeItems: "center", color: "var(--fg-4)" }}><Icon name="chevronRight" size={16}/></div>}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto" }}>
        {view === "board" ? (
          <PipelineBoard data={data} campaignsData={campaignsData} stages={stages} onOpenInitiative={onOpenInitiative} onOpenCluster={onOpenCluster}/>
        ) : (
          <Fragment>
            {stage === "scout" && <ScoutStage campaigns={campaignsData.campaigns} onOpenCampaign={onOpenCampaign} onOpenCapture={onOpenCapture}/>}
            {stage === "cluster" && <ClusterStage clusters={campaignsData.clusters} ideas={campaignsData.ideas} onOpenCluster={onOpenCluster}/>}
            {stage === "validate" && <ValidateStage trends={data.trends}/>}
            {stage === "rate" && <RateStage trends={data.trends}/>}
            {stage === "initiative" && <InitiativeStage projects={data.projects} trends={data.trends} onOpen={onOpenInitiative}/>}
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

const ClusterStage = ({ clusters, ideas, onOpenCluster }) => (
  <div style={{ padding: 20 }}>
    <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14 }}>AI groups incoming signals into semantic clusters. Clusters with ≥ 3 signals and ≥ 0.8 confidence become candidate trends.</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
      {clusters.map(cl => {
        const count = ideas.filter(i => i.cluster === cl.id).length;
        return (
          <div key={cl.id} className="card" style={{ padding: 14, borderLeft: `3px solid ${cl.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{count} signals</span>
              <div style={{ flex: 1 }}/>
              <span className="mono" style={{ fontSize: 11, color: cl.confidence > 0.85 ? "#34D399" : "#F59E0B" }}>{(cl.confidence*100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--fg-0)", fontWeight: 500, marginBottom: 10 }}>{cl.label}</div>
            {cl.proposed ? (
              <button className="btn ai sm" style={{ width: "100%" }} onClick={() => onOpenCluster(cl.id)}><Icon name="sparkles" size={12}/> Review as trend</button>
            ) : (
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>needs more signals</div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const ValidateStage = ({ trends }) => (
  <div style={{ padding: 20 }}>
    <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14 }}>Accepted clusters become trend candidates. Assign an owner, confirm dimension & horizon, check for duplicates.</div>
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--line-1)", fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        <span>Trend candidate</span><span>Dimension</span><span>Horizon</span><span>Evidence</span><span>AI check</span><span/>
      </div>
      {trends.slice(0, 6).map(t => (
        <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 120px 100px", padding: "12px 16px", borderBottom: "1px solid var(--line-1)", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--fg-0)" }}>{t.title}</span>
          <span style={{ fontSize: 12, color: "var(--fg-2)", display: "inline-flex", gap: 6, alignItems: "center" }}><DimensionDot dim={t.dim}/>{t.dim}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>{t.horizon.split(" · ")[0]}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-1)" }}>{t.signals} sig · {t.sources || 30} src</span>
          <span className="chip ai mono" style={{ fontSize: 10 }}>✓ no dup</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn primary sm" style={{ height: 24 }}><Icon name="check" size={11}/></button>
            <button className="btn ghost sm" style={{ height: 24 }}><Icon name="x" size={11}/></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RateStage = ({ trends }) => {
  const top = trends.slice(0, 5);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14 }}>Validated trends are rated: your team estimates business fit, AI estimates market momentum from real signal data. The product makes the priority list.</div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 140px 140px 120px 100px", padding: "10px 16px", borderBottom: "1px solid var(--line-1)", fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Rank</span><span>Trend</span><span>Team fit</span><span>AI market rate</span><span>Composite</span><span/>
        </div>
        {top.map((t, i) => {
          const team = 50 + ((t.impact * 7) % 40);
          const ai = Math.round(t.impact * 0.9);
          const composite = Math.round((team + ai) / 2);
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr 140px 140px 120px 100px", padding: "12px 16px", borderBottom: "1px solid var(--line-1)", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 16, color: i === 0 ? "#FBBF24" : "var(--fg-2)", fontWeight: 600 }}>#{i+1}</span>
              <div>
                <div style={{ fontSize: 13, color: "var(--fg-0)" }}>{t.title}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2 }}>{t.dim} · {t.horizon.split(" · ")[0]}</div>
              </div>
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
              <button className="btn primary sm" style={{ height: 26 }}><Icon name="bolt" size={11}/> Launch</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InitiativeStage = ({ projects, trends, onOpen }) => (
  <div style={{ padding: 20 }}>
    <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14 }}>Rated trends become initiatives — concrete projects with owners, milestones, and AI-assisted specs.</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
      {projects.map(p => {
        const trend = trends.find(x => x.id === p.trends[0]);
        return (
          <div key={p.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => onOpen(p.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span className="chip">{p.stage}</span>
              <div style={{ flex: 1 }}/>
              <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/>AI co-spec</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-0)", marginBottom: 10 }}>{p.title}</div>
            {trend && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><DimensionDot dim={trend.dim}/><span style={{ fontSize: 11.5, color: "var(--fg-2)" }}>from trend: {trend.title}</span></div>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BarMeter value={p.progress} color="var(--accent)"/>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>{p.progress}%</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const PipelineBoard = ({ data, campaignsData, stages, onOpenInitiative, onOpenCluster }) => {
  const allCards = [
    ...campaignsData.ideas.slice(0, 8).map(i => ({ id: "s" + i.id, origin: "scout",      title: i.text,  sub: "signal · " + (i.source || "web"),                     color: "#60A5FA" })),
    ...campaignsData.clusters.slice(0, 6).map(cl => ({ id: "c" + cl.id, origin: "cluster", title: cl.label, sub: `${cl.confidence*100|0}% conf · AI cluster`,           color: cl.color, ai: true, onClick: () => onOpenCluster(cl.id) })),
    ...data.trends.slice(0, 4).map(t => ({ id: "v" + t.id, origin: "validate", title: t.title, sub: t.dim + " · needs owner",                                         color: "#F472B6" })),
    ...data.trends.slice(4, 7).map(t => ({ id: "r" + t.id, origin: "rate",     title: t.title, sub: `team ${60+(t.impact*3)%30} · AI ${Math.round(t.impact*0.9)}`,    color: "#FBBF24" })),
    ...data.projects.slice(0, 4).map(p => ({ id: "i" + p.id, origin: "initiative", title: p.title, sub: p.stage + " · " + p.progress + "%",                           color: "#34D399", onClick: () => onOpenInitiative(p.id) })),
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, flex: 1, minHeight: 0 }}>
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

export const AnalyticsHub = ({ t, data, onOpenTrend }) => {
  const [view, setView] = useState("radar");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--fg-0)" }}>Analytics</h1>
        <div style={{ flex: 1 }}/>
        <div style={{ display: "flex", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: 2 }}>
          {[["radar","Radar","radar"],["matrix","Matrix","matrix"],["timeline","Timeline","timeline"],["funnel","Funnel","funnel"]].map(([k, l, i]) => (
            <button key={k} onClick={() => setView(k)} style={{ padding: "5px 12px", fontSize: 12, borderRadius: 4, background: view === k ? "var(--bg-3)" : "transparent", color: view === k ? "var(--fg-0)" : "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
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
      </div>
    </div>
  );
};
