// Relations-Diagramm: Force-Graph, Matrix-Heatmap, Chord-Diagram
import { useState, useEffect, useMemo } from 'react';
import { Icon, DimensionDot, BarMeter, StageBadge } from './ui.jsx';
import { relationsApi, trendsApi } from './api.js';
import { CIN_DATA } from './data.js';

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
  const [selected, setSelected] = useState(null); // selected trend for popup
  const [cleaningDupes, setCleaningDupes] = useState(false);
  const [dimFilter, setDimFilter] = useState(null); // aktiver Dimensions-Filter oder null

  const trends = data.trends;

  // Duplikat-Erkennung: gruppiere nach normalisiertem Titel
  const duplicates = useMemo(() => {
    const byTitle = new Map();
    for (const t of trends) {
      const key = (t.title || '').trim().toLowerCase();
      if (!key) continue;
      if (!byTitle.has(key)) byTitle.set(key, []);
      byTitle.get(key).push(t);
    }
    const groups = [];
    for (const [, list] of byTitle) {
      if (list.length > 1) {
        // Älteste behalten (nach createdAt, Mock-Trends ohne createdAt gelten als älteste)
        list.sort((a, b) => (a.createdAt || '0').localeCompare(b.createdAt || '0'));
        groups.push({ keep: list[0], remove: list.slice(1) });
      }
    }
    return groups;
  }, [trends]);

  const dupeCount = duplicates.reduce((a, g) => a + g.remove.length, 0);

  const cleanDuplicates = async () => {
    const titles = duplicates.map(g => `"${g.keep.title}" (${g.remove.length + 1}×)`).join(', ');
    if (!confirm(`Duplikate serverseitig bereinigen?\n\nBetroffen: ${titles}\n\nCustom-Trends mit Titel eines Mock-Trends werden komplett entfernt (Mock ist kanonisch). Andere Duplikate: ältester Eintrag bleibt.`)) return;
    setCleaningDupes(true);
    try {
      const mockTitles = CIN_DATA.trends.map(t => t.title);
      const r = await trendsApi.dedupe({ preferredTitles: mockTitles });
      // cin-hidden-trends vom alten Workaround aufräumen — die Trends sind jetzt real weg
      localStorage.removeItem('cin-hidden-trends');
      alert(`${r.removed || 0} Duplikate serverseitig gelöscht. Seite wird neu geladen.`);
      window.location.reload();
    } catch (e) {
      alert('Cleanup fehlgeschlagen: ' + e.message);
      setCleaningDupes(false);
    }
  };

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

  const filteredGraph = useMemo(() => {
    if (!graph) return null;
    if (!dimFilter) {
      return { nodes: graph.nodes, edges: graph.edges.filter(e => e.score >= minScore) };
    }
    // Nur Trends der gefilterten Dimension zeigen, Edges entsprechend eingeschränkt
    const allowedIds = new Set(graph.nodes.filter(n => n.dim === dimFilter).map(n => n.id));
    const nodes = graph.nodes.filter(n => allowedIds.has(n.id));
    const edges = graph.edges.filter(e => e.score >= minScore && allowedIds.has(e.a) && allowedIds.has(e.b));
    return { nodes, edges };
  }, [graph, minScore, dimFilter]);

  const filteredEdges = filteredGraph?.edges || [];
  const filteredNodes = filteredGraph?.nodes || [];

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

      {dupeCount > 0 && (
        <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.35)' }}>
          <Icon name="bell" size={14}/>
          <div style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-1)', lineHeight: 1.4 }}>
            <b>{dupeCount} Duplikat{dupeCount === 1 ? '' : 'e'}</b> erkannt in {duplicates.length} Gruppe{duplicates.length === 1 ? '' : 'n'}:{' '}
            <span style={{ color: 'var(--fg-2)' }}>{duplicates.map(g => `"${g.keep.title}" (${g.remove.length + 1}×)`).join(', ')}</span>
          </div>
          <button className="btn sm" onClick={cleanDuplicates} disabled={cleaningDupes}>
            {cleaningDupes ? 'Bereinige…' : <><Icon name="x" size={12}/> Bereinigen</>}
          </button>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: 12, borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.08)', fontSize: 12, color: '#FFB9C5' }}>⚠ {error}</div>
      )}

      {graph && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>
          <div className="card" style={{ flex: 1, minWidth: 0, padding: 12, overflow: 'hidden', position: 'relative' }}>
            {variant === 'graph' && <ForceGraph nodes={filteredNodes} edges={filteredEdges} onSelect={setSelected} onHover={setHover}/>}
            {variant === 'matrix' && <MatrixHeatmap nodes={filteredNodes} edges={filteredEdges} onSelect={setSelected} onHover={setHover}/>}
            {variant === 'chord' && <ChordDiagram nodes={filteredNodes} edges={filteredEdges} onSelect={setSelected} onHover={setHover}/>}

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
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Legende</span>
                {dimFilter && (
                  <button className="btn ghost icon sm" style={{ marginLeft: 'auto' }} onClick={() => setDimFilter(null)} title="Filter zurücksetzen">
                    <Icon name="x" size={11}/>
                  </button>
                )}
              </div>
              {data.dimensions.map(d => {
                const active = dimFilter === d;
                const dimmed = dimFilter && !active;
                const count = graph.nodes.filter(n => n.dim === d).length;
                return (
                  <button
                    key={d}
                    onClick={() => setDimFilter(active ? null : d)}
                    title={active ? 'Filter aufheben' : `Nur ${d} anzeigen (nochmal klicken → alles)`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px',
                      fontSize: 12, width: '100%', textAlign: 'left', borderRadius: 4,
                      background: active ? 'var(--bg-3)' : 'transparent',
                      color: dimmed ? 'var(--fg-3)' : 'var(--fg-1)',
                      opacity: dimmed ? 0.5 : 1,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: DIM_COLOR[d] || 'var(--fg-3)' }}/>
                    <span style={{ flex: 1 }}>{d}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{count}</span>
                  </button>
                );
              })}
              <hr className="sep" style={{ margin: '10px 0' }}/>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.7 }}>
                <div><b style={{ color: 'var(--fg-1)' }}>{filteredNodes.length}</b> Trends{dimFilter && <span> (von {graph.nodes.length})</span>}</div>
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

      {selected && <TrendPopup trend={selected} onClose={() => setSelected(null)} onOpenFull={onOpenTrend}/>}
    </div>
  );
};

