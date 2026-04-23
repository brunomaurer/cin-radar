# CIN Radar v2 — Changelog

Alle Änderungen der v2-Implementierung (20.–23. April 2026). 86 Commits.

## Neue Features

### Signal-System (komplett neu)
- **Signal als eigenes Entity** — `api/signals.js` CRUD-Endpoint, Redis-persistiert
- **Signal-Ansicht im Explorer** — Tab "Signals" neben Table/Cards/Tiles (`/explore?view=signals`)
- **Signal-Cards editierbar** — Name, Quelle, URL, Beschreibung bearbeitbar (Edit → Speichern/Löschen)
- **AI Signal-Crawler** — `api/crawl-signals.js`, Claude Haiku generiert 3-5 Signale pro Trend
- **Auto-Abo Toggle** — im Trend-Detail neben "Recent signals", löst sofort Crawl aus
- **AI Scout Signal-Entwurf** — `api/generate-signal-draft.js`, Freitext/URL → strukturiertes Signal
- **AI Scout Übernehmen** — akzeptierte Inbox-Items werden als Signal in Redis gespeichert

### Kampagnen-System (neu gebaut)
- **Kampagnen CRUD** — `api/campaigns.js`, eigene Route `/campaigns` mit Sidebar-Navigation
- **Neuer Kampagnen-Dialog** — grüner Button, Felder: Titel, Leitfrage, Beschreibung, Owner, Tags
- **Kampagnen-Workspace** (komplett neu):
  - Pipeline-Stages (Scout→Cluster→Rate→Initiative) mit Countern
  - **Idea Stream** — AI-generierte + manuelle Ideen, editierbar, löschbar, persistiert in Redis
  - **Idea Streams (Tags)** — editierbare Filter-Chips mit Farbwahl, filtern Ideas
  - **Cluster Map** — dynamische SVG-Bubble-Visualisierung aus Tags+Ideas
  - **AI Proposals** — `api/generate-proposals.js`, Claude schlägt Trend-Kandidaten vor
  - Titel/Leitfrage/Beschreibung editierbar (Bearbeiten/Speichern-Modus)
  - Status-Toggle (active/open/closed)
  - Löschen mit Bestätigung (nur im Edit-Modus)

### Cluster-System (neu)
- **Cluster CRUD** — `api/clusters.js`, Redis-persistiert
- **Manuelles Cluster-Erstellen** — Dialog in der Cluster-Stage
- **Cluster-Detailseite** — `/cluster/:id` mit Metadata, verknüpften Signalen, "Review as Trend"
- **Cluster → Trend Flow** — `api/cluster-to-trend.js`, AI generiert vorausgefüllten Steckbrief mit Bild

### Trend-Bilder
- **Bildgenerierung** — `api/generate-image.js`, Pollinations.ai (kostenlos, 3:4 Hochformat)
- **Bild im NewTrendDialog** — 2-Spalten-Layout, rechts Bild-Preview mit Generate-Button
- **Bild im Trend-Detail** — Sidebar der OverviewTab, "Bild generieren" Platzhalter
- **Bild im Explorer** — Cards und Tiles View zeigen Trend-Bilder
- **Auto-Bild bei AI-Trend** — cluster-to-trend generiert automatisch Pollinations-URL
- **Bulk Bild-Generierung** — Explorer Aktionen-Dropdown für selektierte Trends

### Trend-Detail Verbesserungen
- **Inline-Editing** — Bearbeiten-Button für Titel, Summary, Tags, Dim, Horizon, Stage, Owner
- **Rating-Slider nur im Edit-Modus** — Impact/Novelty/Maturity nicht mehr versehentlich änderbar
- **Signal-Abonnierung Toggle** — neben "Recent signals", schaltet AI-Crawler ein
- **Signale aus Redis** — Detail zeigt Mock + KV-Signale zusammen
- **Related-Trends klickbar** — Navigation zum Steckbrief (fehlende Prop gefixt)

### Explorer Verbesserungen
- **Process-Stage Tabs** — horizontale Filter (Scout/Cluster/Rate/Initiative)
- **Kampagnen Ober-Filter** — Dropdown filtert nach Kampagne
- **Capture Channel Filter** — Dropdown filtert nach Erfassungskanal
- **Tiles View** — dritte Ansicht mit grossen Trend-Bildern
- **Aktionen-Dropdown** — bei Selektion: "Bild generieren" oder "Löschen"
- **URL-Parameter** — `?view=signals`, `?channel=url` etc., bleibt bei F5

