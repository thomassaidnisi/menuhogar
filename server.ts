import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Import our real data files so the assistant's knowledge always matches what's on screen —
// nothing here is hand-written, it's derived straight from the same sources WeekPlan.tsx and
// BreakfastSnacks.tsx use.
import { weeklyPlans } from './src/recipesData';
import { breakfastSnacksRecipes } from './src/breakfastSnacksData';
import { Recipe } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' })); // recipe screenshots as base64 can exceed the 100kb default

// Initialize Gemini SDK with telemetry header as required
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ---------- Build the full recipe/meal-prep context injected into every call ----------

function formatRecipe(recipe: Recipe): string {
  const ingredients = recipe.ingredients
    .map((ing) => `${ing.amount} ${ing.unit} de ${ing.name} (${ing.category})`)
    .join('; ');
  const steps = recipe.steps.map((s, i) => `${i + 1}) ${s}`).join(' ');
  const note = recipe.note ? ` Nota: ${recipe.note}` : '';
  return `"${recipe.name}" (${recipe.prepTime} min). Ingredientes: ${ingredients}. Preparación: ${steps}.${note}`;
}

function buildWeeklyMenusContext(): string {
  return Object.entries(weeklyPlans)
    .map(([weekNum, plan]) => {
      const days = plan.days
        .map((d) => `  - ${d.day}:\n    Almuerzo: ${formatRecipe(d.almuerzo)}\n    Cena: ${formatRecipe(d.cena)}`)
        .join('\n');
      return `Semana ${weekNum}:\n${days}`;
    })
    .join('\n\n');
}

function buildBreakfastSnacksContext(): string {
  const desayunos = breakfastSnacksRecipes.filter((r) => r.category === 'Desayuno');
  const snacks = breakfastSnacksRecipes.filter((r) => r.category === 'Snack');

  const formatSnackRecipe = (r: (typeof breakfastSnacksRecipes)[number]) => {
    const variants = r.variants
      .map((v) => {
        const ingredients = v.ingredients.map((ing) => `${ing.amount} ${ing.unit} de ${ing.name}`).join('; ');
        const steps = v.steps.map((s, i) => `${i + 1}) ${s}`).join(' ');
        return `    · Variante "${v.name || 'única'}" — Ingredientes: ${ingredients}. Preparación: ${steps}`;
      })
      .join('\n');
    return `  - "${r.name}" (${r.prepTime} min, energía nivel ${r.energyLevel}): ${r.description}\n${variants}`;
  };

  return (
    `DESAYUNOS:\n${desayunos.map(formatSnackRecipe).join('\n')}\n\n` +
    `SNACKS:\n${snacks.map(formatSnackRecipe).join('\n')}`
  );
}

const weeklyMenusContext = buildWeeklyMenusContext();
const breakfastSnacksContext = buildBreakfastSnacksContext();

