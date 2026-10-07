import { Recipe } from './types';

// Recetas importadas por el usuario (IA desde captura/texto). Viven separadas del recetario
// fijo del ebook (recipesData.ts / weeklyPlans), persistidas en localStorage, y se fusionan
// en runtime con las recetas del ebook donde haga falta (Recetario, picker "Ebook" del
// Planificador Interactivo, etc.) para que participen igual que cualquier otra receta.
const STORAGE_KEY = 'mh_custom_recipes_v1';

export function loadCustomRecipes(): Recipe[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomRecipes(recipes: Recipe[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export function addCustomRecipe(recipe: Recipe): Recipe[] {
  const recipes = loadCustomRecipes();
  const updated = [...recipes, recipe];
  saveCustomRecipes(updated);
  return updated;
}

export function removeCustomRecipe(id: string): Recipe[] {
  const updated = loadCustomRecipes().filter((r) => r.id !== id);
  saveCustomRecipes(updated);
  return updated;
}

export function makeRecipeId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
