# CIN Radar

Trend- und Innovations-Radar. Vite + React SPA deployed auf Vercel, mit Vercel Serverless Functions als Backend, Upstash Redis als Datastore und Anthropic Claude für die AI-Features.

## Live

- **Production**: https://cin-radar.vercel.app
- **Repo**: https://github.com/brunomaurer/cin-radar
- **Deployment**: Jeder Push auf `main` triggert automatisch einen Vercel-Build (~60s bis live).

## Tech Stack

- **Frontend**: React 18 + Vite 5. Inline-Styles + Design-Tokens in `src/tokens.css`. Eigener Mini-Router (`src/router.js`) via `pushState` + `popstate`.
- **Backend**: Vercel Serverless Functions im `api/`-Verzeichnis (Node Runtime).
- **DB**: Upstash Redis (via Vercel Marketplace Integration), gesprochen via `ioredis` mit einem kleinen KV-Wrapper (`api/_shared.js`).
- **AI**: Anthropic Claude
  - `claude-sonnet-4-6` für MVP-Coach-Chat und Artefakt-Generierung
  - `claude-haiku-4-5-20251001` für Relations-Ranking, Signal-Crawling, Idea-Generierung, Proposals, Signal-Drafts

## Environment Variables (Vercel)

Gesetzt in Vercel Dashboard → Settings → Environment Variables:

- `ANTHROPIC_API_KEY` — manuell von console.anthropic.com
- `REDIS_URL` — automatisch gesetzt durch die Upstash Redis Marketplace Integration (Storage → Connect)

## Datenhaltung

**Statische Mock-Daten** (im JS-Bundle, von allen identisch gesehen):
- `src/data.js` — Trends, Signals, Funnel-Stages, Dimensionen (Projects entfernt in v2)
- `src/campaigns_data.js` — Campaigns, Ideas, Clusters, Participants
- `src/i18n.js` — DE/EN Übersetzungen

**Benutzerdaten in Redis** (shared zwischen allen Besuchern der App):
- `trends:index` (Liste) + `trend:<id>` — vom User erfasste/editierte Trends
- `concepts:index` (Liste) + `concept:<id>` — MVP-Initiative-Konzepte (Brief, Artefakte, Chat-History)
- `signals:index` (Liste) + `signal:<id>` — Signale (manuell, URL, AI-Scout)
- `campaigns:index` (Liste) + `campaign:<id>` — Kampagnen (inkl. ideas[], tags[], tagColors{})
- `clusters:index` (Liste) + `cluster:<id>` — Cluster (manuell oder AI)
- `relations:<trendId>` — AI-gerankte Related-Trends, 24h TTL
- `notifications` — Array der letzten 50 Notifications

**localStorage** (pro Browser, nicht shared):
- `cin-pipeline-board` — Pipeline-Board Karten-Reihenfolge
- `cin-kanban-<projectId>` — Kanban-Board pro Initiative
- `cin-ai-dismissed` — AI-Inbox dismissed IDs
- `cin-hidden-trends` — Array von gelöschten/versteckten Trend-IDs

**Merge-Logik Trends**: Frontend mergt Mock + KV-Trends by `id`. KV überschreibt Mock bei gleicher id. Beim Bearbeiten eines Mock-Trends wird automatisch ein KV-Override in Redis angelegt. Gelöschte Trends werden in `cin-hidden-trends` (localStorage) gespeichert und rausgefiltert.

## URL-Routen (Frontend)

| URL | Ansicht |
|-----|---------|
| `/` | Dashboard |
| `/explore` | Trend-Explorer (Tabelle + Cards, Filter, Sort) |
| `/trend/:id` | Trend-Detail + Editor (Slider, AI-Relations) |
| `/explore?view=signals` | Signal-Ansicht im Explorer |
| `/process/:stage` | Pipeline (`scout` · `cluster` · `rate` · `initiative`) — 4 Stages |
| `/campaigns` | Kampagnen-Liste |
| `/campaign/:id` | Campaign-Workspace (Idea Stream, Cluster Map, AI Proposals) |
| `/cluster/:id` | Cluster-Detail |
| `/initiatives` | MVP-Werkstatt Liste |
| `/initiative/:id` | MVP-Werkstatt (Brief + Artefakte + Coach-Chat) |
| `/analytics` | Radar + Matrix + Timeline + Funnel |
| `/library` | Knowledge-Library (Sources, Methods, Glossary, Exports, Prompts) |

SPA-Fallback via `vercel.json` und `public/_redirects` — Deep-Links funktionieren auch beim Reload.

