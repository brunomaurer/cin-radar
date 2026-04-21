import { useState, useEffect } from 'react';
import { CIN_DATA } from './data.js';
import { CIN_CAMPAIGNS } from './campaigns_data.js';
import { CIN_I18N } from './i18n.js';
import { Sidebar, Header } from './shell.jsx';
import { Dashboard } from './dashboard.jsx';
import { Explorer } from './explorer.jsx';
import { TrendDetail } from './detail.jsx';
import { ProcessPipeline, AnalyticsHub, ClusterDetail } from './process.jsx';
import { CampaignList, CampaignWorkspace, CaptureDialog, ClusterReview } from './campaigns.jsx';
import { AIScout, Library, TweaksPanel } from './panels.jsx';
import { ConceptList, ConceptWorkspace } from './initiatives.jsx';
import { SignalList } from './signals.jsx';
import { NewTrendDialog } from './trends.jsx';
import { useLocation, parseRoute, buildPath } from './router.js';
import { conceptsApi, trendsApi, campaignsApi, notificationsApi } from './api.js';

const App = () => {
  const campaignsData = CIN_CAMPAIGNS;
  const { pathname, navigate } = useLocation();
  const parsed = parseRoute(pathname);
  const { route, trendId, campaignId, initiativeId, processStage, clusterId } = parsed;

  const [customTrends, setCustomTrends] = useState([]);
  useEffect(() => {
    trendsApi.list().then(r => setCustomTrends(r.trends || [])).catch(() => {});
  }, []);

  const [campaigns, setCampaigns] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  useEffect(() => {
    campaignsApi.list().then(setCampaigns).catch(() => {});
    notificationsApi.list().then(r => setUnreadNotifs(r.unread || 0)).catch(() => {});
    const pollNotifs = setInterval(() => {
      notificationsApi.list().then(r => setUnreadNotifs(r.unread || 0)).catch(() => {});
    }, 15000);
    return () => clearInterval(pollNotifs);
  }, []);

  const data = (() => {
    const byId = new Map(CIN_DATA.trends.map(t => [t.id, t]));
    for (const t of customTrends) byId.set(t.id, t);
    const trends = Array.from(byId.values());
    const owners = Array.from(new Set(trends.map(t => t.owner).filter(Boolean)));
    return { ...CIN_DATA, trends, owners };
  })();

  const [captureOpen, setCaptureOpen] = useState(false);
  const [newTrendOpen, setNewTrendOpen] = useState(false);
  const [trendPrefill, setTrendPrefill] = useState(null);
  const [clusterReviewId, setClusterReviewId] = useState(null);
  const [lang, setLang] = useState("de");
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = useState({
    density: "regular",
    accent: "blue",
    sidebar: "full",
    ai: "ambient",
  });

  const t = key => (CIN_I18N[lang]?.[key] ?? key);

  useEffect(() => {
    const accentMap = { blue: "#3B82F6", violet: "#A78BFA", teal: "#14B8A6", amber: "#F59E0B" };
    document.documentElement.style.setProperty("--accent", accentMap[tweaks.accent] || "#3B82F6");
  }, [tweaks.accent]);
  useEffect(() => { setSidebarCollapsed(tweaks.sidebar === "icons"); }, [tweaks.sidebar]);
  useEffect(() => {
    document.body.style.fontSize = tweaks.density === "compact" ? "12.5px" : tweaks.density === "cozy" ? "13.5px" : "13px";
  }, [tweaks.density]);

  useEffect(() => { window.__openAI = () => setAiOpen(true); }, []);

  const goTo = (r, sub) => navigate(buildPath({ route: r, processStage: sub }));
  const openTrend = id => navigate(buildPath({ route: "trendDetail", trendId: id }));
  const backFromTrend = () => navigate(buildPath({ route: "explore" }));
  const openCampaign = id => navigate(buildPath({ route: "campaignWorkspace", campaignId: id }));
  const backToProcess = () => navigate(buildPath({ route: "process", processStage: "scout" }));
  const openInitiative = (id) => navigate(buildPath(id ? { route: "initiativeDetail", initiativeId: id } : { route: "initiatives" }));
  const backFromInitiative = () => navigate(buildPath({ route: "initiatives" }));
  const setProcessStage = stage => navigate(buildPath({ route: "process", processStage: stage }));

  // Debounced PUT per trend-id
  const saveTimers = {};
  const updateTrend = (id, patch) => {
    setCustomTrends(prev => {
      const existing = prev.find(t => t.id === id);
      if (existing) return prev.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t);
      const mock = CIN_DATA.trends.find(t => t.id === id);
      const base = mock ? { ...mock, custom: true } : { id };
      return [...prev, { ...base, ...patch, updatedAt: new Date().toISOString() }];
    });
    if (saveTimers[id]) clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(() => {
      trendsApi.update(id, patch).catch(err => console.error('Trend-Update fehlgeschlagen', err));
    }, 400);
  };

  const launchInitiativeFromTrend = async (trend) => {
    try {
      const r = await conceptsApi.create({
        title: `MVP: ${trend.title}`,
        brief: {
          problem: trend.summary || '',
          audience: '',
          metric: '',
          timeframe: '',
          budget: '',
        },
        trendId: trend.id,
      });
      navigate(buildPath({ route: 'initiativeDetail', initiativeId: r.concept.id }));
    } catch (e) {
      alert('Konnte Initiative nicht starten: ' + e.message);
    }
  };

  let content;
  if (route === "dashboard")              content = <Dashboard data={data} campaignsData={campaignsData} onGo={goTo} onOpenTrend={openTrend} onOpenCapture={() => setNewTrendOpen(true)} onOpenTweaks={() => setTweaksOpen(true)} onOpenAI={() => setAiOpen(true)}/>;
  else if (route === "explore")           content = <Explorer t={t} data={data} search={search} onOpenTrend={openTrend} campaigns={campaigns}/>;
  else if (route === "trendDetail")       content = <TrendDetail t={t} data={data} trendId={trendId} onBack={backFromTrend} onUpdate={updateTrend} onOpenTrend={openTrend}/>;
  else if (route === "process")           content = <ProcessPipeline data={data} campaignsData={campaignsData} campaigns={campaigns} stage={processStage} setStage={setProcessStage} onOpenCampaign={openCampaign} onOpenCluster={id => setClusterReviewId(id)} onOpenCapture={() => setNewTrendOpen(true)} onOpenInitiative={openInitiative} onLaunchInitiative={launchInitiativeFromTrend} onReviewAsTrend={prefill => { setTrendPrefill(prefill); setNewTrendOpen(true); }} onOpenClusterDetail={id => navigate(buildPath({ route: 'clusterDetail', clusterId: id }))}/>;
  else if (route === "campaigns")         content = <CampaignList data={campaignsData} onOpen={openCampaign}/>;
  else if (route === "campaignWorkspace") content = <CampaignWorkspace {...campaignsData} campaignId={campaignId} onBack={() => navigate(buildPath({ route: 'campaigns' }))} onOpenCapture={() => setNewTrendOpen(true)} onOpenCluster={id => setClusterReviewId(id)}/>;
  else if (route === "initiativeDetail")  content = <ConceptWorkspace id={initiativeId} trends={data.trends} onBack={() => navigate(buildPath({ route: 'initiatives' }))}/>;
  else if (route === "clusterDetail")     content = <ClusterDetail clusterId={clusterId} campaignsData={campaignsData} onBack={() => navigate(buildPath({ route: 'process', processStage: 'cluster' }))} onReviewAsTrend={prefill => { setTrendPrefill(prefill); setNewTrendOpen(true); }}/>;
  else if (route === "analytics")         content = <AnalyticsHub t={t} data={data} onOpenTrend={openTrend}/>;
  else if (route === "initiatives")       content = <ConceptList onOpen={(id) => navigate(buildPath({ route: 'initiativeDetail', initiativeId: id }))} onGoToRate={() => navigate(buildPath({ route: 'process', processStage: 'rate' }))}/>;
  else if (route === "library")           content = <Library/>;

  const navRoute =
    route === "trendDetail" ? "explore" :
    route === "campaignWorkspace" ? "campaigns" :
    route === "initiativeDetail" ? "initiatives" :
    route;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }} data-screen-label={`CIN · ${route}`}>
      <Sidebar route={navRoute} setRoute={r => goTo(r)} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} t={t}/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header t={t} lang={lang} setLang={setLang} onOpenAI={() => setAiOpen(true)} aiPending={data.aiInbox.length} onSearch={q => { setSearch(q); if (q && route !== 'explore') navigate(buildPath({ route: 'explore' })); }} search={search} onNewTrend={() => setNewTrendOpen(true)} unreadNotifs={unreadNotifs} onMarkRead={() => { notificationsApi.markRead().then(() => setUnreadNotifs(0)).catch(() => {}); }}/>
        <main style={{ flex: 1, overflow: "hidden", background: "var(--bg-0)" }}>{content}</main>
      </div>
      <AIScout open={aiOpen} onClose={() => setAiOpen(false)} data={data} t={t}/>
      {/* CaptureDialog replaced by NewTrendDialog */}
      <NewTrendDialog
        open={newTrendOpen}
        onClose={() => { setNewTrendOpen(false); setTrendPrefill(null); }}
        prefill={trendPrefill}
        dimensions={data.dimensions}
        horizons={data.horizons}
        stages={data.stages}
        onCreated={(trend) => {
          setTrendPrefill(null);
          setCustomTrends(prev => [trend, ...prev]);
          navigate(buildPath({ route: 'trendDetail', trendId: trend.id }));
        }}
      />
      <ClusterReview open={!!clusterReviewId} onClose={() => setClusterReviewId(null)} clusters={campaignsData.clusters} ideas={campaignsData.ideas} clusterId={clusterReviewId}/>
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)}/>}
    </div>
  );
};

export default App;
