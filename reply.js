// Turns Claude's reply into the response the Worker sends to the page.
// Shared module like suggest.js (no Node-only or browser-only APIs), so it
// can be tested with the saved replies in fixtures/replies/.
//
// message: a Claude Messages API reply, e.g.
//   { content: [{ type: "text", text: '{"recipes": [...]}' }], stop_reason: "end_turn" }
// pantry: the list the page sent.

import { checkSuggestions } from "./suggest.js";

// Returns { status, body }:
// - 200 { recipes } with only the recipes that pass checkSuggestions
// - 502 { error: "bad_reply" } if Claude didn't finish normally or the text
//   isn't JSON. Never includes Claude's text. Never throws.
export function readReply(message, pantry) {
  const badReply = { status: 502, body: { error: "bad_reply" } };

  if (!message || message.stop_reason !== "end_turn" || !Array.isArray(message.content)) {
    return badReply;
  }
  const block = message.content.find((b) => b && b.type === "text");
  if (!block || typeof block.text !== "string") {
    return badReply;
  }
  let data;
  try {
    data = JSON.parse(block.text);
  } catch {
    return badReply;
  }
  return { status: 200, body: { recipes: checkSuggestions(data, pantry) } };
}
