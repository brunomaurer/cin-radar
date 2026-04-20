// App Shell: Sidebar + Header + Tweaks
import { Icon } from './ui.jsx';

export const NAV = [
  { id: "dashboard",  icon: "grid",     key: "nav_dashboard" },
  { id: "explore",    icon: "list",     key: "nav_explore" },
  { id: "campaigns",  icon: "folder",   key: "nav_campaigns" },
  { id: "process",    icon: "funnel",   key: "nav_process" },
  { id: "analytics",  icon: "chart",    key: "nav_analytics" },
  { id: "initiatives",icon: "bolt",     key: "nav_initiatives" },
  { id: "library",    icon: "book",     key: "nav_library" },
];

export const Sidebar = ({ route, setRoute, collapsed, setCollapsed, t }) => (
  <aside style={{
    width: collapsed ? 56 : 220,
    flexShrink: 0,
    borderRight: "1px solid var(--line-1)",
    background: "var(--bg-1)",
    display: "flex", flexDirection: "column",
    transition: "width .18s ease",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderBottom: "1px solid var(--line-1)", height: 52 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #3B82F6, #A78BFA)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="white"/>
        </svg>
      </div>
      {!collapsed && (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 600, color: "var(--fg-0)", fontSize: 13, letterSpacing: 0.2 }}>CIN Radar</div>
          <div className="mono" style={{ color: "var(--fg-3)", fontSize: 10 }}>v4.2 · live</div>
        </div>
      )}
    </div>

    <nav style={{ padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV.map(n => (
        <button key={n.id} onClick={() => setRoute(n.id)} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "8px" : "8px 10px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 6,
          background: route === n.id ? "var(--bg-3)" : "transparent",
          color: route === n.id ? "var(--fg-0)" : "var(--fg-2)",
          fontSize: 12.5,
          borderLeft: route === n.id ? "2px solid var(--accent)" : "2px solid transparent",
        }}>
          <Icon name={n.icon} size={16} />
          {!collapsed && <span>{t(n.key)}</span>}
        </button>
      ))}
    </nav>

    <div style={{ flex: 1 }} />

    <div style={{ padding: 8, borderTop: "1px solid var(--line-1)" }}>
      <button onClick={() => setCollapsed(!collapsed)} className="btn ghost" style={{ width: "100%", justifyContent: collapsed ? "center" : "flex-start" }}>
        <Icon name={collapsed ? "arrowRight" : "arrowLeft"} size={14} />
        {!collapsed && <span style={{ fontSize: 12 }}>Collapse</span>}
      </button>
    </div>
  </aside>
);

export const Header = ({ t, lang, setLang, onOpenAI, aiPending, onSearch, search, onNewTrend, unreadNotifs, onMarkRead }) => (
  <header style={{
    display: "flex", alignItems: "center", gap: 12,
    height: 52, padding: "0 16px",
    background: "var(--bg-1)", borderBottom: "1px solid var(--line-1)",
    flexShrink: 0,
  }}>
    <div style={{ position: "relative", flex: 1, maxWidth: 520 }}>
      <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--fg-3)" }}>
        <Icon name="search" size={14}/>
      </div>
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={t("search")}
        className="input"
        style={{ width: "100%", paddingLeft: 30, height: 32 }}
      />
      <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
        <span className="kbd">⌘</span><span className="kbd">K</span>
      </div>
    </div>

    <button className="btn ai" onClick={onOpenAI} style={{ position: "relative" }}>
      <Icon name="sparkles" size={14}/>
      <span>{t("nav_ai")}</span>
      {aiPending > 0 && (
        <span style={{
          background: "white", color: "#4b2fb5", fontWeight: 700, fontSize: 10,
          borderRadius: 999, padding: "1px 6px", marginLeft: 4
        }}>{aiPending}</span>
      )}
    </button>

    <button className="btn" onClick={onNewTrend}>
      <Icon name="plus" size={14}/>
      <span>{t("new_trend")}</span>
    </button>

    <div style={{ width: 1, height: 22, background: "var(--line-2)" }} />

    <button className="btn ghost sm" onClick={() => setLang(lang === "de" ? "en" : "de")}>
      <Icon name="globe" size={13}/>
      <span className="mono" style={{ textTransform: "uppercase", fontSize: 11 }}>{lang}</span>
    </button>

    <button className="btn icon ghost" onClick={onMarkRead} style={{ position: 'relative' }}>
      <Icon name="bell" size={15}/>
      {unreadNotifs > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          width: 16, height: 16, borderRadius: 999,
          background: '#F43F5E', color: '#fff',
          fontSize: 9, fontWeight: 700,
          display: 'grid', placeItems: 'center',
          animation: 'pulse 2s infinite',
        }}>{unreadNotifs}</span>
      )}
    </button>

    <div style={{
      width: 30, height: 30, borderRadius: 999,
      background: "linear-gradient(135deg, #3B82F6, #A78BFA)",
      display: "grid", placeItems: "center",
      color: "white", fontSize: 11, fontWeight: 600
    }}>SA</div>
  </header>
);
