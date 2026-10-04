// Returns the top 3 recipes that use at least one of the given ingredients,
// ranked by how many of the ingredients they use (most first).
//
// ingredients: array of strings, e.g. ["egg", "  Cheese "]
// recipes: array of { name: string, ingredients: string[] }

export function sameIngredient(a, b) {
  const x = a.trim().toLowerCase().replace(/\s+/g, ' ');
  const y = b.trim().toLowerCase().replace(/\s+/g, ' ');


  return x === y || x === y + 's' || x === y + 'es' || y === x + 's' || y === x + 'es';
}


export function matchRecipes(ingredients, recipes) {
  // TODO: your code here
  const cleanedIngredients = ingredients.map((s) => s.trim().toLowerCase().replace(/\s+/g, ' '));
  const matchedRecipes = recipes.filter((recipe) => {
    const recipeIngredients = recipe.ingredients.map((s) => s.trim().toLowerCase().replace(/\s+/g, ' '));
    return recipeIngredients.some((ing) => cleanedIngredients.some((cleanedIng) => sameIngredient(ing, cleanedIng)));
  });
  matchedRecipes.sort((a, b) => {
    const countA = a.ingredients.filter((ing) => cleanedIngredients.some((cleanedIng) => sameIngredient(ing, cleanedIng))).length;
    const countB = b.ingredients.filter((ing) => cleanedIngredients.some((cleanedIng) => sameIngredient(ing, cleanedIng))).length;
    return countB - countA;
  });
  return matchedRecipes.slice(0, 3);
}