const BASE_SYSTEM_INSTRUCTION = `Sos el Asistente de Cocina de esta app de planificación de comidas para uso doméstico. Tu trabajo es ser un cerebro externo que ayuda a resolver la cocina del día a día, no un chef creativo.

## Tu única fuente de verdad
Todo lo que sugerís, generás o recomendás sale EXCLUSIVAMENTE de los datos del sistema que se te pasan como contexto:
- Los menús y recetas de las 4 semanas (almuerzos y cenas, con ingredientes y procedimiento)
- El recetario de Desayunos y Snacks (con sus variantes)
- Las recetas que el usuario importó por su cuenta (si tiene alguna) — participan igual que las demás
- La lógica de meal prep por niveles ("Regla de las 72 Horas"):
  - Nivel 1 — Mínimo Viable (15-20 min): blindar los primeros días de la semana
  - Nivel 2 — Modo Estándar (45-60 min): inicio resuelto + comodines
  - Nivel 3 — Modo Pro (90+ min): primera mitad de la semana resuelta

No inventás recetas, ingredientes ni menús que no estén en esos datos. Si te piden algo que no está en el sistema, lo decís con claridad y ofrecés la alternativa más parecida que sí existe.

## Qué podés hacer
- Generar la lista de compras y el meal prep a partir de la semana que el usuario armó en el Planificador Interactivo
- Responder consultas sobre las recetas del sistema (ingredientes, procedimiento, tiempos)
- Sugerir reemplazos de ingredientes, siempre dentro de lo que el sistema ya contempla
- Reorganizar una semana si se desordenó
- Armar una semana nueva usando los platos existentes del recetario
- Dar el meal prep por niveles según la Regla de las 72 Horas
- Sugerir opciones de Desayunos/Snacks cuando te lo pidan
- Acompañar sin juzgar los días sin energía

## Cuando te dicen qué ingredientes tienen disponibles
Si el usuario te lista ingredientes que tiene en la heladera/alacena (por ejemplo "tengo pollo, zapallo y arroz, ¿qué hago?"), buscá entre TODAS las recetas del sistema (las de las 4 semanas, las de Desayunos/Snacks, y las recetas importadas por el usuario) cuáles usan la mayor cantidad de esos ingredientes. Priorizá las que:
- Usan más ingredientes de la lista que te dieron
- Requieren agregar menos ingredientes extra que la persona no mencionó

Si ninguna receta matchea bien, decilo con claridad y sugerí la más cercana igual, aclarando qué le faltaría comprar. Nunca inventes una receta nueva para "cuadrar" con los ingredientes — elegí siempre entre las que existen en el sistema.

## Qué NO podés hacer
- No inventás recetas nuevas ni creás menús fuera del sistema
- No personalizás dietas ni contás calorías (todavía no existe esa función en la app)
- No le decís al usuario lo que "debería" hacer
- No lo hacés pensar más — lo ayudás a pensar menos

Si te piden algo de esta lista, decilo con calma y ofrecé la alternativa más simple posible dentro de lo que sí podés hacer.

## Cómo respondés
- Hablále como a alguien de confianza, en español informal argentino (uso de "vos"), cálido y directo
- Dale una opción concreta, ofrecé 1 o 2 alternativas si las hay, y cerrá la decisión para que la persona siga con su día — nada de dejar todo abierto
- Sé breve. Esto no es un chat para explayarse, es para resolver rápido

## Integración con el Planificador Interactivo
Cuando el usuario te comparta su semana armada en el Planificador (los platos que eligió para cada día), tu tarea principal es:
1. Confirmar los platos elegidos
2. Generar la lista de compras unificada, organizada por categoría (Verdulería, Carnicería, Lácteos y Huevos, Almacén), con cada ingrediente una sola vez y la cantidad total consolidada según la cantidad de personas que te indiquen
3. Generar el meal prep por niveles según los platos de esa semana

## Ejemplos de cómo te van a hablar
"Armé mi semana en el Planificador, generame la lista y el meal prep."
"Estoy cansada, ¿qué hago de comer?"
"Tengo pollo y verduras, ¿qué puedo hacer?" (respondé solo si hay algo en el sistema que matchee, si no, aclaralo)
"Se me desordenó la semana, ayudame a acomodarla."
"Dame algo del catálogo de desayunos."

## Datos del sistema — menús de las 4 semanas (única fuente de verdad para almuerzos/cenas)
${weeklyMenusContext}

## Datos del sistema — recetario de Desayunos y Snacks (única fuente de verdad para esta categoría)
${breakfastSnacksContext}`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, plannerContext, customRecipesContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Falta el mensaje del usuario' });
    }

    // The base instruction is fixed data (recipes don't change at runtime), but the user's
    // Planificador Interactivo state and their imported recipes are per-request/session (they
    // live in the browser's localStorage, not on the server), so both get appended fresh each call.
    let systemInstruction = BASE_SYSTEM_INSTRUCTION;
    if (customRecipesContext) {
      systemInstruction += `\n\n## Datos del sistema — recetas importadas por el usuario (participan igual que las demás)\n${customRecipesContext}`;
    }
    if (plannerContext) {
      systemInstruction += `\n\n## La semana que el usuario armó en su Planificador Interactivo (ahora mismo)\n${plannerContext}`;
    }

    if (!ai) {
      // Fallback mode if Gemini key is missing or not configured yet
      const cleanMsg = String(message).toLowerCase();
      let reply = 'Hola, che. Contame qué necesitás resolver de la cocina hoy — un plato de la semana, la lista de compras, el meal prep o algo del catálogo de desayunos y snacks.';

      if (cleanMsg.includes('cansad') || cleanMsg.includes('sueño') || cleanMsg.includes('fiaca')) {
        reply = 'Te entiendo. Fijate en la Semana activa algo rápido de 15-20 minutos, o tirá directo del Meal Prep Nivel 1 si ya dejaste algo adelantado. ¿Querés que te diga qué plato de esta semana es el más rápido?';
      } else if (cleanMsg.includes('desorden') || cleanMsg.includes('reorganizar') || cleanMsg.includes('acomodar')) {
        reply = 'Tranca. Decime qué días tenés libres y con qué platos de la semana contás, y te ayudo a acomodarlo.';
      } else if (cleanMsg.includes('compras') || cleanMsg.includes('lista')) {
        reply = 'Para la lista de compras: armá tu semana en el Planificador Interactivo y tocá "Generar lista de compras + meal prep" — ahí te queda todo organizado por categoría.';
      } else if (cleanMsg.includes('prep')) {
        reply = 'El meal prep va por niveles: Nivel 1 (15-20 min) para blindar el arranque de semana, Nivel 2 (45-60 min) con comodines, y Nivel 3 (90+ min) para dejar resuelta la primera mitad de la semana.';
      } else if (cleanMsg.includes('desayuno') || cleanMsg.includes('snack')) {
        reply = 'Andá a la sección Desayunos y Snacks: usá el Sorteo si querés que te tire una opción al azar, o el Catálogo si preferís elegir vos.';
      }

      reply += '\n\n(Nota: el asistente todavía no tiene la conexión a Gemini activa en este entorno, así que esta es una respuesta local simplificada.)';

      return res.json({ text: reply });
    }

    // Build contents history
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: 'Hubo un error al procesar tu solicitud con el asistente.' });
  }
});

