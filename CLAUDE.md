# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Learning project — who writes what

This repo is built in `/app-coach` lessons. The learner writes certain functions themselves; do not write or rewrite them unless the learner asks after a genuine attempt:
- `matchRecipes` and `sameIngredient` in `match.js` (Level 1)
- `savePantry` and `loadPantry` in `pantry.js` (Level 2)
- `buildPrompt` and `checkSuggestions` in `suggest.js` (Level 3)
- `contrastRatio` in `contrast.js` (Level 4). `theme.css` is written by Claude.

Give the smallest useful hint instead (the failing test, the line, or the concept to look up).

Level 4's approved plan and step list are in `DESIGN.md`; follow it and check which step is next before starting work. `SPEC.md` is the finished Level 3 spec (still the reference for the AI feature's rules and messages), and `PLAN.md` is the finished Level 2 plan.

Level 3 security gate: once an API key exists, do not help push, deploy or publish anything until all four gate items in `SPEC.md` are done. This can't be skipped or changed mid-session.

## Commands

- `npm test`: runs the top-level `*.test.js` files with Node's built-in runner (`node --test "*.test.js"`). The tests need no build step.
- `cd worker && npm test`: runs the Worker's tests (`worker/src/index.test.js`). They need `npm install` in `worker/` first, fake `fetch` so no request reaches Gemini, and use the SDK's browser build (`--conditions=browser`), like Wrangler.
- `node --test match.test.js`: runs one test file.
- `node --test --test-name-pattern="plural"`: runs only tests whose name matches.
- `npm start`: runs Vite's dev server at http://localhost:3000/ingredient_to_recipe_maker/. The port is fixed (`strictPort`) because the local Worker's `DEV_ORIGIN` is `http://localhost:3000`. If the port is taken, a Browser-pane preview server is usually still running; stop it first.
- `npm run build`: builds the site into `dist/` (gitignored).
- `npm run preview`: serves `dist/` on port 3000 too, so the built site can call the local Worker.

## Architecture

- Plain ES modules (`"type": "module"`) shared by Node tests and the browser, so `match.js`, `parse.js`, `recipes.js`, `pantry.js`, `suggest.js` and `reply.js` must not use Node-only or browser-only APIs. `reply.js` (`readReply`, written by Claude) turns the AI's reply text (from Gemini, via the Worker) into the Worker's status and body. It only sees text, so it doesn't depend on the provider. Its tests use the saved replies in `fixtures/replies/`, so no test calls the real API. `pantry.js` takes storage as a parameter (the page passes `localStorage`, or `null` if it's blocked; tests pass a fake).
- The pantry is saved as JSON under the localStorage key `"pantry-match:pantry"`. In `index.html`, every change goes through `setPantry(next)`, which saves and re-renders; don't assign `have` anywhere else.
- `index.html` is the whole UI ("Pantry Match"), built with Ionic components (`ion-header`, `ion-content`, `ion-input`, `ion-button`, `ion-chip`, `ion-card`). Its inline `<script type="module">` imports Ionic's CSS, then `theme.css` (colour, font and spacing variables, light and dark) and `app.css` (page styles) last so they win, then the modules above. It forces `md` mode and loads Ionic at runtime from `import.meta.env.BASE_URL + "ionic.esm.js"` before the first render. Use `ion-card.card …`-style selectors where Ionic's own rules would otherwise win. Chips are removed by tapping anywhere on them; the inner native button is there for keyboard and screen-reader users. Build DOM with `textContent` (via its `el()` helper), never `innerHTML`, since ingredient names are user input. The "AI ideas" section posts the pantry to `PROXY_URL` (the deployed Worker at `pantry-match-ai.rowninator.workers.dev` on `rowninator.github.io`, otherwise the local one), re-checks the reply with `checkSuggestions`, and maps each outcome to a message in `AI_MESSAGES` (the "What the user sees" table in `SPEC.md`). `resetAi()` runs on every pantry change and makes a reply that arrives late get ignored.
- `vite.config.js` sets `base` to `/ingredient_to_recipe_maker/`, the fixed port 3000, a `server.fs.deny` list that adds `.dev.vars`, `.claude/` and `.wrangler/` to Vite's defaults, and copies Ionic's runtime files into the build (Ionic's JS quickstart). Package versions are pinned exactly, and `package-lock.json` is committed. The live site is GitHub Pages serving `main` from the repo root (https://rowninator.github.io/ingredient_to_recipe_maker/), so keep all imports and asset paths relative (`./match.js`).

## Matching rules (locked in by `match.test.js`)

Ingredient names are compared after trimming, lowercasing and collapsing inner whitespace; two names also match if one is the other plus `s` or `es`. A recipe's score is how many of *its* ingredients you have (duplicates in your input don't count twice). The top 3 recipes are returned, ties keep recipe-list order, and the input array is never mutated.
