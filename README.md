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
- `extension/u21_targets.json` → U21 target skill matrix profiles
- `extension/nt_targets.json` → NT target skill matrix profiles
- `extension/ui.js` → CHPP-compliant panel rendering

## Current scoring model (v2)

1. Parse decimal age from visible string (`X godina i Y dana`).
2. Parse normalized position contribution values and detect primary position.
3. Load age benchmark for primary position and calculate base performance ratio.
4. Compute profile fit scores against U21 and NT target matrices (best matching profile).
5. Final hybrid score:
   - `55%` current contribution/age benchmark
   - `20%` U21 target fit
   - `25%` NT target fit
   - plus evaluative modifiers (skill structure, physical readiness, match usage, age)
6. Apply benchmark guardrail caps and elite-cap gate.

## Why manual targets before CHPP API

Without CHPP API, manual benchmark and target tables are required and expected.
API later improves input quality and stability, but does not replace scoring methodology.

## Lokalno testiranje

1. Otvori `chrome://extensions`
2. Uključi **Developer mode**
3. Klikni **Load unpacked** i odaberi `extension/`
4. Otvori Hattrick player details stranicu i refresh

Ako ne vidiš panel:
- provjeri da URL sadrži `/Club/Players/Player.aspx`
- reload extension u `chrome://extensions`
- hard refresh stranice (`Ctrl+F5`)
