# CIN Radar — Cross Innovation Network

## Was ist das?

CIN Radar ist ein Trend- und Innovations-Radar-Tool. Es ermöglicht Teams, Signale aus verschiedenen Quellen zu erfassen, zu Trends zu clustern, Kampagnen zu fahren und Innovationsinitiativen zu steuern. Der MVP wurde in Claude Design als Prototyp gebaut und soll nun in eine saubere React-Applikation überführt werden.

## Ausgangslage

Die Quelldateien im `src/`-Ordner stammen aus einem Claude Design Export. Sie verwenden:
- **React** mit Hooks (useState, useEffect, useMemo, useRef) — aber ohne Imports (im Original via globales `React`/`ReactDOM` über CDN + Babel-im-Browser)
- **Inline-Styles** durchgehend (kein CSS-Framework)
- **CSS Custom Properties** (Design Tokens) definiert in `styles/tokens.css`
- **Globale Variablen** für Daten: `window.CIN_DATA`, `window.CIN_CAMPAIGNS`, `window.CIN_I18N`
- **Kein Bundler** — alles lief als einzelne HTML-Seite mit `<script type="text/babel">`

## Migrationsschritte

### 1. Vite + React Projekt aufsetzen
```bash
npm create vite@latest . -- --template react
npm install
```

### 2. Daten-Module konvertieren
Die drei Dateien verwenden `window.*` Globals — umstellen auf ES Module Exports:
- `src/data.js` → `export const CIN_DATA = { ... }`
- `src/campaigns_data.js` → `export const CIN_CAMPAIGNS = { ... }`
- `src/i18n.js` → `export const CIN_I18N = { ... }`

### 3. React-Imports hinzufügen
Jede JSX-Datei beginnt mit destrukturiertem `React`-Zugriff ohne Import, z.B.:
```js
const { useState, useEffect, useMemo, useRef } = React;
```
Ersetzen durch:
```js
import { useState, useEffect, useMemo, useRef } from 'react';
```

### 4. Komponenten als Module exportieren
Jede Datei definiert Komponenten als `const ComponentName = ...` ohne Export. Hinzufügen:
```js
export default ComponentName;
// oder bei mehreren Komponenten pro Datei: named exports
```

### 5. Cross-Referenzen auflösen
Komponenten referenzieren sich gegenseitig über globalen Scope. Import-Statements hinzufügen.

### 6. Design Tokens
`styles/tokens.css` enthält CSS Custom Properties (`--bg-0`, `--fg-0`, `--line-1`, `--accent` etc.) — diese in die App global importieren.

## Dateistruktur (Original)

```
src/
├── app.jsx                  # 99 Zeilen  — Root-Komponente, Routing, State
├── shell.jsx                # 122 Zeilen — Sidebar, Header, TweaksPanel
├── ui.jsx                   # 88 Zeilen  — Shared UI Primitives (Icon, Sparkline, Bars)
├── viz.jsx                  # 288 Zeilen — Radar-Chart, Bubble-Chart, Horizon-Map
├── dashboard.jsx            # 153 Zeilen — Dashboard-View mit KPIs und Widgets
├── explorer.jsx             # 200 Zeilen — Trend-Explorer (Grid/List, Filter, Suche)
├── detail.jsx               # 339 Zeilen — Trend-Detailansicht + Knowledge Base
├── process.jsx              # 395 Zeilen — Prozess-Pipeline (Scout → Cluster → Validate → Initiative)
├── campaigns.jsx            # 490 Zeilen — Kampagnen-Liste, Workspace, Capture Dialog, Cluster Review
├── panels.jsx               # 344 Zeilen — AI Scout Panel, Analytics Hub, Library
├── initiative.jsx           # 417 Zeilen — Initiative-Detail als Projekt-Workspace
├── initiative_playground.jsx # 654 Zeilen — Brief + Artefakte Studio für MVP-Specs
├── data.js                  # 73 Zeilen  — Mock-Daten (Trends, Signals, AI-Inbox, Projects, Funnel)
├── campaigns_data.js        # 107 Zeilen — Mock-Daten (Campaigns, Clusters, Ideas)
└── i18n.js                  # 98 Zeilen  — Übersetzungen DE/EN/FR
styles/
└── tokens.css               # Design Tokens (Farben, Abstände, Typografie)
uploads/
└── pasted-*.png             # Screenshot der bestehenden CIN-Plattform als Referenz
```

**Total: ~3'870 Zeilen Quellcode**

## Routing

Client-seitiges Routing über React State (kein React Router). Routes:

| Route | Komponente | Beschreibung |
|-------|-----------|--------------|
| `dashboard` | Dashboard | KPI-Übersicht, Quick Actions, Recent Activity |
| `explore` | Explorer | Trend-Explorer mit Grid/List-Toggle, Filtern |
| `trendDetail` | TrendDetail | Einzelner Trend mit Signals, Knowledge Base |
| `process` | ProcessPipeline | 4-stufige Pipeline: Scout → Cluster → Validate → Initiative |
| `campaignWorkspace` | CampaignWorkspace | Kampagnen-Detail mit Ideen und Cluster-Review |
| `analytics` | AnalyticsHub | Analytik-Dashboard |
| `initiatives` | ProcessPipeline (stage=initiative) | Initiativen-Übersicht |
| `initiativeDetail` | InitiativePlayground | Projekt-Workspace mit Brief + Artefakte |
| `library` | Library | Wissens-Bibliothek |

## Datenmodell (Mock)

### CIN_DATA
- `dimensions`: ["Technology", "Society", "Economy", "Ecology", "Politics", "Values"]
- `horizons`: ["H1 · 0–2 yrs", "H2 · 2–5 yrs", "H3 · 5–10 yrs"]
- `stages`: ["Signal", "Emerging", "Trend", "Mainstream", "Fading"]
- `trends[]`: id, title, dim, horizon, stage, impact, novelty, maturity, signals, sources, owner, updated, ai, tags, summary
- `signals[]`: id, trendId, title, source, date, lang, strength, type
- `aiInbox[]`: AI-surfaced Signals awaiting review
- `projects[]`: id, title, stage, trends[], lead, progress
- `funnelStages[]`: Pipeline-Stufen mit Counts
- `owners[]`: Abgeleitet aus Trends

### CIN_CAMPAIGNS
- `campaigns[]`, `clusters[]`, `ideas[]`

### CIN_I18N
- Sprachen: de, en, fr
- ~30 Keys für UI-Labels

## Design

- **Accent Colors**: Blue (#3B82F6), Violet (#A78BFA), Teal (#14B8A6), Amber (#F59E0B)
- **Fonts**: Inter (via Google Fonts)
- **Dark/Light**: Via CSS Custom Properties in tokens.css
- **Layout**: Sidebar (220px / 56px collapsed) + Header + Main Content
- **Density**: compact (12.5px), regular (13px), cozy (13.5px)

## Wichtige Hinweise

- Das Bild in `uploads/` zeigt die bestehende CIN-Plattform (Cross Innovation Network) — der Radar MVP soll diese ergänzen/ersetzen.
- i18n: Default-Sprache ist Deutsch (`de`).
- Der Code ist funktional und als Prototyp vollständig — alle Views rendern und sind interaktiv.
- Inline-Styles sind bewusst gewählt im Prototyp. Bei der Migration entscheiden, ob Tailwind, CSS Modules, oder styled-components besser passen.
