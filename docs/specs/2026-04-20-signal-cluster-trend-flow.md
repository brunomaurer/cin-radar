# Signal → Cluster → Trend Flow

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

Klarer Datenfluss von Signalen über Cluster zu Trends mit vorausgefülltem Steckbrief.

## Konzeptmodell

- **Signal** = Rohdaten/Beobachtung (Artikel, Gedanke, Link). Niedrige Hürde, locker, wenig Struktur nötig.
- **Cluster** = Thematische Gruppierung von Signalen (AI oder manuell). Ein Signal kann in mehreren Clustern vorkommen (many-to-many).
- **Trend** = Verdichtete, validierte Erkenntnis. Strukturierter Steckbrief mit Evidenz.

## Flow: "Review as Trend"

1. User klickt "Review as Trend" auf einem Cluster
2. System erstellt einen vorausgefüllten Trend-Steckbrief:
   - **Titel**: aus Cluster-Label abgeleitet (AI-Vorschlag)
   - **Dimension/Horizon/Stage**: AI schlägt vor basierend auf Signal-Inhalten
   - **Summary**: AI-generierte Zusammenfassung der Cluster-Signale
   - **Tags**: aus Signalen extrahiert
   - **Impact/Novelty/Maturity**: AI-Ersteinschätzung
   - **Evidenz/Signale**: Alle Signale des Clusters sind direkt verknüpft
3. User kann alles anpassen und bestätigen

## Signal-Ansicht

- Eigene Listenansicht für alle Signale (analog Explorer für Trends)
- Signale sichtbar unabhängig von Cluster/Trend-Zuordnung
- Filterbar nach: zugeordnet/nicht zugeordnet, Channel, Datum, etc.

## Datenmodell-Implikationen

- Signal braucht eigenes Entity mit eigenem API-Endpoint (`/api/signals`)
- Cluster-Signal-Beziehung: many-to-many (ein Signal kann in mehreren Clustern sein)
- Trend-Signal-Beziehung: Signale als Evidenz am Trend verknüpft

## Offene Fragen

- Soll der vorausgefüllte Steckbrief in einem Dialog oder als neue Seite erscheinen?
- Behält der Cluster seine Identität nach dem "Review as Trend" oder wird er zum Trend umgewandelt?
- Sollen Signale nachträglich von einem Cluster in einen anderen verschoben/kopiert werden können?

## Screenshots

_(noch ausstehend)_
