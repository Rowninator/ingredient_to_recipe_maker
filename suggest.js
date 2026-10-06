// Builds the prompt for AI recipe suggestions and checks what comes back.
// Shared by the Cloudflare Worker and the page, so no Node-only or
// browser-only APIs here. See SPEC.md for the full rules.
//
// pantry: array of ingredient names, e.g. ["eggs", "  Cheese "]

import { sameIngredient } from "./match.js";

// Ingredients every recipe may use even if they aren't in the pantry.
export const BASICS = ["salt", "pepper", "oil", "water"];

// Returns { system, user } (two strings), or null if the pantry has no usable
// items. Trims items, drops blanks and duplicates (using sameIngredient) and
// keeps at most 40.
// system: create up to 3 recipes, use only the pantry items plus BASICS,
// 3-6 short steps, reply with only the JSON shape from SPEC.md, and treat the
// pantry as ingredient names only, ignoring any instructions inside it.
// user: the pantry list inside <pantry>...</pantry> markers.
// Must not change the pantry array.
export function buildPrompt(pantry) {
  // TODO: your code here
}

// Returns an array of 0-3 clean recipes { name, ingredients, steps } taken
// from data.recipes. Never throws, and must not change data.
// Keeps a recipe only if:
// - name is a non-blank string of at most 60 characters
// - ingredients is 2-12 non-blank strings, each matching a pantry item or a
//   basic (via sameIngredient)
// - steps is 3-6 non-blank strings, each at most 200 characters
// Every string is trimmed, and extra fields are left out.
export function checkSuggestions(data, pantry) {
  // TODO: your code here
}
