// Campaigns list + workspace + capture dialog + cluster review
import { useState } from 'react';
import { Icon, BarMeter, DimensionDot, StageBadge } from './ui.jsx';
import { campaignsApi } from './api.js';

const NewCampaignDialog = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', question: '', owner: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (!open) return null;

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const campaign = await campaignsApi.create({
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      onCreated(campaign);
      onClose();
      setForm({ title: '', description: '', question: '', owner: '', tags: '' });
    } catch (e) {
      alert('Error creating campaign: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }} onClick={onClose}>
      <div className="card" style={{ width: 480, padding: 24 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--fg-0)' }}>Neue Kampagne erstellen</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="input" placeholder="Titel *" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
          <input className="input" placeholder="Leitfrage" value={form.question} onChange={e => set('question', e.target.value)} />
          <textarea className="input" placeholder="Beschreibung" value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          <input className="input" placeholder="Owner" value={form.owner} onChange={e => set('owner', e.target.value)} />
          <input className="input" placeholder="Tags (kommagetrennt)" value={form.tags} onChange={e => set('tags', e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn sm" onClick={onClose}>Abbrechen</button>
          <button className="btn sm" style={{ background: '#22C55E', color: '#fff', border: 'none' }} onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Erstellen…' : 'Kampagne erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CampaignList = ({ data, onOpen, onNewCampaign }) => {
  const [filter, setFilter] = useState("all");
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const statusColor = { Active: "ok", Open: "accent", Closed: "" };
  const campaigns = data.campaigns.filter(c => filter === "all" ? true : c.status.toLowerCase() === filter);

  return (
    <div style={{ padding: 20, overflow: "auto", height: "100%" }} className="scroll">
      <div className="card" style={{ padding: 20, marginBottom: 20, background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(59,130,246,0.04) 60%, transparent)", borderColor: "rgba(167,139,250,0.25)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="ai-shimmer" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Campaigns</span>
              <span className="chip ai mono" style={{ fontSize: 10 }}>AI-assisted capture</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--fg-0)" }}>Where signals & ideas come from</h1>
            <p style={{ margin: "8px 0 0", color: "var(--fg-2)", fontSize: 13.5, maxWidth: 640, lineHeight: 1.55 }}>
              Run open campaigns, invite externals, let the AI cluster incoming ideas in real time.
              When a cluster stabilises, it's proposed as a trend — you approve, the radar updates.
            </p>
          </div>
          <button className="btn ai" onClick={onNewCampaign}><Icon name="plus" size={13}/> New campaign</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
          {[
            { icon: "plus",      label: "Create",    sub: "Open idea collection", hint: "Freetext + URL + voice", color: "#60A5FA" },
            { icon: "star",      label: "Rating",    sub: "Prioritise existing",  hint: "Reaction-based voting",   color: "#FBBF24" },
            { icon: "link",      label: "Share",     sub: "Public link, externals", hint: "No login, AI-structured",color: "#34D399" },
            { icon: "user",      label: "Interview", sub: "AI-guided 1:1",        hint: "Extracts 5–12 signals",   color: "#A78BFA" },
          ].map(k => (
            <button key={k.label} onClick={onNewCampaign} className="card" style={{ padding: 12, textAlign: "left", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--bg-3)", color: k.color, display: "grid", placeItems: "center" }}><Icon name={k.icon} size={14}/></div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-0)" }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--fg-1)", marginBottom: 2 }}>{k.sub}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{k.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "ext", title: "Browser extension", sub: "1-click on any URL", stat: "342 this month" },
          { icon: "bell", title: "Slack / Teams bot", sub: "/cin capture", stat: "124 this month" },
          { icon: "sparkles", title: "Email forwarding", sub: "signals@…", stat: "88 this month" },
          { icon: "user", title: "Voice note (mobile)", sub: "Talk, get draft", stat: "21 this month" },
        ].map(c => (
          <div key={c.title} className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-3)", color: "var(--accent-2)", display: "grid", placeItems: "center" }}><Icon name={c.icon} size={14}/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "var(--fg-0)" }}>{c.title}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{c.sub} · {c.stat}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8 }}>My campaigns</span>
        <div style={{ display: "flex", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: 2 }}>
          {["all","active","open","closed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 10px", fontSize: 11, textTransform: "capitalize", borderRadius: 4, background: filter === f ? "var(--bg-3)" : "transparent", color: filter === f ? "var(--fg-0)" : "var(--fg-3)" }}>{f}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{campaigns.length} campaigns</div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 140px 110px 180px", padding: "10px 16px", borderBottom: "1px solid var(--line-1)", fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Campaign</span><span>Owner</span><span>Status</span><span>Signals / Clusters</span><span>AI proposed</span><span style={{ textAlign: "right" }}>Closes</span>
        </div>
        {campaigns.map(c => (
          <div key={c.id} onClick={() => onOpen(c.id)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 140px 110px 180px", padding: "14px 16px", borderBottom: "1px solid var(--line-1)", cursor: "pointer", alignItems: "center" }}
               onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
               onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <div style={{ color: "var(--fg-0)", fontSize: 13.5, fontWeight: 500 }}>{c.title}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {c.tags.map(t => <span key={t} className="chip"><Icon name="hash" size={10}/>{t}</span>)}
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{c.owner}</span>
            <span className={"chip " + (statusColor[c.status] || "")}><span className={"dot " + (statusColor[c.status] || "accent")}/>{c.status}</span>
            <div className="mono" style={{ fontSize: 12, color: "var(--fg-1)" }}>{c.signals} · <span style={{ color: "var(--fg-3)" }}>{c.clusters} clusters</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {c.proposed > 0 && <span className="chip ai mono"><Icon name="sparkles" size={10}/>{c.proposed} new</span>}
            </div>
            <span className="mono" style={{ fontSize: 12, color: c.status === "Closed" ? "var(--fg-3)" : "var(--fg-2)", textAlign: "right" }}>{c.closes}</span>
          </div>
        ))}
      </div>
      <button
        className="btn"
        style={{ background: '#22C55E', color: '#fff', border: 'none', width: '100%', padding: '12px 16px', marginTop: 12, fontSize: 13, fontWeight: 600 }}
        onClick={() => setNewCampaignOpen(true)}
      >
        + Neue Kampagne
      </button>
      <NewCampaignDialog open={newCampaignOpen} onClose={() => setNewCampaignOpen(false)} onCreated={(c) => {}} />
    </div>
  );
};

export const CampaignWorkspace = ({ campaigns, ideas, clusters, participants, campaignId, onBack, onOpenCapture, onOpenCluster }) => {
  const c = campaigns.find(x => x.id === campaignId) || campaigns[0];
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [filter, setFilter] = useState("all");

  const filteredIdeas = filter === "all" ? ideas : ideas.filter(i => i.cluster === filter);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid var(--line-1)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)" }}>
          <button onClick={onBack} style={{ color: "var(--fg-3)", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8 }}><Icon name="arrowLeft" size={12}/> All campaigns</button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span className="chip ok"><span className="dot ok"/>{c.status}</span>
                <span className="chip mono">Create · open collection</span>
                <span className="chip mono"><Icon name="clock" size={10}/>{c.closes}</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "var(--fg-0)" }}>{c.title}</h1>
              <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 13 }}>{c.question}</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn sm"><Icon name="link" size={12}/> Share link</button>
              <button className="btn ai sm" onClick={onOpenCapture}><Icon name="sparkles" size={12}/> Capture idea</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14 }}>
            {[
              ["Signals", c.signals],
              ["Clusters", c.clusters],
              ["AI-proposed trends", c.proposed, true],
              ["Participants", `${c.participants}`, false, `${c.external} external`],
              ["Momentum", "↑", false, "+42 last 24 h"],
            ].map(([label, val, ai, sub], i) => (
              <div key={i} style={{ padding: "8px 10px", background: "var(--bg-1)", borderRadius: 6, border: "1px solid var(--line-1)" }}>
                <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                  <span className={ai ? "ai-shimmer" : "mono"} style={{ fontSize: 18, fontWeight: 600, color: ai ? undefined : "var(--fg-0)" }}>{val}</span>
                  {sub && <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{sub}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 20, borderBottom: "1px solid var(--line-1)", background: "var(--bg-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-0)" }}>Live cluster map</span>
            <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/>updating every 30 s</span>
            <div style={{ flex: 1 }}/>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{clusters.length} clusters · {ideas.length} ideas</span>
          </div>
          <ClusterMap clusters={clusters} selected={selectedCluster} onSelect={setSelectedCluster} onOpenCluster={onOpenCluster}/>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderBottom: "1px solid var(--line-1)" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-0)" }}>Idea stream</span>
          <div style={{ display: "flex", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: 2 }}>
            <button onClick={() => setFilter("all")} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 4, background: filter === "all" ? "var(--bg-3)" : "transparent", color: filter === "all" ? "var(--fg-0)" : "var(--fg-3)" }}>All</button>
            {clusters.map(cl => (
              <button key={cl.id} onClick={() => setFilter(cl.id)} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 4, background: filter === cl.id ? "var(--bg-3)" : "transparent", color: filter === cl.id ? "var(--fg-0)" : "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: cl.color }}/>{cl.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <button className="btn ghost sm"><Icon name="sort" size={12}/> newest</button>
        </div>

        <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
          {filteredIdeas.map(i => {
            const cluster = clusters.find(x => x.id === i.cluster);
            return (
              <div key={i.id} className="card" style={{ padding: 14, marginTop: 12, borderLeft: `3px solid ${cluster?.color || 'var(--line-2)'}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: i.role === "agent" ? "linear-gradient(135deg,#A78BFA,#3B82F6)" : "var(--bg-3)", display: "grid", placeItems: "center", fontSize: 10, color: "white", fontWeight: 600 }}>
                    {i.role === "agent" ? <Icon name="sparkles" size={11}/> : i.author.split(" ").map(x => x[0]).join("").slice(0,2)}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{i.author}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>· {i.role}</span>
                  <span className="chip mono" style={{ fontSize: 10 }}>{i.lang}</span>
                  <span className="chip">{i.type}</span>
                  <div style={{ flex: 1 }}/>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{i.ago}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--fg-0)", lineHeight: 1.5, marginBottom: 10 }}>{i.text}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {cluster && <button onClick={() => onOpenCluster(cluster.id)} className="chip" style={{ background: cluster.color + "1a", borderColor: cluster.color + "55", color: cluster.color }}>
                    <Icon name="sparkles" size={10}/> {cluster.label}
                  </button>}
                  {i.url && <a style={{ color: "var(--accent-2)", fontSize: 11 }} className="mono">{i.url}</a>}
                  <div style={{ flex: 1 }}/>
                  <button className="btn ghost sm" style={{ height: 24 }}>👍 <span className="mono">{i.reactions.relevant}</span></button>
                  <button className="btn ghost sm" style={{ height: 24 }}>✨ <span className="mono">{i.reactions.surprising}</span></button>
                  <button className="btn ghost sm" style={{ height: 24 }}>⚠ <span className="mono">{i.reactions.disagree}</span></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-1)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="ai-shimmer" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>AI Proposals</div>
            <span className="chip ai mono" style={{ fontSize: 10 }}>{clusters.filter(c => c.proposed).length} awaiting</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>Clusters that have stabilised enough to become tracked trends.</div>
        </div>
        <div className="scroll" style={{ flex: 1, overflow: "auto", padding: 14 }}>
          {clusters.filter(c => c.proposed).map(cl => (
            <div key={cl.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: cl.color }}/>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>cluster · {ideas.filter(i => i.cluster === cl.id).length} ideas</span>
                <div style={{ flex: 1 }}/>
                <span className="mono" style={{ fontSize: 11, color: cl.confidence > 0.85 ? "#34D399" : "#F59E0B" }}>{(cl.confidence * 100).toFixed(0)}% conf.</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-0)", marginBottom: 4 }}>{cl.trendName}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginBottom: 10 }}>Cluster theme: <i>{cl.label}</i></div>

              <div style={{ padding: 10, background: "var(--bg-2)", borderRadius: 6, border: "1px solid var(--line-1)", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--ai)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>AI-drafted trend card</div>
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "4px 8px", fontSize: 11.5 }}>
                  <span style={{ color: "var(--fg-3)" }}>Dimension</span><span><DimensionDot dim="Technology"/> Technology</span>
                  <span style={{ color: "var(--fg-3)" }}>Horizon</span><span className="mono">H2 · 2–5 yrs</span>
                  <span style={{ color: "var(--fg-3)" }}>Stage</span><StageBadge stage="Emerging"/>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn ai sm" onClick={() => onOpenCluster(cl.id)}><Icon name="eye" size={12}/> Review</button>
                <button className="btn primary sm"><Icon name="check" size={12}/> Accept</button>
                <div style={{ flex: 1 }}/>
                <button className="btn ghost sm"><Icon name="x" size={12}/></button>
              </div>
            </div>
          ))}

          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, margin: "18px 0 10px" }}>Participants ({participants.filter(p => p.contrib !== null).length + 41})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {participants.map((p, i) => (
              <div key={i} title={`${p.name}${p.contrib ? ' · ' + p.contrib + ' contributions' : ''}`}
                style={{ width: 30, height: 30, borderRadius: 999, background: p.color, color: "white", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)" }}>
                {p.initials || "+41"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClusterMap = ({ clusters, selected, onSelect, onOpenCluster }) => {
  const W = 780, H = 260;
  return (
    <div style={{ position: "relative", width: "100%", height: H, borderRadius: 10, overflow: "hidden", background: "radial-gradient(ellipse at 30% 30%, rgba(59,130,246,0.08), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(167,139,250,0.08), transparent 60%), var(--bg-0)", border: "1px solid var(--line-1)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map(g => (
          <g key={g}>
            <line x1={W*g} x2={W*g} y1="0" y2={H} stroke="var(--line-1)" strokeDasharray="2 6"/>
            <line y1={H*g} y2={H*g} x1="0" x2={W} stroke="var(--line-1)" strokeDasharray="2 6"/>
          </g>
        ))}
        {clusters.map(cl => {
          const cx = cl.x * W, cy = cl.y * H;
          const r = 16 + cl.size * 6;
          const isSel = selected === cl.id;
          return (
            <g key={cl.id} style={{ cursor: "pointer" }}
               onClick={() => onSelect(cl.id)}
               onDoubleClick={() => onOpenCluster(cl.id)}>
              <circle cx={cx} cy={cy} r={r + 14} fill={cl.color} opacity="0.08"/>
              <circle cx={cx} cy={cy} r={r + 6} fill={cl.color} opacity="0.18"/>
              <circle cx={cx} cy={cy} r={r} fill={cl.color} fillOpacity={isSel ? 0.9 : 0.55} stroke={isSel ? "#fff" : cl.color} strokeWidth={isSel ? 2 : 1}/>
              <text x={cx} y={cy + 3} fontSize="11" fill="#0B1426" fontWeight="700" textAnchor="middle">{cl.size}</text>
              <text x={cx} y={cy + r + 14} fontSize="11" fill="var(--fg-1)" textAnchor="middle">{cl.label}</text>
              {cl.proposed && (
                <g transform={`translate(${cx + r - 4}, ${cy - r - 4})`}>
                  <circle r="8" fill="var(--ai)"/>
                  <text fontSize="9" fill="#1a1033" textAnchor="middle" y="3" fontWeight="700">★</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 12, bottom: 10, display: "flex", gap: 8, fontSize: 10.5, color: "var(--fg-3)" }} className="mono">
        <span>◉ size = # ideas</span><span>✶ = AI proposes as trend</span><span>double-click to review</span>
      </div>
    </div>
  );
};

export const CaptureDialog = ({ open, onClose }) => {
  const [mode, setMode] = useState("paste");
  const [text, setText] = useState("Zurich cantonal authority approved a 40-vehicle Waymo pilot starting autumn 2026 — first public-road autonomous fleet in CH.");

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: 720, maxHeight: "86vh", display: "flex", flexDirection: "column", background: "var(--bg-1)", overflow: "hidden", boxShadow: "var(--shadow-pop)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#A78BFA,#3B82F6)", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={14}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-0)" }}>Capture a signal</div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>Any input → AI structures it → you confirm</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div style={{ display: "flex", padding: "0 18px", borderBottom: "1px solid var(--line-1)", gap: 0 }}>
          {[["paste","Paste / describe"],["url","From URL"],["pdf","Upload PDF"],["voice","Voice note"]].map(([k,l]) => (
            <button key={k} onClick={() => setMode(k)} style={{ padding: "10px 14px", fontSize: 12.5, color: mode === k ? "var(--fg-0)" : "var(--fg-3)", borderBottom: "2px solid " + (mode === k ? "var(--ai)" : "transparent"), marginBottom: -1 }}>{l}</button>
          ))}
        </div>

        <div className="scroll" style={{ padding: 18, overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Your input</div>
            {mode === "paste" && (
              <textarea className="input" style={{ width: "100%", height: 220, padding: 12, resize: "none", fontFamily: "var(--font-sans)" }} value={text} onChange={e => setText(e.target.value)} placeholder="Paste a URL, a quote, a headline, or describe something you heard…"/>
            )}
            {mode === "url" && (
              <div>
                <input className="input" style={{ width: "100%", height: 36 }} placeholder="https://…"/>
                <div className="mono" style={{ marginTop: 10, fontSize: 11, color: "var(--fg-3)" }}>We'll fetch title, source, publish date and summary.</div>
              </div>
            )}
            {mode === "pdf" && (
              <div style={{ border: "1px dashed var(--line-3)", borderRadius: 8, padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>
                <Icon name="download" size={22}/>
                <div style={{ marginTop: 8 }}>Drop a PDF here — AI extracts signals page by page.</div>
              </div>
            )}
            {mode === "voice" && (
              <div style={{ border: "1px solid var(--line-2)", borderRadius: 8, padding: 22, textAlign: "center" }}>
                <div style={{ width: 52, height: 52, margin: "0 auto 12px", borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>
                </div>
                <div style={{ color: "var(--fg-1)" }}>Tap to start · speak up to 2 min</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 6 }}>Whisper → Claude → structured draft</div>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Route to campaign</div>
              <select className="input" style={{ width: "100%" }}>
                <option>Was verändert Mobilität bis 2030? (active)</option>
                <option>— no campaign, route to Explorer inbox —</option>
                <option>AI at work</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8 }}>AI draft</span>
              <span className="chip ai mono" style={{ fontSize: 10 }}>Claude Haiku · 1.4 s</span>
              <div style={{ flex: 1 }}/>
              <button className="btn ghost sm"><Icon name="bolt" size={11}/> regen</button>
            </div>
            <div className="card" style={{ padding: 14, background: "var(--bg-2)", borderColor: "rgba(167,139,250,0.3)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", rowGap: 10, columnGap: 10, fontSize: 12 }}>
                <span style={{ color: "var(--fg-3)" }}>Title</span>
                <span style={{ color: "var(--fg-0)", fontWeight: 500 }}>Zurich launches 40-vehicle Waymo autonomous pilot</span>

                <span style={{ color: "var(--fg-3)" }}>Type</span>
                <span><span className="chip">news</span></span>

                <span style={{ color: "var(--fg-3)" }}>Dimension</span>
                <span><DimensionDot dim="Technology"/> Technology <span className="chip ai mono" style={{ fontSize: 10 }}>94%</span></span>

                <span style={{ color: "var(--fg-3)" }}>Matches cluster</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "#60A5FA" }}/>
                  Autonomous fleets go live <span className="chip ai mono" style={{ fontSize: 10 }}>0.91</span>
                </span>

                <span style={{ color: "var(--fg-3)" }}>Duplicates</span>
                <span style={{ color: "var(--fg-2)" }}>None. Closest: <span className="mono" style={{ color: "var(--fg-1)" }}>signal #s12</span> (0.44)</span>

                <span style={{ color: "var(--fg-3)" }}>Tags</span>
                <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4 }}>{["autonomous","fleet","zurich","waymo","policy"].map(t => <span key={t} className="chip"><Icon name="hash" size={9}/>{t}</span>)}</span>

                <span style={{ color: "var(--fg-3)" }}>Summary</span>
                <span style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>Cantonal authority granted public-road permit for 40 Waymo-licensed vehicles. First in Switzerland, autumn 2026 launch.</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <button className="btn primary" onClick={onClose}><Icon name="check" size={13}/> Add to campaign</button>
              <button className="btn" onClick={onClose}>Edit fields</button>
              <div style={{ flex: 1 }}/>
              <button className="btn ghost sm" onClick={onClose}>Save as draft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClusterReview = ({ open, onClose, clusters, ideas, clusterId }) => {
  if (!open) return null;
  const cl = clusters.find(c => c.id === clusterId) || clusters[0];
  const clIdeas = ideas.filter(i => i.cluster === cl.id);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: 860, maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--bg-1)", overflow: "hidden", boxShadow: "var(--shadow-pop)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 14, height: 14, borderRadius: 999, background: cl.color }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-0)" }}>Review cluster · {cl.label}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{clIdeas.length} ideas · confidence {(cl.confidence*100).toFixed(0)}% · AI-proposed trend</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll" style={{ padding: 18, overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Proposed trend</div>
            <div className="card" style={{ padding: 16, background: "linear-gradient(180deg, rgba(167,139,250,0.07), transparent)", borderColor: "rgba(167,139,250,0.3)" }}>
              <input className="input" defaultValue={cl.trendName || "Autonomous Fleets at Scale"} style={{ width: "100%", fontSize: 15, fontWeight: 600, height: 36, background: "var(--bg-2)" }}/>

              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", rowGap: 10, columnGap: 10, fontSize: 12, marginTop: 14 }}>
                <span style={{ color: "var(--fg-3)" }}>Dimension</span><span><DimensionDot dim="Technology"/> Technology</span>
                <span style={{ color: "var(--fg-3)" }}>Horizon</span><span className="mono">H2 · 2–5 yrs</span>
                <span style={{ color: "var(--fg-3)" }}>Stage</span><StageBadge stage="Emerging"/>
                <span style={{ color: "var(--fg-3)" }}>Impact</span><BarMeter value={76} color="var(--accent)"/>
                <span style={{ color: "var(--fg-3)" }}>Novelty</span><BarMeter value={64} color="var(--ai)"/>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10.5, color: "var(--ai)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>AI-drafted summary</div>
                <div style={{ fontSize: 12.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                  Robotaxi pilots are transitioning from research to commercial operations. Waymo at 1M weekly rides, Zurich permitting 40 vehicles, VW divesting ride-hailing — incumbents are repositioning as infrastructure providers while pure-play AV firms take consumer surface.
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                <button className="btn primary" onClick={onClose}><Icon name="check" size={13}/> Create trend</button>
                <button className="btn" onClick={onClose}>Merge into existing…</button>
                <div style={{ flex: 1 }}/>
                <button className="btn ghost" onClick={onClose}><Icon name="x" size={12}/> Reject cluster</button>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Evidence ({clIdeas.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {clIdeas.map(i => (
                <div key={i.id} className="card" style={{ padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, color: "var(--fg-1)" }}>{i.author}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>· {i.role}</span>
                    <div style={{ flex: 1 }}/>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{i.ago}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-1)", lineHeight: 1.5 }}>{i.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
