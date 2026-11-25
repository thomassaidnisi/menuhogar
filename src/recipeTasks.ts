// Shared meal-prep rules: one criterion for the Planificador Interactivo and the Meal Prep section.
import { MealPrepTask, PrepTask, Recipe } from './types';
import { weeklyPlans } from './recipesData';
import { loadCustomRecipes } from './customRecipesData';
import { nutritionMealRecipes, ORIGIN_LABEL } from './nutritionData';

// Planificador Interactivo's level for a "Preparar: receta" task, by how long the recipe takes.
// (Meal Prep no longer uses it: its levels come from each prep task.)
export function prepLevel(prepTime: number): 1 | 2 | 3 {
  return prepTime <= 20 ? 1 : prepTime <= 45 ? 2 : 3;
}

export interface PickableRecipe {
  recipe: Recipe;
  label: string; // badge text, e.g. "Ebook · Sem. 2 · Lunes · cena"
}

// Every recipe that can be added to a Meal Prep week: ebook (any week), nutrition (all categories)
// and imported. Imported ones are read fresh so recipes saved in this session show up.
export function getPickableRecipes(): PickableRecipe[] {
  const ebook = Object.entries(weeklyPlans).flatMap(([week, plan]) =>
    plan.days.flatMap((d) =>
      (['almuerzo', 'cena'] as const).map((mt) => ({ recipe: d[mt], label: `Ebook · Sem. ${week} · ${d.day} · ${mt}` }))
    )
  );
  const nutrition = nutritionMealRecipes.map((r) => ({
    recipe: r,
    label: `🌿 ${ORIGIN_LABEL[r.origin!]}${r.category ? ' · ' + r.category : ''}`
  }));
  const imported = loadCustomRecipes().map((r) => ({
    recipe: r,
    label: `✨ Importada${r.category ? ' · ' + r.category : ''}`
  }));
  return [...imported, ...nutrition, ...ebook];
}

// ---------- Extra recipes per Meal Prep week (mh_mealprep_extra_v1: { "1": ["nut_…", …] }) ----------

export const MEALPREP_EXTRA_KEY = 'mh_mealprep_extra_v1';
export type MealPrepExtras = Record<string, string[]>;

export function loadMealPrepExtras(): MealPrepExtras {
  try {
    const parsed = JSON.parse(localStorage.getItem(MEALPREP_EXTRA_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// ---------- Prep tasks cache for recipes without their own prepTasks (mh_prep_tasks_v1: { recipeId: PrepTask[] }) ----------

export const PREP_TASKS_CACHE_KEY = 'mh_prep_tasks_v1';
export type PrepTasksCache = Record<string, PrepTask[]>;

export function loadPrepTasksCache(): PrepTasksCache {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREP_TASKS_CACHE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// Asks /api/prep-tasks for 1-4 prep tasks. null on any failure (no key, no quota, bad response) —
// the caller falls back to the generic task and doesn't cache, so it's retried next session.
export async function fetchPrepTasks(recipe: Recipe): Promise<PrepTask[] | null> {
  try {
    const res = await fetch('/api/prep-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: recipe.name, ingredients: recipe.ingredients, steps: recipe.steps })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.tasks) && data.tasks.length > 0 ? data.tasks : null;
  } catch {
    return null;
  }
}

export const findPickableRecipe = (id: string) => getPickableRecipes().find((p) => p.recipe.id === id)?.recipe;

// Prefix shared by every task a recipe generates in a week — used to clear tilde/responsable on remove.
export const recipeTaskPrefix = (week: number, recipeId: string) => `w${week}_mp_${recipeId}_`;

// One task per prepTasks entry of each added recipe (recipe's own → cached → generic fallback).
// Recipes still generating are left out (their chip says "generando…"). Ids that no longer
// resolve (deleted imported recipe, renamed JSON id) are skipped silently.
export function getExtraTasks(
  week: number,
  extras: MealPrepExtras,
  cache: PrepTasksCache,
  generating: string[] = []
): MealPrepTask[] {
  const byId = new Map(getPickableRecipes().map((p) => [p.recipe.id, p.recipe]));
  return (extras[week] ?? []).flatMap((id) => {
    const recipe = byId.get(id);
    if (!recipe || generating.includes(id)) return [];
    const prefix = recipeTaskPrefix(week, recipe.id);
    const prepTasks = recipe.prepTasks?.length ? recipe.prepTasks : cache[recipe.id];
    if (!prepTasks?.length) {
      // Distinct id from the generated ones, so its tilde doesn't carry over to a real task later
      return [{
        id: `${prefix}generic`,
        title: `Dejar listos los ingredientes de ${recipe.name}`,
        description: 'Lavá, cortá y medí lo que necesite',
        level: 1,
        checked: false
      }];
    }
    return prepTasks.map((t, i) => ({
      id: `${prefix}${i}`,
      title: t.title,
      description: `${t.description} (~${t.minutes} min)`,
      level: t.level,
      checked: false
    }));
  });
}
