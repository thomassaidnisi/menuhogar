import React, { useState, useMemo } from 'react';
import { Shuffle, LayoutGrid, Search, Heart, Clock, Zap, ArrowLeft, Check, RefreshCw } from 'lucide-react';
import { SnackRecipe, SnackVariant } from '../types';
import { breakfastSnacksRecipes } from '../breakfastSnacksData';

const STORAGE_KEY = 'mh_snacks_favorites';

type CategoryFilter = 'Todas' | 'Desayuno' | 'Snack' | 'Favoritos';
type FlavorFilter = 'Todas' | 'Dulce' | 'Salado';

const ENERGY_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Energía baja',
  2: 'Energía media',
  3: 'Energía alta'
};

const FLAVOR_META: Record<'dulce' | 'salado' | 'mixto', { emoji: string; label: string; text: string; bg: string }> = {
  dulce: { emoji: '🍬', label: 'Dulce', text: 'text-[#E08A3C]', bg: 'bg-[#E08A3C]/10' },
  salado: { emoji: '🧂', label: 'Salado', text: 'text-[#4A7856]', bg: 'bg-[#4A7856]/10' },
  mixto: { emoji: '🍬🧂', label: 'Mixto', text: 'text-[#8A8579]', bg: 'bg-[#8A8579]/10' }
};

