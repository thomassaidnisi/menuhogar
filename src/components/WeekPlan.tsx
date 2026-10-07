import React, { useState } from 'react';
import { Search, Clock, Users, X, ArrowLeft, Check, ChevronDown, Utensils, Sparkles } from 'lucide-react';
import { WeekPlan as WeekPlanType, Recipe, TeamMember, DayMenu } from '../types';
import { weeklyPlans } from '../recipesData';
import { loadCustomRecipes } from '../customRecipesData';
import AssigneeSelector from './AssigneeSelector';

interface WeekPlanProps {
  currentWeek: number;
  setWeek: (weekNum: number) => void;
  weekPlan: WeekPlanType;
  portionsCount: number;
  setPortionsCount: (count: number) => void;
  team: TeamMember[];
  assignments: Record<string, string>;
  onAssign: (id: string, memberId: string | undefined) => void;
  onNavigate?: (section: string) => void;
}

export default function WeekPlan({
  currentWeek,
  setWeek,
  weekPlan,
  portionsCount,
  setPortionsCount,
  team,
  assignments,
  onAssign,
  onNavigate
}: WeekPlanProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedDayMealKey, setSelectedDayMealKey] = useState<string | null>(null); // e.g. "Lunes_almuerzo"

  // Recetario completo (all 4 weeks) — its own search + optional week chip filter
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [recipeWeekFilter, setRecipeWeekFilter] = useState<number | null>(null);
  // 'todas' shows ebook + imported recipes together, 'mias' shows only the user's imported recipes
  const [recipeSourceFilter, setRecipeSourceFilter] = useState<'todas' | 'mias'>('todas');
  const [customRecipes] = useState<Recipe[]>(() => loadCustomRecipes());

  // Highlight today's column in the calendar (only meaningful Mon-Fri)
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayName = dayNames[new Date().getDay()];

  // Filter recipes based on search query
  const matchesSearch = (recipe: Recipe) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;

    // Match name
    if (recipe.name.toLowerCase().includes(q)) return true;
    // Match ingredients
    return recipe.ingredients.some(ing => ing.name.toLowerCase().includes(q));
  };

  const matchesRecipeSearch = (recipe: Recipe) => {
    const q = recipeSearchQuery.toLowerCase();
    if (!q) return true;
    if (recipe.name.toLowerCase().includes(q)) return true;
    return recipe.ingredients.some(ing => ing.name.toLowerCase().includes(q));
  };

  // Build a flat list of all recipes across the 4 weeks for the Recetario completo
  const allWeekRecipes: { key: string; week: number; day: string; mealType: 'almuerzo' | 'cena'; recipe: Recipe; isCustom: false; label: string }[] = [];
  Object.keys(weeklyPlans).forEach((weekKey) => {
    const weekNum = Number(weekKey);
    weeklyPlans[weekNum].days.forEach((dayMenu) => {
      allWeekRecipes.push({ key: `week_${weekNum}_${dayMenu.day}_almuerzo`, week: weekNum, day: dayMenu.day, mealType: 'almuerzo', recipe: dayMenu.almuerzo, isCustom: false, label: `Sem. ${weekNum} · ${dayMenu.day} · almuerzo` });
      allWeekRecipes.push({ key: `week_${weekNum}_${dayMenu.day}_cena`, week: weekNum, day: dayMenu.day, mealType: 'cena', recipe: dayMenu.cena, isCustom: false, label: `Sem. ${weekNum} · ${dayMenu.day} · cena` });
    });
  });

  // Recetas importadas por el usuario, mezcladas con las del ebook — se distinguen por origin/isCustom
  const customEntries = customRecipes.map((recipe) => ({
    key: `custom_${recipe.id}`,
    week: 0,
    day: '',
    mealType: 'almuerzo' as const,
    recipe,
    isCustom: true as const,
    label: `Importada${recipe.category ? ' · ' + recipe.category : ''}`
  }));

  const recetarioEntries = [...allWeekRecipes, ...customEntries];

  const [selectedRecipeWeek, setSelectedRecipeWeek] = useState<number>(currentWeek);
  const [selectedRecipeIsCustom, setSelectedRecipeIsCustom] = useState(false);
  const [selectedRecipeLabel, setSelectedRecipeLabel] = useState<string>('');

  const handleOpenRecipe = (recipe: Recipe, day: string, mealType: 'almuerzo' | 'cena', week: number = currentWeek) => {
    setSelectedRecipe(recipe);
    setSelectedDayMealKey(`week_${week}_${day}_${mealType}`);
    setSelectedRecipeWeek(week);
    setSelectedRecipeIsCustom(false);
    setSelectedRecipeLabel(`Semana ${week}`);
  };

  const handleOpenRecetarioEntry = (entry: (typeof recetarioEntries)[number]) => {
    setSelectedRecipe(entry.recipe);
    setSelectedDayMealKey(entry.key);
    setSelectedRecipeWeek(entry.week);
    setSelectedRecipeIsCustom(entry.isCustom);
    setSelectedRecipeLabel(entry.isCustom ? (entry.recipe.category ? `Importada · ${entry.recipe.category}` : 'Importada') : `Semana ${entry.week}`);
  };

  const handleCloseRecipe = () => {
    setSelectedRecipe(null);
    setSelectedDayMealKey(null);
  };

  const handleAdjustPortions = (diff: number) => {
    const newVal = Math.max(1, portionsCount + diff);
    setPortionsCount(newVal);
  };

  return (
    <div className="space-y-6">
      {/* Week Selector and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E4DC] pb-4">
        {/* Weeks Tabs */}
        <div className="flex bg-[#FDFCFA] p-1 rounded-full border border-[#E8E4DC] self-start">
          {[1, 2, 3, 4].map((num) => (
            <button
              id={`week-tab-${num}`}
              key={num}
              onClick={() => setWeek(num)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                currentWeek === num
                  ? 'bg-[#4A7856] text-white'
                  : 'text-[#8A8579] hover:text-[#2B2B28]'
              }`}
            >
              Semana {num}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8579] opacity-70" />
          <input
            id="recipe-search-input"
            type="text"
            placeholder="Buscar plato o ingrediente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8579] hover:text-[#2B2B28]"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Compact horizontal week-at-a-glance calendar */}
      <div className="overflow-x-auto">
      <div className="grid grid-cols-5 gap-2 min-w-[600px]">
        {weekPlan.days.map((dayMenu) => {
          const almuerzoMatches = matchesSearch(dayMenu.almuerzo);
          const cenaMatches = matchesSearch(dayMenu.cena);

          // If query doesn't match either, dim the day instead of collapsing the grid
          const dayMatches = !searchQuery || almuerzoMatches || cenaMatches;

          const isToday = dayMenu.day === todayName;

          return (
            <div
              key={dayMenu.day}
              className={`bg-[#FFFFFF] rounded-lg overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(43,43,40,0.06)] transition-opacity ${
                isToday ? 'border-2 border-[#E08A3C]' : 'border border-[#E8E4DC]'
              } ${dayMatches ? '' : 'opacity-30'}`}
            >
              <div className={`px-2 py-1.5 flex items-center justify-center gap-1 ${isToday ? 'bg-[#E08A3C]/15' : 'bg-[#4A7856]/8'}`}>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#E08A3C] shrink-0" />}
                <span className={`font-serif font-bold text-[11px] uppercase tracking-wide truncate ${
                  isToday ? 'text-[#B5651D]' : 'text-[#4A7856]'
                }`}>
                  {dayMenu.day}
                </span>
              </div>

              <div className="px-2 py-2.5 flex flex-col gap-1.5">
                <button
                  onClick={() => handleOpenRecipe(dayMenu.almuerzo, dayMenu.day, 'almuerzo')}
                  className={`text-left rounded-md px-1.5 py-1 hover:bg-[#4A7856]/10 transition-colors ${
                    almuerzoMatches ? '' : 'opacity-40'
                  }`}
                >
                  <div className="text-[9px] font-bold text-[#8A8579] uppercase tracking-wider flex items-center gap-1">
                    <Utensils className="w-2.5 h-2.5 text-[#4A7856]" />
                    Almuerzo
                  </div>
                  <div className="text-[11px] font-medium text-[#2B2B28] leading-snug line-clamp-2">
                    {dayMenu.almuerzo.name}
                  </div>
                </button>

                <button
                  onClick={() => handleOpenRecipe(dayMenu.cena, dayMenu.day, 'cena')}
                  className={`text-left rounded-md px-1.5 py-1 hover:bg-[#4A7856]/10 transition-colors ${
                    cenaMatches ? '' : 'opacity-40'
                  }`}
                >
                  <div className="text-[9px] font-bold text-[#8A8579] uppercase tracking-wider flex items-center gap-1">
                    <Utensils className="w-2.5 h-2.5 text-[#4A7856]" />
                    Cena
                  </div>
                  <div className="text-[11px] font-medium text-[#2B2B28] leading-snug line-clamp-2">
                    {dayMenu.cena.name}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Recetario completo - separate section below the calendar */}
      <div className="pt-8 mt-8 border-t-2 border-[#E8E4DC] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="font-serif font-extrabold text-xl text-[#2B2B28] tracking-tight">
              Recetario completo
            </h3>
            <p className="text-sm text-[#8A8579] mt-1">
              Todas las recetas y preparaciones de las 4 semanas, con ingredientes y procedimiento.
            </p>
          </div>
          {onNavigate && (
            <button
              id="open-import-recipe-btn"
              onClick={() => onNavigate('importar')}
              className="shrink-0 bg-[#4A7856] hover:bg-[#4A7856]/90 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-bold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Importar receta
            </button>
          )}
        </div>

        {/* Todas / Mis recetas */}
        <div className="flex bg-[#FDFCFA] p-1 rounded-full border border-[#E8E4DC] self-start w-fit">
          <button
            onClick={() => setRecipeSourceFilter('todas')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              recipeSourceFilter === 'todas' ? 'bg-[#4A7856] text-white' : 'text-[#8A8579] hover:text-[#2B2B28]'
            }`}
          >
            Todas
          </button>
          <button
            id="recetario-filter-mias"
            onClick={() => setRecipeSourceFilter('mias')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              recipeSourceFilter === 'mias' ? 'bg-[#4A7856] text-white' : 'text-[#8A8579] hover:text-[#2B2B28]'
            }`}
          >
            Mis recetas ({customRecipes.length})
          </button>
        </div>

        {/* Recetario search bar (independent from the calendar's search) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8579] opacity-70" />
            <input
              id="recetario-search-input"
              type="text"
              placeholder="Buscar plato o ingrediente..."
              value={recipeSearchQuery}
              onChange={(e) => setRecipeSearchQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
            />
            {recipeSearchQuery && (
              <button
                onClick={() => setRecipeSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8579] hover:text-[#2B2B28]"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Optional secondary week chips - not a required filter, hidden while viewing "Mis recetas" */}
          {recipeSourceFilter === 'todas' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setRecipeWeekFilter(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  recipeWeekFilter === null
                    ? 'bg-[#4A7856] text-white border-[#4A7856]'
                    : 'bg-[#FDFCFA] text-[#8A8579] border-[#E8E4DC] hover:text-[#2B2B28]'
                }`}
              >
                Todas
              </button>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setRecipeWeekFilter(num)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    recipeWeekFilter === num
                      ? 'bg-[#4A7856] text-white border-[#4A7856]'
                      : 'bg-[#FDFCFA] text-[#8A8579] border-[#E8E4DC] hover:text-[#2B2B28]'
                  }`}
                >
                  Semana {num}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Collapsed recipe summary cards, expand on click */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recetarioEntries
            .filter((entry) => (recipeSourceFilter === 'mias' ? entry.isCustom : true))
            .filter((entry) => recipeSourceFilter === 'mias' || recipeWeekFilter === null || entry.week === recipeWeekFilter)
            .filter((entry) => matchesRecipeSearch(entry.recipe))
            .map((entry) => (
              <button
                key={entry.key}
                onClick={() => handleOpenRecetarioEntry(entry)}
                className="w-full text-left bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl p-4 flex items-center justify-between gap-3 hover:border-[#4A7856]/50 hover:bg-[#FDFCFA] transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      entry.isCustom ? 'text-[#E08A3C] bg-[#E08A3C]/10' : 'text-[#4A7856] bg-[#4A7856]/10'
                    }`}>
                      {entry.isCustom ? <>✨ {entry.label}</> : entry.label}
                    </span>
                  </div>
                  <h5 className="font-serif font-bold text-sm text-[#2B2B28] tracking-tight truncate">
                    {entry.recipe.name}
                  </h5>
                  <span className="text-xs text-[#8A8579] flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-[#4A7856]" />
                    {entry.recipe.prepTime} mins
                  </span>
                </div>
                <ChevronDown className="w-4.5 h-4.5 text-[#8A8579] shrink-0 -rotate-90" />
              </button>
            ))}
          {recipeSourceFilter === 'mias' && customRecipes.length === 0 && (
            <div className="md:col-span-2 bg-[#FFFFFF] border border-dashed border-[#E8E4DC] rounded-2xl p-8 text-center text-sm text-[#8A8579]">
              Todavía no importaste ninguna receta. Usá el botón "Importar receta" de arriba.
            </div>
          )}
        </div>
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && selectedDayMealKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={handleCloseRecipe} 
          />

          {/* Modal Container */}
          <div 
            id="recipe-modal"
            className="relative bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-md z-10 flex flex-col"
          >
            {/* Modal Header */}
            <div className="border-b border-[#E8E4DC] p-5 flex items-center justify-between bg-[#FFFFFF]">
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCloseRecipe}
                  className="p-1.5 rounded-lg hover:bg-[#FDFCFA] text-[#8A8579] hover:text-[#2B2B28] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-serif font-extrabold text-lg text-[#2B2B28] tracking-tight">
                  Receta del Hogar
                </h3>
              </div>
              <button
                onClick={handleCloseRecipe}
                className="p-1.5 rounded-lg hover:bg-[#FDFCFA] text-[#8A8579] hover:text-[#2B2B28]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Title & Meta Info */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h2 className="font-serif font-black text-2xl text-[#2B2B28] tracking-tight">
                    {selectedRecipe.name}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-[#8A8579] flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#4A7856]" />
                      Listo en {selectedRecipe.prepTime} minutos
                    </span>
                    {selectedRecipe.estimatedCalories !== undefined && (
                      <span className="text-xs text-[#8A8579] flex items-center gap-1" title="Estimación aproximada calculada por IA, no un dato nutricional exacto — escala junto con las porciones elegidas">
                        🔥 ~{Math.round((selectedRecipe.estimatedCalories * portionsCount) / (selectedRecipe.basePortions || 1))} kcal aprox.
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                      selectedRecipeIsCustom
                        ? 'text-[#E08A3C] bg-[#E08A3C]/10 border-[#E08A3C]/20'
                        : 'text-[#4A7856] bg-[#4A7856]/10 border-[#4A7856]/20'
                    }`}>
                      {selectedRecipeLabel}
                    </span>
                  </div>
                </div>

                {/* Transversal Assignee in modal too */}
                <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl px-4 py-2.5 flex items-center gap-3 self-start">
                  <span className="text-xs font-sans font-medium text-[#8A8579]">Responsable:</span>
                  <AssigneeSelector
                    id={selectedDayMealKey}
                    assignedId={assignments[selectedDayMealKey]}
                    team={team}
                    onAssign={onAssign}
                    align="right"
                  />
                </div>
              </div>

              {/* Portions Adjuster */}
              <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2B2B28]">¿Para cuántas personas cocinás?</h4>
                  <p className="text-xs text-[#8A8579] mt-0.5">Las cantidades de abajo se recalculan automáticamente en base a esto.</p>
                </div>
                
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <button
                    id="modal-portions-decrease"
                    onClick={() => handleAdjustPortions(-1)}
                    className="w-10 h-10 bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl flex items-center justify-center font-bold text-lg hover:bg-[#FDFCFA] text-[#2B2B28] transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-lg text-[#2B2B28] bg-[#FFFFFF] py-1.5 rounded-lg border border-[#E8E4DC]">
                    {portionsCount}
                  </span>
                  <button
                    id="modal-portions-increase"
                    onClick={() => handleAdjustPortions(1)}
                    className="w-10 h-10 bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl flex items-center justify-center font-bold text-lg hover:bg-[#FDFCFA] text-[#2B2B28] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Recipe Note if available */}
              {selectedRecipe.note && (
                <div className="bg-[#E08A3C]/5 border-l-4 border-[#E08A3C] rounded-r-xl p-4 text-xs text-[#2B2B28] leading-relaxed">
                  <span className="font-bold block mb-1">Nota aclaratoria:</span>
                  {selectedRecipe.note}
                </div>
              )}

              {/* Ingredients and Procedure */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                {/* Ingredients (5 cols) */}
                <div className="md:col-span-5 space-y-3">
                  <h4 className="font-serif font-extrabold text-sm text-[#2B2B28] uppercase tracking-wider border-b border-[#E8E4DC] pb-1.5">
                    Ingredientes
                  </h4>
                  <ul className="divide-y divide-[#E8E4DC]/40 space-y-1 text-sm text-[#2B2B28]">
                    {selectedRecipe.ingredients.map((ing, i) => {
                      // Ebook recipes all have basePortions 1, so this divide was previously a no-op for
                      // them — but imported recipes can have any basePortions (e.g. "rinde 4 porciones"),
                      // so the scaling has to go through basePortions to stay correct for those too.
                      const basePortions = selectedRecipe.basePortions || 1;
                      const adjustedAmount = Number(((ing.amount * portionsCount) / basePortions).toFixed(1));
                      return (
                        <li key={i} className="flex justify-between py-2 items-center">
                          <span className="font-medium">{ing.name}</span>
                          <span className="text-xs font-bold text-[#4A7856] bg-[#4A7856]/10 px-2 py-0.5 rounded-full shrink-0">
                            {adjustedAmount} {ing.unit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Procedure (7 cols) */}
                <div className="md:col-span-7 space-y-3">
                  <h4 className="font-serif font-extrabold text-sm text-[#2B2B28] uppercase tracking-wider border-b border-[#E8E4DC] pb-1.5">
                    Procedimiento
                  </h4>
                  <ol className="space-y-4">
                    {selectedRecipe.steps.map((step, index) => (
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

            {/* Modal Footer */}
            <div className="border-t border-[#E8E4DC] p-4 flex justify-end bg-[#FFFFFF]">
              <button
                onClick={handleCloseRecipe}
                className="px-5 py-2.5 bg-[#4A7856] hover:bg-[#4A7856]/90 text-white rounded-xl text-xs font-semibold shadow-none transition-colors"
              >
                Entendido, ¡a cocinar!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
