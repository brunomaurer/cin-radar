# Signal-Abonnierung beim Trend erstellen

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

Beim Erstellen eines neuen Trends soll der User die Möglichkeit haben, diesen direkt für die Signal-Abonnierung zu aktivieren. Ein Background-Agent sammelt dann automatisch Signale zu diesem Trend.

## Kontext

- Betrifft: `NewTrendDialog` in `src/trends.jsx`
- Abhängig von: AI Scout Background-Job (BACKLOG.md "Später / Ideen")

## Offene Fragen

- UI: Toggle/Checkbox im NewTrendDialog? Wo genau platziert?
- Agent-Verhalten: Welche Quellen durchsucht der Agent (RSS, News, Web)?
- Frequenz: Wie oft soll der Agent laufen?
- Kosten/Limits: Max Signale pro Trend pro Tag?

## Screenshots

_(noch ausstehend)_