function FlavorBadge({ flavor }: { flavor: 'dulce' | 'salado' | 'mixto' }) {
  const meta = FLAVOR_META[flavor];
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${meta.text} ${meta.bg}`}>
      {meta.emoji} {meta.label}
    </span>
  );
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function BreakfastSnacks() {
  const [mode, setMode] = useState<'sorteo' | 'catalogo'>('sorteo');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Detail view state (shared between Sorteo and Catálogo)
  const [activeRecipe, setActiveRecipe] = useState<SnackRecipe | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  // Sorteo state
  const [sorteoCategory, setSorteoCategory] = useState<'Todas' | 'Desayuno' | 'Snack'>('Todas');

  // Catálogo state
  const [catalogFilter, setCatalogFilter] = useState<CategoryFilter>('Todas');
  const [flavorFilter, setFlavorFilter] = useState<FlavorFilter>('Todas');
  const [catalogSearch, setCatalogSearch] = useState('');

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const openRecipe = (recipe: SnackRecipe, variantIndex: number = 0) => {
    setActiveRecipe(recipe);
    setActiveVariantIndex(variantIndex);
    setCheckedIngredients({});
  };

  const closeRecipe = () => {
    setActiveRecipe(null);
    setCheckedIngredients({});
  };

  const handleSortear = () => {
    const pool = breakfastSnacksRecipes.filter((r) => sorteoCategory === 'Todas' || r.category === sorteoCategory);
    if (pool.length === 0) return;
    const recipe = pickRandom(pool);
    const variantIndex = Math.floor(Math.random() * recipe.variants.length);
    openRecipe(recipe, variantIndex);
  };

  const catalogRecipes = useMemo(() => {
    const q = catalogSearch.toLowerCase();
    return breakfastSnacksRecipes.filter((r) => {
      if (catalogFilter === 'Desayuno' && r.category !== 'Desayuno') return false;
      if (catalogFilter === 'Snack' && r.category !== 'Snack') return false;
      if (catalogFilter === 'Favoritos' && !favorites.includes(r.id)) return false;
      // 'mixto' recipes have at least one variant of each flavor, so they match both filters.
      if (flavorFilter === 'Dulce' && r.flavor !== 'dulce' && r.flavor !== 'mixto') return false;
      if (flavorFilter === 'Salado' && r.flavor !== 'salado' && r.flavor !== 'mixto') return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [catalogFilter, flavorFilter, catalogSearch, favorites]);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ---------- Shared detail view ----------
  if (activeRecipe) {
    const variant: SnackVariant = activeRecipe.variants[activeVariantIndex];
    const isFav = favorites.includes(activeRecipe.id);

    return (
      <div className="space-y-4">
        <button
          onClick={closeRecipe}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#8A8579] hover:text-[#2B2B28] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-[#2B2B28] rounded-2xl overflow-hidden">
          <div className="p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-[#E08A3C] bg-[#E08A3C]/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {activeRecipe.category}
                  </span>
                  {activeRecipe.flavor && (
                    <span className="text-[10px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {FLAVOR_META[activeRecipe.flavor].emoji} {FLAVOR_META[activeRecipe.flavor].label}
                    </span>
                  )}
                </div>
                <h2 className="font-serif font-extrabold text-2xl text-white tracking-tight mt-2">
                  {activeRecipe.name}
                </h2>
                <p className="text-sm text-white/60 mt-1 max-w-lg">{activeRecipe.description}</p>
              </div>
              <button
                onClick={() => toggleFavorite(activeRecipe.id)}
                className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Favorito"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-[#E08A3C] text-[#E08A3C]' : 'text-white'}`} />
              </button>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-white/70 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E08A3C]" />
                {activeRecipe.prepTime} mins
              </span>
              <span className="text-xs text-white/70 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#E08A3C]" />
                {ENERGY_LABEL[activeRecipe.energyLevel]}
              </span>
              {activeRecipe.estimatedCalories !== undefined && (
                <span
                  className="text-xs text-white/70 flex items-center gap-1.5"
                  title="Estimación aproximada calculada por IA, no un dato nutricional exacto"
                >
                  🔥 ~{activeRecipe.estimatedCalories} kcal aprox.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Variant selector */}
        {activeRecipe.variants.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            {activeRecipe.variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveVariantIndex(idx);
                  setCheckedIngredients({});
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  idx === activeVariantIndex
                    ? 'bg-[#4A7856] text-white border-[#4A7856]'
                    : 'bg-[#FFFFFF] text-[#8A8579] border-[#E8E4DC] hover:text-[#2B2B28]'
                }`}
              >
                {v.name || `Variante ${idx + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Ingredients */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="font-serif font-extrabold text-sm text-[#2B2B28] uppercase tracking-wider border-b border-[#E8E4DC] pb-1.5">
              Ingredientes
            </h4>
            <ul className="space-y-1">
              {variant.ingredients.map((ing, i) => {
                const checked = !!checkedIngredients[i];
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggleIngredient(i)}
                      className={`w-full flex items-start gap-2.5 text-left py-2 px-2 rounded-lg hover:bg-[#4A7856]/5 transition-colors ${
                        checked ? 'opacity-50' : ''
                      }`}
                    >
                      <span className={`w-4.5 h-4.5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                        checked ? 'bg-[#4A7856] border-[#4A7856]' : 'border-[#E8E4DC]'
                      }`}>
                        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className={`text-sm text-[#2B2B28] ${checked ? 'line-through' : ''}`}>
                        <span className="font-medium">{ing.name}</span>
                        {' '}
                        <span className="text-xs font-bold text-[#4A7856]">
                          ({ing.amount} {ing.unit})
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Steps */}
          <div className="md:col-span-7 space-y-3">
            <h4 className="font-serif font-extrabold text-sm text-[#2B2B28] uppercase tracking-wider border-b border-[#E8E4DC] pb-1.5">
              Preparación
            </h4>
            <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl p-4">
              <ol className="space-y-3.5">
                {variant.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 items-start text-sm text-[#2B2B28]">
                    <span className="w-6 h-6 rounded-full bg-[#4A7856]/10 text-[#4A7856] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {mode === 'sorteo' && (
          <button
            onClick={handleSortear}
            className="w-full bg-[#4A7856] hover:bg-[#4A7856]/90 text-white rounded-xl px-5 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sortear otra opción
          </button>
        )}
      </div>
    );
  }

  // ---------- Sorteo / Catálogo top-level views ----------
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif font-extrabold text-2xl text-[#2B2B28] tracking-tight">
          Desayunos y Snacks
        </h2>
        <p className="text-sm text-[#8A8579] mt-1">
          Mix &amp; Match para resolver desayunos y snacks rápido, con variantes para no repetir.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[#FDFCFA] p-1 rounded-full border border-[#E8E4DC] self-start w-fit">
        <button
          onClick={() => setMode('sorteo')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
            mode === 'sorteo' ? 'bg-[#4A7856] text-white' : 'text-[#8A8579] hover:text-[#2B2B28]'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          Sorteo
        </button>
        <button
          onClick={() => setMode('catalogo')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
            mode === 'catalogo' ? 'bg-[#4A7856] text-white' : 'text-[#8A8579] hover:text-[#2B2B28]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Catálogo
        </button>
      </div>

      {mode === 'sorteo' ? (
        <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-6 flex flex-col items-center gap-5 text-center">
          <div>
            <h3 className="font-serif font-bold text-sm text-[#2B2B28] mb-2">Categoría</h3>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {(['Todas', 'Desayuno', 'Snack'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSorteoCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    sorteoCategory === cat
                      ? 'bg-[#4A7856] text-white border-[#4A7856]'
                      : 'bg-[#FDFCFA] text-[#8A8579] border-[#E8E4DC] hover:text-[#2B2B28]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <span className="w-14 h-14 rounded-full bg-[#4A7856]/8 flex items-center justify-center text-2xl">
              🎲
            </span>
            <div>
              <h4 className="font-serif font-bold text-base text-[#2B2B28]">¿Sin ganas de pensar?</h4>
              <p className="text-xs text-[#8A8579] mt-1 max-w-xs">
                El sistema elige un plato y una variante al azar de tu recetario
              </p>
            </div>
            <button
              onClick={handleSortear}
              className="bg-[#4A7856] hover:bg-[#4A7856]/90 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 mt-1"
            >
              <Shuffle className="w-4 h-4" />
              Generar Opción
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8579] opacity-70" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Buscar receta..."
                className="w-full bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['Todas', 'Desayuno', 'Snack', 'Favoritos'] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatalogFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1 ${
                    catalogFilter === cat
                      ? 'bg-[#4A7856] text-white border-[#4A7856]'
                      : 'bg-[#FDFCFA] text-[#8A8579] border-[#E8E4DC] hover:text-[#2B2B28]'
                  }`}
                >
                  {cat === 'Favoritos' && <Heart className="w-3 h-3" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Flavor filter — combinable with the category/favorites filter above */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['Todas', 'Dulce', 'Salado'] as FlavorFilter[]).map((fl) => (
              <button
                key={fl}
                onClick={() => setFlavorFilter(fl)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1 ${
                  flavorFilter === fl
                    ? 'bg-[#2B2B28] text-white border-[#2B2B28]'
                    : 'bg-[#FDFCFA] text-[#8A8579] border-[#E8E4DC] hover:text-[#2B2B28]'
                }`}
              >
                {fl === 'Dulce' && '🍬'}
                {fl === 'Salado' && '🧂'}
                {fl}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catalogRecipes.map((recipe) => {
              const isFav = favorites.includes(recipe.id);
              return (
                <button
                  key={recipe.id}
                  onClick={() => openRecipe(recipe)}
                  className="text-left bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl p-4 space-y-2 hover:border-[#4A7856]/50 hover:bg-[#FDFCFA] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold text-[#4A7856] bg-[#4A7856]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {recipe.category}
                      </span>
                      {recipe.flavor && <FlavorBadge flavor={recipe.flavor} />}
                    </div>
                    <Heart
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id);
                      }}
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isFav ? 'fill-[#E08A3C] text-[#E08A3C]' : 'text-[#8A8579] hover:text-[#E08A3C]'
                      }`}
                    />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#2B2B28] tracking-tight">
                    {recipe.name}
                  </h4>
                  <p className="text-xs text-[#8A8579] leading-snug line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-[#8A8579]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#4A7856]" />
                      {recipe.prepTime} mins
                    </span>
                    <span>{recipe.variants.length} variante{recipe.variants.length !== 1 ? 's' : ''}</span>
                  </div>
                </button>
              );
            })}
            {catalogRecipes.length === 0 && (
              <div className="col-span-full text-center text-sm text-[#8A8579] py-10">
                No hay recetas que coincidan con este filtro.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
