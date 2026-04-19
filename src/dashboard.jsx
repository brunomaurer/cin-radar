// Dashboard — personalized overview
import { Icon, BarMeter, Sparkline, StageBadge, DimensionDot } from './ui.jsx';

export const Dashboard = ({ data, campaignsData, onGo, onOpenTrend, onOpenCapture, onOpenTweaks, onOpenAI }) => {
  const topTrends = [...data.trends].sort((a,b) => b.impact - a.impact).slice(0, 5);
  const hotCampaign = campaignsData.campaigns[0];

  return (
    <div className="scroll" style={{ padding: 20, overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 1 }}>Tuesday · 19 Apr 2026</div>
          <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, color: "var(--fg-0)" }}>Good morning, Sarah.</h1>
          <p style={{ margin: "4px 0 0", color: "var(--fg-2)", fontSize: 13.5 }}>
            <span className="ai-shimmer" style={{ fontWeight: 600 }}>AI Scout</span> has <b style={{ color: "var(--fg-0)" }}>6 new signals</b> and proposes <b style={{ color: "var(--fg-0)" }}>1 new trend</b> since yesterday.
          </p>
        </div>
        <button className="btn sm" onClick={onOpenTweaks}><Icon name="settings" size={13}/> Customize</button>
        <button className="btn ai sm" onClick={onOpenCapture}><Icon name="sparkles" size={13}/> Capture signal</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Tracked trends", val: data.trends.length, delta: "+4 Q", color: "#34D399" },
          { label: "Active signals", val: "1,840", delta: "+612 (30d)", color: "#34D399" },
          { label: "Pending review", val: campaignsData.clusters.filter(c => c.proposed).length + 5, delta: "Review now", color: "#F59E0B", action: true },
          { label: "AI-captured %", val: "74%", delta: "+18 pt YoY", color: "#34D399" },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8 }}>{k.label}</div>
            <div className="mono" style={{ fontSize: 22, color: "var(--fg-0)", fontWeight: 600, marginTop: 6 }}>{k.val}</div>
            <div className="mono" style={{ fontSize: 11, color: k.color, marginTop: 2 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="card" style={{ padding: 16, gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13 }}>Innovation pipeline</div>
            <div style={{ flex: 1 }}/>
            <button onClick={() => onGo("process")} style={{ color: "var(--accent-2)", fontSize: 12 }}>Open pipeline →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {[
              { k: "scout", l: "Scout", n: 1840, c: "#60A5FA" },
              { k: "cluster", l: "Cluster", n: 204, c: "#A78BFA" },
              { k: "validate", l: "Validate", n: 48, c: "#F472B6" },
              { k: "rate", l: "Rate", n: 12, c: "#FBBF24" },
              { k: "initiative", l: "Initiative", n: 4, c: "#34D399" },
            ].map((s, i, arr) => (
              <div key={s.k} style={{ position: "relative" }}>
                <button onClick={() => onGo("process", s.k)} style={{ display: "block", width: "100%", padding: 12, borderRadius: 8, background: `${s.c}14`, border: `1px solid ${s.c}40`, textAlign: "left" }}>
                  <div style={{ fontSize: 10.5, color: s.c, textTransform: "uppercase", letterSpacing: 0.8 }}>0{i+1} · {s.l}</div>
                  <div className="mono" style={{ fontSize: 20, color: "var(--fg-0)", fontWeight: 600, marginTop: 4 }}>{s.n.toLocaleString()}</div>
                </button>
                {i < arr.length - 1 && <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", color: "var(--fg-4)", zIndex: 2 }}><Icon name="chevronRight" size={12}/></div>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--ai-soft)", borderRadius: 6, border: "1px solid rgba(167,139,250,0.3)", marginTop: 12 }}>
            <Icon name="sparkles" size={13}/>
            <span style={{ fontSize: 12, color: "var(--fg-1)" }}>Bottleneck: <b>Cluster → Validate</b> (23% conversion). AI proposes auto-approval above 0.85 confidence.</span>
            <div style={{ flex: 1 }}/>
            <button className="btn ai sm" onClick={() => onGo("process", "cluster")}>Review</button>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13 }}>AI inbox</div>
            <span className="chip ai mono" style={{ fontSize: 10, marginLeft: 8 }}>6 new</span>
            <div style={{ flex: 1 }}/>
            <button onClick={() => onOpenAI?.()} style={{ color: "var(--accent-2)", fontSize: 12 }}>Open →</button>
          </div>
          {data.aiInbox.slice(0, 3).map(n => (
            <div key={n.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line-1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 10.5, color: n.confidence > 0.85 ? "#34D399" : "#F59E0B" }}>{(n.confidence*100).toFixed(0)}%</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>· {n.date}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-0)", lineHeight: 1.4 }}>{n.title}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 16, gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13 }}>Your top trends</div>
            <div style={{ flex: 1 }}/>
            <button onClick={() => onGo("explore")} style={{ color: "var(--accent-2)", fontSize: 12 }}>Explore all →</button>
          </div>
          {topTrends.map(t => {
            const spark = Array.from({ length: 10 }, (_, i) => 20 + Math.sin((t.impact + i) * 0.6) * 8 + (i/9) * t.impact * 0.4);
            return (
              <div key={t.id} onClick={() => onOpenTrend(t.id)} style={{ padding: "10px 0", borderBottom: "1px solid var(--line-1)", display: "grid", gridTemplateColumns: "1fr 90px 90px 60px", gap: 12, alignItems: "center", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-0)" }}>{t.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <DimensionDot dim={t.dim}/>
                    <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{t.dim}</span>
                    <StageBadge stage={t.stage}/>
                  </div>
                </div>
                <BarMeter value={t.impact} color="var(--accent)"/>
                <Sparkline points={spark} width={80} height={20} color="var(--accent-2)"/>
                <span className="mono" style={{ fontSize: 11, color: "#34D399", textAlign: "right" }}>+{Math.round(t.impact/5)}</span>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13 }}>Hottest campaign</div>
            <div style={{ flex: 1 }}/>
            <span className="chip ok"><span className="dot ok"/>live</span>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--fg-0)", fontWeight: 500, marginBottom: 8 }}>{hotCampaign.title}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 12 }}>{hotCampaign.signals} signals · {hotCampaign.participants} people · closes {hotCampaign.closes}</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {campaignsData.clusters.slice(0,6).map(cl => <div key={cl.id} style={{ flex: cl.size || 1, height: 6, background: cl.color, borderRadius: 2, opacity: 0.7 }}/>)}
          </div>
          <button className="btn" style={{ width: "100%" }} onClick={() => onGo("process", "scout")}>Open workspace</button>
        </div>

        <div className="card" style={{ padding: 16, gridColumn: "span 3" }}>
          <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13, marginBottom: 12 }}>What do you want to do?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { l: "Explore trends", s: "Browse steckbriefe + AI scout", i: "list", go: "explore" },
              { l: "Run a campaign", s: "Collect ideas from team/externals", i: "sparkles", go: "process", sub: "scout" },
              { l: "Review cluster", s: "6 waiting for validation", i: "eye", go: "process", sub: "cluster" },
              { l: "Start initiative", s: "Build MVP with AI co-spec", i: "bolt", go: "initiatives" },
            ].map(a => (
              <button key={a.l} onClick={() => onGo(a.go, a.sub)} className="card" style={{ padding: 14, textAlign: "left", background: "var(--bg-2)" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-3)", color: "var(--accent-2)", display: "grid", placeItems: "center", marginBottom: 10 }}><Icon name={a.i} size={14}/></div>
                <div style={{ fontSize: 13, color: "var(--fg-0)", fontWeight: 500 }}>{a.l}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>{a.s}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