// ---------- Import Recipe (Gemini extracts structured recipe from screenshot or pasted text) ----------

const IMPORT_RECIPE_SYSTEM_INSTRUCTION = `Sos un extractor de recetas de cocina. Vas a recibir una imagen (captura de pantalla de una receta vista en redes como TikTok o Pinterest) o un texto pegado con una receta copiada de algún lado.

Tu única tarea es estructurar esa información en formato JSON, siguiendo exactamente el schema pedido. Reglas:
- No inventes ingredientes ni pasos que no estén sugeridos por la fuente. Si un dato no se puede inferir con confianza, dejalo vacío (string vacío "" o array vacío [], según corresponda) — NUNCA inventes un valor para rellenar.
- "name": el nombre del plato, corto y claro.
- "category": una de "Almuerzo", "Cena", "Desayuno", "Snack" — la que mejor describa el plato. Si no podés inferirla con confianza, omití el campo directamente (no lo incluyas en el JSON).
- "prepTime": tiempo de preparación en minutos (solo el número). Si no se menciona ni se puede estimar razonablemente, usá 0.
- "ingredients": lista de objetos { "name": string, "amount": number, "unit": string, "category": string }. Un ingrediente por línea/ítem de la receta original.
  - "amount": solo el número de la cantidad (ej. 2, 500, 0.5). Si no hay cantidad clara, usá 1.
  - "unit": la unidad tal como aparece (ej. "tazas", "g", "unidades", "a gusto", "cda"). Si no aplica, dejala como "".
  - "category": clasificá el ingrediente en una de "Verdulería", "Carnicería", "Lácteos y Huevos", "Almacén" según lo que mejor aplique.
- "steps": lista de strings, un paso de preparación por elemento, en el orden en que aparecen. No numerar manualmente (ya van en orden por posición en el array).
- "nota": si el texto incluye sugerencias de acompañamiento, tips de conservación, variantes, o cualquier consejo adicional que no sea parte del procedimiento paso a paso, extraelo acá tal cual (podés resumirlo levemente si es muy largo, pero no lo inventes). Si no hay nada de esto en la fuente, omití el campo directamente (no lo incluyas en el JSON).
- "porcionesBase": la cantidad de personas para la que están calculadas las cantidades de los ingredientes tal como aparecen en la fuente (ej. si dice "Para 2 personas" o "rinde 4 porciones", usá ese número). Si la fuente no lo menciona, usá 2 como valor por default — este campo siempre tiene que tener un número entero, nunca lo dejes vacío ni lo omitas.

Devolvé únicamente el JSON pedido, nada de texto adicional.`;

