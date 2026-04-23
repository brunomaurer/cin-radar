import { useEffect, useState } from 'react';

export function parseRoute(pathname) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return { route: 'dashboard' };
  const [head, arg] = segs;
  switch (head) {
    case 'explore':     return { route: 'explore' };
    case 'trend':       return arg ? { route: 'trendDetail', trendId: arg } : { route: 'explore' };
    case 'process':     { const stage = arg || 'scout'; return { route: 'process', processStage: stage === 'validate' ? 'rate' : stage }; }
    case 'campaigns':   return { route: 'campaigns' };
    case 'campaign':    return arg ? { route: 'campaignWorkspace', campaignId: arg } : { route: 'campaigns' };
    case 'initiatives': return { route: 'initiatives' };
    case 'initiative':  return arg ? { route: 'initiativeDetail', initiativeId: arg } : { route: 'initiatives' };
    case 'analytics':   {
      const valid = ['radar', 'matrix', 'timeline', 'funnel', 'relations'];
      const v = valid.includes(arg) ? arg : 'radar';
      return { route: 'analytics', analyticsView: v };
    }
    case 'library':     return { route: 'library' };
    case 'cluster':     return arg ? { route: 'clusterDetail', clusterId: arg } : { route: 'process', processStage: 'cluster' };
    case 'signals':     return { route: 'signals' };
    case 'dashboard':   return { route: 'dashboard' };
    default:            return { route: 'dashboard' };
  }
}

export function buildPath({ route, trendId, campaignId, initiativeId, processStage, clusterId, analyticsView }) {
  switch (route) {
    case 'dashboard':         return '/';
    case 'explore':           return '/explore';
    case 'trendDetail':       return '/trend/' + trendId;
    case 'process':           return processStage ? '/process/' + processStage : '/process/scout';
    case 'campaigns':        return '/campaigns';
    case 'campaignWorkspace': return '/campaign/' + campaignId;
    case 'initiatives':       return '/initiatives';
    case 'initiativeDetail':  return '/initiative/' + initiativeId;
    case 'analytics':         return analyticsView ? '/analytics/' + analyticsView : '/analytics';
    case 'clusterDetail':     return '/cluster/' + clusterId;
    case 'library':           return '/library';
    case 'signals':           return '/signals';
    default:                  return '/';
  }
}

export function useLocation() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (path) => {
    if (path === window.location.pathname) return;
    window.history.pushState({}, '', path);
    setPathname(path);
  };
  return { pathname, navigate };
}
