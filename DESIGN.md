# Level 4: App Design (plan)

Give Pantry Match a designed look built with Ionic (plain JS + Vite), deployed to GitHub Pages by GitHub Actions. The app's logic stays unchanged: `match.js`, `parse.js`, `recipes.js`, `pantry.js`, `suggest.js`, `reply.js`, the Worker and their tests. If the backend or key handling changes, the Level 3 security checks apply again before deploying.

## Designs

`design/reference/` holds the learner's own designs, named `NN-state.png`. They are the targets for the screenshot checks.

| File | State |
|---|---|
| `01-empty-pantry.png` | Empty pantry (first visit) |
| `02-pantry-with-recipes.png` | Pantry with items and Top recipes |
| `03-no-matches.png` | Pantry with items, no recipe matches |
| `04-save-failed.png` | Couldn't save on this device |
| `05-ai-loading.png` | AI loading ("Thinking…") |
| `06-ai-success.png` | AI recipe cards |
| `07-ai-no-results.png` | AI "No ideas fit your pantry" |
| `08-ai-busy.png` | AI busy, with the Top recipes pointer |
| `09a`–`09f` | AI error messages (to be added later) |

The designs are light mode only.

### Where the app differs from the designs (on purpose)

Where a design differs from what the app does, the app's behavior and wording are kept. Screenshot checks don't count these as differences:
- No cooking times on recipe cards (`recipes.js` has no times).
- AI cards show the label, name, ingredients and numbered steps only, with no "x of y" or "Missing:" lines. AI recipes use only the pantry plus basics, so nothing is ever missing.
- The empty states keep the app's text and tap-to-add suggestion chips: 6 on first visit, 5 with no matches.
- The save note keeps the app's two texts: "Couldn't save on this device" (a save failed) and "Not saved: this browser is blocking storage" (storage blocked).
- AI loading keeps the line "Asking the AI for ideas… this can take up to 20 seconds" under the button.
- Top recipe cards use the designs' layout ("3 of 4 ingredients", then what you have and what's missing). It's the same data as the current rank and progress bar.

## Screenshot checks

Each state is compared with its design:
- at **320, 375 and 412 px** wide
- in **light and dark** mode
- at normal text size and at a **larger text size** (root font size at 200%, the WCAG "resize text" check)

For dark mode and large text, there's no design to compare with. The check there is: same layout, everything readable, no clipped or overlapping text, no sideways scroll. All text meets a contrast of at least 4.5:1 (3:1 for large text) in both modes.

## Research decisions (step 2, 2026-10-21)

