// Signal List View
import { useState, useEffect, useMemo } from 'react';
import { Icon } from './ui.jsx';
import { signalsApi } from './api.js';

const CHANNEL_COLORS = {
  manual:   '#3B82F6',
  url:      '#10B981',
  pdf:      '#F59E0B',
  'ai-scout': '#A78BFA',
};

const ChannelDot = ({ channel }) => (
  <span style={{
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: CHANNEL_COLORS[channel] || 'var(--fg-3)',
    flexShrink: 0,
  }} title={channel} />
);

const SignalCard = ({ signal, onOpenTrend }) => {
  const date = signal.createdAt
    ? new Date(signal.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '';
  const isAssigned = !!(signal.trendId || signal.clusterId);

  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ChannelDot channel={signal.channel} />
        <span style={{ color: 'var(--fg-0)', fontWeight: 500, fontSize: 13.5, flex: 1 }}>{signal.title}</span>
        <span className="mono" style={{ color: 'var(--fg-3)', fontSize: 10.5 }}>{signal.channel}</span>
      </div>

      {signal.source && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-3)', fontSize: 11.5 }}>
          <Icon name="link" size={11} />
          <span className="mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{signal.source}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {(signal.tags || []).map(tag => (
          <span key={tag} className="chip" style={{ fontSize: 10.5 }}>{tag}</span>
        ))}
        <div style={{ flex: 1 }} />
        {date && (
          <span className="mono" style={{ color: 'var(--fg-3)', fontSize: 10.5 }}>{date}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        {isAssigned ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-2)', background: 'var(--bg-2)', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--line-2)' }}>
            <Icon name="check" size={11} />
            {signal.trendId && (
              <button
                onClick={() => onOpenTrend && onOpenTrend(signal.trendId)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontSize: 11, fontWeight: 500 }}
              >
                Trend #{signal.trendId}
              </button>
            )}
            {!signal.trendId && signal.clusterId && <span>Cluster #{signal.clusterId}</span>}
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)', background: 'var(--bg-1)', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--line-1)' }}>
            <Icon name="minus" size={11} />
            unassigned
          </span>
        )}
      </div>
    </div>
  );
};

const FilterSelect = ({ value, onChange, options }) => (
  <div style={{ position: 'relative' }}>
    <select value={value} onChange={e => onChange(e.target.value)} className="input" style={{ appearance: 'none', paddingRight: 26, background: 'var(--bg-2)' }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--fg-3)' }}>
      <Icon name="chevronDown" size={12} />
    </div>
  </div>
);

export const SignalList = ({ t, onOpenTrend }) => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channel, setChannel] = useState('all');
  const [assignment, setAssignment] = useState('all');

  useEffect(() => {
    setLoading(true);
    signalsApi.list()
      .then(r => { setSignals(r.signals || []); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = signals.slice();
    if (channel !== 'all') r = r.filter(s => s.channel === channel);
    if (assignment === 'assigned')   r = r.filter(s => !!(s.trendId || s.clusterId));
    if (assignment === 'unassigned') r = r.filter(s => !(s.trendId || s.clusterId));
    return r;
  }, [signals, channel, assignment]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--line-1)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)', fontSize: 12, marginRight: 4 }}>
          <Icon name="zap" size={13} />
          <span style={{ fontWeight: 600, color: 'var(--fg-0)', fontSize: 14 }}>Signals</span>
        </div>

        <FilterSelect
          value={channel}
          onChange={setChannel}
          options={[
            ['all', 'All channels'],
            ['manual', 'Manual'],
            ['url', 'URL'],
            ['pdf', 'PDF'],
            ['ai-scout', 'AI Scout'],
          ]}
        />

        <FilterSelect
          value={assignment}
          onChange={setAssignment}
          options={[
            ['all', 'All'],
            ['assigned', 'Assigned'],
            ['unassigned', 'Unassigned'],
          ]}
        />

        <button className="btn ghost sm" onClick={() => { setChannel('all'); setAssignment('all'); }}>
          <Icon name="x" size={12} /> Clear
        </button>

        <div style={{ flex: 1 }} />

        <div className="mono" style={{ color: 'var(--fg-3)', fontSize: 11 }}>
          {filtered.length} {filtered.length !== signals.length ? `of ${signals.length} ` : ''}signal{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content */}
      <div className="scroll" style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--fg-3)', padding: 48, fontSize: 13 }}>
            Loading signals…
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', color: 'var(--hot)', padding: 48, fontSize: 13 }}>
            <Icon name="x" size={16} /> {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-2)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon name="zap" size={22} />
            </div>
            <div style={{ color: 'var(--fg-1)', fontWeight: 500, marginBottom: 6 }}>
              {signals.length === 0 ? 'No signals yet' : 'No signals match the current filters'}
            </div>
            <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>
              {signals.length === 0
                ? 'Signals will appear here once captured via manual entry, URL, PDF, or AI Scout.'
                : 'Try adjusting the channel or assignment filters.'}
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, alignContent: 'start' }}>
            {filtered.map(s => (
              <SignalCard key={s.id} signal={s} onOpenTrend={onOpenTrend} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