## API-Routen (Backend)

- `GET /api/concepts` — Concepts-Liste
- `POST /api/concepts` — neues Concept (body: `{ title, brief, trendId }`)
- `GET/PUT/DELETE /api/concepts?id=<cid>` — einzelnes Concept
- `GET /api/trends` — alle KV-Trends (ohne Mock)
- `POST /api/trends` — neuer Trend
- `GET/PUT/DELETE /api/trends?id=<tid>` — einzelner Trend
- `POST /api/chat` — MVP-Coach Chat (body: `{ messages, system?, context? }` → `{ reply }`)
- `POST /api/generate` — Ein Artefakt generieren (body: `{ brief, trend?, artefact: 'claude'|'prd'|'tech'|'deck'|'prompt'|'email' }` → `{ id, body, words }`)
- `POST /api/relations` — AI-Ranking (body: `{ trend, candidates, force? }` → `{ related: [{id, score, reason}] }`)
- `GET/POST/PUT/DELETE /api/signals` — Signal CRUD (`?id=<sid>`)
- `GET/POST/PUT/DELETE /api/campaigns` — Kampagnen CRUD (`?id=<cid>`)
- `GET/POST/PUT/DELETE /api/clusters` — Cluster CRUD (`?id=<clid>`)
- `POST /api/crawl-signals` — AI-Crawler: generiert Signale für einen Trend (Haiku)
- `POST /api/cluster-to-trend` — Cluster → vorausgefüllter Trend-Steckbrief + Auto-Bild (Sonnet)
- `POST /api/generate-image` — Pollinations.ai Bild-URL (3:4 Hochformat)
- `POST /api/generate-ideas` — Idea Stream generieren für Kampagne (Haiku)
- `POST /api/generate-proposals` — AI Trend-Proposals aus Ideas (Haiku)
- `POST /api/generate-signal-draft` — Signal-Entwurf aus Freitext (Haiku)
- `GET/PUT /api/notifications` — Notifications laden / als gelesen markieren

API-Parameter sind als Query-String (nicht Path) implementiert, weil Vercel's Serverless-Routing bei `api/foo.js` + `api/foo/[id].js` zu Ambiguitäten geführt hat.

**Wichtig für API-Clients**: Listen-Endpoints wrappen Ergebnisse in Objekte (`{ signals: [...] }`, `{ campaigns: [...] }`). Die Frontend-Clients in `src/api.js` extrahieren das Array automatisch (z.B. `.then(r => r.signals || [])`).

## Dateistruktur

```
api/
├── _shared.js              # Anthropic-Client, kv-Wrapper (ioredis), readBody, envCheck
├── chat.js                 # POST — Chat mit Brief/Artefakt-Kontext
├── generate.js             # POST — Artefakt pro Call (max 2048 tokens)
├── concepts.js             # CRUD Concepts/Initiativen
├── trends.js               # CRUD Trends (inkl. imageUrl, subscribed)
├── signals.js              # CRUD Signale
├── campaigns.js            # CRUD Kampagnen (inkl. ideas[], tags[], tagColors{})
├── clusters.js             # CRUD Cluster
├── relations.js            # POST — Similarity-Ranking, 24h Cache
├── crawl-signals.js        # POST — AI-Crawler: Signale für Trend generieren (Haiku)
├── cluster-to-trend.js     # POST — Cluster → Trend-Steckbrief + Auto-Bild (Sonnet)
├── generate-image.js       # POST — Pollinations.ai Bild-URL (3:4 Hochformat)
├── generate-ideas.js       # POST — Idea Stream für Kampagne (Haiku)
├── generate-proposals.js   # POST — Trend-Proposals aus Ideas (Haiku)
├── generate-signal-draft.js # POST — Signal-Entwurf aus Freitext (Haiku)
└── notifications.js        # GET/PUT — Notifications laden/markieren

src/
├── main.jsx            # React-Entry
├── app.jsx             # Root, Routing, Data-Merging (Mock+KV), Dialog-State, Notifications
├── router.js           # parseRoute, buildPath, useLocation Hook
├── api.js              # Frontend-Clients (alle APIs + ARTEFACT_META)
├── useLocalStorage.js  # useLocalStorage-Hook
├── tokens.css          # Design-Tokens + chip/button/slider-Styles
├── data.js             # Mock-Trends/Signals/Funnel-Stages (ohne Projects)
├── campaigns_data.js   # Mock-Campaigns/Ideas/Clusters
├── i18n.js             # DE/EN Übersetzungen
├── ui.jsx              # Icon, BarMeter, Sparkline, StageBadge, DimensionDot
├── shell.jsx           # Sidebar + Header (mit Notification-Bell)
├── viz.jsx             # Radar, Matrix, Timeline, Funnel
├── dashboard.jsx       # Dashboard (4-Stage Pipeline, AI Inbox)
├── explorer.jsx        # Trend-Explorer (Table/Cards/Tiles/Signals) + SignalCard + Bulk-Actions
├── detail.jsx          # Trend-Detail (Inline-Edit, TrendImage, Signal-Abo, Signals aus Redis)
├── signals.jsx         # (Legacy — Signale jetzt im Explorer-Tab)
├── process.jsx         # Pipeline 4 Stages + ClusterStage + ClusterDetail + NewClusterDialog
├── campaigns.jsx       # CampaignList + CampaignWorkspace (Idea Stream, Cluster Map, AI Proposals)
├── panels.jsx          # AIScout (live, Run Scan, Signal-Entwurf), Library, TweaksPanel
├── initiatives.jsx     # ConceptList + ConceptWorkspace (Download, Bundle)
└── trends.jsx          # NewTrendDialog (2-Spalten, Bild rechts) + EditableBar

src/__tests__/          # Vitest Tests (70 Tests)
├── api.test.js         # API-Client Tests
├── router.test.js      # Router Tests
├── data.test.js        # Datenmodell-Validierung
api/__tests__/
└── signals.test.js     # Signals-Handler Tests

public/
└── _redirects          # Netlify-style SPA-Fallback

vercel.json             # Vercel SPA-Fallback rewrites
netlify.toml            # Alternativ-Config für Netlify (nicht aktiv)
```

