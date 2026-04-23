// Relations-Diagramm: Force-Graph, Matrix-Heatmap, Chord-Diagram
import { useState, useEffect, useMemo } from 'react';
import { Icon, DimensionDot } from './ui.jsx';
import { relationsApi } from './api.js';

const DIM_COLOR = {
  Technology: '#60A5FA', Society: '#F472B6', Economy: '#FBBF24',
  Ecology: '#34D399', Politics: '#FB7185', Values: '#A78BFA',
};

export const RelationsView = ({ data, onOpenTrend }) => {
  const [variant, setVariant] = useState('graph');
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(0.5);
  const [hover, setHover] = useState(null); // { a, b, score, reason, x, y }

  const trends = data.trends;

  const loadGraph = async (force = false) => {
    setLoading(true);
    setError(null);
    setProgress({ done: 0, total: trends.length });
    try {
      let done = 0;
      const results = await Promise.all(trends.map(async (t) => {
        const payload = {
          trend: { id: t.id, title: t.title, dim: t.dim, tags: t.tags || [], summary: t.summary || '' },
          candidates: trends.filter(c => c.id !== t.id).map(c => ({
            id: c.id, title: c.title, dim: c.dim, tags: c.tags || [], summary: c.summary || '',
          })),
          force,
        };
        try {
          const r = await relationsApi.rank(payload);
          done++; setProgress({ done, total: trends.length });
          return { id: t.id, related: r.related || [] };
        } catch {
          done++; setProgress({ done, total: trends.length });
          return { id: t.id, related: [] };
        }
      }));

      // Dedupe edges (A↔B wird nur einmal gezählt, Score gemittelt wenn beide Richtungen existieren)
      const edgeMap = new Map();
      for (const { id, related } of results) {
        for (const r of related) {
          const key = [id, r.id].sort().join('|');
          if (!edgeMap.has(key)) {
            edgeMap.set(key, { a: id, b: r.id, scores: [r.score || 0], reasons: [r.reason || ''] });
          } else {
            const e = edgeMap.get(key);
            e.scores.push(r.score || 0);
            if (r.reason) e.reasons.push(r.reason);
          }
        }
      }
      const edges = Array.from(edgeMap.values()).map(e => ({
        a: e.a, b: e.b,
        score: e.scores.reduce((a, b) => a + b, 0) / e.scores.length,
        reason: e.reasons[0] || '',
      }));

      setGraph({ nodes: trends, edges });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGraph(false); }, [trends.length]);

  const filteredEdges = useMemo(() => {
    if (!graph) return [];
    return graph.edges.filter(e => e.score >= minScore);
  }, [graph, minScore]);

  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>Trend-Beziehungen</div>
        <span className="chip ai mono" style={{ fontSize: 10 }}><Icon name="sparkles" size={10}/>AI-ranked</span>
        <div style={{ flex: 1 }}/>
        <label style={{ fontSize: 11, color: 'var(--fg-3)' }}>Diagramm:</label>
        <select className="input" value={variant} onChange={e => setVariant(e.target.value)} style={{ height: 30, fontSize: 12 }}>
          <option value="graph">Force-Graph (Netzwerk)</option>
          <option value="matrix">Matrix-Heatmap</option>
          <option value="chord">Chord-Diagram</option>
        </select>
        <label style={{ fontSize: 11, color: 'var(--fg-3)' }}>Min. Score:</label>
        <input type="range" min="0" max="1" step="0.05" value={minScore} onChange={e => setMinScore(parseFloat(e.target.value))}
          className="bar" style={{ width: 120, '--thumb-color': 'var(--accent)' }}/>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', minWidth: 36, textAlign: 'right' }}>{Math.round(minScore * 100)}%</span>
        <button className="btn sm" onClick={() => loadGraph(true)} disabled={loading} title="Cache umgehen und alles neu berechnen">
          <Icon name="bolt" size={12}/> Neu berechnen
        </button>
      </div>

      {loading && (
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ai-shimmer" style={{ fontSize: 13 }}>Lade Relations…</span>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{progress.done}/{progress.total}</div>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent)', width: `${(progress.done / Math.max(1, progress.total)) * 100}%`, transition: 'width 200ms' }}/>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: 12, borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.08)', fontSize: 12, color: '#FFB9C5' }}>⚠ {error}</div>
      )}

      {graph && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>
          <div className="card" style={{ flex: 1, minWidth: 0, padding: 12, overflow: 'hidden', position: 'relative' }}>
            {variant === 'graph' && <ForceGraph nodes={graph.nodes} edges={filteredEdges} onOpenTrend={onOpenTrend} onHover={setHover}/>}
            {variant === 'matrix' && <MatrixHeatmap nodes={graph.nodes} edges={filteredEdges} onOpenTrend={onOpenTrend} onHover={setHover}/>}
            {variant === 'chord' && <ChordDiagram nodes={graph.nodes} edges={filteredEdges} onOpenTrend={onOpenTrend} onHover={setHover}/>}

            {hover && (
              <div style={{
                position: 'absolute', top: hover.y, left: hover.x,
                background: 'var(--bg-2)', border: '1px solid var(--line-3)',
                borderRadius: 6, padding: '8px 10px', maxWidth: 280,
                fontSize: 11.5, color: 'var(--fg-1)', pointerEvents: 'none',
                boxShadow: 'var(--shadow-2)', zIndex: 10,
              }}>
                <div style={{ color: 'var(--fg-0)', fontWeight: 600, marginBottom: 4 }}>{hover.title}</div>
                {hover.reason && <div style={{ lineHeight: 1.5, color: 'var(--fg-2)' }}>{hover.reason}</div>}
                {hover.score != null && <div className="mono" style={{ color: '#34D399', marginTop: 4 }}>{Math.round(hover.score * 100)}%</div>}
              </div>
            )}
          </div>
          <div style={{ width: 240, flexShrink: 0, overflow: 'auto' }} className="scroll">
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Legende</div>
              {data.dimensions.map(d => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: DIM_COLOR[d] || 'var(--fg-3)' }}/>
                  <span>{d}</span>
                </div>
              ))}
              <hr className="sep" style={{ margin: '10px 0' }}/>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.7 }}>
                <div><b style={{ color: 'var(--fg-1)' }}>{graph.nodes.length}</b> Trends</div>
                <div><b style={{ color: 'var(--fg-1)' }}>{filteredEdges.length}</b> Verbindungen ≥ {Math.round(minScore*100)}%</div>
                <div><b style={{ color: 'var(--fg-1)' }}>{graph.edges.length}</b> Total</div>
              </div>
              <hr className="sep" style={{ margin: '10px 0' }}/>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.5 }}>
                {variant === 'graph' && 'Punkte = Trends. Linien = AI-erkannte thematische Ähnlichkeit. Dicke/Opacity = Score.'}
                {variant === 'matrix' && 'Zeile × Spalte = Trend-Paar. Farbintensität = Score. Diagonale grau (Trend zu sich selbst).'}
                {variant === 'chord' && 'Trends auf Kreis. Bögen verbinden ähnliche Paare. Dicke = Score.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== Force-Directed Graph ==========

function runForceSim(nodes, edges, { iterations = 200, width = 800, height = 520 } = {}) {
  const n = nodes.length;
  const cx = width / 2, cy = height / 2;
  // Circle-Initialisierung (stabiler als Random)
  const pos = nodes.map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: cx + Math.cos(a) * 150, y: cy + Math.sin(a) * 150, vx: 0, vy: 0 };
  });
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;
    // Repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const d2 = Math.max(1, dx * dx + dy * dy);
        const d = Math.sqrt(d2);
        const f = 4500 / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        pos[i].vx -= fx; pos[i].vy -= fy;
        pos[j].vx += fx; pos[j].vy += fy;
      }
    }
    // Attraction
    for (const e of edges) {
      const ia = idIdx.get(e.a), ib = idIdx.get(e.b);
      if (ia == null || ib == null) continue;
      const dx = pos[ib].x - pos[ia].x;
      const dy = pos[ib].y - pos[ia].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const target = 120 + (1 - e.score) * 150;
      const f = (d - target) * 0.04 * e.score;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      pos[ia].vx += fx; pos[ia].vy += fy;
      pos[ib].vx -= fx; pos[ib].vy -= fy;
    }
    // Center gravity + damping + integrate
    for (const p of pos) {
      p.vx += (cx - p.x) * 0.003;
      p.vy += (cy - p.y) * 0.003;
      p.vx *= 0.72 * cooling + 0.2;
      p.vy *= 0.72 * cooling + 0.2;
      p.x += p.vx * 0.5;
      p.y += p.vy * 0.5;
      // Hard bounds
      p.x = Math.max(40, Math.min(width - 40, p.x));
      p.y = Math.max(40, Math.min(height - 40, p.y));
    }
  }
  return pos;
}

