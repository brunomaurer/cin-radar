# Prozess-Navigation als horizontale Leiste

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

Die Prozess-Stages (Scout, Cluster, Validate, Rate, Initiative) sollen als horizontale Zeile dargestellt werden — nicht als separate Views. Klick auf einen Stage springt zum Explorer und filtert automatisch nach diesem Prozessschritt.

## Verhalten

1. Alle 5 Stages nebeneinander in einer Zeile anzeigen (z.B. als Tabs, Chips oder Stepper)
2. Klick auf einen Stage → Navigation zu `/explore` mit aktivem Filter auf den entsprechenden Stage
3. Explorer zeigt dann nur Trends im gewählten Prozessschritt

## Kontext

- Betrifft: `src/process.jsx` (aktuell eigene Pipeline-View), `src/explorer.jsx` (braucht Filter-Integration)
- Aktuell: Prozess hat eigene Route `/process/:stage` mit separater Board-Ansicht
- Neu: Prozess-Stages werden zum Navigations-/Filter-Element für den Explorer

## Offene Fragen

- Wo wird die Prozess-Zeile angezeigt? (Im Explorer oben? In der Sidebar? Auf dem Dashboard?)
- Soll die separate `/process/:stage` Route entfallen oder zusätzlich bestehen bleiben?
- Sollen die Stages einen Counter anzeigen (z.B. "Scout (12)")?

## Screenshots

_(noch ausstehend)_
