// Radar, Matrix, Timeline, Funnel visualizations
import { Icon, Sparkline, DimensionDot } from './ui.jsx';

export const Radar = ({ t, data, onOpenTrend }) => {
  const W = 720, H = 720, cx = W/2, cy = H/2, R = 300;
  const rings = [
    { r: R, label: "H3 · 5–10 yrs", key: "H3 · 5–10 yrs" },
    { r: R * 0.66, label: "H2 · 2–5 yrs", key: "H2 · 2–5 yrs" },
    { r: R * 0.33, label: "H1 · 0–2 yrs", key: "H1 · 0–2 yrs" },
  ];
  const dims = data.dimensions;
  const anglePer = (Math.PI * 2) / dims.length;

  const placed = data.trends.map((tr, i) => {
    const di = dims.indexOf(tr.dim);
    const ring = rings.find(r => r.key === tr.horizon) || rings[1];
    const baseAngle = di * anglePer - Math.PI/2 + anglePer/2;
    const jitter = ((parseInt(tr.id, 36) % 100) / 100 - 0.5) * anglePer * 0.85;
    const a = baseAngle + jitter;
    const rr = ring.r - 30 - (tr.impact / 100) * 50 + ((i * 13) % 22);
    return { ...tr, x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
  });

  const dimColor = { Technology: "#60A5FA", Society: "#F472B6", Economy: "#FBBF24", Ecology: "#34D399", Politics: "#FB7185", Values: "#A78BFA" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", height: "100%" }}>
      <div style={{ padding: 24, display: "grid", placeItems: "center", overflow: "auto" }} className="scroll">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#17253F" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#070D1A" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R + 20} fill="url(#radar-bg)"/>
          {rings.map(r => (
            <g key={r.key}>
              <circle cx={cx} cy={cy} r={r.r} fill="none" stroke="var(--line-2)" strokeDasharray="3 4"/>
              <text x={cx} y={cy - r.r + 4} textAnchor="middle" fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">{r.label}</text>
            </g>
          ))}
          {dims.map((d, i) => {
            const a = i * anglePer - Math.PI/2;
            const x2 = cx + Math.cos(a) * (R + 10), y2 = cy + Math.sin(a) * (R + 10);
            const la = i * anglePer - Math.PI/2 + anglePer/2;
            const lx = cx + Math.cos(la) * (R + 26), ly = cy + Math.sin(la) * (R + 26);
            return (
              <g key={d}>
                <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--line-1)"/>
                <text x={lx} y={ly} textAnchor="middle" fontSize="12" fontWeight="600" fill={dimColor[d]}>{d}</text>
              </g>
            );
          })}
          <g>
            <defs>
              <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0"/>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.25"/>
              </linearGradient>
            </defs>
            <path d={`M ${cx} ${cy} L ${cx + R} ${cy} A ${R} ${R} 0 0 0 ${cx + R * Math.cos(-Math.PI/6)} ${cy + R * Math.sin(-Math.PI/6)} Z`} fill="url(#sweep)" opacity="0.5"/>
          </g>
          {placed.map(tr => {
            const size = 5 + (tr.impact / 100) * 7;
            return (
              <g key={tr.id} style={{ cursor: "pointer" }} onClick={() => onOpenTrend(tr.id)}>
                <circle cx={tr.x} cy={tr.y} r={size + 4} fill={dimColor[tr.dim]} opacity="0.15"/>
                <circle cx={tr.x} cy={tr.y} r={size} fill={dimColor[tr.dim]} stroke="#fff" strokeOpacity="0.4" strokeWidth="1"/>
                <text x={tr.x + size + 5} y={tr.y + 3} fontSize="10" fill="var(--fg-1)">{tr.title.length > 22 ? tr.title.slice(0, 22) + "…" : tr.title}</text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r="4" fill="#fff"/>
        </svg>
      </div>
      <div style={{ borderLeft: "1px solid var(--line-1)", padding: 16, background: "var(--bg-1)", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Legend</div>
          {dims.map(d => <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: 999, background: dimColor[d] }}/>{d}</div>)}
        </div>
        <hr className="sep"/>
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Encoding</div>
          <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.8 }}>
            <div><span className="mono" style={{ color: "var(--fg-1)" }}>Angle</span> — Dimension</div>
            <div><span className="mono" style={{ color: "var(--fg-1)" }}>Ring</span> — Horizon</div>
            <div><span className="mono" style={{ color: "var(--fg-1)" }}>Size</span> — Impact</div>
          </div>
        </div>
        <hr className="sep"/>
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Top movers</div>
          {data.trends.slice(0, 5).sort((a,b) => b.impact - a.impact).slice(0,5).map(x => (
            <div key={x.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--line-1)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => onOpenTrend(x.id)}>
              <DimensionDot dim={x.dim}/>
              <span style={{ fontSize: 12, color: "var(--fg-1)", flex: 1 }}>{x.title}</span>
              <span className="mono" style={{ fontSize: 11, color: "#34D399" }}>+{x.impact - 50}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Matrix = ({ data, onOpenTrend }) => {
  const W = 780, H = 560, pad = { l: 64, r: 30, t: 30, b: 64 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const xAxis = "Maturity", yAxis = "Impact";
  const dimColor = { Technology: "#60A5FA", Society: "#F472B6", Economy: "#FBBF24", Ecology: "#34D399", Politics: "#FB7185", Values: "#A78BFA" };

  return (
    <div style={{ padding: 20, overflow: "auto", height: "100%" }} className="scroll">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ color: "var(--fg-3)", fontSize: 12 }}>X</span>
        <select className="input" defaultValue="Maturity"><option>Maturity</option><option>Novelty</option><option>Signals</option></select>
        <span style={{ color: "var(--fg-3)", fontSize: 12 }}>Y</span>
        <select className="input" defaultValue="Impact"><option>Impact</option><option>Novelty</option><option>Maturity</option></select>
        <span style={{ color: "var(--fg-3)", fontSize: 12 }}>Size</span>
        <select className="input" defaultValue="Signals"><option>Signals</option><option>Sources</option></select>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 900 }}>
          <rect x={pad.l} y={pad.t} width={iw/2} height={ih/2} fill="rgba(167,139,250,0.04)"/>
          <rect x={pad.l + iw/2} y={pad.t} width={iw/2} height={ih/2} fill="rgba(52,211,153,0.04)"/>
          <rect x={pad.l} y={pad.t + ih/2} width={iw/2} height={ih/2} fill="rgba(100,116,139,0.03)"/>
          <rect x={pad.l + iw/2} y={pad.t + ih/2} width={iw/2} height={ih/2} fill="rgba(251,191,36,0.04)"/>

          <text x={pad.l + 8} y={pad.t + 16} fontSize="10.5" fill="#C4B5FD" fontFamily="var(--font-mono)" opacity="0.9">BETS · high impact, low maturity</text>
          <text x={pad.l + iw/2 + 8} y={pad.t + 16} fontSize="10.5" fill="#6EE7B7" fontFamily="var(--font-mono)" opacity="0.9">WIN · high impact, mature</text>
          <text x={pad.l + 8} y={pad.t + ih - 6} fontSize="10.5" fill="var(--fg-3)" fontFamily="var(--font-mono)">MONITOR</text>
          <text x={pad.l + iw/2 + 8} y={pad.t + ih - 6} fontSize="10.5" fill="#FDE68A" fontFamily="var(--font-mono)" opacity="0.9">HARVEST</text>

          {[0, 0.25, 0.5, 0.75, 1].map(g => (
            <g key={g}>
              <line x1={pad.l} x2={W-pad.r} y1={pad.t + ih * g} y2={pad.t + ih * g} stroke="var(--line-1)" strokeDasharray="2 4"/>
              <line y1={pad.t} y2={pad.t + ih} x1={pad.l + iw * g} x2={pad.l + iw * g} stroke="var(--line-1)" strokeDasharray="2 4"/>
              <text x={pad.l - 10} y={pad.t + ih - ih * g + 3} fontSize="10" fill="var(--fg-3)" textAnchor="end" fontFamily="var(--font-mono)">{Math.round(g * 100)}</text>
              <text x={pad.l + iw * g} y={pad.t + ih + 16} fontSize="10" fill="var(--fg-3)" textAnchor="middle" fontFamily="var(--font-mono)">{Math.round(g * 100)}</text>
            </g>
          ))}

          <line x1={pad.l + iw/2} x2={pad.l + iw/2} y1={pad.t} y2={pad.t + ih} stroke="var(--line-3)"/>
          <line y1={pad.t + ih/2} y2={pad.t + ih/2} x1={pad.l} x2={W-pad.r} stroke="var(--line-3)"/>

          <text x={pad.l + iw/2} y={H - 14} fontSize="12" fill="var(--fg-1)" textAnchor="middle" fontWeight="600">← {xAxis} →</text>
          <text transform={`translate(18, ${pad.t + ih/2}) rotate(-90)`} fontSize="12" fill="var(--fg-1)" textAnchor="middle" fontWeight="600">← {yAxis} →</text>

          {data.trends.map(tr => {
            const x = pad.l + (tr.maturity/100) * iw;
            const y = pad.t + ih - (tr.impact/100) * ih;
            const rad = 6 + (tr.signals / 700) * 14;
            return (
              <g key={tr.id} style={{ cursor: "pointer" }} onClick={() => onOpenTrend(tr.id)}>
                <circle cx={x} cy={y} r={rad} fill={dimColor[tr.dim]} fillOpacity="0.25" stroke={dimColor[tr.dim]} strokeWidth="1.2"/>
                <text x={x} y={y - rad - 4} fontSize="10" fill="var(--fg-1)" textAnchor="middle">{tr.title.length > 26 ? tr.title.slice(0, 24) + "…" : tr.title}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const Timeline = ({ data, onOpenTrend }) => {
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];
  const rowH = 56;
  const W = 1000, headerH = 40, leftW = 200;
  const H = headerH + data.trends.length * rowH;
  const stageColor = { Signal: "#6B7A96", Emerging: "#60A5FA", Trend: "#FBBF24", Mainstream: "#34D399", Fading: "#F43F5E" };
  const dimColor = { Technology: "#60A5FA", Society: "#F472B6", Economy: "#FBBF24", Ecology: "#34D399", Politics: "#FB7185", Values: "#A78BFA" };

  const barFor = (tr, i) => {
    const seed = (parseInt(tr.id, 36) % 6);
    const start = 0 + seed;
    const width = 3 + ((tr.signals % 5));
    const end = Math.min(years.length - 1, start + width);
    return { start, end, today: 2026 - years[0] };
  };
  const xOf = i => leftW + (i / (years.length - 1)) * (W - leftW - 30);

  return (
    <div style={{ padding: 20, overflow: "auto", height: "100%" }} className="scroll">
      <div className="card" style={{ padding: 0, minWidth: W }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%">
          {years.map((y, i) => (
            <g key={y}>
              <line x1={xOf(i)} x2={xOf(i)} y1={0} y2={H} stroke="var(--line-1)" strokeDasharray={y === 2026 ? "" : "2 4"}/>
              <text x={xOf(i)} y={24} textAnchor="middle" fontSize="11" fill="var(--fg-2)" fontFamily="var(--font-mono)">{y}</text>
            </g>
          ))}
          <line x1={xOf(2)} x2={xOf(2)} y1={0} y2={H} stroke="var(--accent)" strokeWidth="1.5"/>
          <rect x={xOf(2) - 22} y="4" width="44" height="14" rx="3" fill="var(--accent)"/>
          <text x={xOf(2)} y="14" textAnchor="middle" fontSize="10" fill="white" fontFamily="var(--font-mono)" fontWeight="600">TODAY</text>

          {data.trends.map((tr, i) => {
            const y = headerH + i * rowH;
            const b = barFor(tr, i);
            return (
              <g key={tr.id} style={{ cursor: "pointer" }} onClick={() => onOpenTrend(tr.id)}>
                <rect x="0" y={y} width={W} height={rowH} fill={i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"}/>
                <rect x="8" y={y + 14} width="4" height="24" fill={dimColor[tr.dim]} rx="2"/>
                <text x="20" y={y + 22} fontSize="12" fill="var(--fg-0)" fontWeight="500">{tr.title.length > 26 ? tr.title.slice(0, 24) + "…" : tr.title}</text>
                <text x="20" y={y + 38} fontSize="10" fill="var(--fg-3)" fontFamily="var(--font-mono)">{tr.dim} · {tr.stage}</text>

                <rect x={xOf(b.start)} y={y + 20} width={xOf(b.end) - xOf(b.start)} height={18}
                  fill={stageColor[tr.stage]} fillOpacity="0.25" stroke={stageColor[tr.stage]} strokeWidth="1" rx="4"/>
                <circle cx={xOf(b.start)} cy={y + 29} r="5" fill={stageColor[tr.stage]}/>
                <circle cx={xOf(b.end)} cy={y + 29} r="5" fill={stageColor[tr.stage]} stroke="#fff" strokeOpacity="0.4"/>
                <text x={xOf(b.start) + 10} y={y + 33} fontSize="10" fill="var(--fg-0)" fontFamily="var(--font-mono)">{tr.horizon.split(" · ")[0]} · impact {tr.impact}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const Funnel = ({ data }) => {
  const max = data.funnelStages[0].count;
  return (
    <div style={{ padding: 24, overflow: "auto", height: "100%" }} className="scroll">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 14 }}>Signal → Project funnel</span>
            <span className="chip mono">Q1 2026</span>
            <div style={{ flex: 1 }}/>
            <span className="chip ai"><Icon name="sparkles" size={10}/> AI reviewed 74% of signals</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {data.funnelStages.map((s, i) => {
              const pct = s.count / max;
              const width = 640 * (0.32 + 0.68 * pct);
              const prev = i > 0 ? data.funnelStages[i-1].count : s.count;
              const conversion = i > 0 ? Math.round((s.count / prev) * 100) : 100;
              return (
                <div key={s.key} style={{ width, height: 64, borderRadius: 8,
                  background: `linear-gradient(180deg, rgba(59,130,246,${0.15 + i*0.05}), rgba(59,130,246,${0.08 + i*0.03}))`,
                  border: "1px solid rgba(59,130,246,0.35)",
                  display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", padding: "0 18px", gap: 16 }}>
                  <span className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>0{i+1}</span>
                  <div>
                    <div style={{ color: "var(--fg-0)", fontSize: 14, fontWeight: 600 }}>{s.label}</div>
                    {i > 0 && <div style={{ color: "var(--fg-3)", fontSize: 11 }} className="mono">conversion {conversion}%</div>}
                  </div>
                  <span className="mono" style={{ color: "var(--fg-0)", fontSize: 22, fontWeight: 600 }}>{s.count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ color: "var(--fg-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Bottleneck</div>
            <div style={{ fontSize: 13, color: "var(--fg-0)", marginBottom: 8 }}>Clustered → Trends</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.55 }}>Only 23% of clusters become tracked trends. AI proposes auto-approval for clusters with confidence ≥ 0.85.</div>
            <button className="btn sm ai" style={{ marginTop: 10 }}><Icon name="sparkles" size={12}/> Apply suggestion</button>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ color: "var(--fg-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Velocity</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 22, color: "var(--fg-0)", fontWeight: 600 }} className="mono">4.2 <span style={{ fontSize: 11, color: "var(--fg-3)" }}>weeks</span></span>
              <span style={{ color: "#34D399", fontSize: 11 }} className="mono">↓ 31% vs Q4</span>
            </div>
            <div style={{ marginTop: 10 }}><Sparkline points={[10, 8, 9, 7, 6, 5.5, 4.8, 4.2]} width={260} height={40} color="#34D399"/></div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ color: "var(--fg-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>AI contribution</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>auto-captured signals</span><span style={{ color: "var(--fg-0)" }}>1,362</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>AI-proposed trends</span><span style={{ color: "var(--fg-0)" }}>9</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>hours saved</span><span style={{ color: "#34D399" }}>~214 h</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
