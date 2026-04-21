// Campaigns list + workspace + capture dialog + cluster review
import { useState, useEffect } from 'react';
import { Icon, BarMeter, DimensionDot, StageBadge } from './ui.jsx';
import { campaignsApi, generateIdeasApi } from './api.js';

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
      onCreated(campaign.campaign || campaign);
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
          <textarea className="input" placeholder="Beschreibung — Ziel, Kontext, erwartete Ergebnisse…" value={form.description} onChange={e => set('description', e.target.value)} rows={6} style={{ resize: 'vertical', width: '100%', height: 'auto', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, padding: '10px 12px' }} />
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
  const [apiCampaigns, setApiCampaigns] = useState([]);
  const statusColor = { Active: "ok", Open: "accent", Closed: "" };

  useEffect(() => {
    campaignsApi.list().then(r => setApiCampaigns(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const allCampaigns = [...data.campaigns, ...apiCampaigns.filter(ac => !data.campaigns.some(mc => mc.id === ac.id))];
  const campaigns = allCampaigns.filter(c => filter === "all" ? true : (c.status || 'active').toLowerCase() === filter);

  return (
    <div style={{ padding: 20, overflow: "auto", height: "100%" }} className="scroll">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--fg-0)" }}>Kampagnen</h1>
          <p style={{ margin: "4px 0 0", color: "var(--fg-2)", fontSize: 13 }}>
            Kampagnen erstellen, Signale sammeln, Cluster bilden, Trends ableiten.
          </p>
        </div>
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
                {(c.tags || []).map(t => <span key={t} className="chip"><Icon name="hash" size={10}/>{t}</span>)}
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{c.owner}</span>
            <span className={"chip " + (statusColor[c.status] || "")}><span className={"dot " + (statusColor[c.status] || "accent")}/>{c.status}</span>
            <div className="mono" style={{ fontSize: 12, color: "var(--fg-1)" }}>{c.signals || 0} · <span style={{ color: "var(--fg-3)" }}>{c.clusters || 0} clusters</span></div>
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
      <NewCampaignDialog open={newCampaignOpen} onClose={() => setNewCampaignOpen(false)} onCreated={(c) => { setApiCampaigns(prev => [c, ...prev]); }} />
    </div>
  );
};

export const CampaignWorkspace = ({ campaigns, ideas: mockIdeas, clusters, participants, campaignId, onBack, onOpenCapture, onOpenCluster }) => {
  const [apiCampaign, setApiCampaign] = useState(null);
  const [ideaStream, setIdeaStream] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', question: '', description: '' });
  const [proposals, setProposals] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [status, setStatus] = useState('active');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const isMock = !!campaigns.find(x => x.id === campaignId);

  useEffect(() => {
    // Reset state when switching campaigns
    setIdeaStream([]);
    setProposals([]);
    setSelectedCluster(null);
    setApiCampaign(null);
    setEditing(false);
    setTags([]);

    const found = campaigns.find(x => x.id === campaignId);
    if (found) {
      setEditForm({ title: found.title, question: found.question || '', description: found.description || '' });
      setStatus((found.status || 'active').toLowerCase());
      setTags(found.tags || []);
      // For mock campaigns, seed the idea stream from mock data
      setIdeaStream(mockIdeas.map(i => ({
        id: i.id,
        text: i.text,
        source: i.role === 'agent' ? 'ai' : 'manual',
        type: i.type || 'signal',
        author: i.author,
        timestamp: i.ago,
        cluster: i.cluster,
      })));
      // Build proposals from clusters that have proposed=true
      setProposals(clusters.filter(cl => cl.proposed).map(cl => ({
        id: cl.id,
        title: cl.trendName,
        confidence: cl.confidence,
        sourceIdeas: mockIdeas.filter(i => i.cluster === cl.id).length,
        cluster: cl,
      })));
    } else {
      campaignsApi.get(campaignId).then(r => {
        const camp = r.campaign || r;
        setApiCampaign(camp);
        setEditForm({ title: camp.title, question: camp.question || '', description: camp.description || '' });
        setStatus((camp.status || 'active').toLowerCase());
        setTags(camp.tags || []);
        // Load saved ideas from campaign object
        if (camp.ideas && camp.ideas.length > 0) {
          setIdeaStream(camp.ideas);
        }
      }).catch(() => {});
    }
  }, [campaignId]);

  const c = campaigns.find(x => x.id === campaignId) || apiCampaign || campaigns[0];
  if (!c) return null;

  const handleGenerateIdeas = async () => {
    setGenerating(true);
    try {
      const result = await generateIdeasApi.generate({
        title: c.title,
        question: c.question || '',
        description: c.description || '',
      });
      const newIdeas = (result.ideas || []).map((idea, idx) => ({
        id: `gen-${Date.now()}-${idx}`,
        text: idea.text,
        source: 'ai',
        type: idea.type || 'signal',
        tags: idea.tags || [],
        timestamp: 'just now',
      }));
      const updated = [...ideaStream, ...newIdeas];
      setIdeaStream(updated);
      // Persist to campaign if API-based
      if (!isMock) {
        campaignsApi.update(campaignId, { ideas: updated }).catch(() => {});
      }
    } catch (e) {
      alert('Error generating ideas: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddIdea = () => {
    if (!newIdeaText.trim()) return;
    const newIdea = {
      id: `manual-${Date.now()}`,
      text: newIdeaText.trim(),
      source: 'manual',
      type: 'observation',
      timestamp: 'just now',
    };
    const updated = [...ideaStream, newIdea];
    setIdeaStream(updated);
    setNewIdeaText('');
    setSelectedCluster(null); // show all so the new idea is visible
    if (!isMock) {
      campaignsApi.update(campaignId, { ideas: updated }).catch(() => {});
    }
  };

  const handleDeleteIdea = (ideaId) => {
    const updated = ideaStream.filter(i => i.id !== ideaId);
    setIdeaStream(updated);
    if (!isMock) {
      campaignsApi.update(campaignId, { ideas: updated }).catch(() => {});
    }
  };

  const handleEditIdea = (ideaId, newText) => {
    const updated = ideaStream.map(i => i.id === ideaId ? { ...i, text: newText } : i);
    setIdeaStream(updated);
    if (!isMock) {
      campaignsApi.update(campaignId, { ideas: updated }).catch(() => {});
    }
  };

  const handleAssignTag = (ideaId, tag) => {
    const updated = ideaStream.map(i => {
      if (i.id !== ideaId) return i;
      const existingTags = i.tags || [];
      if (existingTags.includes(tag)) return i;
      return { ...i, tags: [...existingTags, tag] };
    });
    setIdeaStream(updated);
    if (!isMock) {
      campaignsApi.update(campaignId, { ideas: updated }).catch(() => {});
    }
  };

  const startEdit = () => {
    setEditForm({ title: editForm.title || c.title, question: editForm.question || c.question || '', description: editForm.description || c.description || '' });
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const saveEdit = () => {
    setEditing(false);
    if (!isMock) {
      campaignsApi.update(campaignId, editForm).catch(() => {});
    }
  };

  const handleDismissProposal = (proposalId) => {
    setProposals(prev => prev.filter(p => p.id !== proposalId));
  };

  const statusCycle = ['active', 'open', 'closed'];
  const statusColors = { active: 'ok', open: 'accent', closed: '' };
  const handleStatusToggle = () => {
    const next = statusCycle[(statusCycle.indexOf(status) + 1) % statusCycle.length];
    setStatus(next);
    if (!isMock) {
      campaignsApi.update(campaignId, { status: next }).catch(() => {});
    }
  };

  const handleDelete = () => {
    if (!confirm('Kampagne wirklich löschen?')) return;
    if (!isMock) {
      campaignsApi.remove(campaignId).then(() => onBack()).catch(() => alert('Fehler beim Löschen'));
    } else {
      onBack();
    }
  };

  const filteredIdeas = selectedCluster
    ? ideaStream.filter(i => (i.tags || []).includes(selectedCluster) || i.cluster === selectedCluster || (i.text && i.text.toLowerCase().includes(selectedCluster.toLowerCase())))
    : ideaStream;
  const signalCount = isMock ? (c.signals || 0) : ideaStream.length;
  const clusterCount = isMock ? (c.clusters || clusters.length) : 0;
  const proposalCount = proposals.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "100%", overflow: "auto" }} className="scroll">
      {/* Left column ~65% */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid var(--line-1)" }}>
        {/* Top bar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-1)" }}>
          <button onClick={onBack} style={{ color: "var(--fg-3)", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="arrowLeft" size={12}/> All campaigns</button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <button onClick={handleStatusToggle} className={`chip ${statusColors[status] || ''}`} style={{ cursor: 'pointer' }} title="Klick zum Ändern">
                  <span className={`dot ${statusColors[status] || 'accent'}`}/>{status}
                </button>
              </div>
              {editing ? (
                <>
                  <input className="input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} autoFocus
                    style={{ fontSize: 19, fontWeight: 600, color: "var(--fg-0)", width: '100%', marginBottom: 8 }} placeholder="Titel" />
                  <input className="input" value={editForm.question} onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                    style={{ width: '100%', fontSize: 13, marginBottom: 8 }} placeholder="Leitfrage" />
                  <textarea className="input" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={4} style={{ width: '100%', height: 'auto', fontSize: 12.5, fontFamily: 'inherit', lineHeight: 1.5, padding: '10px 12px', resize: 'vertical' }} placeholder="Beschreibung" />
                </>
              ) : (
                <>
                  <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "var(--fg-0)" }}>{editForm.title || c.title}</h1>
                  {(editForm.question || c.question) && <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 13, fontStyle: 'italic' }}>«{editForm.question || c.question}»</p>}
                  {(editForm.description || c.description) && <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 12.5, lineHeight: 1.5 }}>{editForm.description || c.description}</p>}
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {editing ? (
                <>
                  <button className="btn sm" onClick={cancelEdit}>Abbrechen</button>
                  <button className="btn primary sm" onClick={saveEdit}><Icon name="check" size={13}/> Speichern</button>
                </>
              ) : (
                <>
                  <button className="btn sm" onClick={startEdit}><Icon name="edit" size={13}/> Bearbeiten</button>
                  <button className="btn ai sm" onClick={onOpenCapture}><Icon name="plus" size={12}/> Neuer Trend</button>
                  <button className="btn sm" onClick={handleDelete} style={{ color: 'var(--hot)' }} title="Kampagne löschen"><Icon name="x" size={12}/></button>
                </>
              )}
            </div>
          </div>

          {/* Pipeline stages */}
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {[
              { l: "Scout", n: signalCount, c: "#34D399", sub: "Signals" },
              { l: "Cluster", n: clusterCount, c: "#A78BFA", sub: "Groups" },
              { l: "Rate", n: proposalCount, c: "#F59E0B", sub: "Proposals" },
              { l: "Initiative", n: 0, c: "#60A5FA", sub: "MVPs" },
            ].map((s, i, arr) => (
              <div key={s.l} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: `${s.c}14`, border: `1px solid ${s.c}40` }}>
                  <div style={{ fontSize: 9.5, color: s.c, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>{s.l}</div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-0)", marginTop: 2 }}>{s.n}</div>
                  <div style={{ fontSize: 9.5, color: "var(--fg-3)" }}>{s.sub}</div>
                </div>
                {i < arr.length - 1 && <div style={{ color: "var(--fg-4)", flexShrink: 0 }}><Icon name="chevronRight" size={10}/></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Cluster Map — built from tags + ideas */}
        {(tags.length > 0 || (isMock && clusters.length > 0)) && (
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--line-1)", background: "var(--bg-1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-0)" }}>Cluster Map</span>
              <div style={{ flex: 1 }}/>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{tags.length || clusters.length} clusters · {ideaStream.filter(i => (i.tags || []).length > 0 || i.cluster).length} zugeordnet</span>
            </div>
            {isMock && clusters.length > 0 ? (
              <ClusterMap clusters={clusters} selected={selectedCluster} onSelect={setSelectedCluster} onOpenCluster={onOpenCluster}/>
            ) : (
              <IdeaClusterMap tags={tags} ideas={ideaStream} selected={selectedCluster} onSelect={setSelectedCluster}/>
            )}
          </div>
        )}

        {/* Idea Stream */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--line-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: clusters.length > 0 ? 8 : 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-0)" }}>Idea Stream</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{filteredIdeas.length}{selectedCluster ? ` / ${ideaStream.length}` : ''} ideas</span>
            <div style={{ flex: 1 }}/>
            {ideaStream.length > 0 && (
              <button className="btn ai sm" onClick={handleGenerateIdeas} disabled={generating}>
                <Icon name="sparkles" size={12}/> {generating ? 'Generating...' : 'Generate more'}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            <button className="chip" onClick={() => setSelectedCluster(null)}
              style={{ cursor: 'pointer', background: !selectedCluster ? 'rgba(96,165,250,0.15)' : 'transparent', borderColor: !selectedCluster ? 'rgba(96,165,250,0.4)' : 'var(--line-2)', color: !selectedCluster ? '#60A5FA' : 'var(--fg-3)' }}>
              All
            </button>
            {tags.map(tag => (
              <div key={tag} className="chip" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: selectedCluster === tag ? 'rgba(167,139,250,0.15)' : 'transparent', borderColor: selectedCluster === tag ? 'rgba(167,139,250,0.4)' : 'var(--line-2)', color: selectedCluster === tag ? '#A78BFA' : 'var(--fg-3)' }}>
                <span onClick={() => setSelectedCluster(selectedCluster === tag ? null : tag)}>{tag}</span>
                <span onClick={(e) => { e.stopPropagation(); const updated = tags.filter(t => t !== tag); setTags(updated); if (selectedCluster === tag) setSelectedCluster(null); if (!isMock) campaignsApi.update(campaignId, { tags: updated }).catch(() => {}); }}
                  style={{ cursor: 'pointer', color: 'var(--fg-4)', marginLeft: 2 }}>×</span>
              </div>
            ))}
            <input
              className="input"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newTag.trim()) { const updated = [...tags, newTag.trim()]; setTags(updated); setNewTag(''); if (!isMock) campaignsApi.update(campaignId, { tags: updated }).catch(() => {}); } }}
              placeholder="+ Tag"
              style={{ width: 70, fontSize: 11, padding: '2px 6px', height: 22 }}
            />
          </div>
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          {ideaStream.length === 0 && !generating && (
            <div style={{ padding: '40px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <button className="btn ai" onClick={handleGenerateIdeas} disabled={generating} style={{ padding: '10px 20px', fontSize: 13, width: '100%' }}>
                    <Icon name="sparkles" size={14}/> Generate Idea Stream
                  </button>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6 }}>AI erstellt 5-8 Ideen basierend auf Titel & Beschreibung</div>
                </div>
                <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>oder</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 8 }}>Eigene Ideen erfassen</div>
                </div>
              </div>
              <textarea
                className="input"
                placeholder="Eigene Idee, Beobachtung oder Hypothese eingeben… (Enter zum Hinzufügen)"
                value={newIdeaText}
                onChange={e => setNewIdeaText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddIdea(); } }}
                rows={3}
                style={{ width: '100%', resize: 'vertical', height: 'auto', fontFamily: 'inherit', fontSize: 13, padding: '10px 12px' }}
              />
              {newIdeaText.trim() && (
                <button className="btn sm" onClick={handleAddIdea} style={{ marginTop: 8 }}>Hinzufügen</button>
              )}
            </div>
          )}

          {generating && ideaStream.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
              <span className="ai-shimmer" style={{ fontSize: 13 }}>Generating idea seeds...</span>
            </div>
          )}

          {filteredIdeas.map(i => (
            <IdeaCard key={i.id} idea={i} onDelete={handleDeleteIdea} onEdit={handleEditIdea} clusters={clusters} onOpenCluster={onOpenCluster} availableTags={tags} onAssignTag={handleAssignTag} />
          ))}

          {/* Manual idea input */}
          {ideaStream.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                className="input"
                placeholder="Add an idea manually..."
                value={newIdeaText}
                onChange={e => setNewIdeaText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddIdea(); } }}
                rows={2}
                style={{ flex: 1, resize: 'none', height: 'auto', fontFamily: 'inherit', fontSize: 13, padding: '10px 12px' }}
              />
              <button className="btn sm" onClick={handleAddIdea} disabled={!newIdeaText.trim()} style={{ height: 38 }}>Add</button>
            </div>
          )}
        </div>

        {/* Cluster map moved to above Idea Stream */}
      </div>

      {/* Right column ~35% */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-1)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="ai-shimmer" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>AI Proposals</div>
            {proposals.length > 0 && <span className="chip ai mono" style={{ fontSize: 10 }}>{proposals.length} awaiting</span>}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>Trend candidates suggested by AI based on ideas and signals.</div>
        </div>
        <div className="scroll" style={{ flex: 1, overflow: "auto", padding: 14 }}>
          {proposals.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6 }}>
                Add more ideas to get AI proposals. As patterns emerge in your idea stream, the AI will suggest trend candidates here.
              </div>
            </div>
          )}

          {proposals.map(p => (
            <div key={p.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                {p.cluster && <span style={{ width: 10, height: 10, borderRadius: 999, background: p.cluster.color }}/>}
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{p.sourceIdeas} source ideas</span>
                <div style={{ flex: 1 }}/>
                <span className="mono" style={{ fontSize: 11, color: p.confidence > 0.85 ? "#34D399" : "#F59E0B" }}>{(p.confidence * 100).toFixed(0)}% conf.</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-0)", marginBottom: 4 }}>{p.title}</div>
              {p.cluster && (
                <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginBottom: 10 }}>Cluster theme: <i>{p.cluster.label}</i></div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn primary sm" onClick={() => onOpenCluster && onOpenCluster(p.id)}><Icon name="check" size={12}/> Accept</button>
                <div style={{ flex: 1 }}/>
                <button className="btn ghost sm" onClick={() => handleDismissProposal(p.id)}><Icon name="x" size={12}/> Dismiss</button>
              </div>
            </div>
          ))}

          {/* Participants section for mock campaigns */}
          {isMock && participants.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.8, margin: "18px 0 10px" }}>Participants ({participants.filter(p => p.contrib !== null).length + 41})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {participants.map((p, i) => (
                  <div key={i} title={`${p.name}${p.contrib ? ' · ' + p.contrib + ' contributions' : ''}`}
                    style={{ width: 30, height: 30, borderRadius: 999, background: p.color, color: "white", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)" }}>
                    {p.initials || "+41"}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const IdeaCard = ({ idea, onDelete, onEdit, clusters, onOpenCluster, availableTags, onAssignTag }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(idea.text);

  const cluster = clusters ? clusters.find(x => x.id === idea.cluster) : null;
  const isAI = idea.source === 'ai';

  const handleSave = () => {
    if (editText.trim() && editText !== idea.text) {
      onEdit(idea.id, editText.trim());
    }
    setEditing(false);
  };

  return (
    <div className="card" style={{ padding: 14, marginTop: 12, borderLeft: `3px solid ${cluster?.color || (isAI ? 'var(--ai)' : 'var(--line-2)')}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 999, background: isAI ? "linear-gradient(135deg,#A78BFA,#3B82F6)" : "var(--bg-3)", display: "grid", placeItems: "center", fontSize: 10, color: "white", fontWeight: 600 }}>
          {isAI ? <Icon name="sparkles" size={11}/> : (idea.author ? idea.author.split(" ").map(x => x[0]).join("").slice(0,2) : 'U')}
        </div>
        <span style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{isAI ? 'AI' : (idea.author || 'You')}</span>
        <span className="chip" style={{ fontSize: 10 }}>{idea.type || 'idea'}</span>
        {idea.tags && idea.tags.length > 0 && idea.tags.map(t => (
          <span key={t} className="chip mono" style={{ fontSize: 10 }}><Icon name="hash" size={9}/>{t}</span>
        ))}
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{idea.timestamp || ''}</span>
      </div>

      {editing ? (
        <div style={{ marginBottom: 8 }}>
          <textarea
            className="input"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            style={{ width: '100%', resize: 'vertical', height: 'auto', fontFamily: 'inherit', fontSize: 13, padding: '8px 10px' }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button className="btn primary sm" style={{ fontSize: 11 }} onClick={handleSave}><Icon name="check" size={10}/> Speichern</button>
            <button className="btn sm" style={{ fontSize: 11 }} onClick={() => setEditing(false)}>Abbrechen</button>
            <div style={{ flex: 1 }}/>
            <button className="btn ghost sm" style={{ fontSize: 11, color: 'var(--hot)' }} onClick={() => onDelete(idea.id)}><Icon name="x" size={10}/> Löschen</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "var(--fg-0)", lineHeight: 1.5, marginBottom: 10 }}>{idea.text}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {(idea.tags || []).map(t => (
              <span key={t} className="chip" style={{ background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.3)', color: '#A78BFA', fontSize: 10 }}>{t}</span>
            ))}
            {availableTags && availableTags.length > 0 && (
              <select className="input" style={{ fontSize: 10, padding: '1px 4px', height: 20, width: 'auto', minWidth: 50 }}
                value="" onChange={e => { if (e.target.value) onAssignTag?.(idea.id, e.target.value); }}>
                <option value="">+ Tag</option>
                {availableTags.filter(t => !(idea.tags || []).includes(t)).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            <div style={{ flex: 1 }}/>
            <button className="btn ghost sm" style={{ height: 24, fontSize: 11 }} onClick={() => { setEditText(idea.text); setEditing(true); }}><Icon name="edit" size={10}/> Edit</button>
          </div>
        </>
      )}
    </div>
  );
};

const TAG_COLORS = ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F472B6', '#FB923C', '#2DD4BF', '#E879F9'];

const IdeaClusterMap = ({ tags, ideas, selected, onSelect }) => {
  const W = 780, H = 220;
  // Build cluster data from tags
  const tagClusters = tags.map((tag, i) => {
    const count = ideas.filter(idea => (idea.tags || []).includes(tag)).length;
    const col = TAG_COLORS[i % TAG_COLORS.length];
    // Distribute tags evenly across the map
    const cols = Math.min(tags.length, 4);
    const row = Math.floor(i / cols);
    const colIdx = i % cols;
    const cx = (W / (cols + 1)) * (colIdx + 1);
    const cy = H * 0.35 + row * (H * 0.4);
    return { id: tag, label: tag, count, color: col, cx, cy, r: 18 + Math.min(count, 10) * 5 };
  });

  const unassigned = ideas.filter(i => !(i.tags || []).length).length;

  return (
    <div style={{ position: "relative", width: "100%", height: H, borderRadius: 10, overflow: "hidden", background: "radial-gradient(ellipse at 30% 30%, rgba(59,130,246,0.06), transparent 60%), var(--bg-0)", border: "1px solid var(--line-1)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[0.5].map(g => (
          <line key={g} y1={H*g} y2={H*g} x1="0" x2={W} stroke="var(--line-1)" strokeDasharray="2 6"/>
        ))}
        {tagClusters.map(cl => {
          const isSel = selected === cl.id;
          return (
            <g key={cl.id} style={{ cursor: "pointer" }} onClick={() => onSelect(isSel ? null : cl.id)}>
              <circle cx={cl.cx} cy={cl.cy} r={cl.r + 12} fill={cl.color} opacity="0.08"/>
              <circle cx={cl.cx} cy={cl.cy} r={cl.r + 4} fill={cl.color} opacity="0.18"/>
              <circle cx={cl.cx} cy={cl.cy} r={cl.r} fill={cl.color} fillOpacity={isSel ? 0.9 : 0.5} stroke={isSel ? "#fff" : cl.color} strokeWidth={isSel ? 2 : 1}/>
              <text x={cl.cx} y={cl.cy + 3} fontSize="12" fill={isSel ? "#0B1426" : "#fff"} fontWeight="700" textAnchor="middle">{cl.count}</text>
              <text x={cl.cx} y={cl.cy + cl.r + 14} fontSize="10" fill="var(--fg-2)" textAnchor="middle" fontWeight="500">{cl.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 12, bottom: 8, display: "flex", gap: 12, fontSize: 10, color: "var(--fg-3)" }} className="mono">
        <span>◉ size = # ideas</span>
        {unassigned > 0 && <span style={{ color: 'var(--warn)' }}>{unassigned} unassigned</span>}
      </div>
    </div>
  );
};

const ClusterMap = ({ clusters, selected, onSelect, onOpenCluster }) => {
  const W = 780, H = 260;
  return (
    <div style={{ position: "relative", width: "100%", height: H, borderRadius: 10, overflow: "hidden", background: "radial-gradient(ellipse at 30% 30%, rgba(59,130,246,0.08), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(167,139,250,0.08), transparent 60%), var(--bg-0)", border: "1px solid var(--line-1)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
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
