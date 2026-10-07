export interface Recipe {
  id: string;
  name: string;
  prepTime: number; // in minutes
  basePortions: number;
  ingredients: {
    name: string;
    amount: number; // base amount for 1 person (or per basePortions)
    unit: string;
    category: 'Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén';
  }[];
  steps: string[];
  note?: string;
  // Present on recipes imported by the user (via IA), absent on the fixed ebook recipes.
  origin?: 'ebook' | 'importada';
  // Only meaningful for imported recipes — the ebook recipes get their meal type from their
  // fixed slot in weeklyPlans (almuerzo/cena) instead.
  category?: 'Almuerzo' | 'Cena' | 'Desayuno' | 'Snack';
  // AI-estimated kcal per single portion (at basePortions), via POST /api/estimate-calories.
  // Approximate, not a precise nutritional calculation — shown only in recipe detail views.
  estimatedCalories?: number;
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
  ingredients: { name: string; amount: number; unit: string }[];
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
