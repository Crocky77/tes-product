# TES – Talent Evaluation Score

Browser add-on for Hattrick (CHPP-compliant evaluation dashboard).

## Scope (CHPP compliant)

TES evaluates current player state only:
- positional contribution benchmarked by age
- primary position detection from visible contribution data
- normalized TES score (0–100)
- NT minimum benchmark flag
- performance tier classification

TES does **not** include training planning, projection, simulation, optimization, or ROI logic.

## Architecture

- `extension/content.js` → reads DOM and orchestrates injection
- `extension/engine.js` → pure evaluative TES calculation
- `extension/benchmarks.json` → age benchmark curves by position
- `extension/ui.js` → CHPP-compliant panel rendering

## UI text pack implemented

- Header: `TES – Talent Evaluation Score`
- Subtitle: `Positional Performance & Age Benchmark Analysis`
- Version label: `v1.0 PRO`
- Sections:
  - `PERFORMANCE FACTORS`
  - `PERFORMANCE DIAGNOSTICS`
  - optional `Advanced Metrics` (collapsible)

## Lokalno testiranje

1. Otvori `chrome://extensions`
2. Uključi **Developer mode**
3. Klikni **Load unpacked** i odaberi `extension/`
4. Otvori Hattrick player details stranicu i refresh

Ako ne vidiš panel:
- provjeri da URL sadrži `/Club/Players/Player.aspx`
- reload extension u `chrome://extensions`
- hard refresh stranice (`Ctrl+F5`)
