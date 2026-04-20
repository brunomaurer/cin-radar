// AI Scout panel + Tweaks + Projects/Library/Analytics stubs
import { Fragment, useState, useEffect } from 'react';
import { Icon, BarMeter, Sparkline, StageBadge, DimensionDot } from './ui.jsx';
import { useLocalStorage } from './useLocalStorage.js';
import { conceptsApi, signalsApi, crawlApi, trendsApi } from './api.js';

export const AIScout = ({ open, onClose, data, t }) => {
  const [tab, setTab] = useState("inbox");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [dismissedIds, setDismissedIds] = useLocalStorage("cin-ai-dismissed", []);
  const [realSignals, setRealSignals] = useState([]);
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => {
    if (!open) return;
    signalsApi.list()
      .then(sigs => {
        const aiSignals = (Array.isArray(sigs) ? sigs : []).filter(s => s.channel === 'ai-scout');
        setRealSignals(aiSignals);
        if (aiSignals.length > 0) {
          const latest = aiSignals.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
          setLastRun(latest.createdAt);
        }
      })
      .catch(() => {});
  }, [open, running]);

  // Combine mock aiInbox with real ai-scout signals for display
  const mockItems = data.aiInbox.filter(n => !dismissedIds.includes(n.id));
  const realItems = realSignals.filter(s => !dismissedIds.includes(s.id)).map(s => ({
    id: s.id,
    title: s.title,
    source: s.source || '',
    date: s.createdAt ? new Date(s.createdAt).toLocaleDateString('de-CH') : '',
    confidence: s.confidence || 0.7,
    lang: 'en',
    new: true,
    matchedTrend: s.trendId ? `Trend #${s.trendId}` : null,
    proposedTrend: s.title,
  }));
  const items = [...realItems, ...mockItems];

  if (!open) return null;

  const handleAccept = id => setDismissedIds(ids => [...ids, id]);
  const handleDismiss = id => setDismissedIds(ids => [...ids, id]);
  const handleReset = () => setDismissedIds([]);

  const runScan = async () => {
    setRunning(true);
    try {
      const allTrends = await trendsApi.list().then(r => r.trends || []).catch(() => []);
      const subscribed = allTrends.filter(tr => tr.subscribed || tr.stage === 'Emerging' || tr.stage === 'Trend');
      await Promise.allSettled(subscribed.slice(0, 10).map(tr => crawlApi.crawl(tr)));
    } catch (e) {
      // silent
    } finally {
      setRunning(false);
    }
  };

  const lastRunLabel = lastRun
    ? (() => { const ms = Date.now() - new Date(lastRun).getTime(); return ms < 60000 ? 'just now' : ms < 3600000 ? Math.floor(ms/60000) + ' min ago' : Math.floor(ms/3600000) + ' h ago'; })()
    : '12 min ago';

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, height: "100%", background: "var(--bg-1)", borderLeft: "1px solid var(--line-2)",
        display: "flex", flexDirection: "column", boxShadow: "var(--shadow-pop)"
      }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #A78BFA, #3B82F6)", display: "grid", placeItems: "center" }}>
            <Icon name="sparkles" size={16}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--fg-0)" }}>AI Scout</div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>monitoring 214 sources · last run {lastRunLabel}</div>
          </div>
          <button className="btn sm" onClick={runScan} disabled={running}>
            {running ? <><span className="spin" style={{ display: "inline-block" }}><Icon name="sparkles" size={12}/></span> Scanning…</> : <><Icon name="bolt" size={12}/> Run scan</>}
          </button>
          <button className="btn icon ghost" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div style={{ display: "flex", padding: "0 18px", borderBottom: "1px solid var(--line-1)", gap: 2 }}>
          {[["inbox", `${t("ai_inbox")} · ${items.length}`], ["capture", t("capture_with_ai")], ["sources", "Sources"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "10px 12px", fontSize: 12.5, color: tab === k ? "var(--fg-0)" : "var(--fg-3)",
              borderBottom: "2px solid " + (tab === k ? "var(--ai)" : "transparent"), marginBottom: -1
            }}>{l}</button>
          ))}
        </div>

        <div className="scroll" style={{ flex: 1, overflow: "auto" }}>
          {tab === "inbox" && (
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 11.5, color: "var(--fg-2)", padding: "6px 4px 12px" }}>
                {items.length} {t("pending_review")}. Confidence ≥ 0.60 surfaced automatically.
              </div>
              {items.map(n => (
                <div key={n.id} className="card" style={{ padding: 14, marginBottom: 10, borderColor: n.new ? "rgba(167,139,250,0.35)" : "var(--line-1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span className="mono" style={{ color: "var(--fg-3)", fontSize: 10.5 }}>{n.date}</span>
                    <span className="chip mono" style={{ fontSize: 10 }}>{n.lang}</span>
                    {n.new && <span className="chip ai mono" style={{ fontSize: 10 }}>NEW CLUSTER</span>}
                    <div style={{ flex: 1 }}/>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{t("confidence")}</span>
                    <span className="mono" style={{ fontSize: 12, color: n.confidence > 0.85 ? "#34D399" : "#F59E0B" }}>{(n.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--fg-0)", marginBottom: 4, lineHeight: 1.4 }}>{n.title}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 10 }}>{n.source}</div>
                  <div style={{ padding: 10, background: "var(--bg-2)", borderRadius: 6, border: "1px solid var(--line-1)", marginBottom: 10 }}>
                    <div style={{ fontSize: 10.5, color: "var(--ai)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>AI recommendation</div>
                    {n.matchedTrend
                      ? <div style={{ fontSize: 12, color: "var(--fg-1)" }}>{t("link_to_trend")}: <b style={{ color: "var(--fg-0)" }}>{n.matchedTrend}</b></div>
                      : <div style={{ fontSize: 12, color: "var(--fg-1)" }}>{t("create_trend")}: <b style={{ color: "var(--fg-0)" }}>{n.proposedTrend}</b></div>
                    }
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn ai sm" onClick={() => handleAccept(n.id)}><Icon name="check" size={12}/> {t("accept")}</button>
                    <button className="btn sm"><Icon name="link" size={12}/> Change link</button>
                    <div style={{ flex: 1 }}/>
                    <button className="btn ghost sm" onClick={() => handleDismiss(n.id)}><Icon name="x" size={12}/> {t("dismiss")}</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 12 }}>
                  Inbox clear ✨
                  <div style={{ marginTop: 12 }}>
                    <button className="btn sm" onClick={handleReset}>Inbox zurücksetzen</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "capture" && (
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 12.5, color: "var(--fg-1)", marginBottom: 10 }}>Paste a URL, drop a PDF, or describe a signal in natural language.</div>
              <textarea className="input" style={{ width: "100%", height: 120, padding: 10, resize: "vertical", fontFamily: "var(--font-sans)" }}
                value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. https://nature.com/…   or   'New EU directive on synthetic biology published today, affects textile industry …'"/>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button className="btn ai"><Icon name="sparkles" size={13}/> Generate {t("ai_draft")}</button>
                <button className="btn ghost"><Icon name="ext" size={13}/> Upload PDF</button>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{t("ai_draft")} — preview</div>
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", rowGap: 8, columnGap: 10, fontSize: 12.5 }}>
                    {[
                      ["Title", "Synthetic leather from precision fermentation"],
                      ["Dimension", <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><DimensionDot dim="Technology"/>Technology <span className="chip ai mono" style={{ fontSize: 9 }}>92%</span></span>],
                      ["Horizon", <span className="mono">H2 · 2–5 yrs <span className="chip ai mono" style={{ fontSize: 9 }}>87%</span></span>],
                      ["Stage", <StageBadge stage="Emerging"/>],
                      ["Tags", <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>{["biotech","materials","fashion"].map(x => <span key={x} className="chip">{x}</span>)}</span>],
                      ["Summary", <span style={{ color: "var(--fg-2)" }}>AI extracted a 3-sentence summary from the source — editable.</span>],
                    ].map(([k, v]) => <Fragment key={k}><span style={{ color: "var(--fg-3)" }}>{k}</span><span>{v}</span></Fragment>)}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                    <button className="btn primary sm"><Icon name="check" size={12}/> Create trend</button>
                    <button className="btn sm">Edit fields</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "sources" && (
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--fg-2)", marginBottom: 12 }}>Feeds the AI Scout monitors in the background.</div>
              {[
                { name: "Google Scholar", type: "Research", freq: "hourly", status: "ok" },
                { name: "EUR-Lex", type: "Policy", freq: "daily", status: "ok" },
                { name: "TechCrunch", type: "Media", freq: "15 min", status: "ok" },
                { name: "Reuters", type: "Media", freq: "15 min", status: "ok" },
                { name: "Custom RSS · 34 feeds", type: "Mixed", freq: "hourly", status: "warn" },
                { name: "Internal PDF drops", type: "Upload", freq: "manual", status: "ok" },
              ].map(s => (
                <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line-1)" }}>
                  <div>
                    <div style={{ fontSize: 12.5, color: "var(--fg-0)" }}>{s.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{s.type} · every {s.freq}</div>
                  </div>
                  <span className={"dot " + (s.status === "ok" ? "ok" : "warn")}/>
                  <button className="btn ghost sm"><Icon name="settings" size={12}/></button>
                </div>
              ))}
              <button className="btn" style={{ marginTop: 12 }}><Icon name="plus" size={12}/> Add source</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Projects = ({ data }) => (
  <div style={{ padding: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
      {data.projects.map(p => {
        const trend = data.trends.find(x => x.id === p.trends[0]);
        return (
          <div key={p.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span className="chip">{p.stage}</span>
              <div style={{ flex: 1 }}/>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Lead · {p.lead}</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--fg-0)", fontWeight: 500, marginBottom: 12 }}>{p.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              {trend && <><DimensionDot dim={trend.dim}/><span style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{trend.title}</span></>}
            </div>
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

const KNOWLEDGE_SECTIONS = {
  sources: {
    l: "Sources", icon: "book", desc: "Reports, studies and URLs your analysts cite in trend cards.",
    items: [
      { t: "McKinsey · The state of AI 2026", m: "Report · 68 p · cited in 14 trends", tag: "external" },
      { t: "IPCC AR7 synthesis draft", m: "PDF · cited in 8 trends", tag: "external" },
      { t: "EU AI Act — consolidated text", m: "Regulation · cited in 5 trends", tag: "regulatory" },
      { t: "Stanford HAI index 2026", m: "PDF · cited in 11 trends", tag: "external" },
      { t: "Our procurement interviews 2025", m: "Internal · 12 transcripts", tag: "internal" },
    ],
  },
  methods: {
    l: "Methods & templates", icon: "grid", desc: "Reusable templates for campaigns, scoring and reporting.",
    items: [
      { t: "Campaign brief template", m: "DOCX · 2 pages", tag: "template" },
      { t: "Signal capture form", m: "Used 1,840 × · 2026", tag: "form" },
      { t: "Scoring rubric — impact × maturity", m: "v4 · Apr 2026", tag: "rubric" },
      { t: "Scenario writing canvas", m: "A3 template", tag: "template" },
      { t: "Quarterly briefing deck", m: "PPTX · 18 slides", tag: "template" },
    ],
  },
  glossary: {
    l: "Glossary", icon: "hash", desc: "Shared vocabulary — so Procurement, R&D and Strategy mean the same thing.",
    items: [
      { t: "Dimension", m: "One of 6 strategic lenses (Tech, Society, Regulation, Market, Environment, Geo)", tag: "core" },
      { t: "Signal", m: "Single observable data point — URL, quote, study", tag: "core" },
      { t: "Trend", m: "Validated pattern across ≥ 3 signals and ≥ 2 sources", tag: "core" },
      { t: "Horizon", m: "H1 0-2y · H2 2-5y · H3 5-10y", tag: "core" },
      { t: "Impact score", m: "1-100 composite of team fit + AI market rate", tag: "scoring" },
    ],
  },
  exports: {
    l: "Exports & reports", icon: "download", desc: "Briefings shipped out to exec, board, partners.",
    items: [
      { t: "Q1 2026 · Board radar briefing", m: "PPTX · shared with 14", tag: "briefing" },
      { t: "Bio-materials deep-dive", m: "PDF · Apr 2026", tag: "report" },
      { t: "CEO monthly foresight note · March", m: "PDF · 4 pages", tag: "briefing" },
      { t: "Partner brief — Climate R&D alliance", m: "PDF · shared externally", tag: "external" },
    ],
  },
  prompts: {
    l: "AI prompts", icon: "sparkles", desc: "Versioned prompts that power Scout, Cluster, and Spec — editable by Admins.",
    items: [
      { t: "scout.extract_signal", m: "v1.4 · 612 runs / mo · 94% accepted", tag: "production" },
      { t: "cluster.semantic_group", m: "v2.0 · 204 clusters / mo", tag: "production" },
      { t: "validate.duplicate_check", m: "v1.1 · 48 checks / mo", tag: "production" },
      { t: "rate.market_momentum", m: "v0.9 · beta", tag: "beta" },
      { t: "initiative.draft_spec", m: "v1.0 · 22 runs", tag: "production" },
      { t: "trend.summarize_card", m: "v2.2 · 1,340 runs / mo", tag: "production" },
    ],
  },
};

export const Library = () => {
  const [sec, setSec] = useState("sources");
  const [concepts, setConcepts] = useState([]);
  const entries = Object.entries(KNOWLEDGE_SECTIONS);
  const active = KNOWLEDGE_SECTIONS[sec];

  useEffect(() => { conceptsApi.list().then(r => setConcepts(r.concepts || [])).catch(() => {}); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--fg-0)" }}>Knowledge</h1>
        <span className="chip mono">sources · methods · glossary · exports · prompts</span>
        <div style={{ flex: 1 }}/>
        <button className="btn sm"><Icon name="plus" size={12}/> New entry</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", flex: 1, minHeight: 0 }}>
        <div style={{ borderRight: "1px solid var(--line-1)", padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {entries.map(([k, v]) => (
            <button key={k} onClick={() => setSec(k)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 6,
              background: sec === k ? "var(--bg-3)" : "transparent",
              color: sec === k ? "var(--fg-0)" : "var(--fg-2)",
              fontSize: 12.5, textAlign: "left"
            }}>
              <Icon name={v.icon} size={14}/>
              <span style={{ flex: 1 }}>{v.l}</span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{k === "exports" ? concepts.filter(c => c.hasArtefacts).length : v.items.length}</span>
            </button>
          ))}
          <div style={{ height: 1, background: "var(--line-1)", margin: "8px 0" }}/>
          <div style={{ fontSize: 11, color: "var(--fg-3)", padding: "6px 10px", lineHeight: 1.5 }}>
            Knowledge items can be linked from any trend card, campaign or initiative.
          </div>
        </div>
        <div className="scroll" style={{ padding: 20, overflow: "auto" }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{active.l}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginBottom: 14, maxWidth: 560 }}>{active.desc}</div>
          {sec === "exports" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {concepts.filter(c => c.hasArtefacts).length === 0 && (
                <div style={{ gridColumn: "1/-1", padding: 20, color: "var(--fg-3)", fontSize: 12 }}>
                  Noch keine generierten Artefakte — erstelle eine Initiative und generiere Artefakte.
                </div>
              )}
              {concepts.filter(c => c.hasArtefacts).map(c => (
                <div key={c.id} className="card" style={{ padding: '8px 12px', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-0)' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                    {new Date(c.updatedAt).toLocaleDateString('de-CH')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {active.items.map(it => (
                <div key={it.t} className="card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span className="chip mono" style={{ fontSize: 10 }}>{it.tag}</span>
                    {sec === "prompts" && <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={9}/>prompt</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--fg-0)", fontWeight: 500, marginBottom: 4, fontFamily: sec === "prompts" ? "var(--mono)" : "inherit" }}>{it.t}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{it.m}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Analytics = ({ data }) => (
  <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
    {[
      { label: "Tracked trends", val: data.trends.length, delta: "+4 this quarter" },
      { label: "Active signals", val: data.trends.reduce((a,t) => a + t.signals, 0).toLocaleString(), delta: "+612 (30d)" },
      { label: "AI-captured %", val: "74%", delta: "+18 pt YoY" },
      { label: "Avg. time-to-trend", val: "4.2 w", delta: "↓ 31%" },
    ].map(k => (
      <div key={k.label} className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8 }}>{k.label}</div>
        <div style={{ fontSize: 24, color: "var(--fg-0)", fontWeight: 600, marginTop: 6 }} className="mono">{k.val}</div>
        <div style={{ fontSize: 11, color: "#34D399", marginTop: 4 }} className="mono">{k.delta}</div>
      </div>
    ))}
    <div className="card" style={{ padding: 16, gridColumn: "span 4" }}>
      <div style={{ fontWeight: 600, color: "var(--fg-0)", marginBottom: 12 }}>Signal volume by dimension (12 months)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
        {data.dimensions.map(d => {
          const trends = data.trends.filter(t => t.dim === d);
          const pts = Array.from({ length: 12 }, (_, i) => 10 + Math.sin(i + d.length) * 8 + i * 2 + trends.length * 4);
          return (
            <div key={d}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><DimensionDot dim={d}/><span style={{ fontSize: 12, color: "var(--fg-1)" }}>{d}</span></div>
              <Sparkline points={pts} width={160} height={48} color="var(--accent-2)"/>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 4 }}>{trends.length} trends · {trends.reduce((a,t) => a + t.signals, 0)} sig.</div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const TweaksPanel = ({ tweaks, setTweaks, onClose }) => (
  <div style={{ position: "fixed", right: 18, bottom: 18, width: 280, background: "var(--bg-2)", border: "1px solid var(--line-3)", borderRadius: 10, boxShadow: "var(--shadow-pop)", zIndex: 40, overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--line-2)" }}>
      <span style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13 }}>Tweaks</span>
      <div style={{ flex: 1 }}/>
      <button onClick={onClose} className="btn ghost icon sm"><Icon name="x" size={12}/></button>
    </div>
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
      <TweakRow label="Density" options={[["compact","Compact"],["regular","Regular"],["cozy","Cozy"]]} value={tweaks.density} onChange={v => setTweaks({ ...tweaks, density: v })}/>
      <TweakRow label="Accent" options={[["blue","Blue"],["violet","Violet"],["teal","Teal"],["amber","Amber"]]} value={tweaks.accent} onChange={v => setTweaks({ ...tweaks, accent: v })}/>
      <TweakRow label="Sidebar" options={[["icons","Icons"],["full","Full"]]} value={tweaks.sidebar} onChange={v => setTweaks({ ...tweaks, sidebar: v })}/>
      <TweakRow label="AI prominence" options={[["subtle","Subtle"],["ambient","Ambient"],["prominent","Prominent"]]} value={tweaks.ai} onChange={v => setTweaks({ ...tweaks, ai: v })}/>
    </div>
  </div>
);

const TweakRow = ({ label, options, value, onChange }) => (
  <div>
    <div style={{ fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
    <div style={{ display: "flex", background: "var(--bg-1)", borderRadius: 6, padding: 2, border: "1px solid var(--line-2)" }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{
          flex: 1, padding: "5px 8px", fontSize: 11, borderRadius: 4,
          background: value === v ? "var(--bg-3)" : "transparent",
          color: value === v ? "var(--fg-0)" : "var(--fg-3)"
        }}>{l}</button>
      ))}
    </div>
  </div>
);