## Lokal entwickeln

```bash
git clone https://github.com/brunomaurer/cin-radar.git
cd cin-radar
npm install
```

**Option A — Nur Frontend** (API-Calls gehen dann zu localhost ins Leere):
```bash
npm run dev              # http://localhost:5173
```

**Option B — Mit Backend-Funktionen** (braucht Vercel CLI + Login):
```bash
npx vercel login
npx vercel link          # auf cin-radar-Projekt verweisen
npx vercel env pull .env.development.local
npx vercel dev           # http://localhost:3000 (Frontend + API-Routen zusammen)
```

Die `.env.development.local` enthält Keys und ist via `.gitignore` (`*.local`) ausgeschlossen.

## Deployment

```bash
git push                 # Vercel redeployed automatisch
```

Bei Env-Var-Änderungen: Vercel Dashboard → Deployments → neueste → ⋯ → Redeploy.

## Kosten (Anthropic, grob)

- MVP-Coach Nachricht: ~$0.01
- Ein Artefakt generieren: ~$0.01
- Alle 6 Artefakte einmal: ~$0.06
- Relations-Ranking (Haiku, 24h-Cached): ~$0.005

$5 Anthropic-Credit reicht für viele Stunden Prototyping.

## UX-Guidelines

- **Löschen nur im Edit-Modus** — überall konsistent: zuerst "Bearbeiten" klicken, dann erscheint "Löschen"
- **Bestätigungsdialog** bei destruktiven Aktionen (Kampagne löschen, Bulk-Delete Trends)
- **Bilder im Hochformat** — 3:4 (600x800px) via Pollinations.ai, generiert aus Titel+Dimension+Summary
- **Rating-Slider nur im Edit-Modus** — Impact/Novelty/Maturity sind read-only bis "Bearbeiten" geklickt wird
- **textarea braucht `height: auto`** — die `.input` CSS-Klasse setzt `height: 30px`, muss für textareas überschrieben werden

## Tests

```bash
npm test          # Vitest run (70 Tests)
npm run test:watch  # Vitest watch mode
```

## Stand der Arbeit

- Siehe [BACKLOG.md](./BACKLOG.md) für Prioritäten und Ideen-Sammlung
- Siehe [docs/CHANGELOG-v2.md](./docs/CHANGELOG-v2.md) für alle v2-Änderungen (86 Commits, 20.–23. April 2026)
- Siehe [docs/specs/2026-04-20-cin-radar-v2-design.md](./docs/specs/2026-04-20-cin-radar-v2-design.md) für das v2-Design
- Siehe [docs/superpowers/plans/2026-04-20-cin-radar-v2.md](./docs/superpowers/plans/2026-04-20-cin-radar-v2.md) für den Implementierungsplan
