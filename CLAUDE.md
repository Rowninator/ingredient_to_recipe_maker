# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Learning project — who writes what

This repo is built in `/app-coach` lessons. The learner writes certain functions themselves; do not write or rewrite them unless the learner asks after a genuine attempt:
- `matchRecipes` and `sameIngredient` in `match.js` (Level 1)
- `savePantry` and `loadPantry` in `pantry.js` (Level 2)

Give the smallest useful hint instead (the failing test, the line, or the concept to look up).

The current level's approved design and step list are in `PLAN.md`; follow it and check which step is next before starting work.

## Commands

- `npm test`: runs every `*.test.js` with Node's built-in runner (`node --test`). No dependencies, no build step.
- `node --test match.test.js`: runs one test file.
- `node --test --test-name-pattern="plural"`: runs only tests whose name matches.
- `npm start`: serves the app at http://localhost:3000 via `server.js`. If the port is taken, a Browser-pane preview server is usually still running; stop it first.

## Architecture

- Plain ES modules (`"type": "module"`) shared by Node tests and the browser, so `match.js`, `parse.js`, `recipes.js` and `pantry.js` must not use Node-only or browser-only APIs. `pantry.js` takes storage as a parameter (the page passes `localStorage`, or `null` if it's blocked; tests pass a fake).
- The pantry is saved as JSON under the localStorage key `"pantry-match:pantry"`. In `index.html`, every change goes through `setPantry(next)`, which saves and re-renders; don't assign `have` anywhere else.
- `index.html` is the whole UI ("Pantry Match"): CSS and an inline `<script type="module">` that imports the modules above. Build DOM with `textContent` (via its `el()` helper), never `innerHTML`, since ingredient names are user input.
- `server.js` exists only because browsers block module imports from `file://`. It listens on 127.0.0.1 only, refuses any path with a part starting with `.` (`isHiddenPath`, tested in `server.test.js`), and starts only when run directly, so tests can import it. The live site is GitHub Pages serving `main` from the repo root (https://rowninator.github.io/ingredient_to_recipe_maker/), so keep all imports and asset paths relative (`./match.js`).

## Matching rules (locked in by `match.test.js`)

Ingredient names are compared after trimming, lowercasing and collapsing inner whitespace; two names also match if one is the other plus `s` or `es`. A recipe's score is how many of *its* ingredients you have (duplicates in your input don't count twice). The top 3 recipes are returned, ties keep recipe-list order, and the input array is never mutated.
