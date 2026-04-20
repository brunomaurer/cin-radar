# CIN Radar — Backlog

Lebendige Liste. Neu hinzukommen unter "Als nächstes" oder "Später / Ideen". Wenn erledigt → Häkchen + Datum, verschieben nach "Erledigt".

Letztes Update: 2026-04-20

## In Arbeit

_(aktuell nichts aktiv)_

## Als nächstes (priorisiert)

1. **Capture Dialog "URL-Modus" echt machen**
   URL paste → Server fetcht HTML → Claude extrahiert `{ title, source, date, type, strength, summary, tags, dim }` → Nutzer bestätigt → wird als Signal oder Trend gespeichert. ~1–1.5h. Wow-Moment.

2. **Signals per Trend sammeln**
   Neues `/api/signals` Endpoint + "+ Signal"-Button im Trend-Detail. Manuell oder aus URL-Analyse (#1). Signale-Counter am Trend wird hochgezählt, erscheinen im Evidence-Tab.

3. **AI Scout echt verdrahten**
   Inbox-Items "Accept" → entweder Signal-Count am verknüpften Trend +1 (mit Signal-Eintrag) oder Trend-Entwurf erzeugen (prefilled `NewTrendDialog`). Aktuell entfernt Accept das Item nur aus der Inbox ohne Folge-Wirkung.

4. **Capture Dialog "PDF-Modus" echt machen**
   Multipart-Upload → `pdfjs-dist` für Text-Extract → gleicher Claude-Analyse-Flow wie #1. ~2h.

5. **Trend-Coach Chat**
   Rechts-Panel im Trend-Detail (analog zum MVP-Coach). Kontext: aktueller Trend + Signale. Fragen wie "welche Signale fehlen?", "Risiken?", "adjacent Trends?". Aufwand klein da MVP-Coach-Struktur wiederverwendbar. ~30min.

## Später / Ideen

### AI / Daten
- **AI-Scout Background-Job** — Vercel Cron monitored RSS/News-Feeds, Claude scoret gegen existierende Trends, Treffer landen in der Inbox
- **Embeddings-basierte Relations** — OpenAI text-embedding-3-small, Vektoren persistiert statt on-demand Claude (skaliert besser bei vielen Trends)
- **Voice-Capture** — Audio → Whisper (OpenAI/Groq) → Claude → Signal
- **Trend-Duplikat-Check** — beim Erfassen eines neuen Trends automatisch prüfen ob ähnlicher existiert (Claude-Vergleich)

### UX / Features
- **TrendDetail: Titel/Summary/Tags inline editierbar** — aktuell nur Rating
- **Initiative-Templates** — vorgefertigte Briefs für typische MVP-Arten (B2B SaaS, interne Tools, Pilot-Programm, ...)
- **Export-Funktionalität** — Trend-Report als PDF, Initiative-Bundle als ZIP mit allen Artefakten
- **Dashboard echte Stats** — aktuell hardcoded KPIs, sollten dynamisch aus Mock+KV berechnet werden
- **Mobile-Layout** — aktuell Desktop-first, Sidebar+Modals brauchen Anpassung
- **Dark/Light-Mode** — aktuell nur Dark, Tokens.css hat bereits Variablen die man per Theme switchen könnte
- **Tastatur-Shortcuts** — z.B. `⌘K` für Command-Palette (existiert als Design-Element, aber ohne Funktion)

### Infrastruktur / Qualität
- **Rate-Limit + Password-Gate** — API ist aktuell offen für alle mit der URL, jeder kann Anthropic-Credits verbrauchen
- **User-Accounts + Sharing** — Supabase-Migration falls Multi-User gewünscht (eigener Workspace pro User, Concept-Sharing explizit)
- **Streaming für Chat/Generate** — Token-weise Ausgabe statt blockend (fühlt sich schneller an)
- **Error-Tracking** — Sentry oder PostHog für Frontend-Fehler
- **Tests** — Playwright-Smoke für Happy-Path (Trend anlegen → editieren → Initiative launchen → Artefakte generieren)
- **CLAUDE.md pro Initiative** — Export-Flow so umbauen dass generierte CLAUDE.md direkt in ein neues GitHub-Repo pusht

### Prozess-Stages real verdrahten
- **Scout-Stage** — echte Signal-Erfassung (via #1 aus "Als nächstes")
- **Cluster-Stage** — Claude groupiert eingehende Signale semantisch, schlägt Trend-Entwürfe vor
- **Validate-Stage** — Trend-Kandidaten mit Evidenz-Check (mindestens N Signale aus M Quellen)
- **Rate-Stage** — Team-Fit-Umfrage + AI-Market-Rate, Composite-Score berechnet die Reihenfolge

### Refactoring / Hygiene
- **`data.projects` entfernen** — Mock-Projects p1-p4 sind durch KV-Concepts ersetzt, nur noch Spuren in TrendDetail (Sidebar "Projekte")
- **`src/initiative.jsx` löschen** — Legacy Pre-KV Initiative-Workspace, nicht mehr importiert
- **i18n vervollständigen** — aktuell fehlt FR (in CLAUDE.md erwähnt aber nicht implementiert), und viele neue Strings aus der MVP-Werkstatt sind nur auf Deutsch

## Erledigt

### 2026-04-20
- [x] **Related Trends via Claude-Analyse** — `/api/relations` rankt Ähnlichkeit (Haiku, 24h Cache), Sidebar + Tab zeigen Score + AI-Reason, klickbar
- [x] **Trend anlegen** — "Neuer Trend"-Button öffnet `NewTrendDialog` mit Formular (Titel, Dim, Horizon, Stage, Rating-Slider, Tags, Summary)
- [x] **Trend editieren** — Impact/Novelty/Maturity als draggable HTML5-Range-Slider im Trend-Detail, debounced PUT
- [x] **Trend-CRUD-API** — `api/trends.js` mit list/create/get/update/delete, Mock+KV gemerged im Frontend
- [x] **Initiativen nur via Pipeline** — `/initiatives` zeigt nur noch KV-Konzepte, "Neues Konzept"-Button entfernt, Rate-Stage Launch-Button erzeugt prefilled Konzept
- [x] **Chat-Panel Layout-Fix** — Input bleibt sichtbar bei vielen Messages
- [x] **Concept-API konsolidiert** — ein File mit `?id=` Query statt Subfolder-Routing (Vercel-Ambiguität)
- [x] **ioredis statt @vercel/kv** — Upstash Marketplace setzt nur `REDIS_URL`, nicht `KV_REST_API_*`

### 2026-04-19
- [x] **MVP-Werkstatt mit Anthropic-Chat** — `/initiatives` + `/initiative/:id`, Brief, 6 Artefakte (CLAUDE.md/PRD/Tech/Deck/Prompt/Email), Coach-Chat mit Kontext
- [x] **Vercel KV (Upstash Redis) eingebunden** — für Concepts, Trends, Relations
- [x] **Anthropic API via Vercel Functions** — `/api/chat`, `/api/generate`
- [x] **GitHub + Vercel verknüpft** — Production auf cin-radar.vercel.app, auto-redeploy bei Push
- [x] **URL-basiertes Routing** — `pushState`, `popstate`-Listener, SPA-Fallback in Vercel + Netlify Configs
- [x] **Pipeline-Board Drag&Drop** — zwischen Spalten + vertikal sortieren, localStorage
- [x] **AI-Inbox Persistence** — Accept/Dismiss bleibt nach Reload
- [x] **Kanban-Board Reorder** — vertikal sortieren in Initiative-Workspace

### 2026-04-18 (Migration)
- [x] **Vite + React Projekt** — aus Claude-Design Export migriert
- [x] **JSX auf ES-Modules** — 12 Komponenten, 3 Daten-Module umgestellt (Imports/Exports)
- [x] **Design-Tokens** — `tokens.css` eingebunden, Inter + JetBrains Mono Fonts
- [x] **Alle Views klickbar** — Dashboard, Explorer, Trend-Detail, Pipeline, Campaigns, Analytics, Library, AI-Scout-Panel, Capture-Dialog, Cluster-Review

## Offene Design-Fragen

- Sollten die Mock-Projekte in `data.projects` (p1-p4) entfernt werden, jetzt wo KV-Konzepte existieren? Noch Referenzen in TrendDetail-Sidebar.
- Related-Cache TTL (24h) — gut für Prototyp. Später: Invalidation bei Trend-Änderung?
- "AI Scout" als Begriff: meint aktuell zwei Dinge (Inbox-Panel + Capture-Dialog). Zusammenführen oder klarer trennen?
- Welche Sprache für die AI-Outputs? Aktuell gemischt (System-Prompt Deutsch, Claude antwortet meist Deutsch aber nicht immer).
