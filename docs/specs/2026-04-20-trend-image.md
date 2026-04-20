# Trend-Bild (manuell + KI-generiert)

**Status:** Draft
**Datum:** 2026-04-20

## Anforderung

Jeder Trend soll ein Bild haben. Zwei Wege zur Erfassung:

1. **Manuell** — User kann ein eigenes Foto/Bild hochladen
2. **KI-generiert** — Button "Bild generieren" erstellt automatisch ein thematisch passendes Bild basierend auf Titel/Summary/Tags des Trends

## Kontext

- Betrifft: `NewTrendDialog` (src/trends.jsx), Trend-Detail (src/detail.jsx), Explorer-Cards (src/explorer.jsx)
- Bild wird vermutlich im Trend-Objekt als URL gespeichert

## Offene Fragen

- Bildgenerierung: Welcher Dienst? (z.B. DALL-E, Stable Diffusion, Flux)
- Speicherung: Wo werden Bilder abgelegt? (Vercel Blob, Cloudinary, S3, Base64 in Redis?)
- Anzeige: Wo überall soll das Bild erscheinen? (Explorer-Card, Detail-Header, Dashboard?)
- Format/Grösse: Thumbnail + Full-Size? Seitenverhältnis?

## Screenshots

_(noch ausstehend)_
