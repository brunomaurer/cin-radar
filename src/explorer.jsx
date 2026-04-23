// Explorer — table/list with filters, sort, search
import { useState, useMemo, useEffect } from 'react';
import { Icon, BarMeter, Sparkline, StageBadge, DimensionDot } from './ui.jsx';
import { signalsApi, trendsApi } from './api.js';

const processStages = [
  { k: 'all', l: 'All', c: 'var(--fg-2)' },
  { k: 'scout', l: 'Scout', c: '#34D399' },
  { k: 'cluster', l: 'Cluster', c: '#A78BFA' },
  { k: 'rate', l: 'Rate', c: '#F59E0B' },
  { k: 'initiative', l: 'Initiative', c: '#60A5FA' },
];

const processStageMap = {
  scout: ['Signal'],
  cluster: ['Emerging'],
  rate: ['Trend', 'Mainstream'],
  initiative: ['Mainstream', 'Fading'],
};

const CSV_COLUMNS = [
  ['id',         'ID'],
  ['title',      'Title'],
  ['dim',        'Dimension'],
  ['horizon',    'Horizon'],
  ['stage',      'Stage'],
  ['impact',     'Impact'],
  ['novelty',    'Novelty'],
  ['maturity',   'Maturity'],
  ['signals',    'Signals'],
  ['sources',    'Sources'],
  ['owner',      'Owner'],
  ['updated',    'Updated'],
  ['ai',         'AI-Score'],
  ['tags',       'Tags'],
  ['summary',    'Summary'],
  ['imageUrl',   'Image URL'],
  ['campaignId', 'Campaign ID'],
  ['channel',    'Channel'],
  ['custom',     'Custom'],
  ['subscribed', 'Subscribed'],
  ['createdAt',  'Created At'],
  ['updatedAt',  'Updated At'],
];