// ========== Trend-Popup ==========

const TrendPopup = ({ trend, onClose, onOpenFull }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'grid', placeItems: 'center', zIndex: 70, padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{
          width: 520, maxWidth: '100%', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-1)', overflow: 'hidden',
          boxShadow: 'var(--shadow-pop)',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <DimensionDot dim={trend.dim} size={10}/>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>#{trend.id}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>· {trend.dim}</span>
          <div style={{ flex: 1 }}/>
          <button className="btn ghost icon" onClick={onClose} title="Schliessen (Esc)">
            <Icon name="x" size={14}/>
          </button>
        </div>

        <div className="scroll" style={{ padding: 16, overflow: 'auto', flex: 1, minHeight: 0 }}>
          {trend.imageUrl && (
            <img src={trend.imageUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12, background: 'var(--bg-2)' }}/>
          )}

          <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 600, color: 'var(--fg-0)', lineHeight: 1.3 }}>{trend.title}</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <StageBadge stage={trend.stage}/>
            {trend.horizon && <span className="chip mono">{trend.horizon}</span>}
            {trend.owner && <span className="chip mono">{trend.owner}</span>}
            {(trend.tags || []).map(tag => <span key={tag} className="chip"><Icon name="hash" size={10}/>{tag}</span>)}
          </div>

          {trend.summary && (
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.55 }}>{trend.summary}</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 40px', rowGap: 8, columnGap: 10, alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Impact</span>
            <BarMeter value={trend.impact ?? 0} color="var(--accent)" height={4}/>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)', textAlign: 'right' }}>{trend.impact ?? 0}</span>

            <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Novelty</span>
            <BarMeter value={trend.novelty ?? 0} color="var(--ai)" height={4}/>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)', textAlign: 'right' }}>{trend.novelty ?? 0}</span>

            <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Maturity</span>
            <BarMeter value={trend.maturity ?? 0} color="#F59E0B" height={4}/>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)', textAlign: 'right' }}>{trend.maturity ?? 0}</span>
          </div>

          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', display: 'flex', gap: 14 }}>
            <span><b style={{ color: 'var(--fg-1)' }}>{trend.signals ?? 0}</b> Signale</span>
            <span><b style={{ color: 'var(--fg-1)' }}>{trend.sources ?? 0}</b> Quellen</span>
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line-1)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn sm" onClick={() => onOpenFull?.(trend.id)}>
            <Icon name="ext" size={12}/> Vollbild öffnen
          </button>
          <div style={{ flex: 1 }}/>
          <button className="btn primary sm" onClick={onClose}>Schliessen</button>
        </div>
      </div>
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

const ForceGraph = ({ nodes, edges, onSelect, onHover }) => {
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
             onClick={() => { onHover(null); onSelect?.(n); }}
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

const MatrixHeatmap = ({ nodes, edges, onSelect, onHover }) => {
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
              onClick={() => e && onSelect?.(col)}
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

const ChordDiagram = ({ nodes, edges, onSelect, onHover }) => {
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
          <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => { onHover(null); onSelect?.(n); }}
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
