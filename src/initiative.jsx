// Initiative detail as full project workspace
import { Fragment, useState } from 'react';
import { Icon, DimensionDot } from './ui.jsx';
import { useLocalStorage } from './useLocalStorage.js';

export const InitiativeDetail = ({ projects, trends, projectId, onBack }) => {
  const p = projects.find(x => x.id === projectId) || projects[0];
  const trend = trends.find(x => x.id === p.trends[0]);
  const [tab, setTab] = useState("overview");

  const tabs = [
    ["overview", "Overview", "grid"],
    ["spec", "Spec · AI", "sparkles"],
    ["kanban", "Kanban", "board"],
    ["milestones", "Milestones", "timeline"],
    ["team", "Team & budget", "users"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)" }}>
        <button onClick={onBack} style={{ color: "var(--fg-3)", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8 }}><Icon name="arrowLeft" size={12}/> Initiatives</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span className="chip ok"><span className="dot ok"/>{p.stage}</span>
          {trend && <span className="chip"><DimensionDot dim={trend.dim}/> from trend: {trend.title}</span>}
          <span className="chip ai mono"><Icon name="sparkles" size={10}/> AI co-pilot</span>
          <span className="chip mono">{p.lead} · lead</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--fg-0)" }}>{p.title}</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14 }}>
          {[["Progress", `${p.progress}%`], ["Milestones", "3 / 7"], ["Tasks", "18 / 42"], ["Budget", "CHF 48k / 120k"], ["Next review", "5 d"]].map(([k,v]) => (
            <div key={k} className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8 }}>{k}</div>
              <div className="mono" style={{ fontSize: 14, color: "var(--fg-0)", fontWeight: 600, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, padding: "0 20px", borderBottom: "1px solid var(--line-1)" }}>
        {tabs.map(([k, l, i]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 14px", fontSize: 12.5, color: tab === k ? "var(--fg-0)" : "var(--fg-3)", borderBottom: "2px solid " + (tab === k ? "var(--accent)" : "transparent"), marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name={i} size={12}/> {l}
          </button>
        ))}
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto" }}>
        {tab === "overview" && <InitiativeOverview p={p} trend={trend}/>}
        {tab === "spec" && <InitiativeSpec p={p} trend={trend}/>}
        {tab === "kanban" && <InitiativeKanban p={p}/>}
        {tab === "milestones" && <InitiativeMilestones p={p}/>}
        {tab === "team" && <InitiativeTeam p={p}/>}
      </div>
    </div>
  );
};

