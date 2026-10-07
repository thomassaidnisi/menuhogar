import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid, Search, X, Plus, BookOpen, Users as UsersIcon, Download, Upload, Trash2,
  Leaf, Beef, Milk, ShoppingBasket, Send, Image as ImageIcon, Minus
} from 'lucide-react';
import { TeamMember, Recipe } from '../types';
import { weeklyPlans } from '../recipesData';
import { loadCustomRecipes } from '../customRecipesData';
import AssigneeSelector from './AssigneeSelector';

interface InteractivePlannerProps {
  team: TeamMember[];
  assignments: Record<string, string>;
  onAssign: (id: string, memberId: string | undefined) => void;
  onAddMember: (name: string) => void;
}

// ---------- Local types (independent from the rest of the app's weekly data model) ----------

type MealType = 'almuerzo' | 'cena';

type MealSlot = {
  recipeRef?: { week: number; day: string; mealType: MealType };
  customRecipeId?: string; // references an imported recipe (mh_custom_recipes_v1), mutually exclusive with recipeRef
  customText: string;
};

type PlannerDayPlan = Record<MealType, MealSlot>;

type Category = 'Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén';

interface PlannerShopItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: Category;
  checked: boolean;
}

interface PlannerTask {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  checked: boolean;
}

interface PlannerState {
  days: Record<string, PlannerDayPlan>;
  diners: number;
  shoppingItems: PlannerShopItem[];
  mealPrepTasks: PlannerTask[];
  hasGenerated: boolean;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const CATEGORIES: Category[] = ['Verdulería', 'Carnicería', 'Lácteos y Huevos', 'Almacén'];
const STORAGE_KEY = 'mh_planner_state_v1';

const CATEGORY_META: Record<Category, { icon: React.ComponentType<any>; text: string; bg: string; bullet: string }> = {
  'Verdulería': { icon: Leaf, text: 'text-[#4A7856]', bg: 'bg-[#4A7856]/10', bullet: 'bg-[#4A7856]' },
  'Carnicería': { icon: Beef, text: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', bullet: 'bg-[#EF4444]' },
  'Lácteos y Huevos': { icon: Milk, text: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10', bullet: 'bg-[#3B82F6]' },
  'Almacén': { icon: ShoppingBasket, text: 'text-[#E08A3C]', bg: 'bg-[#E08A3C]/10', bullet: 'bg-[#E08A3C]' }
};

const LEVELS_INFO = [
  { num: 1 as const, label: 'Nivel 1 · Mínimo viable' },
  { num: 2 as const, label: 'Nivel 2 · Modo estándar' },
  { num: 3 as const, label: 'Nivel 3 · Modo pro' }
];

function emptyState(): PlannerState {
  const days: Record<string, PlannerDayPlan> = {};
  DAYS.forEach((d) => {
    days[d] = {
      almuerzo: { customText: '' },
      cena: { customText: '' }
    };
  });
  return { days, diners: 2, shoppingItems: [], mealPrepTasks: [], hasGenerated: false };
}

// Flat list of every recipe across the 4 suggested weeks, for the "Ebook" picker — never filtered by week
const allRecipes: { week: number; day: string; mealType: MealType; recipe: Recipe }[] = [];
Object.keys(weeklyPlans).forEach((weekKey) => {
  const weekNum = Number(weekKey);
  weeklyPlans[weekNum].days.forEach((dayMenu) => {
    allRecipes.push({ week: weekNum, day: dayMenu.day, mealType: 'almuerzo', recipe: dayMenu.almuerzo });
    allRecipes.push({ week: weekNum, day: dayMenu.day, mealType: 'cena', recipe: dayMenu.cena });
  });
});

function resolveRecipe(ref: { week: number; day: string; mealType: MealType }): Recipe | undefined {
  const wp = weeklyPlans[ref.week];
  if (!wp) return undefined;
  const dm = wp.days.find((d) => d.day === ref.day);
  if (!dm) return undefined;
  return dm[ref.mealType];
}

// Resolves whatever the slot points to: an ebook recipe, an imported (custom) recipe, or nothing.
function resolveSlotRecipe(slot: MealSlot, customRecipes: Recipe[]): Recipe | undefined {
  if (slot.recipeRef) return resolveRecipe(slot.recipeRef);
  if (slot.customRecipeId) return customRecipes.find((r) => r.id === slot.customRecipeId);
  return undefined;
}

export default function InteractivePlanner({ team, assignments, onAssign, onAddMember }: InteractivePlannerProps) {
  const [state, setState] = useState<PlannerState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as PlannerState;
      } catch {
        return emptyState();
      }
    }
    return emptyState();
  });

  // "activeTab" now just tracks which section is currently most visible (scrollspy),
  // and clicking a tab scrolls to it — nothing is hidden/unmounted anymore.
  const [activeTab, setActiveTab] = useState<'planificacion' | 'compras' | 'mealprep'>('planificacion');
  const [customRecipes] = useState<Recipe[]>(() => loadCustomRecipes());
  const [newMemberName, setNewMemberName] = useState('');
  const [pickerTarget, setPickerTarget] = useState<{ day: string; mealType: MealType } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [newItemDrafts, setNewItemDrafts] = useState<Record<string, string>>({});
  const [newTaskDrafts, setNewTaskDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const planificacionSectionRef = useRef<HTMLDivElement>(null);
  const comprasSectionRef = useRef<HTMLDivElement>(null);
  const mealPrepSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Scrollspy: highlight whichever section tab is currently closest to the top of the viewport
  useEffect(() => {
    const sections: { id: 'planificacion' | 'compras' | 'mealprep'; el: HTMLDivElement | null }[] = [
      { id: 'planificacion', el: planificacionSectionRef.current },
      { id: 'compras', el: comprasSectionRef.current },
      { id: 'mealprep', el: mealPrepSectionRef.current }
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const match = sections.find((s) => s.el === topMost.target);
        if (match) setActiveTab(match.id);
      },
      { rootMargin: '-110px 0px -70% 0px', threshold: [0, 1] }
    );

    sections.forEach((s) => s.el && observer.observe(s.el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: 'planificacion' | 'compras' | 'mealprep') => {
    const refMap = { planificacion: planificacionSectionRef, compras: comprasSectionRef, mealprep: mealPrepSectionRef };
    refMap[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------- Planificación tab helpers ----------

  const updateSlot = (day: string, mealType: MealType, updates: Partial<MealSlot>) => {
    setState((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [mealType]: { ...prev.days[day][mealType], ...updates }
        }
      }
    }));
  };

  const handlePickRecipe = (week: number, recipeDay: string, mealType: MealType) => {
    if (!pickerTarget) return;
    updateSlot(pickerTarget.day, pickerTarget.mealType, {
      recipeRef: { week, day: recipeDay, mealType },
      customRecipeId: undefined,
      customText: ''
    });
    setPickerTarget(null);
    setPickerSearch('');
  };

  const handlePickCustomRecipe = (recipeId: string) => {
    if (!pickerTarget) return;
    updateSlot(pickerTarget.day, pickerTarget.mealType, {
      recipeRef: undefined,
      customRecipeId: recipeId,
      customText: ''
    });
    setPickerTarget(null);
    setPickerSearch('');
  };

  const handleClearRecipe = (day: string, mealType: MealType) => {
    updateSlot(day, mealType, { recipeRef: undefined, customRecipeId: undefined });
  };

  const handleAdjustDiners = (diff: number) => {
    setState((prev) => ({ ...prev, diners: Math.max(1, prev.diners + diff) }));
  };

  // ---------- Generate shopping list + meal prep from the grid ----------

  const handleGenerate = () => {
    const items: Record<string, PlannerShopItem> = {};
    const tasks: PlannerTask[] = [];

    DAYS.forEach((day) => {
      (['almuerzo', 'cena'] as MealType[]).forEach((mealType) => {
        const slot = state.days[day][mealType];

        if (slot.recipeRef || slot.customRecipeId) {
          const recipe = resolveSlotRecipe(slot, customRecipes);
          if (!recipe) return;

          recipe.ingredients.forEach((ing) => {
            const key = `${ing.category}_${ing.name}_${ing.unit}`;
            const amt = Number((ing.amount * state.diners).toFixed(1));
            if (items[key]) {
              items[key].amount = Number((items[key].amount + amt).toFixed(1));
            } else {
              items[key] = {
                id: `planner_shop_${key}`.replace(/\s+/g, '_'),
                name: ing.name,
                amount: amt,
                unit: ing.unit,
                category: ing.category,
                checked: false
              };
            }
          });

          const level: 1 | 2 | 3 = recipe.prepTime <= 20 ? 1 : recipe.prepTime <= 45 ? 2 : 3;
          tasks.push({
            id: `planner_mp_${day}_${mealType}_${Math.random().toString(36).slice(2)}`,
            title: `Preparar: ${recipe.name} (${day} · ${mealType})`,
            level,
            checked: false
          });
        } else if (slot.customText.trim()) {
          tasks.push({
            id: `planner_mp_${day}_${mealType}_${Math.random().toString(36).slice(2)}`,
            title: `Preparar: ${slot.customText.trim()} (${day} · ${mealType})`,
            level: 1,
            checked: false
          });
        }
      });
    });

    setState((prev) => ({
      ...prev,
      shoppingItems: Object.values(items),
      mealPrepTasks: tasks,
      hasGenerated: true
    }));
    // Give the newly generated content a tick to render before scrolling to it
    setTimeout(() => scrollToSection('compras'), 50);
  };

  // ---------- Shopping list tab helpers ----------

  const toggleShoppingItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingItems: prev.shoppingItems.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    }));
  };

  const addShoppingItem = (category: Category, rawText: string) => {
    const names = rawText.split('\n').map((t) => t.trim()).filter(Boolean);
    if (names.length === 0) return;
    setState((prev) => ({
      ...prev,
      shoppingItems: [
        ...prev.shoppingItems,
        ...names.map((name) => ({
          id: `planner_shop_manual_${category}_${name}_${Math.random().toString(36).slice(2)}`.replace(/\s+/g, '_'),
          name,
          amount: 1,
          unit: 'u',
          category,
          checked: false
        }))
      ]
    }));
  };

  const handleClearShoppingList = () => {
    if (!window.confirm('¿Vaciar la lista de compras del planificador?')) return;
    setState((prev) => ({ ...prev, shoppingItems: [] }));
  };

  // ---------- Meal prep tab helpers ----------

  const toggleTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      mealPrepTasks: prev.mealPrepTasks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    }));
  };

  const addTask = (level: 1 | 2 | 3, rawText: string) => {
    const titles = rawText.split('\n').map((t) => t.trim()).filter(Boolean);
    if (titles.length === 0) return;
    setState((prev) => ({
      ...prev,
      mealPrepTasks: [
        ...prev.mealPrepTasks,
        ...titles.map((title) => ({
          id: `planner_mp_manual_${level}_${Math.random().toString(36).slice(2)}`,
          title,
          level,
          checked: false
        }))
      ]
    }));
  };

  // ---------- Import / Export / Clear ----------

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planificador-interactivo.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.days) throw new Error('Formato inválido');
        setState({ ...emptyState(), ...parsed });
      } catch {
        alert('El archivo no tiene un formato válido de Planificador Interactivo.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (!window.confirm('¿Reiniciar todo el Planificador Interactivo? Se perderá lo armado (podés exportarlo antes).')) return;
    setState(emptyState());
    setActiveTab('planificacion');
  };

  // ---------- Share ----------

  const buildSummaryText = () => {
    let text = `📅 *MI SEMANA - PLANIFICADOR INTERACTIVO* %0A`;
    text += `👥 _Para ${state.diners} personas_ %0A%0A`;
    DAYS.forEach((day) => {
      const { almuerzo, cena } = state.days[day];
      const almName = resolveSlotRecipe(almuerzo, customRecipes)?.name || almuerzo.customText;
      const cenName = resolveSlotRecipe(cena, customRecipes)?.name || cena.customText;
      if (!almName && !cenName) return;
      text += `*${day}*%0A`;
      if (almName) text += `🍽️ Almuerzo: ${almName}%0A`;
      if (cenName) text += `🌙 Cena: ${cenName}%0A`;
      text += `%0A`;
    });
    text += `_Armado con MenuHogar 🍳_`;
    return text;
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${buildSummaryText()}`;
    window.open(url, '_blank');
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const filledDays = DAYS.filter((d) => {
      const { almuerzo, cena } = state.days[d];
      const almName = resolveSlotRecipe(almuerzo, customRecipes)?.name || almuerzo.customText;
      const cenName = resolveSlotRecipe(cena, customRecipes)?.name || cena.customText;
      return !!(almName || cenName);
    });

    const width = 800;
    const rowHeight = 64;
    const height = 160 + filledDays.length * rowHeight + 60;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#FDFCFA';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#4A7856';
    ctx.fillRect(0, 0, width, 96);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Manrope, sans-serif';
    ctx.fillText('Mi semana · Planificador Interactivo', 32, 44);
    ctx.font = '16px Manrope, sans-serif';
    ctx.fillText(`Para ${state.diners} personas`, 32, 72);

    let y = 96 + 44;
    filledDays.forEach((day) => {
      const { almuerzo, cena } = state.days[day];
      const almName = resolveSlotRecipe(almuerzo, customRecipes)?.name || almuerzo.customText || '—';
      const cenName = resolveSlotRecipe(cena, customRecipes)?.name || cena.customText || '—';

      ctx.fillStyle = '#2B2B28';
      ctx.font = 'bold 18px Manrope, sans-serif';
      ctx.fillText(day, 32, y);

      ctx.font = '15px Manrope, sans-serif';
      ctx.fillStyle = '#8A8579';
      ctx.fillText(`Almuerzo: ${almName}`, 180, y - 8);
      ctx.fillText(`Cena: ${cenName}`, 180, y + 16);

      ctx.strokeStyle = '#E8E4DC';
      ctx.beginPath();
      ctx.moveTo(32, y + 30);
      ctx.lineTo(width - 32, y + 30);
      ctx.stroke();

      y += rowHeight;
    });

    ctx.fillStyle = '#E08A3C';
    ctx.font = 'italic 14px Manrope, sans-serif';
    ctx.fillText('Armado con MenuHogar 🍳', 32, height - 24);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-semana.png';
    a.click();
  };

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header + internal tabs, sticky at the top of the page */}
      <div className="sticky top-16 md:top-0 z-30 bg-[#FDFCFA] pt-2 pb-4 -mx-4 px-4 md:-mx-8 md:px-8 space-y-4 border-b border-[#E8E4DC]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h2 className="font-serif font-extrabold text-2xl text-[#2B2B28] tracking-tight flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-[#4A7856]" />
              Planificador Interactivo
            </h2>
            <p className="text-sm text-[#8A8579] mt-1">
              Armá tu propia semana desde cero — es independiente del menú sugerido.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
            <button
              onClick={handleImportClick}
              className="bg-[#FFFFFF] border border-[#E8E4DC] hover:bg-[#FDFCFA] text-[#2B2B28] rounded-xl px-3.5 py-2 flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar datos
            </button>
            <button
              onClick={handleExport}
              className="bg-[#FFFFFF] border border-[#E8E4DC] hover:bg-[#FDFCFA] text-[#2B2B28] rounded-xl px-3.5 py-2 flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar datos
            </button>
            <button
              onClick={handleClearAll}
              className="bg-[#FFFFFF] border border-[#E8E4DC] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[#8A8579] rounded-xl px-3.5 py-2 flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar todo
            </button>
          </div>
        </div>

        {/* Internal tabs — quick-jump navigation + scrollspy, content below is always visible */}
        <div className="flex bg-[#FFFFFF] p-1 rounded-full border border-[#E8E4DC] self-start w-fit">
          {[
            { id: 'planificacion', label: 'Planificación' },
            { id: 'compras', label: 'Compras' },
            { id: 'mealprep', label: 'Meal Prep' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id as 'planificacion' | 'compras' | 'mealprep')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-[#4A7856] text-white' : 'text-[#8A8579] hover:text-[#2B2B28]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Section: Planificación ---------- */}
      <div ref={planificacionSectionRef} style={{ scrollMarginTop: '140px' }} className="space-y-6">
          {/* Equipo de cocina */}
          <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-5 space-y-3">
            <h3 className="font-serif font-bold text-sm text-[#2B2B28] flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-[#4A7856]" />
              Equipo de cocina
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {team.map((member) => (
                <span
                  key={member.id}
                  className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-xs font-bold ${member.color}`}
                >
                  <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[9px]">
                    {member.initials}
                  </span>
                  {member.name}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMemberName.trim()) {
                    onAddMember(newMemberName.trim());
                    setNewMemberName('');
                  }
                }}
                placeholder="Agregar persona al equipo..."
                className="flex-1 bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
              />
              <button
                onClick={() => {
                  if (newMemberName.trim()) {
                    onAddMember(newMemberName.trim());
                    setNewMemberName('');
                  }
                }}
                className="w-9 h-9 shrink-0 bg-[#4A7856] hover:bg-[#4A7856]/90 text-white rounded-xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* 7-day grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DAYS.map((day) => (
              <div key={day} className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl p-3.5 space-y-3">
                <h4 className="font-serif font-extrabold text-sm text-[#2B2B28]">{day}</h4>

                {(['almuerzo', 'cena'] as MealType[]).map((mealType) => {
                  const slot = state.days[day][mealType];
                  const chosenRecipe = resolveSlotRecipe(slot, customRecipes);
                  return (
                    <div key={mealType} className="space-y-1.5 border-t border-[#E8E4DC]/60 pt-2.5 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#8A8579] uppercase tracking-wider">
                          {mealType}
                        </span>
                        <button
                          onClick={() => setPickerTarget({ day, mealType })}
                          className="text-[10px] font-bold text-[#4A7856] hover:underline flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          Ebook
                        </button>
                      </div>

                      {chosenRecipe ? (
                        <div className="flex items-center justify-between gap-1 bg-[#4A7856]/10 text-[#4A7856] rounded-lg px-2 py-1.5">
                          <span className="text-xs font-semibold truncate">{chosenRecipe.name}</span>
                          <button onClick={() => handleClearRecipe(day, mealType)} className="shrink-0 hover:opacity-70">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={slot.customText}
                          onChange={(e) => updateSlot(day, mealType, { customText: e.target.value })}
                          placeholder="Ej: Guiso de lentejas"
                          className="w-full bg-[#FDFCFA] border border-[#E8E4DC] rounded-lg px-2.5 py-1.5 text-xs text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
                        />
                      )}

                      <AssigneeSelector
                        id={`planner_${day}_${mealType}`}
                        assignedId={assignments[`planner_${day}_${mealType}`]}
                        team={team}
                        onAssign={onAssign}
                        align="left"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Asistente de cocina */}
          <div className="bg-[#4A7856] rounded-2xl p-5 md:p-6 space-y-4 text-white">
            <h3 className="font-serif font-extrabold text-lg flex items-center gap-2">
              🧑‍🍳 Asistente de cocina
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">¿Para cuántos comensales cocinás?</p>
                <p className="text-xs text-white/70 mt-0.5">Las cantidades de la lista de compras se calculan con esto.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAdjustDiners(-1)}
                  className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold text-lg bg-white/10 py-1.5 rounded-lg">
                  {state.diners}
                </span>
                <button
                  onClick={() => handleAdjustDiners(1)}
                  className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-white text-[#4A7856] hover:bg-white/90 rounded-xl px-5 py-3 text-sm font-bold transition-colors"
            >
              Generar lista de compras + meal prep
            </button>
          </div>
      </div>

      {/* ---------- Section: Compras ---------- */}
      <div ref={comprasSectionRef} style={{ scrollMarginTop: '140px' }} className="space-y-4">
        <h3 className="font-serif font-extrabold text-xl text-[#2B2B28] tracking-tight">
          Lista de Compras
        </h3>
        {(() => {
          return !state.hasGenerated && state.shoppingItems.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-dashed border-[#E8E4DC] rounded-2xl p-8 text-center text-sm text-[#8A8579]">
              Generá tu lista arriba (sección Planificación) para ver esto acá.
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={handleClearShoppingList}
                  className="text-[#8A8579] hover:text-red-600 flex items-center gap-1.5 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              </div>

              {CATEGORIES.map((cat) => {
                const catItems = state.shoppingItems.filter((i) => i.category === cat);
                const meta = CATEGORY_META[cat];
                const Icon = meta.icon;
                const draft = newItemDrafts[cat] || '';

                return (
                  <div key={cat} className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full ${meta.bg} ${meta.text} flex items-center justify-center`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <h4 className="font-serif font-extrabold text-base text-[#2B2B28]">{cat}</h4>
                        <span className="text-[10px] font-bold text-[#8A8579] bg-[#FDFCFA] px-2 py-0.5 rounded-full border border-[#E8E4DC]">
                          {catItems.filter((i) => i.checked).length} de {catItems.length}
                        </span>
                      </div>
                      <AssigneeSelector
                        id={`planner_shop_cat_${cat}`}
                        assignedId={assignments[`planner_shop_cat_${cat}`]}
                        team={team}
                        onAssign={onAssign}
                        align="right"
                      />
                    </div>

                    {catItems.length > 0 && (
                      <div className="border-t border-[#E8E4DC]/60 divide-y divide-[#E8E4DC]/40 px-5">
                        {catItems.map((item) => (
                          <div key={item.id} className={`flex items-center justify-between py-2.5 gap-3 ${item.checked ? 'opacity-50' : ''}`}>
                            <button
                              onClick={() => toggleShoppingItem(item.id)}
                              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                            >
                              <span className={`w-4.5 h-4.5 rounded border-2 shrink-0 flex items-center justify-center ${
                                item.checked ? 'bg-[#4A7856] border-[#4A7856]' : 'border-[#E8E4DC]'
                              }`}>
                                {item.checked && (
                                  <svg className="w-3 h-3 stroke-2 stroke-white fill-none" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>
                              <span className={`text-sm text-[#2B2B28] font-medium truncate ${item.checked ? 'line-through' : ''}`}>
                                {item.name} — <span className={`text-xs font-bold ${meta.text}`}>{item.amount} {item.unit}</span>
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-[#E8E4DC]/60 px-5 py-3">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setNewItemDrafts((prev) => ({ ...prev, [cat]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && draft.trim()) {
                            addShoppingItem(cat, draft);
                            setNewItemDrafts((prev) => ({ ...prev, [cat]: '' }));
                          }
                        }}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData('text');
                          if (text.includes('\n')) {
                            e.preventDefault();
                            addShoppingItem(cat, text);
                          }
                        }}
                        placeholder="+ Agregar ítem (Enter o pegar)"
                        className="w-full bg-[#FDFCFA] border border-[#E8E4DC] rounded-lg px-3 py-2 text-xs text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
                      />
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

      {/* ---------- Section: Meal Prep ---------- */}
      <div ref={mealPrepSectionRef} style={{ scrollMarginTop: '140px' }} className="space-y-4">
        <h3 className="font-serif font-extrabold text-xl text-[#2B2B28] tracking-tight">
          Meal Prep
        </h3>
        {!state.hasGenerated && state.mealPrepTasks.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-dashed border-[#E8E4DC] rounded-2xl p-8 text-center text-sm text-[#8A8579]">
              Generá tu lista arriba (sección Planificación) para ver esto acá.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LEVELS_INFO.map((lvl) => {
                const lvlTasks = state.mealPrepTasks.filter((t) => t.level === lvl.num);
                const draft = newTaskDrafts[lvl.num] || '';
                return (
                  <div key={lvl.num} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl p-4 space-y-3 flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-serif font-bold text-sm text-[#2B2B28]">{lvl.label}</h4>
                      <AssigneeSelector
                        id={`planner_mp_level_${lvl.num}`}
                        assignedId={assignments[`planner_mp_level_${lvl.num}`]}
                        team={team}
                        onAssign={onAssign}
                        align="right"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {lvlTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`w-full flex items-start gap-2 text-left py-1.5 ${task.checked ? 'opacity-50' : ''}`}
                        >
                          <span className={`w-4.5 h-4.5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                            task.checked ? 'bg-[#4A7856] border-[#4A7856]' : 'border-[#E8E4DC] bg-[#FFFFFF]'
                          }`}>
                            {task.checked && (
                              <svg className="w-3 h-3 stroke-2 stroke-white fill-none" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-xs text-[#2B2B28] leading-snug ${task.checked ? 'line-through text-[#8A8579]' : ''}`}>
                            {task.title}
                          </span>
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setNewTaskDrafts((prev) => ({ ...prev, [lvl.num]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && draft.trim()) {
                          addTask(lvl.num, draft);
                          setNewTaskDrafts((prev) => ({ ...prev, [lvl.num]: '' }));
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (text.includes('\n')) {
                          e.preventDefault();
                          addTask(lvl.num, text);
                        }
                      }}
                      placeholder="+ Agregar tarea (Enter o pegar)"
                      className="w-full bg-[#FFFFFF] border border-[#E8E4DC] rounded-lg px-3 py-2 text-xs text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Compartir tu semana */}
          <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-5 space-y-3">
            <h3 className="font-serif font-bold text-sm text-[#2B2B28]">Compartir tu semana</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleShareWhatsApp}
                className="bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-bold transition-colors"
              >
                <Send className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={handleDownloadImage}
                className="bg-[#FDFCFA] border border-[#E8E4DC] hover:bg-[#F5F2EC] text-[#2B2B28] rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-bold transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Descargar imagen
              </button>
            </div>
            <p className="text-xs text-[#8A8579]">
              Tus datos se guardan en este dispositivo. Usá "Exportar datos" para llevarlos a otro.
            </p>
          </div>
      </div>

      {/* ---------- Ebook Recipe Picker Modal ---------- */}
      {pickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setPickerTarget(null)} />
          <div className="relative bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-md z-10 flex flex-col">
            <div className="border-b border-[#E8E4DC] p-5 flex items-center justify-between">
              <h3 className="font-serif font-extrabold text-lg text-[#2B2B28]">
                Elegí una receta del recetario
              </h3>
              <button
                onClick={() => setPickerTarget(null)}
                className="p-1.5 rounded-lg hover:bg-[#FDFCFA] text-[#8A8579] hover:text-[#2B2B28]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#E8E4DC]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8579] opacity-70" />
                <input
                  autoFocus
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Buscar plato o ingrediente..."
                  className="w-full bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-3 space-y-1.5">
              {customRecipes
                .filter((recipe) => {
                  const q = pickerSearch.toLowerCase();
                  if (!q) return true;
                  if (recipe.name.toLowerCase().includes(q)) return true;
                  return recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q));
                })
                .map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handlePickCustomRecipe(recipe.id)}
                    className="w-full text-left bg-[#FFFFFF] border border-[#E8E4DC] hover:border-[#4A7856]/50 hover:bg-[#FDFCFA] rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-[#E08A3C] bg-[#E08A3C]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ✨ Importada{recipe.category ? ` · ${recipe.category}` : ''}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-[#2B2B28] mt-1 truncate">
                        {recipe.name}
                      </h5>
                    </div>
                    <span className="text-xs text-[#8A8579] shrink-0">{recipe.prepTime} mins</span>
                  </button>
                ))}
              {allRecipes
                .filter(({ recipe }) => {
                  const q = pickerSearch.toLowerCase();
                  if (!q) return true;
                  if (recipe.name.toLowerCase().includes(q)) return true;
                  return recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(q));
                })
                .map(({ week, day, mealType, recipe }, idx) => (
                  <button
                    key={`${week}-${day}-${mealType}-${idx}`}
                    onClick={() => handlePickRecipe(week, day, mealType)}
                    className="w-full text-left bg-[#FFFFFF] border border-[#E8E4DC] hover:border-[#4A7856]/50 hover:bg-[#FDFCFA] rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-[#4A7856] bg-[#4A7856]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Sem. {week} · {day} · {mealType}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-[#2B2B28] mt-1 truncate">
                        {recipe.name}
                      </h5>
                    </div>
                    <span className="text-xs text-[#8A8579] shrink-0">{recipe.prepTime} mins</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