function rowsToCsv(rows, sep = ';') {
  const escape = (v) => {
    if (v == null) return '';
    let s = Array.isArray(v) ? v.join(', ') : String(v);
    if (s.includes(sep) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const header = CSV_COLUMNS.map(([, l]) => escape(l)).join(sep);
  const body = rows.map(row => CSV_COLUMNS.map(([k]) => escape(row[k])).join(sep)).join('\r\n');
  return header + '\r\n' + body;
}

function downloadCsv(rows) {
  const csv = rowsToCsv(rows);
  const BOM = '\uFEFF'; // UTF-8 BOM — damit Excel Umlaute richtig anzeigt
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `trends-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const Explorer = ({ t, data, search, onOpenTrend, campaigns }) => {
  const [dim, setDim] = useState("all");
  const [horizon, setHorizon] = useState("all");
  const [stage, setStage] = useState("all");
  const [owner, setOwner] = useState("all");
  const [sort, setSort] = useState({ key: "impact", dir: "desc" });
  const [view, setView] = useState(() => new URLSearchParams(window.location.search).get('view') || 'table');
  const [selected, setSelected] = useState(new Set());
  const [processFilter, setProcessFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [signals, setSignals] = useState([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBulkGenerateImages = async () => {
    if (selected.size === 0) return;
    setActionLoading(true);
    setActionOpen(false);
    let count = 0;
    try {
      for (const id of selected) {
        const trend = data.trends.find(t => t.id === id);
        if (!trend || trend.imageUrl) continue;
        const r = await fetch('/api/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: trend.title, dim: trend.dim, summary: trend.summary || '' }) });
        const img = await r.json();
        if (img.url) {
          // Try update, if 404 (mock trend), create it first
          try {
            await trendsApi.update(id, { imageUrl: img.url });
          } catch {
            await trendsApi.create({ ...trend, imageUrl: img.url, custom: true });
          }
          count++;
        }
      }
      alert(`${count} Bild(er) generiert! Seite neu laden um sie zu sehen.`);
    } catch (e) {
      alert('Fehler: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} Trend(s) wirklich löschen?`)) return;
    setActionOpen(false);
    setActionLoading(true);
    try {
      const hidden = JSON.parse(localStorage.getItem('cin-hidden-trends') || '[]');
      for (const id of selected) {
        await trendsApi.remove(id).catch(() => {});
        if (!hidden.includes(id)) hidden.push(id);
      }
      localStorage.setItem('cin-hidden-trends', JSON.stringify(hidden));
      setSelected(new Set());
      window.location.reload();
    } catch (e) {
      alert('Fehler: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'signals') {
      setSignalsLoading(true);
      signalsApi.list()
        .then(r => {
          const apiSignals = Array.isArray(r) ? r : [];
          // Merge with mock signals from data
          const mockSignals = (data.signals || []).map(s => ({ ...s, channel: s.channel || 'mock', dateLabel: s.date, summary: '' }));
          const all = [...apiSignals, ...mockSignals.filter(ms => !apiSignals.some(as => as.id === ms.id))];
          setSignals(all);
        })
        .catch(() => {
          // Fallback to mock signals
          setSignals((data.signals || []).map(s => ({ ...s, channel: s.channel || 'mock', dateLabel: s.date, summary: '' })));
        })
        .finally(() => setSignalsLoading(false));
    }
  }, [view]);

  // Update URL with view param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (view !== 'table') { params.set('view', view); } else { params.delete('view'); }
    const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [view]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('channel')) setChannelFilter(params.get('channel'));
    if (params.get('view')) setView(params.get('view'));
  }, []);

  const rows = useMemo(() => {
    let r = data.trends.slice();
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(t => t.title.toLowerCase().includes(q) || (t.tags||[]).some(x => x.toLowerCase().includes(q)));
    }
    if (dim !== "all") r = r.filter(t => t.dim === dim);
    if (horizon !== "all") r = r.filter(t => t.horizon === horizon);
    if (stage !== "all") r = r.filter(t => t.stage === stage);
    if (owner !== "all") r = r.filter(t => t.owner === owner);
    if (processFilter !== 'all') {
      const allowed = processStageMap[processFilter] || [];
      r = r.filter(tr => allowed.includes(tr.stage));
    }
    if (campaignFilter) r = r.filter(tr => tr.campaignId === campaignFilter);
    if (channelFilter) r = r.filter(tr => tr.channel === channelFilter);
    r.sort((a, b) => {
      const v = typeof a[sort.key] === "string" ? a[sort.key].localeCompare(b[sort.key]) : a[sort.key] - b[sort.key];
      return sort.dir === "asc" ? v : -v;
    });
    return r;
  }, [data, search, dim, horizon, stage, owner, sort, processFilter, campaignFilter, channelFilter]);

  const clear = () => { setDim("all"); setHorizon("all"); setStage("all"); setOwner("all"); };

  const toggle = id => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const Th = ({ k, children, align = "left", w }) => (
    <th style={{ textAlign: align, padding: "10px 12px", fontWeight: 500, color: "var(--fg-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--line-1)", width: w, cursor: "pointer", whiteSpace: "nowrap" }}
        onClick={() => setSort(s => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }))}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {children}
        {sort.key === k && <span className="mono" style={{ fontSize: 9 }}>{sort.dir === "desc" ? "▼" : "▲"}</span>}
      </span>
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: 'flex', gap: 8, padding: '12px 24px 0' }}>
        <select className="btn sm" value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">Alle Kampagnen</option>
          {(campaigns || []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select className="btn sm" value={channelFilter} onChange={e => setChannelFilter(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">All channels</option>
          <option value="manual">Manual</option>
          <option value="url">URL import</option>
          <option value="pdf">PDF import</option>
          <option value="ai-scout">AI Scout</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: '8px 24px 0' }}>
        {processStages.map(s => (
          <button
            key={s.k}
            className="btn sm"
            style={{
              background: processFilter === s.k ? s.c : 'transparent',
              color: processFilter === s.k ? '#fff' : 'var(--fg-2)',
              border: processFilter === s.k ? 'none' : '1px solid var(--line-2)',
              fontSize: 12,
              fontWeight: processFilter === s.k ? 600 : 400,
            }}
            onClick={() => setProcessFilter(s.k)}
          >
            {s.l}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--line-1)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-2)", fontSize: 12, marginRight: 4 }}>
          <Icon name="filter" size={13}/> <span>{t("filters")}</span>
        </div>
        <FilterSelect value={dim} onChange={setDim} options={[["all", t("all_dimensions")], ...data.dimensions.map(d => [d, d])]} />
        <FilterSelect value={horizon} onChange={setHorizon} options={[["all", t("all_horizons")], ...data.horizons.map(d => [d, d])]} />
        <FilterSelect value={stage} onChange={setStage} options={[["all", t("all_stages")], ...data.stages.map(d => [d, d])]} />
        <FilterSelect value={owner} onChange={setOwner} options={[["all", t("all_owners")], ...data.owners.map(d => [d, d])]} />
        <button className="btn ghost sm" onClick={clear}><Icon name="x" size={12}/>{t("clear")}</button>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: 2 }}>
          <button onClick={() => setView("table")} style={{ padding: "4px 8px", borderRadius: 4, background: view === "table" ? "var(--bg-3)" : "transparent", color: view === "table" ? "var(--fg-0)" : "var(--fg-3)" }}><Icon name="list" size={13}/></button>
          <button onClick={() => setView("cards")} style={{ padding: "4px 8px", borderRadius: 4, background: view === "cards" ? "var(--bg-3)" : "transparent", color: view === "cards" ? "var(--fg-0)" : "var(--fg-3)" }}><Icon name="grid" size={13}/></button>
          <button className={`btn sm${view === 'tiles' ? ' active' : ''}`} onClick={() => setView('tiles')} style={view === 'tiles' ? { background: 'var(--accent)', color: '#fff' } : {}}>Tiles</button>
          <button className={`btn sm${view === 'signals' ? ' active' : ''}`} onClick={() => setView('signals')} style={view === 'signals' ? { background: 'var(--accent)', color: '#fff' } : {}}><Icon name="zap" size={12}/> Signals</button>
        </div>

        <div className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>
          {rows.length} {t("of")} {data.trends.length} {t("rows")}
        </div>
        <button className="btn sm" onClick={() => downloadCsv(rows)} disabled={rows.length === 0} title={`${rows.length} Steckbriefe exportieren`}><Icon name="download" size={13}/> CSV</button>
        {selected.size > 0 && (
          <div style={{ position: 'relative' }}>
            <button className="btn primary sm" onClick={() => setActionOpen(!actionOpen)} disabled={actionLoading}>
              {actionLoading ? '…' : <><Icon name="bolt" size={12}/> Aktion ({selected.size})</>}
            </button>
            {actionOpen && (
              <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, padding: 4, zIndex: 50, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <button onClick={handleBulkGenerateImages} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: 12, color: 'var(--fg-0)', borderRadius: 4, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon name="sparkles" size={12}/> Bild generieren
                </button>
                <button onClick={handleBulkDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: 12, color: 'var(--hot)', borderRadius: 4, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon name="x" size={12}/> Löschen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "linear-gradient(90deg, rgba(167,139,250,0.08), rgba(59,130,246,0.03) 60%, transparent)", borderBottom: "1px solid var(--line-1)" }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--ai-soft)", color: "var(--ai)", display: "grid", placeItems: "center" }}>
          <Icon name="sparkles" size={13}/>
        </div>
        <div style={{ fontSize: 12.5 }}>
          <span className="ai-shimmer" style={{ fontWeight: 600 }}>AI Scout</span>
          <span style={{ color: "var(--fg-2)", marginLeft: 8 }}>found <b style={{ color: "var(--fg-0)" }}>6</b> new signals and proposes <b style={{ color: "var(--fg-0)" }}>1</b> new trend since your last visit.</span>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn sm" onClick={() => window.__openAI?.()}><Icon name="eye" size={12}/> {t("review")}</button>
      </div>

      {view === "table" && (
        <div className="scroll" style={{ flex: 1, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-0)", zIndex: 2 }}>
              <tr>
                <th style={{ width: 36, padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }}></th>
                <Th k="title">Trend</Th>
                <Th k="dim" w={130}>Dimension</Th>
                <Th k="horizon" w={120}>{t("horizon")}</Th>
                <Th k="stage" w={110}>{t("stage")}</Th>
                <Th k="impact" align="right" w={120}>{t("impact")}</Th>
                <Th k="novelty" align="right" w={110}>{t("novelty")}</Th>
                <Th k="maturity" align="right" w={110}>{t("maturity")}</Th>
                <Th k="signals" align="right" w={90}>{t("signals")}</Th>
                <th style={{ width: 100, padding: "10px 12px", borderBottom: "1px solid var(--line-1)", color: "var(--fg-3)", fontSize: 11, textTransform: "uppercase", fontWeight: 500, letterSpacing: 0.5 }}>Trend</th>
                <Th k="owner" w={110}>{t("owner")}</Th>
                <Th k="updated" align="right" w={80}>{t("updated")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const spark = Array.from({ length: 12 }, (_, i) => 20 + Math.sin((r.impact + i) * 0.6) * 10 + (i/11)*r.impact*0.4);
                const isSel = selected.has(r.id);
                return (
                  <tr key={r.id}
                      onClick={() => onOpenTrend(r.id)}
                      style={{ cursor: "pointer", background: isSel ? "var(--accent-soft)" : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = isSel ? "var(--accent-soft)" : "var(--bg-1)"}
                      onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--accent-soft)" : "transparent"}>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }} onClick={e => { e.stopPropagation(); toggle(r.id); }}>
                      <div style={{ width: 14, height: 14, border: "1px solid var(--line-3)", borderRadius: 3, background: isSel ? "var(--accent)" : "transparent", display: "grid", placeItems: "center" }}>
                        {isSel && <Icon name="check" size={10} stroke={3}/>}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="mono" style={{ color: "var(--fg-3)", fontSize: 10.5, width: 40 }}>#{r.id}</span>
                        <span style={{ color: "var(--fg-0)", fontWeight: 500 }}>{r.title}</span>
                        {r.ai > 0.9 && <span className="chip ai" title="AI-enriched"><Icon name="sparkles" size={10}/></span>}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)", color: "var(--fg-2)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <DimensionDot dim={r.dim}/>{r.dim}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)", color: "var(--fg-2)" }} className="mono">{r.horizon}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }}><StageBadge stage={r.stage}/></td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BarMeter value={r.impact} color="var(--accent)" />
                        <span className="mono" style={{ color: "var(--fg-1)", width: 22, textAlign: "right", fontSize: 11 }}>{r.impact}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BarMeter value={r.novelty} color="var(--ai)" />
                        <span className="mono" style={{ color: "var(--fg-1)", width: 22, textAlign: "right", fontSize: 11 }}>{r.novelty}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BarMeter value={r.maturity} color="#F59E0B" />
                        <span className="mono" style={{ color: "var(--fg-1)", width: 22, textAlign: "right", fontSize: 11 }}>{r.maturity}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)", color: "var(--fg-1)", textAlign: "right" }} className="mono">{r.signals}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)" }}>
                      <Sparkline points={spark} color={r.stage === "Fading" ? "var(--hot)" : "var(--accent-2)"} width={80} height={22}/>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)", color: "var(--fg-2)" }}>{r.owner}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-1)", color: "var(--fg-3)", textAlign: "right" }} className="mono">{r.updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === "cards" && (
        <div className="scroll" style={{ flex: 1, padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, alignContent: "start" }}>
          {rows.map(r => (
            <div key={r.id} className="card" style={{ padding: 14, cursor: "pointer" }} onClick={() => onOpenTrend(r.id)}>
              {r.imageUrl && (
                <img src={r.imageUrl} alt="" style={{ width: 80, height: 107, objectFit: 'cover', borderRadius: 6, float: 'right', marginLeft: 10 }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <DimensionDot dim={r.dim}/>
                <span className="mono" style={{ color: "var(--fg-3)", fontSize: 10.5 }}>#{r.id}</span>
                <div style={{ flex: 1 }}/>
                <StageBadge stage={r.stage}/>
              </div>
              <div style={{ color: "var(--fg-0)", fontWeight: 500, fontSize: 13.5, marginBottom: 6 }}>{r.title}</div>
              <div style={{ color: "var(--fg-3)", fontSize: 11.5, marginBottom: 12 }} className="mono">{r.horizon} · {r.signals} signals</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "4px 8px", fontSize: 11 }}>
                <span style={{ color: "var(--fg-3)" }}>{t("impact")}</span><BarMeter value={r.impact} color="var(--accent)"/><span className="mono">{r.impact}</span>
                <span style={{ color: "var(--fg-3)" }}>{t("novelty")}</span><BarMeter value={r.novelty} color="var(--ai)"/><span className="mono">{r.novelty}</span>
                <span style={{ color: "var(--fg-3)" }}>{t("maturity")}</span><BarMeter value={r.maturity} color="#F59E0B"/><span className="mono">{r.maturity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'tiles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, padding: '0 24px' }}>
          {rows.map(tr => (
            <div key={tr.id} className="card" style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }} onClick={() => onOpenTrend(tr.id)}>
              {tr.imageUrl ? (
                <img src={tr.imageUrl} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: 200, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-4)', fontSize: 32 }}>
                  ◻
                </div>
              )}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tr.title}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--fg-3)' }}>
                  {tr.dim} · {tr.stage}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'signals' && (
        <div className="scroll" style={{ flex: 1, padding: 16, overflow: 'auto' }}>
          {signalsLoading && (
            <div style={{ textAlign: 'center', color: 'var(--fg-3)', padding: 48, fontSize: 13 }}>Loading signals…</div>
          )}
          {!signalsLoading && signals.length === 0 && (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <Icon name="zap" size={22} />
              </div>
              <div style={{ color: 'var(--fg-1)', fontWeight: 500, marginBottom: 6 }}>No signals yet</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>Signals will appear here once captured via manual entry, URL, PDF, or AI Scout.</div>
            </div>
          )}
          {!signalsLoading && signals.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, alignContent: 'start' }}>
              {signals.map(s => (
                <SignalCard key={s.id} signal={s} onOpenTrend={onOpenTrend} onUpdate={(id, patch) => {
                  signalsApi.update(id, patch).then(r => {
                    const updated = r.signal || r;
                    setSignals(prev => prev.map(x => x.id === id ? { ...x, ...updated } : x));
                  }).catch(() => {});
                }} onDelete={(id) => {
                  signalsApi.remove(id).then(() => setSignals(prev => prev.filter(x => x.id !== id))).catch(() => {});
                }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SignalCard = ({ signal: s, onOpenTrend, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: s.title, source: s.source || '', url: s.url || '', summary: s.summary || '' });
  const isMock = s.channel === 'mock';
  const rawDate = s.createdAt ? new Date(s.createdAt) : null;
  const date = s.dateLabel || (rawDate && !isNaN(rawDate) ? rawDate.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '');
  const channelLabel = { manual: 'Manuell', mock: 'Demo', url: 'URL', pdf: 'PDF', 'ai-scout': 'AI Scout' }[s.channel] || s.channel;
  const dotColor = { manual: '#3B82F6', mock: '#3B82F6', url: '#10B981', pdf: '#F59E0B', 'ai-scout': '#A78BFA' }[s.channel] || 'var(--fg-3)';
  const isAssigned = !!(s.trendId || s.clusterId);

  const handleSave = () => {
    onUpdate(s.id, { title: form.title, source: form.source, url: form.url, summary: form.summary });
    setEditing(false);
  };

  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {editing ? (
        <>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Name" autoFocus style={{ fontSize: 13, fontWeight: 500 }} />
          <input className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Quelle (z.B. TechCrunch, Reuters)" style={{ fontSize: 12 }} />
          <input className="input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="URL" style={{ fontSize: 12 }} />
          <textarea className="input" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Beschreibung" rows={2} style={{ fontSize: 12, height: 'auto', fontFamily: 'inherit', resize: 'vertical', padding: '8px 10px' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn primary sm" style={{ fontSize: 11 }} onClick={handleSave}><Icon name="check" size={10}/> Speichern</button>
            <button className="btn sm" style={{ fontSize: 11 }} onClick={() => setEditing(false)}>Abbrechen</button>
            <div style={{ flex: 1 }}/>
            {!isMock && <button className="btn ghost sm" style={{ fontSize: 11, color: 'var(--hot)' }} onClick={() => onDelete(s.id)}><Icon name="x" size={10}/> Löschen</button>}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <span style={{ color: 'var(--fg-0)', fontWeight: 500, fontSize: 13.5, flex: 1 }}>{s.title}</span>
            <span className="mono" style={{ color: 'var(--fg-3)', fontSize: 10.5 }}>{channelLabel}</span>
          </div>
          {(s.source || s.url) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-3)', fontSize: 11.5 }}>
              <Icon name="link" size={11} />
              <span className="mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{s.source}{s.url && s.source ? ' · ' : ''}{s.url && <a href={s.url} target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Link</a>}</span>
            </div>
          )}
          {s.summary && (
            <div style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4 }}>{s.summary}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {(s.tags || []).map(tag => <span key={tag} className="chip" style={{ fontSize: 10.5 }}>{tag}</span>)}
            <div style={{ flex: 1 }} />
            {date && <span className="mono" style={{ color: 'var(--fg-3)', fontSize: 10.5 }}>{date}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {isAssigned ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-2)', background: 'var(--bg-2)', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--line-2)' }}>
                <Icon name="check" size={11} />
                {s.trendId && <button onClick={() => onOpenTrend(s.trendId)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontSize: 11, fontWeight: 500 }}>Trend #{s.trendId}</button>}
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)', background: 'var(--bg-1)', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--line-1)' }}>
                <Icon name="minus" size={11} /> unassigned
              </span>
            )}
            <div style={{ flex: 1 }}/>
            <button className="btn ghost sm" style={{ height: 22, fontSize: 10 }} onClick={() => { setForm({ title: s.title, source: s.source || '', url: s.url || '', summary: s.summary || '' }); setEditing(true); }}><Icon name="edit" size={10}/> Edit</button>
          </div>
        </>
      )}
    </div>
  );
};

export const FilterSelect = ({ value, onChange, options }) => (
  <div style={{ position: "relative" }}>
    <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ appearance: "none", paddingRight: 26, background: "var(--bg-2)" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
    <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-3)" }}>
      <Icon name="chevronDown" size={12}/>
    </div>
  </div>
);
