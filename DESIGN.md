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
   - Keep or replace `npm start`/`server.js` (decide after the research).
   - All asset paths stay relative or use `base`.
5. **`theme.css` (learner).**
   - The learner writes the colors, fonts and spacing from the designs as CSS variables, with light and dark versions.
   - The designs have no dark versions, so Claude proposes dark values first and waits for the learner's approval.
   - Contrast is checked in both modes.
   - This is done before the rebuild.
6. **Rebuild the page with Ionic components** (Claude), using `theme.css`.
   - Same ids, behavior, messages, `el()`/`textContent` (never `innerHTML`), and `setPantry` flow.
   - Run the screenshot checks above for every state, then fix the differences.
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
