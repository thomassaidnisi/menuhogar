import React, { useRef, useState } from 'react';
import { Sparkles, Image as ImageIcon, FileText, Upload, Plus, Trash2, Loader2, X, CheckCircle2 } from 'lucide-react';
import { Recipe } from '../types';
import { addCustomRecipe, makeRecipeId } from '../customRecipesData';

interface ImportRecipeProps {
  onSaved?: () => void;
}

type IngredientCategory = 'Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén';
const CATEGORIES: IngredientCategory[] = ['Verdulería', 'Carnicería', 'Lácteos y Huevos', 'Almacén'];
const MEAL_CATEGORIES: Recipe['category'][] = ['Almuerzo', 'Cena', 'Desayuno', 'Snack'];

interface DraftIngredient {
  name: string;
  amount: string; // kept as free text while editing, parsed to number on save
  unit: string;
  category: IngredientCategory;
}

interface DraftRecipe {
  name: string;
  category: '' | Exclude<Recipe['category'], undefined>;
  prepTime: string;
  ingredients: DraftIngredient[];
  steps: string[];
  note: string;
  basePortions: string;
  estimatedCalories: string;
}

function emptyDraft(): DraftRecipe {
  return { name: '', category: '', prepTime: '', ingredients: [], steps: [], note: '', basePortions: '2', estimatedCalories: '' };
}

const amberBorder = 'border-[#E08A3C] focus:border-[#E08A3C] bg-[#E08A3C]/5';
const normalBorder = 'border-[#E8E4DC] focus:border-[#4A7856]';