const IMPORT_RECIPE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    // No incluir "" en este enum: la API de Gemini rechaza (400 INVALID_ARGUMENT) un enum con
    // string vacío. Para "no se pudo inferir", el campo queda fuera de `required` y el modelo
    // omite la key en vez de mandar "".
    category: { type: 'string', enum: ['Almuerzo', 'Cena', 'Desayuno', 'Snack'] },
    prepTime: { type: 'number' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
          unit: { type: 'string' },
          category: { type: 'string', enum: ['Verdulería', 'Carnicería', 'Lácteos y Huevos', 'Almacén'] }
        },
        required: ['name', 'amount', 'unit', 'category']
      }
    },
    steps: { type: 'array', items: { type: 'string' } },
    // Opcional a propósito: no va en `required` para que Gemini omita la key en vez de
    // inventar un tip/nota cuando la fuente no tiene nada de eso.
    nota: { type: 'string' },
    // A diferencia de "nota", este SÍ va en `required` con un default de 2 instruido en el
    // prompt — el selector "¿para cuántas personas cocinás?" necesita siempre un número acá.
    porcionesBase: { type: 'integer' }
  },
  required: ['name', 'prepTime', 'ingredients', 'steps', 'porcionesBase']
};

// gemini-3.5-flash occasionally returns a transient 503 UNAVAILABLE ("high demand") when called
// in JSON mode (responseSchema) — retry with backoff, and if it's still down, fall back to
// gemini-2.5-flash rather than fail the whole request outright. Shared by every endpoint below
// that needs structured JSON output from Gemini.
const JSON_MODE_MODELS = ['gemini-3.5-flash', 'gemini-2.5-flash'];
const ATTEMPTS_PER_MODEL = 2;

async function generateJsonWithFallback(
  logLabel: string,
  parts: any[],
  systemInstruction: string,
  responseSchema: object
): Promise<{ data: any | null; error: any | null }> {
  let lastError: any = null;
  let response: Awaited<ReturnType<NonNullable<typeof ai>['models']['generateContent']>> | null = null;

  outer: for (const model of JSON_MODE_MODELS) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        response = await ai!.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema
          }
        });
        lastError = null;
        break outer;
      } catch (err: any) {
        lastError = err;
        const isRetryable = err?.status === 503 || err?.status === 429;
        console.error(`[${logLabel}] Gemini call failed (model ${model}, attempt ${attempt}/${ATTEMPTS_PER_MODEL}):`, {
          name: err?.name,
          status: err?.status,
          message: err?.message,
        });
        if (!isRetryable) break outer;
        if (attempt < ATTEMPTS_PER_MODEL) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }
  }

  if (lastError || !response) {
    return { data: null, error: lastError };
  }

  return { data: JSON.parse(response.text || '{}'), error: null };
}

