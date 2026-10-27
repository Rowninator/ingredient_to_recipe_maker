# Security review: AI recipe suggestions

## Where the key lives

Today, the Gemini key lives only in local dev at `worker/.dev.vars` for `wrangler dev`. For production, the deployed Worker will get its secret via Cloudflare: `wrangler secret put GEMINI_API_KEY`. It will never appear in the browser, repo, or `index.html`; the page only sends `{"pantry": [...]}` to `PROXY_URL`, and the Worker is the only place that has the key.

## How a request flows

On “Suggest with AI,” the browser posts only the pantry list to the Worker: `fetch(PROXY_URL, { method: "POST", body: JSON.stringify({ pantry: sent }) })`. The Worker checks origin, CORS preflight, request method, per-IP rate limit, and pantry validation (`1-40` strings, max 40 chars, no commas). If valid, it builds a prompt from the pantry and calls Gemini with `systemInstruction` + `contents`, using `responseJsonSchema` and a 15s timeout. Gemini returns structured JSON; the Worker never passes raw Google errors to the page and runs the reply through `readReply()` / `checkSuggestions()` before returning only cleaned recipes to the browser. The page then renders cards with `textContent`, never `innerHTML`.

## Risks checked

- Key leak / browser exfiltration: if the key lived in the UI or repo, anyone could copy it. Protection: the deployed key will live in a Cloudflare Worker secret, not in the browser; local dev stays in `.dev.vars` and is ignored by git; `index.html` never includes it. Proof: I searched the project folder, the full git history (every branch, tag, and stored object), and the `.wrangler/` folder for my exact key and for anything shaped like a Google key; result: 0 matches. `.dev.vars` was also confirmed ignored by git and was never committed.
- The Origin check stops other sites from using my Worker through a visitor’s browser. It does not stop a malicious script from sending any Origin it wants. What limits a script instead is the strict pantry validation (what it can send) and the rate limit plus billing off on the Google project (how much). The rate limit caps requests per IP, and with billing off, abuse can only burn free quota, not money.

## Level 5: the Android app’s address

The Worker now also accepts `https://localhost`, the address the Android app sends with its requests.

Every Capacitor Android app uses the same address, so it does not prove a request came from *my* app. The rate limit allows 5 requests per minute per IP, and billing is off, so the worst case is using up the free quota, not costing money.

Evidence: the running app sent `https://localhost`, and the old Worker returned 403. Worker tests returned 403 for `http://localhost`, `https://localhost:3000`, another site's Origin, and no Origin. A key search that included `android/` and `dist-android/` found 0 matches.
