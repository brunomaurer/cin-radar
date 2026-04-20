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
  - `claude-haiku-4-5-20251001` für Relations-Ranking (schneller, günstiger)

## Environment Variables (Vercel)

Gesetzt in Vercel Dashboard → Settings → Environment Variables:

- `ANTHROPIC_API_KEY` — manuell von console.anthropic.com
- `REDIS_URL` — automatisch gesetzt durch die Upstash Redis Marketplace Integration (Storage → Connect)

## Datenhaltung

**Statische Mock-Daten** (im JS-Bundle, von allen identisch gesehen):
- `src/data.js` — Trends, Signals, Projects, Funnel-Stages, Dimensionen
- `src/campaigns_data.js` — Campaigns, Ideas, Clusters, Participants
- `src/i18n.js` — DE/EN Übersetzungen

**Benutzerdaten in Redis** (shared zwischen allen Besuchern der App):
- `trends:index` (Liste) + `trend:<id>` — vom User erfasste/editierte Trends
- `concepts:index` (Liste) + `concept:<id>` — MVP-Initiative-Konzepte (Brief, Artefakte, Chat-History)
- `relations:<trendId>` — AI-gerankte Related-Trends, 24h TTL

**localStorage** (pro Browser, nicht shared):
- `cin-pipeline-board` — Pipeline-Board Karten-Reihenfolge
- `cin-kanban-<projectId>` — Kanban-Board pro Initiative
- `cin-ai-dismissed` — AI-Inbox dismissed IDs

**Merge-Logik Trends**: Frontend mergt Mock + KV-Trends by `id`. KV überschreibt Mock bei gleicher id. Beim Bearbeiten eines Mock-Trends (Slider bewegen, Titel ändern) wird automatisch ein KV-Override mit gleicher id angelegt.

## URL-Routen (Frontend)

| URL | Ansicht |
|-----|---------|
| `/` | Dashboard |
| `/explore` | Trend-Explorer (Tabelle + Cards, Filter, Sort) |
| `/trend/:id` | Trend-Detail + Editor (Slider, AI-Relations) |
| `/process/:stage` | Pipeline (`scout` · `cluster` · `validate` · `rate` · `initiative`) |
| `/campaign/:id` | Campaign-Workspace |
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

API-Parameter sind als Query-String (nicht Path) implementiert, weil Vercel's Serverless-Routing bei `api/foo.js` + `api/foo/[id].js` zu Ambiguitäten geführt hat.

## Dateistruktur

```
api/
├── _shared.js          # Anthropic-Client, kv-Wrapper (ioredis), readBody, envCheck
├── chat.js             # POST — Chat mit Brief/Artefakt-Kontext
├── generate.js         # POST — Artefakt pro Call (max 2048 tokens)
├── concepts.js         # list/create/get/update/delete (Query-Param ?id)
├── trends.js           # list/create/get/update/delete
└── relations.js        # POST — Similarity-Ranking, 24h Cache

src/
├── main.jsx            # React-Entry
├── app.jsx             # Root, Routing, Data-Merging (Mock+KV), Dialog-State
├── router.js           # parseRoute, buildPath, useLocation Hook
├── api.js              # Frontend-Clients (conceptsApi, trendsApi, chatApi, generateApi, relationsApi)
├── useLocalStorage.js  # useLocalStorage-Hook
├── tokens.css          # Design-Tokens + chip/button/slider-Styles
├── data.js             # Mock-Trends/Signals/Projects
├── campaigns_data.js   # Mock-Campaigns/Ideas/Clusters
├── i18n.js             # DE/EN Übersetzungen
├── ui.jsx              # Icon, BarMeter, Sparkline, StageBadge, DimensionDot
├── shell.jsx           # Sidebar + Header
├── viz.jsx             # Radar, Matrix, Timeline, Funnel
├── dashboard.jsx       # Dashboard-View
├── explorer.jsx        # Trend-Explorer
├── detail.jsx          # Trend-Detail mit Tabs, editable Rating, AI-Relations
├── process.jsx         # Pipeline + Board, fetcht KV-Konzepte für Stage 5
├── campaigns.jsx       # CampaignList + Workspace + CaptureDialog + ClusterReview
├── panels.jsx          # AIScout, Library, TweaksPanel, Projects, Analytics
├── initiatives.jsx     # ConceptList + ConceptWorkspace mit MVP-Coach
├── initiative.jsx      # (LEGACY, ungenutzt — Pre-KV Workspace-Variante)
└── trends.jsx          # NewTrendDialog + EditableBar (draggable Slider)

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

## Stand der Arbeit

Siehe [BACKLOG.md](./BACKLOG.md) für erledigte Punkte, als-nächstes-Prioritäten und Ideen-Sammlung.