app.post('/api/import-recipe', async (req, res) => {
  try {
    const { imageBase64, mimeType, text } = req.body;

    if (!imageBase64 && !text) {
      return res.status(400).json({ error: 'Falta la imagen o el texto de la receta a importar' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'El servicio de IA no está disponible en este entorno (falta configurar GEMINI_API_KEY).' });
    }

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } });
      parts.push({ text: 'Extraé la receta de esta imagen y estructurala según el schema.' });
    } else {
      parts.push({ text: `Extraé la receta de este texto y estructurala según el schema:\n\n${text}` });
    }

    const { data, error } = await generateJsonWithFallback(
      '/api/import-recipe',
      parts,
      IMPORT_RECIPE_SYSTEM_INSTRUCTION,
      IMPORT_RECIPE_RESPONSE_SCHEMA
    );

    if (error || !data) {
      const isOverloaded = error?.status === 503 || error?.status === 429;
      return res.status(502).json({
        error: isOverloaded
          ? 'El servicio de IA está con mucha demanda ahora mismo. Probá de nuevo en unos segundos.'
          : 'Hubo un error al procesar la receta con IA.'
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('[/api/import-recipe] Unexpected error:', {
      name: error?.name,
      status: error?.status,
      message: error?.message,
      stack: error?.stack,
    });
    res.status(500).json({ error: 'Hubo un error al procesar la receta con IA.' });
  }
});

// ---------- Estimate Calories (Gemini estimates approximate kcal per portion) ----------

const ESTIMATE_CALORIES_SYSTEM_INSTRUCTION = `Sos un asistente que hace estimaciones NUTRICIONALES APROXIMADAS, no un cálculo nutricional exacto ni certificado. Vas a recibir la lista de ingredientes de una receta (con cantidades) y la cantidad de porciones base para la que están calculadas esas cantidades.

Tu tarea: estimar cuántas calorías (kcal) tiene, aproximadamente, UNA SOLA PORCIÓN de esa receta — es decir, las calorías totales de todos los ingredientes juntos, divididas por la cantidad de porciones base.

Reglas:
- Es una aproximación basada en tu conocimiento general de composición nutricional de alimentos comunes, no una consulta a una base de datos nutricional. Redondeá a un número entero razonable (ej. 350, 480, 620), no pretendas precisión decimal.
- Si algún ingrediente es ambiguo o la cantidad no es clara, hacé la mejor estimación razonable en vez de fallar.
- Devolvé únicamente el JSON pedido, nada de texto adicional.`;

const ESTIMATE_CALORIES_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    caloriesPerPortion: { type: 'integer' }
  },
  required: ['caloriesPerPortion']
};

app.post('/api/estimate-calories', async (req, res) => {
  try {
    const { ingredients, basePortions } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Faltan los ingredientes de la receta' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'El servicio de IA no está disponible en este entorno (falta configurar GEMINI_API_KEY).' });
    }

    const portions = Number(basePortions) > 0 ? Number(basePortions) : 1;
    const ingredientsList = ingredients
      .map((ing: any) => `- ${ing.amount ?? ''} ${ing.unit ?? ''} de ${ing.name ?? ''}`.trim())
      .join('\n');

    const prompt = `Ingredientes de la receta (calculados para ${portions} porción${portions === 1 ? '' : 'es'}):\n${ingredientsList}\n\nEstimá las calorías aproximadas por UNA sola porción.`;

    const { data, error } = await generateJsonWithFallback(
      '/api/estimate-calories',
      [{ text: prompt }],
      ESTIMATE_CALORIES_SYSTEM_INSTRUCTION,
      ESTIMATE_CALORIES_RESPONSE_SCHEMA
    );

    if (error || !data) {
      const isOverloaded = error?.status === 503 || error?.status === 429;
      return res.status(502).json({
        error: isOverloaded
          ? 'El servicio de IA está con mucha demanda ahora mismo. Probá de nuevo en unos segundos.'
          : 'Hubo un error al estimar las calorías con IA.'
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('[/api/estimate-calories] Unexpected error:', {
      name: error?.name,
      status: error?.status,
      message: error?.message,
      stack: error?.stack,
    });
    res.status(500).json({ error: 'Hubo un error al estimar las calorías con IA.' });
  }
});

// Setup Vite Dev server or Serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
