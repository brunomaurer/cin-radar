# Initiative — Export & Bibliothek-Ablage

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

Initiativen-Artefakte (PRD, Tech Spec, Deck, etc.) sollen downloadbar sein und in die Bibliothek abgelegt werden können.

## Verhalten

1. **Download-Button** pro Artefakt — z.B. als PDF, Markdown oder PPTX
2. **In Bibliothek ablegen** — Button legt das Artefakt in der Knowledge Library ab, wo es unabhängig von der Initiative auffindbar ist
3. **Bundle-Download** — alle Artefakte einer Initiative als ZIP

## Kontext

- Betrifft: `src/initiatives.jsx` (Artefakt-Studio), `src/panels.jsx` (Library)
- Library ist aktuell nur ein Stub/Platzhalter — wird durch diese Funktion zum echten Feature
- 6 Artefakt-Typen: CLAUDE.md, PRD, Tech Spec, Management Deck, Prototype Prompt, Kickoff Email

## Offene Fragen

- Welche Formate beim Download? (PDF, Markdown, PPTX für Deck?)
- Soll die Bibliothek nach Typ filterbar sein (alle PRDs, alle Decks, etc.)?
- Versionierung: Wenn ein Artefakt neu generiert wird, alte Version behalten?

## Screenshots

_(noch ausstehend)_
