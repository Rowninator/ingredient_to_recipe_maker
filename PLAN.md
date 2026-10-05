# Pantry plan: remember ingredients between visits

## Context
Pantry Match forgets everything on reload: the ingredients you add live only in the `have` array inside `index.html`'s script. Level 2 turns that list into a **pantry** that is saved in the browser and comes back when you reopen the page (including on your phone, once it's on GitHub Pages). Ingredient names only, no quantities. The learner writes the save and load functions; Claude writes the tests and the page wiring.

Note: `CLAUDE.md` is written but not committed yet; commit it before step 1 below.

## 1. How the pantry is saved in the browser

- **Where:** `localStorage`, the browser's built-in key/value store. It's per-device and per-site, survives reloads and restarts, and needs no server or account.
- **Format:** one key, `"pantry-match:pantry"`, holding the list as JSON text, e.g. `["eggs","cheese","olive oil"]`. (localStorage only stores strings, so the list goes through `JSON.stringify` / `JSON.parse`.)
- **New file `pantry.js`** with two functions **the learner writes**:
  - `savePantry(storage, items)`: writes the list. Returns `true` on success, `false` if saving fails (storage missing, full, or blocked), and never crashes the page.
  - `loadPantry(storage)`: returns the saved list. Returns `[]` when nothing is saved, the saved text is broken, it isn't a list, or storage is missing or throws. Keeps only non-blank text entries (trimmed).
- **Why `storage` is a parameter:** tests pass in a small fake object with `getItem`/`setItem`, so they run in Node without a browser. The page passes the real `localStorage`.
- **New `pantry.test.js`** (Claude writes, before the learner codes), covering:
  save then load returns the same list · empty pantry round-trips · nothing saved → `[]` · broken JSON → `[]` · saved value that isn't a list → `[]` · non-text / blank entries dropped and names trimmed · storage `null` → load `[]`, save `false` · `getItem`/`setItem` that throw → `[]` / `false` · save doesn't change the list passed in · uses the `"pantry-match:pantry"` key.

## 2. Add and remove controls on the page (`index.html`)

These mostly already exist; the change is that every one of them now saves.
- **Add:** the existing input + **Add** button (commas for several), and the tap-to-add suggestion chips. Duplicates are still skipped using the existing `sameIngredient` from `match.js`.
- **Remove:** tap a chip's **×** (existing).
- **Clear all:** existing button, but because the pantry is now saved, it asks "Clear your whole pantry?" (`confirm()`) before wiping it.
- **Labels:** the section heading "Your ingredients" becomes **"Your pantry"**, with a small "Saved on this device" note under it.
- **Code shape:** replace the three places that change `have` (`add`, `remove`, the Clear-all handler) with one `setPantry(next)` function that updates `have`, calls `savePantry(localStorage, have)`, then `render()`. One save point means nothing can change without being saved.

## 3. How recipe suggestions use the saved pantry

- On page load, `have = loadPantry(storage)` instead of `[]`, then `render()`. A returning visitor sees their pantry chips **and** their top 3 recipes immediately, with no typing.
- Matching is unchanged: `render()` still calls `matchRecipes(have, recipes)` from `match.js`. The pantry *is* the ingredient list.
- Empty states are unchanged: an empty pantry shows "What's in your kitchen?", and no matches shows "No recipes yet" with suggestions.
- If storage is blocked (e.g. some private-browsing modes), the page reads `localStorage` inside a `try`, passes `null` on failure, and simply works without saving.

## Steps (each ends with a check)
1. Commit + push `CLAUDE.md`.
2. Claude writes `pantry.js` (empty stubs with comments) + `pantry.test.js`; run `npm test` (new tests fail, old 26 pass); learner commits.
3. Learner writes `savePantry` and `loadPantry` until `npm test` is all green. Claude gives hints only.
4. Review + commit.
5. Claude wires `pantry.js` into `index.html` (section 2 and 3 changes) and updates CLAUDE.md's "who writes what" list with the pantry function names.
6. Push, turn on GitHub Pages, check on a real phone.

## Verification
- `npm test`: all old tests plus the new pantry tests pass.
- Browser pane at phone size (375 and 320 wide): add ingredients → reload → chips and recipes are still there; remove one → reload → it stays removed; Clear all asks first; no console errors; no sideways scroll.
- Edge check: put broken text in `localStorage["pantry-match:pantry"]` via DevTools → reload → page shows the empty state, doesn't crash.
- After step 6: open the GitHub Pages link on a phone, add items, close the tab, reopen → pantry is back.
