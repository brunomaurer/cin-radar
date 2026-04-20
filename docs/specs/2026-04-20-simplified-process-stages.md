# Vereinfachte Prozess-Stages

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

Prozess von 5 auf 4 Stages vereinfachen. Validate und Rate werden zusammengelegt.

## Vorher

Scout → Cluster → Validate → Rate → Initiative

## Nachher

Scout → Cluster → Rate → Initiative

## Rate (neu, kombiniert)

Beinhaltet jetzt beides:
- **Validierung**: Duplikat-Anzeige, Anzahl Signale, Evidenz-Check — als Info direkt sichtbar
- **Bewertung**: Impact/Novelty/Maturity scoring, Priorisierung, Owner zuweisen, Dimension/Horizon bestätigen

## Kampagne als Ober-Filter

- Übergeordnet über dem ganzen Prozess: **Kampagnen-Filter**
- Alle Kampagnen werden als Filter-Optionen angezeigt
- User wählt eine Kampagne → sieht nur Signale/Cluster/Trends dieser Kampagne
- Ohne Filter → alles kampagnenübergreifend sichtbar

## Kontext

- Betrifft: `src/process.jsx`, Sidebar-Navigation, Dashboard, alle Stage-Referenzen
- Stage-Array in `src/data.js` anpassen
- Routing `/process/:stage` — `validate` entfällt
- Kampagnen-Filter als übergeordnetes UI-Element (z.B. Dropdown/Tabs oben)

## Screenshots

_(noch ausstehend)_