export const InitiativeOverview = ({ p, trend }) => (
  <div style={{ padding: 20, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Problem</div>
        <div style={{ fontSize: 13.5, color: "var(--fg-0)", lineHeight: 1.6 }}>
          Current supplier onboarding for bio-based materials takes weeks of manual back-and-forth. Each spec sheet is reviewed by hand, with no common sustainability language across procurement, R&D and compliance.
        </div>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Solution hypothesis</div>
        <div style={{ fontSize: 13.5, color: "var(--fg-0)", lineHeight: 1.6 }}>
          Build an MVP that ingests supplier spec sheets (PDF/CSV), auto-scores them against a shared sustainability rubric, and flags missing evidence — shortening intake from 3 weeks to under 48 hours.
        </div>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Recent activity</div>
        {[
          ["Maya moved 'Build scoring rubric v1' → Done", "2h ago"],
          ["AI drafted 4 acceptance criteria from trend evidence", "yesterday"],
          ["Milestone 'Week 3: pilot with 2 suppliers' scheduled", "2d ago"],
          ["Budget approval CHF 120k confirmed", "1w ago"],
        ].map(([l, t]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line-1)" }}>
            <span className="dot ok"/>
            <span style={{ fontSize: 12.5, color: "var(--fg-1)", flex: 1 }}>{l}</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {trend && (
        <div className="card" style={{ padding: 16, borderLeft: "3px solid var(--accent-2)" }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Why this? (evidence link)</div>
          <div style={{ fontSize: 13, color: "var(--fg-0)", fontWeight: 500, marginBottom: 6 }}>{trend.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <DimensionDot dim={trend.dim}/>
            <span style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{trend.dim}</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>· {trend.signals} signals · impact {trend.impact}</span>
          </div>
          <button className="btn sm" style={{ width: "100%" }}>Open trend card →</button>
        </div>
      )}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Team</div>
        {["Maya Lindström · Lead PM", "Timo Weber · Eng lead", "Priya Ranganathan · Design", "Felix Marti · Compliance"].map((m, i) => (
          <div key={m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <div style={{ width: 24, height: 24, borderRadius: 999, background: `hsl(${i*80} 50% 40%)`, color: "white", fontSize: 10, display: "grid", placeItems: "center", fontWeight: 600 }}>{m.split(" ")[0][0]}{m.split(" ")[1][0]}</div>
            <span style={{ fontSize: 12, color: "var(--fg-1)" }}>{m}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 14, background: "var(--ai-soft)", border: "1px solid rgba(167,139,250,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Icon name="sparkles" size={12}/>
          <span style={{ fontSize: 11, color: "var(--ai)", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>AI nudge</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fg-1)", lineHeight: 1.5 }}>Velocity is 30% below the planned rate. Two tasks in 'In progress' have been idle for 6 days — Timo may need reassignment.</div>
      </div>
    </div>
  </div>
);

export const InitiativeSpec = ({ p, trend }) => {
  const [msgs, setMsgs] = useState([
    { who: "ai", text: "I've read the trend card and your MVP brief. Want to draft acceptance criteria, risks, or go straight to a prototype outline?" },
    { who: "user", text: "Acceptance criteria, in Gherkin please." },
    { who: "ai", text: "Drafting 4 criteria from the brief and trend signals:\n\n• Given a supplier uploads a bio-material spec, When the MVP ingests it, Then it returns a sustainability score within 30 s.\n• Given 10 concurrent uploads, Then throughput stays ≥ 2/min.\n• Given missing data, Then the system flags gaps and proposes augmentation.\n• Given a scored spec, Then reviewers can reject with a structured reason in ≤ 3 clicks." },
  ]);
  const [input, setInput] = useState("");
  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setMsgs(m => [...m, { who: "user", text: q }, { who: "ai", text: `Vorschlag notiert: „${q}" — ich würde das in den nächsten Iterationen einbauen.` }]);
    setInput("");
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%", padding: 20 }}>
      <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Spec draft</div>
        <div style={{ flex: 1, overflow: "auto", fontSize: 13, color: "var(--fg-1)", lineHeight: 1.65 }}>
          <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 14, marginBottom: 8 }}>Acceptance criteria</div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            <li>Given a supplier uploads a bio-material spec, When the MVP ingests it, Then it returns a sustainability score within 30 s.</li>
            <li>Given 10 concurrent uploads, Then throughput stays ≥ 2/min.</li>
            <li>Given missing data, Then the system flags gaps and proposes augmentation.</li>
            <li>Given a scored spec, Then reviewers can reject with a structured reason in ≤ 3 clicks.</li>
          </ul>
          <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 14, margin: "16px 0 8px" }}>Out of scope (MVP)</div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            <li>Multi-tenant isolation</li>
            <li>Regulatory certification workflow</li>
          </ul>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <button className="btn sm"><Icon name="download" size={12}/> Export</button>
          <button className="btn sm">Push to Linear</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#A78BFA,#3B82F6)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={12}/></div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-0)" }}>AI spec assistant</span>
          {trend && <span className="chip ai mono" style={{ fontSize: 10 }}>reads {trend.title.slice(0, 24)}…</span>}
        </div>
        <div className="scroll" style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.who === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
              <div style={{ padding: "8px 12px", borderRadius: 10, background: m.who === "user" ? "var(--accent)" : "var(--bg-2)", color: m.who === "user" ? "white" : "var(--fg-1)", fontSize: 12.5, whiteSpace: "pre-wrap", lineHeight: 1.5, border: m.who === "ai" ? "1px solid var(--line-2)" : "none" }}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 10, borderTop: "1px solid var(--line-1)", display: "flex", gap: 6 }}>
          <input className="input" style={{ flex: 1 }} placeholder="Ask to refine, add risks, draft tests…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }}/>
          <button className="btn ai sm" onClick={() => send()}><Icon name="arrowRight" size={12}/></button>
        </div>
        <div style={{ padding: "8px 10px", borderTop: "1px solid var(--line-1)", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Add risks", "User stories", "Tech stack options", "Cost estimate", "Draft intro deck"].map(x => (
            <button key={x} className="chip" style={{ cursor: "pointer" }} onClick={() => send(x)}>{x}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

const KANBAN_SEED = {
  backlog: [
    { id: "t1", title: "Define rubric weights with compliance", owner: "FM", p: "M", tags: ["spec"] },
    { id: "t2", title: "Draft supplier onboarding email", owner: "ML", p: "L", tags: ["comms"] },
    { id: "t3", title: "Pick PDF parser library", owner: "TW", p: "M", tags: ["eng"], ai: true },
    { id: "t4", title: "Interview 3 procurement leads", owner: "PR", p: "H", tags: ["research"] },
  ],
  inprogress: [
    { id: "t5", title: "Build scoring service skeleton", owner: "TW", p: "H", tags: ["eng"], stale: 6 },
    { id: "t6", title: "Mock review UI v2", owner: "PR", p: "M", tags: ["design"] },
    { id: "t7", title: "Write acceptance criteria (AI-drafted)", owner: "ML", p: "H", tags: ["spec"], ai: true },
  ],
  review: [
    { id: "t8", title: "Sustainability rubric v0.3", owner: "FM", p: "H", tags: ["spec"] },
    { id: "t9", title: "Data model ERD", owner: "TW", p: "M", tags: ["eng"] },
  ],
  done: [
    { id: "t10", title: "Kickoff deck", owner: "ML", p: "L", tags: ["comms"] },
    { id: "t11", title: "Budget approval memo", owner: "ML", p: "M", tags: ["ops"] },
    { id: "t12", title: "Trend card read-out to stakeholders", owner: "ML", p: "L", tags: ["comms"] },
  ],
};

export const InitiativeKanban = ({ p }) => {
  const [board, setBoard] = useLocalStorage("cin-kanban-" + (p?.id || "default"), KANBAN_SEED);
  const [dragging, setDragging] = useState(null);
  const [hoverCol, setHoverCol] = useState(null);
  const [hoverCard, setHoverCard] = useState(null);
  const cols = [
    { k: "backlog", l: "Backlog", c: "#94A3B8" },
    { k: "inprogress", l: "In progress", c: "#60A5FA" },
    { k: "review", l: "Review", c: "#F59E0B" },
    { k: "done", l: "Done", c: "#34D399" },
  ];

  const dropOnColumn = (toCol) => {
    if (!dragging) return;
    const { card, fromCol } = dragging;
    setBoard(b => {
      const next = { ...b };
      if (fromCol === toCol) {
        next[toCol] = b[toCol].filter(c => c.id !== card.id);
      } else {
        next[fromCol] = b[fromCol].filter(c => c.id !== card.id);
        next[toCol] = [...b[toCol]];
      }
      if (hoverCard && hoverCard.col === toCol) {
        let idx = hoverCard.idx;
        if (hoverCard.pos === "after") idx += 1;
        if (fromCol === toCol) {
          const origIdx = b[toCol].findIndex(c => c.id === card.id);
          if (origIdx !== -1 && origIdx < idx) idx -= 1;
        }
        next[toCol].splice(idx, 0, card);
      } else {
        next[toCol].push(card);
      }
      return next;
    });
    setDragging(null);
    setHoverCol(null);
    setHoverCard(null);
  };

  return (
    <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: "var(--fg-2)" }}>Drag cards across columns. AI auto-drafts tasks from your spec and flags stale work.</div>
        <div style={{ flex: 1 }}/>
        <button className="btn sm"><Icon name="filter" size={12}/> Filter</button>
        <button className="btn ai sm"><Icon name="sparkles" size={12}/> AI: draft tasks from spec</button>
        <button className="btn primary sm"><Icon name="plus" size={12}/> New task</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, flex: 1, minHeight: 0 }}>
        {cols.map(col => {
          const isHover = hoverCol === col.k;
          return (
          <div
            key={col.k}
            onDragOver={e => { e.preventDefault(); if (hoverCol !== col.k) setHoverCol(col.k); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) { setHoverCol(null); setHoverCard(null); } }}
            onDrop={() => dropOnColumn(col.k)}
            style={{
              background: isHover ? "var(--bg-2)" : "var(--bg-1)",
              border: "1px solid " + (isHover ? col.c + "80" : "var(--line-1)"),
              boxShadow: isHover ? `inset 0 0 0 1px ${col.c}40` : "none",
              transition: "background 120ms, border-color 120ms, box-shadow 120ms",
              borderRadius: 10,
              display: "flex", flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: col.c }}/>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-0)" }}>{col.l}</span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{board[col.k].length}</span>
              <div style={{ flex: 1 }}/>
              <button className="btn ghost icon sm"><Icon name="plus" size={11}/></button>
            </div>
            <div className="scroll" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "auto" }}>
              {board[col.k].map((card, idx) => {
                const isDraggingMe = dragging?.card.id === card.id;
                const showLineBefore = hoverCard?.col === col.k && hoverCard.idx === idx && hoverCard.pos === "before";
                const showLineAfter = hoverCard?.col === col.k && hoverCard.idx === idx && hoverCard.pos === "after";
                return (
                <Fragment key={card.id}>
                  {showLineBefore && <div style={{ height: 2, background: col.c, borderRadius: 2, margin: "-3px 4px" }}/>}
                <div
                  draggable
                  onDragStart={e => { setDragging({ card, fromCol: col.k }); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDragging(null); setHoverCol(null); setHoverCard(null); }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (hoverCol !== col.k) setHoverCol(col.k);
                    const r = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientY - r.top) < r.height / 2 ? "before" : "after";
                    if (!hoverCard || hoverCard.col !== col.k || hoverCard.idx !== idx || hoverCard.pos !== pos) {
                      setHoverCard({ col: col.k, idx, pos });
                    }
                  }}
                  style={{
                    padding: 10,
                    background: "var(--bg-2)",
                    border: "1px solid " + (card.stale ? "#F59E0B60" : "var(--line-2)"),
                    borderRadius: 8,
                    cursor: isDraggingMe ? "grabbing" : "grab",
                    opacity: isDraggingMe ? 0.4 : 1,
                    transform: isDraggingMe ? "rotate(-1.5deg)" : "none",
                    transition: "opacity 120ms, transform 120ms",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                    {card.tags.map(tag => <span key={tag} className="chip mono" style={{ fontSize: 9.5, padding: "1px 6px" }}>{tag}</span>)}
                    {card.ai && <span className="chip ai mono" style={{ fontSize: 9.5, padding: "1px 6px" }}><Icon name="sparkles" size={9}/>AI</span>}
                    <div style={{ flex: 1 }}/>
                    <span className="mono" style={{ fontSize: 9.5, padding: "1px 5px", borderRadius: 3, background: card.p === "H" ? "#EF444430" : card.p === "M" ? "#F59E0B30" : "var(--bg-3)", color: card.p === "H" ? "#F87171" : card.p === "M" ? "#FBBF24" : "var(--fg-3)" }}>{card.p}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-0)", lineHeight: 1.4, marginBottom: 8 }}>{card.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 999, background: "var(--bg-3)", color: "var(--fg-1)", fontSize: 9, display: "grid", placeItems: "center", fontWeight: 600 }}>{card.owner}</div>
                    {card.stale && <span className="mono" style={{ fontSize: 10, color: "#F59E0B" }}>stale {card.stale}d</span>}
                    <div style={{ flex: 1 }}/>
                    <Icon name="message" size={11}/>
                    <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{(card.id.charCodeAt(1) || 0) % 5}</span>
                  </div>
                </div>
                {showLineAfter && <div style={{ height: 2, background: col.c, borderRadius: 2, margin: "-3px 4px" }}/>}
                </Fragment>
                );
              })}
              {col.k === "backlog" && (
                <button className="card" style={{ padding: 10, background: "var(--ai-soft)", border: "1px dashed rgba(167,139,250,0.4)", color: "var(--ai)", fontSize: 11.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="sparkles" size={11}/> AI proposes 3 more tasks from spec
                </button>
              )}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

export const InitiativeMilestones = ({ p }) => {
  const ms = [
    { l: "Week 1 · Kickoff + team aligned", from: 0, to: 1, st: "done" },
    { l: "Week 2 · Rubric v1 locked", from: 1, to: 2, st: "done" },
    { l: "Week 3 · Pilot with 2 suppliers", from: 2, to: 3, st: "done" },
    { l: "Week 4 · Scoring service live (internal)", from: 3, to: 4, st: "active" },
    { l: "Week 6 · 10 suppliers onboarded", from: 4, to: 6, st: "planned" },
    { l: "Week 8 · Go / no-go review", from: 6, to: 8, st: "planned" },
    { l: "Week 10 · Hand-off to Procurement", from: 8, to: 10, st: "planned" },
  ];
  const col = { done: "#34D399", active: "#60A5FA", planned: "var(--bg-3)" };
  return (
    <div style={{ padding: 20 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 6, paddingBottom: 10, borderBottom: "1px solid var(--line-1)", fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase" }}>
          {Array.from({ length: 10 }, (_, i) => <div key={i} style={{ flex: 1, textAlign: "center" }}>W{i+1}</div>)}
        </div>
        {ms.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < ms.length - 1 ? "1px solid var(--line-1)" : "none" }}>
            <div style={{ width: 280, fontSize: 12.5, color: "var(--fg-1)" }}>
              <span className="mono" style={{ color: col[m.st], fontWeight: 600, marginRight: 6 }}>●</span>{m.l}
            </div>
            <div style={{ flex: 1, height: 22, background: "var(--bg-1)", borderRadius: 4, position: "relative" }}>
              <div style={{ position: "absolute", left: `${m.from * 10}%`, width: `${(m.to - m.from) * 10}%`, top: 3, bottom: 3, background: col[m.st], borderRadius: 3, opacity: m.st === "planned" ? 0.4 : 0.8 }}/>
              <div style={{ position: "absolute", left: "30%", top: -2, bottom: -2, borderLeft: "2px dashed #F87171" }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InitiativeTeam = ({ p }) => (
  <div style={{ padding: 20, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Team</div>
      {[
        ["Maya Lindström", "Lead PM", "100%", "ML"],
        ["Timo Weber", "Engineering lead", "80%", "TW"],
        ["Priya Ranganathan", "Product design", "60%", "PR"],
        ["Felix Marti", "Compliance & sourcing", "40%", "FM"],
        ["Noah Keller", "Data eng · part time", "30%", "NK"],
      ].map(([n, r, cap, ini], i) => (
        <div key={n} style={{ display: "grid", gridTemplateColumns: "36px 1fr 100px 80px", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line-1)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: `hsl(${i*70} 50% 42%)`, color: "white", fontSize: 11, display: "grid", placeItems: "center", fontWeight: 600 }}>{ini}</div>
          <div>
            <div style={{ fontSize: 13, color: "var(--fg-0)" }}>{n}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{r}</div>
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{cap} capacity</div>
          <button className="btn ghost sm" style={{ height: 24 }}>Message</button>
        </div>
      ))}
    </div>
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Budget</div>
      <div className="mono" style={{ fontSize: 22, color: "var(--fg-0)", fontWeight: 600 }}>CHF 48,200</div>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 10 }}>of CHF 120,000 · 40% used</div>
      <div style={{ height: 8, background: "var(--bg-1)", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ width: "40%", height: "100%", background: "var(--accent)" }}/>
      </div>
      {[["People", "32,400"], ["Cloud + tooling", "8,600"], ["External research", "5,200"], ["Misc.", "2,000"]].map(([l,v]) => (
        <div key={l} style={{ display: "flex", padding: "6px 0", fontSize: 12.5, color: "var(--fg-1)", borderBottom: "1px solid var(--line-1)" }}>
          <span style={{ flex: 1 }}>{l}</span>
          <span className="mono" style={{ color: "var(--fg-2)" }}>CHF {v}</span>
        </div>
      ))}
    </div>
  </div>
);
