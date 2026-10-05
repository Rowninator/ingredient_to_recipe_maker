// Saves and loads the pantry (your list of ingredient names) so it comes back
// when you reopen the page.
//
// storage: anything with getItem(key) and setItem(key, text), like the
// browser's localStorage. Tests pass in a small fake one. It may also be null
// when the browser blocks storage.
//
// The list is stored under PANTRY_KEY as JSON text, e.g. '["eggs","cheese"]'.

export const PANTRY_KEY = "pantry-match:pantry";

// Writes items (an array of strings) to storage.
// Returns true if it saved, false if it couldn't (storage missing, full or
// blocked). Must never throw, and must not change the items array.
export function savePantry(storage, items) {
  try {
    storage.setItem(PANTRY_KEY, JSON.stringify(items));
    return true;
  } catch (e) {
    return false;
  }
}

// Reads the saved list back from storage.
// Returns [] when nothing is saved, the saved text is broken JSON, the saved
// value isn't an array, or storage is missing or throws. Keeps only entries
// that are non-blank strings, trimmed.
export function loadPantry(storage) {
  
  try {
    const data = storage.getItem(PANTRY_KEY);
    if (!data) {
      return [];
    }
    const items = JSON.parse(data);
    if (!Array.isArray(items)) {
      return [];
    }
    return items.filter((s) => typeof s === "string" && s.trim() !== "").map((s) => s.trim());
  } catch (e) {
    return [];
  }
}
