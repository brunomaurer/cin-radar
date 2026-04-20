# CIN Radar v2 — Gesamtdesign

**Status:** Draft
**Datum:** 2026-04-20

## Vision

CIN Radar wird von einem Prototyp zu einem durchgängigen Innovations-Radar weiterentwickelt. Zentrale Änderung: **Kampagne wird zum führenden Element**, der Prozess wird vereinfacht, und der Datenfluss Signal → Cluster → Trend wird durchgängig real verdrahtet.

## 1. Kampagne als zentrales Element

Die Kampagne ist der Workspace, in dem der gesamte Innovation-Prozess abläuft.

**Erstellen:** Grüner Button unten in der Kampagnen-Liste → Dialog mit Titel, Beschreibung, Zeitraum, Teilnehmer.

**Innerhalb einer Kampagne kann man:**
- Signale erfassen (manuell, URL, PDF, AI Scout)
- Cluster bilden (AI + manuell)
- Cluster als Trend reviewen → vorausgefüllter Steckbrief
- Stream/Visualisierung des Prozessfortschritts sehen

**Kampagne als Ober-Filter:** Übergeordnet über dem ganzen Prozess. Ohne Filter → alles kampagnenübergreifend sichtbar.

**Persistierung:** Kampagnen in Redis (wie Trends/Concepts).

**Hybrid-Ansatz:** Signale und Trends können auch ohne Kampagne existieren (globaler Radar). Kampagnen sind ein Weg, sie thematisch zu bündeln und gezielt zu bearbeiten.

**Datenmodell Kampagne:**
```
{
  id, title, description,
  startDate, endDate?,
  participants: [],
  status (active | completed | archived),
  createdAt, updatedAt
}
```

## 2. Vereinfachter Prozess (4 Stages)

**Vorher:** Scout → Cluster → Validate → Rate → Initiative
**Nachher:** Scout → Cluster → Rate → Initiative

Darstellung als horizontale Zeile (Tabs/Chips/Stepper). Klick auf Stage → Explorer mit Filter auf diesen Prozessschritt.

**Rate** beinhaltet neu auch Validierung:
- Duplikat-Anzeige, Anzahl Signale, Evidenz-Check — als Info direkt sichtbar
- Impact/Novelty/Maturity Scoring, Priorisierung, Owner, Dimension/Horizon

## 3. Signal als eigenes Entity

Signale sind Rohdaten/Beobachtungen — niedrige Hürde, locker, wenig Struktur.

**Drei Erfassungswege:**
- Manuell (Freitext, Gedanke, Beobachtung)
- URL-Import (Claude extrahiert Metadaten)
- AI Scout (automatisch im Hintergrund)

**Eigene Signal-Listenansicht** — alle Signale sichtbar, filterbar nach Zuordnung, Channel, Datum.

**Many-to-many:** Ein Signal kann in mehreren Clustern vorkommen.

**Neues API-Endpoint:** `/api/signals` für CRUD.

**Datenmodell Signal:**
```
{
  id, title, summary, source, url?,
  channel (manual | url | pdf | ai-scout),
  date, tags[], strength?,
  clusterIds[], trendId?,
  campaignId?,
  createdAt, updatedAt
}
```

## 4. Cluster → Trend Review Flow

Klick "Review as Trend" auf einem Cluster erzeugt vorausgefüllten Trend-Steckbrief:
- Titel aus Cluster-Label (AI-Vorschlag)
- Dimension/Horizon/Stage: AI-Vorschlag basierend auf Signal-Inhalten
- Summary: AI-Zusammenfassung der Cluster-Signale
- Tags: aus Signalen extrahiert
- Impact/Novelty/Maturity: AI-Ersteinschätzung
- Evidenz: Alle Signale des Clusters direkt verknüpft

Manuelles Cluster-Erstellen zusätzlich zu AI-Clustern möglich.

**Datenmodell Cluster:**
```
{
  id, label, description?,
  color, confidence?,
  signalIds: [],
  campaignId?,
  origin (ai | manual),
  proposed: boolean,
  createdAt, updatedAt
}
```

## 5. Trend-Bild (manuell + KI-generiert)

Jeder Trend kann ein Bild haben:
- **Manuell:** User lädt Bild hoch
- **KI-generiert:** Button generiert thematisch passendes Bild aus Titel/Summary/Tags

Bild wird als URL im Trend-Objekt gespeichert. Anzeige in Explorer, Detail, Dashboard.

## 6. Signal-Abonnierung pro Trend

Beim Erstellen eines Trends: Toggle zum Aktivieren der Signal-Abonnierung. Ein Background-Agent sammelt dann automatisch Signale zu diesem Trend.

## 7. Capture Channel als Filter

Klick auf einen Capture Channel → Explorer filtert nach Trends/Signalen dieses Channels.
Channels: URL-Import, PDF-Import, manuell, AI Scout (erweiterbar).

## 8. Explorer — Kachelansicht

Dritte Ansichtsoption neben List und Grid: Tile View mit grossem Trend-Bild, Titel, Dimension, Stage. Abhängig von Trend-Bild Feature.

## 9. Initiative — Export & Bibliothek

- Download-Button pro Artefakt (PDF, Markdown)
- Bundle-Download als ZIP
- "In Bibliothek ablegen" — Artefakte landen in der Knowledge Library
- Library wird zum echten Feature (filterbar nach Typ, durchsuchbar)

## 10. Cleanup

- "Capture signal" Button aus Dashboard entfernt ✅
- `src/initiative.jsx` (Legacy) löschen
- `data.projects` (Mock p1-p4) entfernen
- Validate-Stage aus Code entfernen

## Abhängigkeiten

```
Kampagnen-CRUD (#1) ──────────────┐
                                   ├→ Kampagne als Ober-Filter (#2)
Signal-Entity + API (#3) ─────────┤
                                   ├→ Cluster → Trend Flow (#4)
Manuelles Cluster-Erstellen (#4) ─┘

Trend-Bild (#5) ──→ Explorer Kachelansicht (#8)

Signal-Abonnierung (#6) ──→ braucht Signal-Entity (#3)

Artefakt-Export (#9) ──→ Library real machen

Prozess vereinfachen (#2) ──→ unabhängig, kann parallel
Cleanup (#10) ──→ unabhängig, kann parallel
```

## Nicht im Scope (bewusst zurückgestellt)

- User-Accounts / Multi-User / Login
- Mobile Layout
- TypeScript Migration
- Tests (Playwright)
- Dark/Light Mode Toggle
- Streaming für Chat/Generate
