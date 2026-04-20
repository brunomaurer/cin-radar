# Manueller Cluster erstellen

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

In der Cluster-Stage soll man zusätzlich zu den AI-generierten Clustern auch manuell eigene Cluster erstellen können.

## Verhalten

1. Button in der Cluster-Stage zum Anlegen eines neuen Clusters
2. User gibt z.B. Label/Thema ein und kann manuell Signale zuordnen
3. Manuell erstellte Cluster erscheinen neben den AI-Clustern und durchlaufen denselben Workflow (Review as trend)

## Kontext

- Betrifft: `src/process.jsx` (ClusterStage)
- Aktuell: Cluster entstehen nur durch AI-Gruppierung (≥3 Signale, ≥0.8 Confidence)
- Neu: Zusätzlich manuelle Erstellung, z.B. wenn AI Muster nicht erkennt oder User bewusst anders gruppieren will

## Offene Fragen

- Welche Felder beim Anlegen? (Label, Farbe, Beschreibung?)
- Kann man nachträglich Signale per Drag & Drop zuordnen?
- Sollen manuelle Cluster visuell von AI-Clustern unterscheidbar sein?

## Screenshots

_(noch ausstehend)_