### Pipeline vereinfacht
- **4 Stages statt 5** — Validate in Rate zusammengeführt (Scout→Cluster→Rate→Initiative)
- **Dashboard Pipeline** — konsistent 4 Stages, Flexbox-Layout
- **Process Pipeline** — Flexbox, responsive, gleiche Höhe

### Initiative Export + Bibliothek
- **Download-Buttons** — pro Artefakt als Markdown
- **Bundle-Download** — alle Artefakte zusammen
- **Library zeigt echte Artefakte** — aus Redis-Konzepten

### AI Scout (live verdrahtet)
- **Echte Signale** — lädt ai-scout Signale aus Redis
- **"Run scan" Button** — crawlt für abonnierte Trends
- **Signal-Entwurf** — Freitext → AI Draft → Übernehmen
- **Letzte Ausführung** — echte Timestamp-Anzeige

### Notification-System
- **Bell leuchtet rot** — bei neuen Signalen, mit Unread-Counter
- **Polling** — alle 15 Sekunden
- **Mark as read** — Klick auf Bell

### Globale Suche
- **Navigiert zum Explorer** — Tippen auf jeder Seite springt zum Explorer
- **Placeholder** — "Trends, Signale, Kampagnen durchsuchen…"

## Cleanup
- `src/initiative.jsx` gelöscht (Legacy)
- `data.projects` entfernt (Mock-Projekte durch KV-Concepts ersetzt)
- Projects-Sidebar aus Detail entfernt
- CaptureDialog durch NewTrendDialog ersetzt (überall)
- Mock Campaign-Typen und Capture-Channels von Kampagnen-Seite entfernt

## API-Endpoints (neu)

| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/signals` | GET/POST/PUT/DELETE | Signal CRUD |
| `/api/campaigns` | GET/POST/PUT/DELETE | Kampagnen CRUD |
| `/api/clusters` | GET/POST/PUT/DELETE | Cluster CRUD |
| `/api/crawl-signals` | POST | AI-Crawler für Signale (Haiku) |
| `/api/cluster-to-trend` | POST | Cluster → Trend-Steckbrief (Sonnet) + Auto-Bild |
| `/api/generate-image` | POST | Pollinations.ai Bild-URL (3:4 Hochformat) |
| `/api/generate-ideas` | POST | Idea Stream generieren (Haiku) |
| `/api/generate-proposals` | POST | AI Trend-Proposals aus Ideas (Haiku) |
| `/api/generate-signal-draft` | POST | Signal-Entwurf aus Freitext (Haiku) |
| `/api/notifications` | GET/PUT | Notifications laden / als gelesen markieren |

## Redis-Keys (neu)

- `signals:index` + `signal:<id>` — Signale
- `campaigns:index` + `campaign:<id>` — Kampagnen (inkl. ideas[], tags[], tagColors{})
- `clusters:index` + `cluster:<id>` — Cluster
- `notifications` — Array der letzten 50 Notifications

## localStorage-Keys (neu)

- `cin-hidden-trends` — Array von Trend-IDs die "gelöscht" (versteckt) wurden

## UX-Guidelines (etabliert)

- **Löschen nur im Edit-Modus** — überall: zuerst "Bearbeiten", dann erscheint "Löschen"
- **Bestätigungsdialog** bei destruktiven Aktionen (Kampagne löschen, Bulk-Delete)
- **Mock-Trends** werden bei Bearbeitung automatisch als KV-Override in Redis angelegt
- **API-Responses** wrappen Listen in Objekte (`{ signals: [...] }`), Frontend-Clients extrahieren

## Tests

- **Vitest** Setup mit 70 Tests in 4 Suites
- `src/__tests__/api.test.js` — API-Client Tests
- `src/__tests__/router.test.js` — Router Tests (parseRoute, buildPath)
- `src/__tests__/data.test.js` — Datenmodell-Validierung
- `api/__tests__/signals.test.js` — Signals-Handler Tests
- `npm test` / `npm run test:watch`