const ForceGraph = ({ nodes, edges, onOpenTrend, onHover }) => {
  const W = 800, H = 520;
  const positions = useMemo(() => runForceSim(nodes, edges, { width: W, height: H }),
    [nodes.map(n => n.id).join(','), edges.map(e => e.a + '|' + e.b + '|' + e.score.toFixed(2)).join(',')]);
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
      {/* Edges */}
      {edges.map((e, i) => {
        const a = positions[idIdx.get(e.a)]; const b = positions[idIdx.get(e.b)];
        if (!a || !b) return null;
        return (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="var(--accent)" strokeOpacity={0.15 + e.score * 0.55}
            strokeWidth={0.5 + e.score * 2.5}
            onMouseMove={ev => onHover({
              title: nodes.find(n => n.id === e.a).title + ' ↔ ' + nodes.find(n => n.id === e.b).title,
              reason: e.reason, score: e.score, x: ev.nativeEvent.offsetX + 14, y: ev.nativeEvent.offsetY + 14,
            })}
            onMouseLeave={() => onHover(null)}/>
        );
      })}
      {/* Nodes */}
      {nodes.map((n, i) => {
        const p = positions[i];
        const size = 8 + (n.impact || 50) / 10;
        return (
          <g key={n.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }}
             onClick={() => onOpenTrend?.(n.id)}
             onMouseMove={ev => onHover({ title: n.title, reason: `${n.dim} · Impact ${n.impact}`, score: null, x: ev.nativeEvent.offsetX + 14, y: ev.nativeEvent.offsetY + 14 })}
             onMouseLeave={() => onHover(null)}>
            <circle r={size + 3} fill={DIM_COLOR[n.dim] || '#94A3B8'} opacity={0.2}/>
            <circle r={size} fill={DIM_COLOR[n.dim] || '#94A3B8'} stroke="#fff" strokeOpacity={0.4} strokeWidth={1}/>
            <text y={size + 12} fontSize={10} fill="var(--fg-1)" textAnchor="middle">
              {n.title.length > 22 ? n.title.slice(0, 22) + '…' : n.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ========== Matrix Heatmap ==========

const MatrixHeatmap = ({ nodes, edges, onOpenTrend, onHover }) => {
  const pair = new Map();
  for (const e of edges) pair.set([e.a, e.b].sort().join('|'), e);

  const cell = 22;
  const headerH = 120;
  const headerW = 180;
  const W = headerW + nodes.length * cell + 10;
  const H = headerH + nodes.length * cell + 10;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }} className="scroll">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block' }}>
        {nodes.map((n, i) => (
          <g key={'col' + n.id} transform={`translate(${headerW + i * cell + cell / 2}, ${headerH - 6}) rotate(-55)`}>
            <text fontSize={10} fill="var(--fg-2)" textAnchor="start">{n.title.length > 24 ? n.title.slice(0, 24) + '…' : n.title}</text>
          </g>
        ))}
        {nodes.map((n, j) => (
          <g key={'row' + n.id} transform={`translate(${headerW - 6}, ${headerH + j * cell + cell / 2 + 3})`}>
            <text fontSize={10} fill="var(--fg-2)" textAnchor="end">{n.title.length > 26 ? n.title.slice(0, 26) + '…' : n.title}</text>
          </g>
        ))}
        {nodes.map((row, j) => nodes.map((col, i) => {
          if (i === j) {
            return <rect key={`${i}-${j}`} x={headerW + i * cell} y={headerH + j * cell} width={cell - 1} height={cell - 1} fill="var(--bg-3)" opacity={0.3}/>;
          }
          const key = [row.id, col.id].sort().join('|');
          const e = pair.get(key);
          const score = e ? e.score : 0;
          return (
            <rect key={`${i}-${j}`}
              x={headerW + i * cell} y={headerH + j * cell}
              width={cell - 1} height={cell - 1}
              fill="var(--accent)" opacity={score * 0.95}
              style={{ cursor: e ? 'pointer' : 'default' }}
              onClick={() => e && onOpenTrend?.(col.id)}
              onMouseMove={ev => e && onHover({
                title: row.title + ' ↔ ' + col.title,
                reason: e.reason, score,
                x: ev.nativeEvent.offsetX + 14, y: ev.nativeEvent.offsetY + 14,
              })}
              onMouseLeave={() => onHover(null)}>
              <title>{row.title} ↔ {col.title}: {Math.round(score * 100)}%{e?.reason ? ' — ' + e.reason : ''}</title>
            </rect>
          );
        }))}
      </svg>
    </div>
  );
};

// ========== Chord Diagram ==========

const ChordDiagram = ({ nodes, edges, onOpenTrend, onHover }) => {
  const W = 720, H = 520;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) / 2 - 80;

  const positions = nodes.map((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { angle: a, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  const idIdx = new Map(nodes.map((n, i) => [n.id, i]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line-2)" strokeDasharray="3 4"/>

      {/* Chords */}
      {edges.map((e, i) => {
        const ia = idIdx.get(e.a), ib = idIdx.get(e.b);
        if (ia == null || ib == null) return null;
        const p1 = positions[ia], p2 = positions[ib];
        const d = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
        return (
          <path key={i} d={d} fill="none"
            stroke="var(--accent)" strokeOpacity={0.15 + e.score * 0.55}
            strokeWidth={0.5 + e.score * 2.5}
            onMouseMove={ev => onHover({
              title: nodes[ia].title + ' ↔ ' + nodes[ib].title,
              reason: e.reason, score: e.score,
              x: ev.nativeEvent.offsetX + 14, y: ev.nativeEvent.offsetY + 14,
            })}
            onMouseLeave={() => onHover(null)}/>
        );
      })}

      {/* Nodes on circle */}
      {nodes.map((n, i) => {
        const p = positions[i];
        const size = 7 + (n.impact || 50) / 12;
        const labelR = r + 20;
        const lx = cx + Math.cos(p.angle) * labelR;
        const ly = cy + Math.sin(p.angle) * labelR;
        const textAnchor = Math.cos(p.angle) > 0.3 ? 'start' : Math.cos(p.angle) < -0.3 ? 'end' : 'middle';
        const title = n.title.length > 24 ? n.title.slice(0, 24) + '…' : n.title;
        return (
          <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => onOpenTrend?.(n.id)}
             onMouseMove={ev => onHover({ title: n.title, reason: `${n.dim} · Impact ${n.impact}`, score: null, x: ev.nativeEvent.offsetX + 14, y: ev.nativeEvent.offsetY + 14 })}
             onMouseLeave={() => onHover(null)}>
            <circle cx={p.x} cy={p.y} r={size + 3} fill={DIM_COLOR[n.dim] || '#94A3B8'} opacity={0.25}/>
            <circle cx={p.x} cy={p.y} r={size} fill={DIM_COLOR[n.dim] || '#94A3B8'} stroke="#fff" strokeOpacity={0.4} strokeWidth={1}/>
            <text x={lx} y={ly} fontSize={10} fill="var(--fg-1)" textAnchor={textAnchor} dominantBaseline="middle">{title}</text>
          </g>
        );
      })}
    </svg>
  );
};
