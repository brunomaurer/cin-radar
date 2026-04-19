// Shared UI primitives (icons, sparkline, bars)
export const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    radar: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 3v9l6 3"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></>,
    matrix: <><path d="M3 21V3h18"/><path d="M3 15h18M3 9h18M9 21V3M15 21V3"/></>,
    timeline: <><path d="M3 12h18"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></>,
    funnel: <><path d="M3 5h18l-7 8v6l-4 2v-8z"/></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
    book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 5v14"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></>,
    sparkles: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    filter: <><path d="M3 5h18M6 12h12M10 19h4"/></>,
    sort: <><path d="M7 4v16M7 4l-3 3M7 4l3 3"/><path d="M17 20V4M17 20l-3-3M17 20l3-3"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8V9a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1z"/></>,
    arrowRight: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
    check: <><path d="M5 12l4 4 10-10"/></>,
    x: <><path d="M6 6l12 12M18 6L6 18"/></>,
    chevronDown: <><path d="M6 9l6 6 6-6"/></>,
    chevronRight: <><path d="M9 6l6 6-6 6"/></>,
    ext: <><path d="M14 4h6v6"/><path d="M20 4L10 14"/><path d="M20 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5"/></>,
    bolt: <><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></>,
    trendUp: <><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11 5"/><path d="M14 11a5 5 0 0 0-7.1 0L4 13.9a5 5 0 0 0 7.1 7.1L13 19"/></>,
    dot: <><circle cx="12" cy="12" r="3" fill="currentColor"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    command: <><path d="M9 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3 3 3 0 0 0 3-3V8a3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3H9"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    download: <><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></>,
    star: <><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"/></>,
    fire: <><path d="M12 3s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-5 0 2 1 3 2 3 0-3 1-6 1-8z"/></>,
    hash: <><path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    board: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></>,
    users: <><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21a6 6 0 0 0-5-6"/></>,
    message: <><path d="M21 12a8 8 0 0 1-12 7l-5 2 1.5-4.5A8 8 0 1 1 21 12z"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

export const BarMeter = ({ value, max = 100, color = "var(--accent)", height = 4 }) => (
  <div style={{ position: "relative", width: "100%", height, background: "var(--bg-3)", borderRadius: 999, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(value/max)*100}%`, background: color, borderRadius: 999 }} />
  </div>
);

export const Sparkline = ({ points, color = "var(--accent)", width = 80, height = 22 }) => {
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i*step} ${height - ((p-min)/range)*(height-2) - 1}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const StageBadge = ({ stage }) => {
  const map = {
    "Signal":     { cls: "", dot: "dim" },
    "Emerging":   { cls: "accent", dot: "accent" },
    "Trend":      { cls: "warn", dot: "warn" },
    "Mainstream": { cls: "ok", dot: "ok" },
    "Fading":     { cls: "", dot: "hot" },
  };
  const v = map[stage] || {};
  return <span className={"chip " + (v.cls || "")}><span className={"dot " + (v.dot || "accent")} />{stage}</span>;
};

export const DimensionDot = ({ dim, size = 8 }) => {
  const map = {
    Technology: "#60A5FA", Society: "#F472B6", Economy: "#FBBF24",
    Ecology: "#34D399", Politics: "#FB7185", Values: "#A78BFA"
  };
  return <span style={{ width: size, height: size, borderRadius: 2, background: map[dim] || "#94A3B8", display: "inline-block" }} />;
};
