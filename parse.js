// Splits typed text like "egg, cheese,, milk" into ["egg", "cheese", "milk"].
export function parseIngredients(text) {
  return text.split(",").map((s) => s.trim()).filter((s) => s !== "");
}