export default function ImportRecipe({ onSaved }: ImportRecipeProps) {
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [draft, setDraft] = useState<DraftRecipe>(emptyDraft());
  const [savedFlash, setSavedFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // data:image/xxx;base64,....
      const [meta, base64] = result.split(',');
      const mimeMatch = meta.match(/data:(.*);base64/);
      setImageBase64(base64);
      setImageMimeType(mimeMatch ? mimeMatch[1] : file.type || 'image/jpeg');
      setImagePreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const resetSource = () => {
    setImageBase64(null);
    setImagePreviewUrl(null);
    setPastedText('');
    setHasExtracted(false);
    setDraft(emptyDraft());
    setExtractError(null);
  };

  const handleExtract = async () => {
    setExtractError(null);
    setIsExtracting(true);
    try {
      const body = mode === 'image' ? { imageBase64, mimeType: imageMimeType } : { text: pastedText };
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo extraer la receta.');
      }
      const data = await res.json();
      const ingredients: DraftIngredient[] = Array.isArray(data.ingredients)
        ? data.ingredients.map((ing: any) => ({
            name: ing.name || '',
            amount: ing.amount !== undefined && ing.amount !== null ? String(ing.amount) : '',
            unit: ing.unit || '',
            category: CATEGORIES.includes(ing.category) ? ing.category : 'Almacén'
          }))
        : [];
      const basePortions = data.porcionesBase !== undefined && data.porcionesBase !== null ? String(data.porcionesBase) : '2';

      setDraft({
        name: data.name || '',
        category: (MEAL_CATEGORIES.includes(data.category) ? data.category : '') as DraftRecipe['category'],
        prepTime: data.prepTime ? String(data.prepTime) : '',
        ingredients,
        steps: Array.isArray(data.steps) ? data.steps.filter((s: any) => typeof s === 'string') : [],
        note: typeof data.nota === 'string' ? data.nota : '',
        basePortions,
        estimatedCalories: ''
      });
      setHasExtracted(true);

      // Calorie estimation is best-effort: if it fails, the field just stays empty and editable
      // rather than blocking the already-successful recipe extraction.
      if (ingredients.length > 0) {
        try {
          const calRes = await fetch('/api/estimate-calories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ingredients: ingredients.map((ing) => ({ name: ing.name, amount: Number(ing.amount) || 1, unit: ing.unit })),
              basePortions: Number(basePortions) || 2
            })
          });
          if (calRes.ok) {
            const calData = await calRes.json();
            if (calData.caloriesPerPortion !== undefined && calData.caloriesPerPortion !== null) {
              setDraft((prev) => ({ ...prev, estimatedCalories: String(calData.caloriesPerPortion) }));
            }
          }
        } catch {
          // silently leave estimatedCalories empty — user can fill it in manually
        }
      }
    } catch (err: any) {
      setExtractError(err.message || 'Hubo un error al procesar la receta con IA.');
    } finally {
      setIsExtracting(false);
    }
  };

  // ---------- Review form helpers ----------

  const updateIngredient = (idx: number, updates: Partial<DraftIngredient>) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => (i === idx ? { ...ing, ...updates } : ing))
    }));
  };

  const addIngredient = () => {
    setDraft((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '', category: 'Almacén' }]
    }));
  };

  const removeIngredient = (idx: number) => {
    setDraft((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
  };

  const updateStep = (idx: number, text: string) => {
    setDraft((prev) => ({ ...prev, steps: prev.steps.map((s, i) => (i === idx ? text : s)) }));
  };

  const addStep = () => {
    setDraft((prev) => ({ ...prev, steps: [...prev.steps, ''] }));
  };

  const removeStep = (idx: number) => {
    setDraft((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }));
  };

  // ---------- Validation ----------

  const hasValidIngredients = draft.ingredients.length > 0 && draft.ingredients.every((i) => i.name.trim());
  const hasValidSteps = draft.steps.length > 0 && draft.steps.every((s) => s.trim());
  const isValid = draft.name.trim() && draft.category && hasValidIngredients && hasValidSteps;

  const handleSave = () => {
    if (!isValid) return;
    const recipe: Recipe = {
      id: makeRecipeId(),
      name: draft.name.trim(),
      prepTime: draft.prepTime ? Number(draft.prepTime) || 0 : 0,
      basePortions: Math.max(1, Number(draft.basePortions) || 2),
      ingredients: draft.ingredients.map((ing) => ({
        name: ing.name.trim(),
        amount: Number(ing.amount) || 1,
        unit: ing.unit.trim(),
        category: ing.category
      })),
      steps: draft.steps.map((s) => s.trim()),
      note: draft.note.trim() || undefined,
      origin: 'importada',
      category: draft.category || undefined,
      estimatedCalories: draft.estimatedCalories.trim() ? Number(draft.estimatedCalories) || undefined : undefined
    };
    addCustomRecipe(recipe);
    setSavedFlash(true);
    setTimeout(() => {
      setSavedFlash(false);
      resetSource();
      onSaved?.();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif font-extrabold text-2xl text-[#2B2B28] tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#4A7856]" />
          Importar Receta
        </h2>
        <p className="text-sm text-[#8A8579] mt-1">
          Sumá recetas que encontraste en TikTok, Pinterest o donde sea — la IA la estructura por vos y la sumás al recetario.
        </p>
      </div>

      {!hasExtracted && (
        <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-5 space-y-4">
          {/* Toggle Subir imagen / Pegar texto */}
          <div className="flex bg-[#FDFCFA] p-1 rounded-full border border-[#E8E4DC] self-start w-fit">
            <button
              onClick={() => setMode('image')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'image' ? 'bg-[#4A7856] text-white' : 'text-[#8A8579] hover:text-[#2B2B28]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Subir imagen
            </button>
            <button
              onClick={() => setMode('text')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'text' ? 'bg-[#4A7856] text-white' : 'text-[#8A8579] hover:text-[#2B2B28]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Pegar texto
            </button>
          </div>

          {mode === 'image' ? (
            <div className="space-y-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {imagePreviewUrl ? (
                <div className="relative w-full max-w-sm">
                  <img src={imagePreviewUrl} alt="Captura de la receta" className="w-full rounded-xl border border-[#E8E4DC]" />
                  <button
                    onClick={() => { setImageBase64(null); setImagePreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-sm border-2 border-dashed border-[#E8E4DC] hover:border-[#4A7856]/50 rounded-xl p-8 flex flex-col items-center gap-2 text-[#8A8579] hover:text-[#4A7856] transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-semibold">Subí una captura de pantalla</span>
                  <span className="text-xs">De TikTok, Pinterest, Instagram, etc.</span>
                </button>
              )}
            </div>
          ) : (
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Pegá acá el texto de la receta copiado de algún lado..."
              rows={8}
              className="w-full bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
            />
          )}

          {extractError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
              {extractError}
            </div>
          )}

          <button
            id="extract-recipe-btn"
            onClick={handleExtract}
            disabled={isExtracting || (mode === 'image' ? !imageBase64 : !pastedText.trim())}
            className="bg-[#4A7856] hover:bg-[#4A7856]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-3 text-sm font-bold flex items-center gap-2 transition-colors"
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isExtracting ? 'Procesando con IA...' : 'Extraer receta con IA'}
          </button>
        </div>
      )}

      {/* Pantalla de revisión — siempre editable, nunca guardado directo */}
      {hasExtracted && (
        <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-extrabold text-lg text-[#2B2B28]">Revisá y completá la receta</h3>
            <button
              onClick={resetSource}
              className="text-xs text-[#8A8579] hover:text-[#2B2B28] font-medium flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Descartar
            </button>
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Nombre *</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Falta completar"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden ${draft.name.trim() ? normalBorder : amberBorder}`}
            />
          </div>

          {/* Categoría + Tiempo + Porciones base */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Categoría *</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value as DraftRecipe['category'] }))}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden ${draft.category ? normalBorder : amberBorder}`}
              >
                <option value="">Falta completar</option>
                {MEAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Tiempo de preparación (min)</label>
              <input
                type="number"
                min={0}
                value={draft.prepTime}
                onChange={(e) => setDraft((prev) => ({ ...prev, prepTime: e.target.value }))}
                placeholder="Opcional"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden ${normalBorder}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Porciones base</label>
              <input
                type="number"
                min={1}
                value={draft.basePortions}
                onChange={(e) => setDraft((prev) => ({ ...prev, basePortions: e.target.value }))}
                placeholder="2"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden ${normalBorder}`}
              />
              <p className="text-[10px] text-[#8A8579]">Personas para las que rinden las cantidades de arriba.</p>
            </div>
          </div>

          {/* Ingredientes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Ingredientes * (al menos 1)</label>
            <div className="space-y-2">
              {draft.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                    placeholder="Falta completar"
                    className={`flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm text-[#2B2B28] focus:outline-hidden ${ing.name.trim() ? normalBorder : amberBorder}`}
                  />
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, { amount: e.target.value })}
                    placeholder="Cant."
                    className={`w-16 border rounded-lg px-2 py-2 text-sm text-[#2B2B28] focus:outline-hidden ${normalBorder}`}
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
                    placeholder="Unidad"
                    className={`w-20 border rounded-lg px-2 py-2 text-sm text-[#2B2B28] focus:outline-hidden ${normalBorder}`}
                  />
                  <select
                    value={ing.category}
                    onChange={(e) => updateIngredient(idx, { category: e.target.value as IngredientCategory })}
                    className={`w-32 border rounded-lg px-2 py-2 text-xs text-[#2B2B28] focus:outline-hidden ${normalBorder}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="shrink-0 p-2 text-[#8A8579] hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addIngredient}
              className="text-xs font-bold text-[#4A7856] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar ingrediente
            </button>
          </div>

          {/* Pasos */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Pasos de preparación * (al menos 1)</label>
            <div className="space-y-2">
              {draft.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-6 h-6 mt-1.5 rounded-full bg-[#4A7856]/10 text-[#4A7856] flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(idx, e.target.value)}
                    placeholder="Falta completar"
                    rows={2}
                    className={`flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm text-[#2B2B28] focus:outline-hidden ${step.trim() ? normalBorder : amberBorder}`}
                  />
                  <button
                    onClick={() => removeStep(idx)}
                    className="shrink-0 p-2 mt-1 text-[#8A8579] hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              className="text-xs font-bold text-[#4A7856] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar paso
            </button>
          </div>

          {/* Nota / tip */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Nota o tip (opcional)</label>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Tip o sugerencia (opcional)"
              rows={2}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden ${normalBorder}`}
            />
          </div>

          {/* Calorías estimadas */}
          <div className="space-y-1.5 max-w-xs">
            <label className="text-xs font-bold text-[#8A8579] uppercase tracking-wider">Calorías estimadas por porción (opcional)</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={draft.estimatedCalories}
                onChange={(e) => setDraft((prev) => ({ ...prev, estimatedCalories: e.target.value }))}
                placeholder="Estimado por IA"
                className={`w-full border rounded-xl px-4 py-2.5 pr-14 text-sm text-[#2B2B28] focus:outline-hidden ${normalBorder}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8A8579]">kcal</span>
            </div>
            <p className="text-[10px] text-[#8A8579]">Aproximación calculada por IA — ajustala si te parece que no da.</p>
          </div>

          {/* Guardar */}
          <div className="border-t border-[#E8E4DC] pt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[#8A8579]">
              Los campos en ámbar todavía te faltan completar.
            </p>
            <button
              id="save-imported-recipe-btn"
              onClick={handleSave}
              disabled={!isValid}
              className="bg-[#4A7856] hover:bg-[#4A7856]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-3 text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
            >
              {savedFlash ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {savedFlash ? '¡Guardada!' : 'Guardar receta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