- **Versions, pinned exactly** (no `^`), each released at least two weeks before 2026-10-21: `@ionic/core` **9.0.6** (2026-09-30), `vite` **8.3.3** (2026-10-06), `vite-plugin-static-copy` **4.1.1** (2026-06-06; supports Vite 6–8). `package-lock.json` is committed. If the page needs `ionicons`, it's pinned the same way.
- **Node:** Vite 8 needs Node `^20.19.0 || >=22.12.0`; local is **24.18.0**, and the deploy workflow uses the same version.
- **Ionic setup:** the official [JS quickstart](https://ionicframework.com/docs/javascript/quickstart): runtime import of `/ionic.esm.js`, `vite-plugin-static-copy`, `@ionic/core` excluded from bundling.
- **Mode:** forced to `md` everywhere (`window.Ionic = { config: { mode: 'md' } }` before Ionic loads), so all devices match the screenshots.
- **Dark mode:** `@ionic/core/css/palettes/dark.system.css` ([dark mode](https://ionicframework.com/docs/theming/dark-mode)). The dark values in `theme.css` apply **only in dark mode**: they sit inside the same dark-mode media query and target `:root.md` to win over Ionic's palette. Light values apply otherwise.
- **Dev server:** `npm start` runs Vite with `server: { port: 3000, strictPort: true }`; `server.js` and `server.test.js` are removed.
- **Dev server deny list:** the first `vite.config.js` sets `server.fs.deny` to Vite's default list plus `.dev.vars`, `.dev.vars.*`, `**/.claude/**` and `**/.wrangler/**` (local data folders; all checked to return 403). The [docs](https://vite.dev/config/server-options) don't say whether setting it replaces the default, so the default entries are repeated. The deny list doesn't cover Vite's `public/` folder, so nothing secret goes there.
- **Accepted audit finding (2026-10-22):** `npm audit` reports 3 high in `braces` (via `chokidar`, via `vite-plugin-static-copy`), a denial-of-service from deeply nested patterns. It's dev and build-time only and our patterns come from our own config; npm's "fix" downgrades the plugin to 0.2.0. The learner checks for a plugin update before the Level 5 release build.
- **Build:** `base: '/ingredient_to_recipe_maker/'` ([static deploy](https://vite.dev/guide/static-deploy)); output in `dist/`, which is gitignored.
- **Deploy:** the Vite docs' workflow (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5) with `node-version: 24.18.0`; Pages source set to "GitHub Actions".
- **Chips:** Ionic chips have no remove button, so the page adds its own ✕.

## Steps

1. **Commit `design/reference/`** (learner).
2. **Research with a subagent.** It checks the official docs, with links, for:
   - Ionic with plain JS and Vite: install, the components needed, theming with CSS variables, dark mode
   - Vite's `base` setting for the project site at `/ingredient_to_recipe_maker/`
   - the GitHub Actions workflow that deploys to Pages

   It reports back with links.
3. **Test hook.** A project hook in `.claude/settings.json` runs `npm test` after every edit.
4. **Vite setup.**
   - The logic modules and tests stay unchanged.
   - The dev server runs on **port 3000**, because the local Worker's `DEV_ORIGIN` is `http://localhost:3000`.
   - Replace `npm start`/`server.js` with Vite (see Research decisions) and update `CLAUDE.md`.
   - Install the pinned versions and commit `package-lock.json`.
   - Check that the dev server refuses `/worker/.dev.vars`, and that `dist/` has no tests, `worker/` or `.md` files.
   - All asset paths stay relative or use `base`.
5. **`theme.css` (Claude) and `contrastRatio` (learner).** Changed on 2026-10-22: the learner's Level 4 piece is now the contrast function, not the theme file.
   - Claude writes `theme.css` from the measured light values and the approved dark values, as CSS variables with the same names in both blocks (light in `:root`, dark in `@media (prefers-color-scheme: dark) { :root.md }`).
   - Approved changes from the designs: 8 low-contrast texts use muted grey `#65736d` (darkened to `#63716b` at the step 7 review, so the empty-state text reaches 4.5:1 on its box), muted green `#5b7a5f` and step number `#5f6a52`. The system font stack is used.
   - Claude writes `contrast.test.js` and an empty stub first. The learner writes `contrastRatio(hexA, hexB)` in `contrast.js` (two `#rrggbb` colours in, the WCAG ratio out, throws on anything else).
   - Once it passes, Claude adds `theme.test.js`, which reads `theme.css` and uses `contrastRatio` to check every text/background pair in light and dark: 4.5:1 for text, 3:1 for icons and the input border.
   - This is done before the rebuild.
6. **Rebuild the page with Ionic components** (Claude), using `theme.css`.
   - Same ids, behavior, messages, `el()`/`textContent` (never `innerHTML`), and `setPantry` flow.
   - Run the screenshot checks above for every state, then fix the differences.
   - Decided 2026-10-22: the header subtitle is dropped (not in the designs); icons are three inline SVGs (leaf, shield, basket) plus "×" text, so no `ion-icon` and no `svg/` copy; page CSS lives in `app.css`, imported after Ionic and `theme.css`; one style direction (no worktrees). Added `--pm-tile-bg` for the empty-state icon tile (measured `#deece0`; dark `#243530`). At large text sizes the Add button wraps below the input.
   - **Optional:** try two style directions in two git worktrees, compare their screenshots, keep one and delete the other.
7. **Checkpoint.**
   - `npm test` and `cd worker && npm test`.
   - `/code-review` in a fresh context.
   - Check that the built output has no key and no `.dev.vars`.
   - Commit.
8. **Deploy.**
   - Add the Actions workflow.
   - The learner switches the Pages source to "GitHub Actions".
   - Check the live site (the address stays `rowninator.github.io`, so the Worker's allowed-site check is unchanged): every state, one real AI request, and a real phone.
