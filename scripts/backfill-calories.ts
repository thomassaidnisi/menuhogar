// One-time backfill: estimates approximate kcal-per-portion for every existing recipe (the 40
// ebook recipes across the 4 weeks + the 19 Desayunos/Snacks entries) and patches the result
// directly into recipesData.ts / breakfastSnacksData.ts, matched by each recipe's unique `id`.
// Run with: npx tsx scripts/backfill-calories.ts
//
// Resumable: patches each file right after every successful estimate (not batched at the end),
// and skips any recipe that already has `estimatedCalories` in the source file. The free-tier
// Gemini quota is only 20 requests/day/model, so a full run across ~59 recipes may need several
// days — just re-run the script on subsequent days and it'll pick up where it left off.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { recipesW1, recipesW2, recipesW3, recipesW4 } from '../src/recipesData';
import { breakfastSnacksRecipes } from '../src/breakfastSnacksData';
import { Recipe, SnackRecipe } from '../src/types';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Falta GEMINI_API_KEY en .env');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'];
const ATTEMPTS_PER_MODEL = 2;

const SYSTEM_INSTRUCTION = `Sos un asistente que hace estimaciones NUTRICIONALES APROXIMADAS, no un cálculo nutricional exacto ni certificado. Vas a recibir la lista de ingredientes de una receta (con cantidades) y la cantidad de porciones base para la que están calculadas esas cantidades.

Tu tarea: estimar cuántas calorías (kcal) tiene, aproximadamente, UNA SOLA PORCIÓN de esa receta — es decir, las calorías totales de todos los ingredientes juntos, divididas por la cantidad de porciones base.

Reglas:
- Es una aproximación basada en tu conocimiento general de composición nutricional de alimentos comunes, no una consulta a una base de datos nutricional. Redondeá a un número entero razonable (ej. 350, 480, 620), no pretendas precisión decimal.
- Si algún ingrediente es ambiguo o la cantidad no es clara, hacé la mejor estimación razonable en vez de fallar.
- Devolvé únicamente el JSON pedido, nada de texto adicional.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: { caloriesPerPortion: { type: 'integer' } },
  required: ['caloriesPerPortion']
};

async function estimateCalories(ingredients: { name: string; amount: number; unit: string }[], basePortions: number): Promise<number | null> {
  const ingredientsList = ingredients.map((ing) => `- ${ing.amount} ${ing.unit} de ${ing.name}`).join('\n');
  const prompt = `Ingredientes de la receta (calculados para ${basePortions} porción${basePortions === 1 ? '' : 'es'}):\n${ingredientsList}\n\nEstimá las calorías aproximadas por UNA sola porción.`;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA
          }
        });
        const parsed = JSON.parse(response.text || '{}');
        if (typeof parsed.caloriesPerPortion === 'number') return Math.round(parsed.caloriesPerPortion);
        return null;
      } catch (err: any) {
        const isRetryable = err?.status === 503 || err?.status === 429;
        console.error(`  Gemini call failed (model ${model}, attempt ${attempt}/${ATTEMPTS_PER_MODEL}):`, err?.status, err?.message);
        if (!isRetryable) return null;
        if (attempt < ATTEMPTS_PER_MODEL) await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
  return null;
}

function alreadyHasCalories(filePath: string, id: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  // A recipe block runs from its `id: 'xxx',` line to the next `id:` line (or EOF) — look for
  // `estimatedCalories` within that slice so we don't false-positive on a sibling recipe's field.
  const idIdx = content.search(new RegExp(`id: ["']${id}["'],`));
  if (idIdx === -1) return false;
  const nextIdIdx = content.slice(idIdx + 1).search(/id: ["'][^"']+["'],/);
  const blockEnd = nextIdIdx === -1 ? content.length : idIdx + 1 + nextIdIdx;
  return /estimatedCalories:/.test(content.slice(idIdx, blockEnd));
}

function patchOneRecipe(filePath: string, id: string, calories: number): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  const idLineRegex = new RegExp(`([ \\t]*id: ["']${id}["'],\\n)`);
  if (!idLineRegex.test(content)) {
    console.warn(`  ⚠ No se encontró la línea "id: '${id}'," en ${path.basename(filePath)} — se omite.`);
    return false;
  }
  const indentMatch = content.match(new RegExp(`([ \\t]*)id: ["']${id}["'],`));
  const indent = indentMatch ? indentMatch[1] : '    ';
  content = content.replace(idLineRegex, `$1${indent}estimatedCalories: ${calories},\n`);
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

async function main() {
  const recipesDataPath = path.join(__dirname, '../src/recipesData.ts');
  const breakfastSnacksDataPath = path.join(__dirname, '../src/breakfastSnacksData.ts');

  const ebookRecipes: Recipe[] = [
    ...Object.values(recipesW1),
    ...Object.values(recipesW2),
    ...Object.values(recipesW3),
    ...Object.values(recipesW4)
  ];

  console.log(`Estimando calorías para ${ebookRecipes.length} recetas del ebook...`);
  let ebookDone = 0;
  for (const recipe of ebookRecipes) {
    if (alreadyHasCalories(recipesDataPath, recipe.id)) {
      console.log(`  ${recipe.name}... ya tiene estimatedCalories, se omite.`);
      ebookDone++;
      continue;
    }
    process.stdout.write(`  ${recipe.name}... `);
    const calories = await estimateCalories(recipe.ingredients, recipe.basePortions);
    if (calories !== null && patchOneRecipe(recipesDataPath, recipe.id, calories)) {
      console.log(`${calories} kcal (guardado)`);
      ebookDone++;
    } else {
      console.log('FALLÓ (se puede reintentar en una corrida posterior)');
    }
  }

  console.log(`\nEstimando calorías para ${breakfastSnacksRecipes.length} recetas de Desayunos/Snacks...`);
  let snacksDone = 0;
  for (const recipe of breakfastSnacksRecipes as SnackRecipe[]) {
    if (alreadyHasCalories(breakfastSnacksDataPath, recipe.id)) {
      console.log(`  ${recipe.name}... ya tiene estimatedCalories, se omite.`);
      snacksDone++;
      continue;
    }
    process.stdout.write(`  ${recipe.name}... `);
    const firstVariant = recipe.variants[0];
    const calories = await estimateCalories(firstVariant.ingredients, 1);
    if (calories !== null && patchOneRecipe(breakfastSnacksDataPath, recipe.id, calories)) {
      console.log(`${calories} kcal (guardado)`);
      snacksDone++;
    } else {
      console.log('FALLÓ (se puede reintentar en una corrida posterior)');
    }
  }

  console.log(`\nListo por ahora: ${ebookDone}/${ebookRecipes.length} recetas del ebook, ${snacksDone}/${breakfastSnacksRecipes.length} de Desayunos/Snacks.`);
  if (ebookDone < ebookRecipes.length || snacksDone < breakfastSnacksRecipes.length) {
    console.log('Quedan recetas pendientes — volvé a correr el script (ej. cuando se reponga la cuota diaria de Gemini) y va a retomar solo lo que falta.');
  }
}

main();
