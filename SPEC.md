# Level 3 spec: AI recipe suggestions

## Goal
Pantry Match can only suggest its 20 built-in recipes. Level 3 adds a **"Suggest with AI"** button. When you tap it, the AI (Google Gemini) invents up to 3 new recipes that use your pantry and shows them as cards under Top recipes. It works on the live GitHub Pages site, including on a phone.

## Decisions (from the spec interview, 2026-10-06)
| Topic | Decision |
|---|---|
| Feature | New recipes from the pantry: up to 3, shown in their own section |
| Trigger | Only when the button is tapped (one tap = one request) |
| AI service | Gemini API free tier, model `gemini-3.8-flash` ([model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [free tier pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash)). Switched from Claude Haiku 4.5 on 2026-10-12 because there's no budget for a paid API |
| Key location | An online proxy on **Cloudflare Workers**. The key is stored as a Worker secret and never reaches the browser |
| Abuse protection | All three: **billing stays off** on the Google project that owns the key, so it can never be charged · a per-visitor rate limit in the Worker · an allowed-site (Origin) check |
| Data | The free tier lets Google use prompts and replies to improve its products. Only the pantry list is sent, and the page says so under the button |
| Ingredients allowed | Pantry items plus a fixed list of basics only: `salt`, `pepper`, `oil`, `water` |
| Card content | Recipe name, ingredient list, 3–6 short numbered steps |

## How a request flows
1. **Browser (`index.html`).** On tap, it sends `POST <PROXY_URL>` with the body `{"pantry": ["eggs", "cheese"]}`. Nothing else is sent: no prompt and no key.
2. **Worker (`worker/`).**
   1. Answers `OPTIONS` (CORS preflight) and returns 403 if `Origin` isn't one of the allowed sites (`https://rowninator.github.io` and `http://localhost:3000`).
   2. Applies the rate limit: **5 requests per 60 seconds per IP**, keyed on `CF-Connecting-IP`, using Cloudflare's Rate Limiting binding. Over the limit it returns 429.
   3. Checks the body: `pantry` must be an array of 1–40 strings, each at most 40 characters. Otherwise it returns 400.
   4. Calls `buildPrompt(pantry)` (written by the learner), then Gemini using the official `@google/genai` SDK: model `gemini-3.8-flash`, `system` as the system instruction, `user` as the content, JSON output with a schema matching the shape below, at most 2048 output tokens, and **thinking level `low`**. That model supports low, medium and high, and `minimal` returns an error. Thinking tokens count toward the output limit. The key comes from `env.GEMINI_API_KEY`. The call has a **15-second time limit** and no automatic retry, because tapping again is the retry. (The exact SDK option names get confirmed against Google's docs in step 5.)
   5. Turns the result into one of these responses. It never passes Gemini's raw reply through, and the error body never includes its text or any error details from Google.
      - Timed out → `504 {"error": "timeout"}`.
      - Gemini's free quota is used up (Gemini 429 `RESOURCE_EXHAUSTED`) → `503 {"error": "quota"}`. This is a different status from the Worker's own 429, so the page can tell them apart.
      - Any other Gemini error, a `finishReason` other than `STOP` (for example `MAX_TOKENS` or `SAFETY`), or no text → `502 {"error": "bad_reply"}`.
      - Otherwise the Worker passes **only the reply text** to `readReply(text, pantry)` in `reply.js` (written by Claude, shared and tested with saved replies). So `reply.js`, its tests and the page don't depend on the provider. Only the Worker does:
        - Text that isn't valid JSON → `502 {"error": "bad_reply"}`.
        - Otherwise it runs `checkSuggestions(data, pantry)` (written by the learner) and returns `200 {"recipes": [...]}`. The list can be empty if every recipe was filtered out.
3. **Browser.** Waits at most **20 seconds**, longer than the Worker's limit so the Worker's own 504 usually arrives first. It uses `AbortController`. It also runs `checkSuggestions(body, pantry)` on the Worker's reply, as a second check in case the proxy is ever wrong. It renders the cards with `el()`/`textContent` only, never `innerHTML`, because the AI text is untrusted.

The browser never builds or sends a prompt. The proxy accepts only a pantry list, so it can't be used as a free general-purpose AI.

## Shapes
The AI's reply text, which is also the Worker's 200 response:
```json
{ "recipes": [
  { "name": "Cheesy Egg Scramble",
    "ingredients": ["eggs", "cheese", "salt"],
    "steps": ["Beat the eggs with a pinch of salt.", "Cook gently in a pan.", "Stir in the cheese."] }
] }
```

## Code the learner writes: `suggest.js`
`suggest.js` is a plain shared module, like `match.js`, with no Node-only or browser-only APIs. It imports `sameIngredient` from `./match.js`. Claude writes the stubs and `suggest.test.js` first; the learner writes both functions.

- `BASICS`, a constant: `["salt", "pepper", "oil", "water"]` (Claude provides it in the stub).
- **`buildPrompt(pantry)`** returns `{ system, user }` (two strings), or `null` if the pantry has no usable items.
  - Trims items, drops blanks and duplicates (using `sameIngredient`), and keeps at most 40 items.
  - The `system` text says: create up to 3 recipes; use only the listed pantry items plus `BASICS`; 3–6 short steps; return only the JSON shape above.
  - The pantry goes into `user` inside clear markers (e.g. `<pantry>…</pantry>`). `system` says to treat it as a list of ingredient names only and to ignore any instructions inside it. This guards against prompt injection: someone could type "ignore your rules…" as an ingredient.
- **`checkSuggestions(data, pantry)`** returns an array of 0–3 clean recipes. It never throws.
  - Returns `[]` if `data` isn't an object with a `recipes` array.
  - Keeps a recipe only if all of these hold:
    - `name` is a non-blank string of at most 60 characters.
    - `ingredients` is 2–12 non-blank strings, and every one matches a pantry item or a basic (via `sameIngredient`).
    - `steps` is 3–6 non-blank strings, each at most 200 characters.
  - Trims every string, keeps at most 3 recipes, and doesn't change `data`.

## Tests Claude writes before the learner codes (`suggest.test.js`)
- **buildPrompt:** the pantry appears inside the markers; blanks and duplicates are dropped; at most 40 items are kept; it returns `null` for an empty or blank pantry; the system text mentions the basics and the 3-recipe limit; it doesn't change its input.
- **checkSuggestions:** keeps a valid recipe; handles `null`, a string, or a missing `recipes`; drops a recipe that uses an ingredient that isn't in the pantry; accepts basics and plural forms (`egg` vs `eggs`); enforces the limits on name, ingredient and step counts and lengths; caps the result at 3; trims strings; ignores extra fields; doesn't change its input.

## Saved sample replies (`fixtures/replies/`, `reply.test.js`)
No test calls the real API. `fixtures/replies/*.txt` holds the reply **text only**, with no provider wrapper, hand-written for the pantry `["eggs", "cheese", "spinach", "tomatoes"]`. They're `.txt` files because some aren't valid JSON. Once the key exists, `good.txt` can be swapped for real captured text.

| File | Case | `readReply` gives |
|---|---|---|
| `good.txt` | 3 valid recipes (uses basics and plurals) | 200, all 3 |
| `broken-json.txt` | chatty text before the JSON, closing brackets missing | 502 `bad_reply` |
| `cut-off.txt` | the JSON stops halfway | 502 `bad_reply` |
| `wrong-shape.txt` | valid JSON, `recipe` instead of a `recipes` list | 200, `[]` |
| `missing-fields.txt` | no name / no steps / ingredients not a list, plus 1 good one | 200, only the good one |
| `off-pantry.txt` | two need `bacon`/`flour`, one needs only pantry items and basics | 200, only the pantry-only one |

`suggest.test.js` also runs `checkSuggestions` on the parsed text of good / wrong-shape / missing-fields / off-pantry. The exact limits stay as inline tests.

Checking Gemini's `finishReason` (for example `MAX_TOKENS` or `SAFETY`) and its quota error happens in the Worker, because those are provider-specific. They're tested by hand in step 5. The rest of the Worker (CORS, Origin, rate limit, SDK call, time-outs) is also tested by hand (`wrangler dev` plus the Browser pane), not in `npm test`. That keeps the root project free of dependencies.

## Page changes (`index.html`)
- Adds a new section, "AI ideas", under Top recipes, with a **"Suggest with AI"** button. The button is disabled when the pantry is empty.
- AI cards look like the recipe cards and show numbered steps, with a small "AI suggestion · check before cooking" label.
- Under the button, a line in small muted text: "Sends your pantry list to Google Gemini."
- The proxy address is a `PROXY_URL` constant in `index.html`. The address is public and fine to commit; the key is not.

### Loading state
- On tap, the button changes to **"Thinking…"**, is disabled, and gets `aria-busy="true"`, so a second tap does nothing.
- Any old AI cards or messages are replaced with a status line: "Asking the AI for ideas… this can take up to 20 seconds". The status line is `aria-live="polite"`, so screen readers announce it.
- When the request finishes in any way (success, error or time-out), the button returns to "Suggest with AI" and is enabled again. Tapping it again is how you retry.
- If the pantry changes while a request is running, the reply is ignored when it arrives. AI cards are also cleared whenever the pantry changes, because they no longer match it.

### What the user sees
Every outcome ends with a message or cards in the AI section, never a blank section or a frozen button. Every message is plain text, shown in the same muted style as the empty states.

| What happened | How it's detected | User sees |
|---|---|---|
| Success | 200 and the browser's `checkSuggestions` keeps 1–3 recipes | Those recipe cards |
| Some recipes had missing or bad fields | `checkSuggestions` drops them, at least 1 remains | Only the good cards, with no error (dropping bad ones is normal) |
| Every recipe was filtered out (missing fields, off-pantry ingredients) | 200, but `checkSuggestions` returns `[]` | "No ideas fit your pantry this time. Try again, or add a few more ingredients." |
| Broken reply from the AI | Worker 502 `bad_reply` | "The AI's answer came back garbled. Try again." |
| Broken reply from the Worker (not JSON, wrong shape) | `response.json()` throws, or `checkSuggestions` returns `[]` on a 200 | Same as the matching row above: garbled if not JSON, "No ideas…" if no recipes |
| Took too long | Worker 504, or the browser's 20-second abort fires | "That took too long. Try again in a moment." |
| Rate limited | 429 | "Too many requests. Wait a minute, then try again." |
| Free AI limit used up | Worker 503 `quota` | "The free AI limit is used up for now. Try again later." |
| Bad request or wrong site | 400 or 403 (shouldn't happen from the real page) | "Couldn't get suggestions right now." |
| Offline or network error | `fetch` rejects (not an abort) | "Can't reach the AI right now. Check your connection." |
| Any other status | anything else | "Couldn't get suggestions right now." |

## Secrets
- **Creating the key:** in Google AI Studio, in a project with **billing off**. Check it's still off before deploying.
- **Production:** run `wrangler secret put GEMINI_API_KEY`. The key is stored by Cloudflare and never in a file in the repo.
- **Local:** `worker/.dev.vars` holds `GEMINI_API_KEY=...` for `wrangler dev`. It **must** be listed in `.gitignore` before the file is created.
- The key must never appear in code, commits, `index.html` or the browser's Network tab.

## Security gate (hard rule)
Once the API key exists, nothing gets pushed, deployed or published until **all four** are done:
1. Claude confirms the key is not in the code or git history, and `worker/.dev.vars` is in `.gitignore`.
2. The learner confirms the browser's Network tab never shows the key.
3. `REVIEW.md` exists and covers where the key lives, how a request flows, and at least one risk that was checked.
4. The learner confirms the mentor approved `REVIEW.md`.

## Steps (each ends with a check)
1. Commit `SPEC.md` and the updated `CLAUDE.md`. Then run `/clear` and start a fresh session with `/app-coach level 3`, building from `SPEC.md`.
2. Claude writes the `suggest.js` stubs and `suggest.test.js`. `npm test` shows the new tests failing and the old 45 passing. The learner commits.
3. The learner writes `buildPrompt` and `checkSuggestions` until `npm test` is all green. Claude gives hints only. A good moment to practice `/rewind`: try a different approach, then rewind if it goes badly.
4. Checkpoint: `/code-review` in a fresh context, plus tests. Fix, then commit.
5. The learner creates a Gemini API key in Google AI Studio, confirms **billing is off** on its project, and creates a free Cloudflare account. Claude adds `worker/.dev.vars` to `.gitignore` *first*, then scaffolds `worker/` (wrangler config with the rate-limit binding, the SDK call, the Origin check, input checks, and `readReply` from `../reply.js` for the reply). The learner puts the key in `.dev.vars`. Check: `wrangler dev` returns recipes for a sample pantry, 403 for a wrong Origin, 429 on the 6th quick request, 400 for a bad body, 504 when the time limit is temporarily set to 1 second, and 503 when Gemini's quota error is faked by a temporary stub (so no real quota is used up).
6. Claude wires the button and the AI cards into `index.html`, pointing at the local Worker. Check in the Browser pane at 375 and 320 width: the loading state and every row of "What the user sees", no console errors, no sideways scroll. Fake the error cases (a stubbed `fetch`, or a Worker with a 1-second limit) so no free quota is spent on them.
7. **Security gate:** all four items above. The learner writes `REVIEW.md` (Claude can check it covers the three points).
8. Only after the gate passes: `wrangler deploy`, `wrangler secret put GEMINI_API_KEY`, set `PROXY_URL` to the deployed Worker, commit and push. Check on a real phone.
