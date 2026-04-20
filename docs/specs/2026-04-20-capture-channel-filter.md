# Capture Channel als Filter zum Explorer

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

Klick auf einen Capture Channel springt zum Explorer und filtert nach Trends/Signalen, die über diesen Channel erfasst wurden.

## Verhalten

1. Capture Channels sind klickbar (z.B. auf Dashboard oder in einer Channel-Übersicht)
2. Klick → Navigation zu `/explore` mit aktivem Filter auf den gewählten Channel
3. Explorer zeigt nur Steckbriefe/Trends die über diesen Channel reingekommen sind

## Kontext

- Capture Channels: z.B. URL-Import, PDF-Import, manuell, AI Scout, Voice
- Trends/Signale brauchen ein `channel`-Feld in den Daten, um filtern zu können

## Offene Fragen

- Welche Channels gibt es genau? (URL, PDF, manuell, AI Scout, weitere?)
- Wo werden die Channels angezeigt? (Dashboard-Widget, Sidebar, eigene Seite?)
- Sollen Channels einen Counter anzeigen (z.B. "URL-Import (24)")?

## Screenshots

_(noch ausstehend)_
