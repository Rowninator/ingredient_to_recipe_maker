// Turns the AI's reply text into the response the Worker sends to the page.
// Shared module like suggest.js (no Node-only or browser-only APIs), so it
// can be tested with the saved replies in fixtures/replies/.
//
// It only sees the reply text, so it doesn't depend on the AI provider. The
// Worker checks the provider's own signals (finish reason, quota errors)
// before calling it.
//
// text: the AI's reply text, e.g. '{"recipes": [...]}'
// pantry: the list the page sent.

import { checkSuggestions } from "./suggest.js";

// Returns { status, body }:
// - 200 { recipes } with only the recipes that pass checkSuggestions
// - 502 { error: "bad_reply" } if text isn't a string of valid JSON.
//   Never includes the AI's text. Never throws.
export function readReply(text, pantry) {
  const badReply = { status: 502, body: { error: "bad_reply" } };

  if (typeof text !== "string") {
    return badReply;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return badReply;
  }
  return { status: 200, body: { recipes: checkSuggestions(data, pantry) } };
}
