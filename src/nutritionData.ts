// Recetas y guía de la nutricionista y del taller antiinflamatorio, transcriptas a mano en
// reference/nutricion/*.json (los PDFs originales NO van al repo). Este archivo solo adapta ese
// JSON a los tipos que ya usa la app — el JSON es la única fuente.
import recetasRaw from '../reference/nutricion/recetas_nutricion.json';
import guiaRaw from '../reference/nutricion/guia_nutricion.json';
import prepTasksRaw from '../reference/nutricion/prep_tasks_nutricion.json';
import { PrepTask, Recipe, SnackRecipe } from './types';

type Origin = 'nutricionista' | 'taller';
type IngredientCategory = Recipe['ingredients'][number]['category'];

interface RawRecipe {
  id: string;
  name: string;
  origin: Origin;
  section: 'desayunos_snacks' | 'comidas';
  category: string;
  flavor: 'dulce' | 'salado' | 'mixto';
  basePortions: number;
  estimatedCalories?: number;
  timeMinutes: number;
  tags: string[];
  ingredients: { name: string; amount: number | null; unit: string }[];
  steps: string[];
  note?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  source: string;
  summary: string;
  items: string[];
  table?: { title: string; columns: string[]; rows: string[][] };
}

export const ORIGIN_LABEL: Record<NonNullable<Recipe['origin']>, string> = {
  ebook: 'Ebook',
  importada: 'Importada',
  nutricionista: 'Nutricionista',
  taller: 'Taller antiinflamatorio'
};

const recetas = recetasRaw as RawRecipe[];
const prepTasksById = prepTasksRaw as Record<string, PrepTask[]>;
export const guideSections = guiaRaw as GuideSection[];

// ponytail: the JSON has no góndola category, so it's guessed from the ingredient name. It feeds
// the Planificador's shopping list — if a guess is wrong there, add a "category" field to the JSON.
function guessCategory(name: string): IngredientCategory {
  const n = name.toLowerCase();
  if (/pollo|lomo|bondiola|merluza|salmón|jamón|bife|carne/.test(n)) return 'Carnicería';
  if (/huevo|clara|leche|yogur|queso|ricota|manteca|ghee/.test(n)) return 'Lácteos y Huevos';
  if (/espinaca|tomate|palta|banana|manzana|pera|naranja|limón|lima|zanahoria|cebolla|apio|pepino|brócoli|calabaza|frutilla|arándano|frambuesa|durazno|ananá|pomelo|uva|plátano|espárrago|perejil|cilantro|menta|jengibre|hojas|verdeo|ciboulette|repollo|vegetales|frutos rojos|^ajo\b(?! en polvo)/.test(n)) return 'Verdulería';
  return 'Almacén';
}

const MEAL_CATEGORY: Record<string, Recipe['category']> = {
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  pan: 'Pan',
  salsa: 'Salsa'
};

export const nutritionMealRecipes: Recipe[] = recetas
  .filter((r) => r.section === 'comidas')
  .map((r) => ({
    id: r.id,
    name: r.name,
    prepTime: r.timeMinutes,
    basePortions: r.basePortions,
    ingredients: r.ingredients.map((ing) => ({ ...ing, category: guessCategory(ing.name) })),
    steps: r.steps,
    note: r.note,
    origin: r.origin,
    category: MEAL_CATEGORY[r.category],
    estimatedCalories: r.estimatedCalories,
    prepTasks: prepTasksById[r.id]
  }));

export const nutritionSnackRecipes: SnackRecipe[] = recetas
  .filter((r) => r.section === 'desayunos_snacks')
  .map((r) => ({
    id: r.id,
    // bebida → Desayuno, merienda → Snack: keeps the existing Desayuno/Snack filters intact
    category: r.category === 'desayuno' || r.category === 'bebida' ? 'Desayuno' : 'Snack',
    flavor: r.flavor,
    name: r.name,
    description: r.note || r.tags.join(' · '),
    prepTime: r.timeMinutes,
    energyLevel: r.timeMinutes <= 10 ? 1 : r.timeMinutes <= 30 ? 2 : 3,
    origin: r.origin,
    variants: [{ ingredients: r.ingredients, steps: r.steps }],
    estimatedCalories: r.estimatedCalories
  }));
