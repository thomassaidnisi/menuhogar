// Something done ahead so cooking later is quick (wash, cut, soak, marinate, a base, a batch) —
// never "cook the dish". Used by the Meal Prep section for recipes added to a week.
export interface PrepTask {
  level: 1 | 2 | 3;
  title: string;
  description: string;
  minutes: number;
}

export interface Recipe {
  id: string;
  name: string;
  prepTime: number; // in minutes
  basePortions: number;
  ingredients: {
    name: string;
    amount: number | null; // base amount per basePortions; null = "a gusto" (never scaled)
    unit: string;
    category: 'Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén';
  }[];
  steps: string[];
  note?: string;
  // Absent on the fixed ebook recipes (treated as 'ebook'); 'nutricionista'/'taller' come from
  // reference/nutricion/recetas_nutricion.json via nutritionData.ts.
  origin?: 'ebook' | 'importada' | 'nutricionista' | 'taller';
  // Only meaningful for imported recipes — the ebook recipes get their meal type from their
  // fixed slot in weeklyPlans (almuerzo/cena) instead.
  // 'Pan'/'Salsa' are side preparations from the nutrition recipes — not offered as planner meals.
  category?: 'Almuerzo' | 'Cena' | 'Desayuno' | 'Snack' | 'Pan' | 'Salsa';
  // AI-estimated kcal per single portion (at basePortions), via POST /api/estimate-calories.
  // Approximate, not a precise nutritional calculation — shown only in recipe detail views.
  estimatedCalories?: number;
  // From prep_tasks_nutricion.json (nutrition recipes) or the import flow (imported recipes).
  // Ebook recipes have none: their prep tasks are AI-generated and cached in mh_prep_tasks_v1.
  prepTasks?: PrepTask[];
}

export interface DayMenu {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
  almuerzo: Recipe;
  cena: Recipe;
}

export interface WeekPlan {
  id: number; // 1, 2, 3, 4
  days: DayMenu[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number; // total accumulated amount
  unit: string;
  category: 'Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén';
  checked: boolean;
  assignedTo?: string; // ID of the member
}

export interface MealPrepTask {
  id: string;
  title: string;
  description: string;
  level: 1 | 2 | 3;
  checked: boolean;
  assignedTo?: string; // ID of the member
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string; // Tailwind color class or hex
}

export interface SnackVariant {
  name?: string;
  ingredients: { name: string; amount: number | null; unit: string }[]; // null = "a gusto"
  steps: string[];
}

export interface SnackRecipe {
  id: string;
  category: 'Desayuno' | 'Snack';
  // Whether the recipe (across ALL its variants) reads sweet, savory, or both — e.g. a recipe
  // named after a savory dish can still have one sweet variant tucked in, hence 'mixto'.
  flavor?: 'dulce' | 'salado' | 'mixto';
  name: string;
  description: string;
  prepTime: number; // in minutes
  energyLevel: 1 | 2 | 3;
  origin?: 'ebook' | 'nutricionista' | 'taller'; // absent = ebook (Mix & Match)
  variants: SnackVariant[];
  // AI-estimated kcal per portion, computed from the first variant's ingredients. Approximate,
  // shown only in the recipe detail view — see Recipe.estimatedCalories for the same convention.
  estimatedCalories?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}
