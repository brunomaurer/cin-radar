import { useEffect, useState } from 'react';

export function parseRoute(pathname) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return { route: 'dashboard' };
  const [head, arg] = segs;
  switch (head) {
    case 'explore':     return { route: 'explore' };
    case 'trend':       return arg ? { route: 'trendDetail', trendId: arg } : { route: 'explore' };
    case 'process':     return { route: 'process', processStage: arg || 'scout' };
    case 'campaign':    return arg ? { route: 'campaignWorkspace', campaignId: arg } : { route: 'process', processStage: 'scout' };
    case 'initiatives': return { route: 'initiatives' };
    case 'initiative':  return arg ? { route: 'initiativeDetail', initiativeId: arg } : { route: 'initiatives' };
    case 'analytics':   return { route: 'analytics' };
    case 'library':     return { route: 'library' };
    case 'dashboard':   return { route: 'dashboard' };
    default:            return { route: 'dashboard' };
  }
}

export function buildPath({ route, trendId, campaignId, initiativeId, processStage }) {
  switch (route) {
    case 'dashboard':         return '/';
    case 'explore':           return '/explore';
    case 'trendDetail':       return '/trend/' + trendId;
    case 'process':           return processStage ? '/process/' + processStage : '/process/scout';
    case 'campaignWorkspace': return '/campaign/' + campaignId;
    case 'initiatives':       return '/initiatives';
    case 'initiativeDetail':  return '/initiative/' + initiativeId;
    case 'analytics':         return '/analytics';
    case 'library':           return '/library';
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
