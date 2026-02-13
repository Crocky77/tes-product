# TES – Talent Evaluation Score

Browser add-on for Hattrick (CHPP-compliant evaluation dashboard).

## Scope (CHPP compliant)

TES evaluates current player state only:
- positional contribution benchmarked by age
- primary position detection from normalized contribution values
- normalized TES score (0–100)
- NT minimum benchmark flag
- performance tier classification

TES does **not** include training planning, projection, simulation, optimization, or ROI logic.

## Architecture

- `extension/content.js` → reads DOM and orchestrates injection
- `extension/engine.js` → pure evaluative TES calculation
- `extension/benchmarks.json` → age benchmark curves by position
- `extension/ui.js` → CHPP-compliant panel rendering

## Current scoring model (v1)

1. Parse player decimal age from visible string (`X godina i Y dana`).
2. Parse normalized position contributions from the visible contribution table.
3. Primary position = maximum normalized contribution.
4. Read age benchmark from per-position curves (linear interpolation).
5. Base score:
   - `performanceRatio = contribution / minBenchmark`
   - cap ratio to `1.15`
   - `TES_raw = performanceRatio * 100`
6. Apply evaluative modifiers only:
   - skill-structure modifier
   - physical-readiness modifier
   - match-usage modifier
   - slight post-peak age modifier
7. Elite cap model:
   - score above 96 only if elite condition is satisfied.

## Stability improvements

- Panel render is now stabilized using state-hash comparison to avoid re-render flicker.
- Mutation observer ignores panel-internal mutations.

## Lokalno testiranje

1. Otvori `chrome://extensions`
2. Uključi **Developer mode**
3. Klikni **Load unpacked** i odaberi `extension/`
4. Otvori Hattrick player details stranicu i refresh

Ako ne vidiš panel:
- provjeri da URL sadrži `/Club/Players/Player.aspx`
- reload extension u `chrome://extensions`
- hard refresh stranice (`Ctrl+F5`)


## CHPP API vs local evaluacija

Bez CHPP licence/API-ja moramo ručno održavati benchmark tablice i parsirati samo vidljive DOM podatke.
To je ispravan put za ovu fazu projekta.

Kad CHPP API bude dostupan, možemo povećati preciznost (stabilniji input, bolji match usage i coverage),
ali i dalje trebamo ručno definiranu evaluacijsku metodologiju (benchmark + modifikatori).
