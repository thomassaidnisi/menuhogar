import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Trash2, Menu, X, ChevronRight } from 'lucide-react';
import { weeklyPlans, getMealPrepTasks } from './recipesData';
import { TeamMember, WeekPlan } from './types';
import {
  loadMealPrepExtras, getExtraTasks, recipeTaskPrefix, MEALPREP_EXTRA_KEY, MealPrepExtras,
  loadPrepTasksCache, PREP_TASKS_CACHE_KEY, PrepTasksCache, fetchPrepTasks, findPickableRecipe
} from './recipeTasks';

// Import Views
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import WeekPlanView from './components/WeekPlan';
import ShoppingListView from './components/ShoppingList';
import MealPrepView from './components/MealPrep';
import AssistantView from './components/Assistant';
import InteractivePlannerView from './components/InteractivePlanner';
import BreakfastSnacksView from './components/BreakfastSnacks';
import TeamManager from './components/TeamManager';
import ImportRecipeView from './components/ImportRecipe';
import GuiaView from './components/Guia';

const DEFAULT_TEAM: TeamMember[] = [
  { id: 'yo', name: 'Yo', initials: 'YO', color: 'bg-[#4A7856] text-white' }
];

// Suggests which of the 4 ebook weeks to show by default, cycling 1→2→3→4→1... based on the
// current calendar week, so the app doesn't always default to Semana 1 once the 4 weeks pass.
function getSuggestedWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const weekOfYear = Math.floor(daysSinceStart / 7);
  return (weekOfYear % 4) + 1;
}

export default function App() {
  // Navigation & Week
  const [activeSection, setActiveSection] = useState<string>(() => {
    return localStorage.getItem('mh_activeSection') || 'home';
  });
  // Defaults to the week suggested by the 4-week cycle based on today's date every time the
  // app is opened; setCurrentWeek still lets the user navigate freely between weeks in-session.
  const [currentWeek, setCurrentWeek] = useState<number>(() => getSuggestedWeek());

  // Global household config
  const [portionsCount, setPortionsCount] = useState<number>(() => {
    const saved = localStorage.getItem('mh_portionsCount');
    return saved ? parseInt(saved, 10) : 2;
  });

  // Transversal Kitchen Team state
  const [team, setTeam] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('mh_team');
    return saved ? JSON.parse(saved) : DEFAULT_TEAM;
  });
  const [isTeamOpen, setIsTeamOpen] = useState(false);

  // Global Checkboxes & Assignments
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('mh_checkedShoppingItems');
    return saved ? JSON.parse(saved) : {};
  });

  const [checkedMealPrepTasks, setCheckedMealPrepTasks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('mh_checkedMealPrepTasks');
    return saved ? JSON.parse(saved) : {};
  });

  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('mh_assignments');
    return saved ? JSON.parse(saved) : {};
  });

  // Recipes the user added to each Meal Prep week (on top of the 9 fixed tasks)
  const [mealPrepExtras, setMealPrepExtras] = useState<MealPrepExtras>(() => loadMealPrepExtras());
  // AI-generated prep tasks for added recipes that don't ship their own (ebook, older imported)
  const [prepTasksCache, setPrepTasksCache] = useState<PrepTasksCache>(() => loadPrepTasksCache());
  const [generatingPrepTasks, setGeneratingPrepTasks] = useState<string[]>([]);
  const attemptedPrepTasks = useRef(new Set<string>()); // one AI try per recipe per session

  // Mobile menu slide in state (for top-bar header actions)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('mh_activeSection', activeSection);
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem('mh_portionsCount', portionsCount.toString());
  }, [portionsCount]);

  useEffect(() => {
    localStorage.setItem('mh_team', JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    localStorage.setItem('mh_checkedShoppingItems', JSON.stringify(checkedShoppingItems));
  }, [checkedShoppingItems]);

  useEffect(() => {
    localStorage.setItem('mh_checkedMealPrepTasks', JSON.stringify(checkedMealPrepTasks));
  }, [checkedMealPrepTasks]);

  useEffect(() => {
    localStorage.setItem('mh_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(MEALPREP_EXTRA_KEY, JSON.stringify(mealPrepExtras));
  }, [mealPrepExtras]);

  useEffect(() => {
    localStorage.setItem(PREP_TASKS_CACHE_KEY, JSON.stringify(prepTasksCache));
  }, [prepTasksCache]);

  // Generates prep tasks for every added recipe that has none yet — right after it's added, and
  // again next session for ones whose generation failed (failures aren't cached; until then the
  // recipe shows the generic fallback task).
  useEffect(() => {
    const ids = new Set(Object.values(mealPrepExtras).flat());
    ids.forEach(async (id) => {
      if (attemptedPrepTasks.current.has(id) || prepTasksCache[id]) return;
      attemptedPrepTasks.current.add(id);
      const recipe = findPickableRecipe(id);
      if (!recipe || recipe.prepTasks?.length) return;
      setGeneratingPrepTasks((prev) => [...prev, id]);
      const tasks = await fetchPrepTasks(recipe);
      if (tasks) setPrepTasksCache((prev) => ({ ...prev, [id]: tasks }));
      setGeneratingPrepTasks((prev) => prev.filter((x) => x !== id));
    });
  }, [mealPrepExtras]);

  const handleAddMealPrepRecipe = (week: number, recipeId: string) => {
    setMealPrepExtras((prev) => {
      const ids = prev[week] ?? [];
      return ids.includes(recipeId) ? prev : { ...prev, [week]: [...ids, recipeId] };
    });
  };

  // Also drops the checked/assigned state of all its tasks, so re-adding the recipe starts fresh and
  // no stale key lingers (progress only counts listed tasks, so it's correct either way).
  const handleRemoveMealPrepRecipe = (week: number, recipeId: string) => {
    const keyPrefix = `week_${week}_mp_${recipeTaskPrefix(week, recipeId)}`;
    // Exact suffix match (_0, _1…, _generic): a plain startsWith would also hit a recipe whose id
    // merely starts with this one (w1_sopa vs w1_sopa_verduras).
    const isThisRecipesTask = (k: string) => k.startsWith(keyPrefix) && /^(\d+|generic)$/.test(k.slice(keyPrefix.length));
    const dropPrefix = <T,>(obj: Record<string, T>) =>
      Object.fromEntries(Object.entries(obj).filter(([k]) => !isThisRecipesTask(k)));
    setMealPrepExtras((prev) => ({ ...prev, [week]: (prev[week] ?? []).filter((id) => id !== recipeId) }));
    setCheckedMealPrepTasks(dropPrefix);
    setAssignments(dropPrefix);
  };

  // Handlers for team members
  const handleAddMember = (name: string) => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const colors = [
      'bg-[#4A7856] text-white',
      'bg-[#E08A3C] text-white',
      'bg-amber-600 text-white',
      'bg-emerald-700 text-white',
      'bg-orange-600 text-white',
      'bg-rose-700 text-white',
      'bg-teal-700 text-white'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      name,
      initials,
      color: randomColor
    };

    setTeam((prev) => [...prev, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
    // Clean up assignments for this member
    setAssignments((prev) => {
      const clean = { ...prev };
      Object.keys(clean).forEach((key) => {
        if (clean[key] === id) {
          delete clean[key];
        }
      });
      return clean;
    });
  };

  const handleAssign = (id: string, memberId: string | undefined) => {
    setAssignments((prev) => {
      const updated = { ...prev };
      if (memberId === undefined) {
        delete updated[id];
      } else {
        updated[id] = memberId;
      }
      return updated;
    });
  };

  // Helper to reset shopping items for active week
  const handleResetList = () => {
    setCheckedShoppingItems((prev) => {
      const updated = { ...prev };
      // delete all keys starting with week_[currentWeek]_shop_
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`week_${currentWeek}_shop_`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  // Compute stats for current active week
  const weekPlan: WeekPlan = weeklyPlans[currentWeek];

  // Shopping progress stats
  const getShoppingStats = () => {
    const uniqueIngKeys = new Set<string>();
    weekPlan.days.forEach((day) => {
      [day.almuerzo, day.cena].forEach((meal) => {
        meal.ingredients.forEach((ing) => {
          const itemKey = `week_${currentWeek}_shop_${ing.category}_${ing.name}`.replace(/\s+/g, '_');
          uniqueIngKeys.add(itemKey);
        });
      });
    });

    const total = uniqueIngKeys.size;
    let bought = 0;
    uniqueIngKeys.forEach((key) => {
      if (checkedShoppingItems[key]) bought++;
    });

    return {
      bought,
      total,
      percentage: total > 0 ? Math.round((bought / total) * 100) : 0
    };
  };

  // Meal prep progress stats
  const getMealPrepStats = () => {
    const rawTasks = [
      ...getMealPrepTasks(currentWeek),
      ...getExtraTasks(currentWeek, mealPrepExtras, prepTasksCache, generatingPrepTasks)
    ];
    // Find the current active level's completed stats (we assume level 1 stats for dashboard summary)
    // Or we find which tasks of Level 1 are completed
    const lvl1Tasks = rawTasks.filter((t) => t.level === 1);
    let lvl1Completed = 0;
    lvl1Tasks.forEach((t) => {
      const key = `week_${currentWeek}_mp_${t.id}`;
      if (checkedMealPrepTasks[key]) lvl1Completed++;
    });

    // Check level 1, then level 2, then level 3 to determine 'active' level for dashboard
    let activeLevel: number = 1;
    let completed = lvl1Completed;
    let total = lvl1Tasks.length;

    const lvl2Tasks = rawTasks.filter((t) => t.level === 2);
    let lvl2Completed = 0;
    lvl2Tasks.forEach((t) => {
      const key = `week_${currentWeek}_mp_${t.id}`;
      if (checkedMealPrepTasks[key]) lvl2Completed++;
    });

    const lvl3Tasks = rawTasks.filter((t) => t.level === 3);
    let lvl3Completed = 0;
    lvl3Tasks.forEach((t) => {
      const key = `week_${currentWeek}_mp_${t.id}`;
      if (checkedMealPrepTasks[key]) lvl3Completed++;
    });

    if (lvl1Completed === lvl1Tasks.length && lvl1Tasks.length > 0) {
      activeLevel = 2;
      completed = lvl2Completed;
      total = lvl2Tasks.length;

      if (lvl2Completed === lvl2Tasks.length && lvl2Tasks.length > 0) {
        activeLevel = 3;
        completed = lvl3Completed;
        total = lvl3Tasks.length;
      }
    }

    return {
      level: activeLevel,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col md:flex-row text-[#2B2B28] font-sans antialiased selection:bg-[#4A7856]/20">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        teamCount={team.length}
        onOpenTeam={() => setIsTeamOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#FFFFFF] border-b border-[#E8E4DC] h-16 px-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <span className="font-sans font-extrabold text-sm tracking-tight text-[#2B2B28]">
              MenuHogar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTeamOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[#FDFCFA] text-[#8A8579] hover:text-[#2B2B28] relative"
              title="Miembros de cocina"
            >
              <Users className="w-5 h-5" />
              {team.length > 1 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#4A7856] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                  {team.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content Wrap with bottom margin for mobile bottom navbar */}
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto pb-24 md:pb-8">
          {activeSection === 'home' && (
            <Home
              currentWeek={currentWeek}
              weekPlan={weekPlan}
              portionsCount={portionsCount}
              shoppingProgress={getShoppingStats()}
              mealPrepProgress={getMealPrepStats()}
              team={team}
              assignments={assignments}
              onAssign={handleAssign}
              onNavigate={(sect) => {
                setActiveSection(sect);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeSection === 'semana' && (
            <WeekPlanView
              currentWeek={currentWeek}
              setWeek={setCurrentWeek}
              weekPlan={weekPlan}
              portionsCount={portionsCount}
              setPortionsCount={setPortionsCount}
              team={team}
              assignments={assignments}
              onAssign={handleAssign}
              onNavigate={(sect) => {
                setActiveSection(sect);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeSection === 'importar' && (
            <ImportRecipeView
              onSaved={() => {
                setActiveSection('semana');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeSection === 'compras' && (
            <ShoppingListView
              currentWeek={currentWeek}
              setWeek={setCurrentWeek}
              weekPlan={weekPlan}
              portionsCount={portionsCount}
              setPortionsCount={setPortionsCount}
              team={team}
              checkedItems={checkedShoppingItems}
              toggleCheckedItem={(key) =>
                setCheckedShoppingItems((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              assignments={assignments}
              onAssign={handleAssign}
              onResetList={handleResetList}
            />
          )}

          {activeSection === 'mealprep' && (
            <MealPrepView
              currentWeek={currentWeek}
              setWeek={setCurrentWeek}
              team={team}
              checkedTasks={checkedMealPrepTasks}
              toggleCheckedTask={(key) =>
                setCheckedMealPrepTasks((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              assignments={assignments}
              onAssign={handleAssign}
              extraRecipeIds={mealPrepExtras[currentWeek] ?? []}
              prepTasksCache={prepTasksCache}
              generatingRecipeIds={generatingPrepTasks}
              onAddRecipe={(id) => handleAddMealPrepRecipe(currentWeek, id)}
              onRemoveRecipe={(id) => handleRemoveMealPrepRecipe(currentWeek, id)}
            />
          )}

          {activeSection === 'snacks' && (
            <BreakfastSnacksView />
          )}

          {activeSection === 'guia' && <GuiaView />}

          {activeSection === 'planificador' && (
            <InteractivePlannerView
              team={team}
              assignments={assignments}
              onAssign={handleAssign}
              onAddMember={handleAddMember}
            />
          )}

          {activeSection === 'asistente' && (
            <AssistantView currentWeek={currentWeek} />
          )}
        </main>
      </div>

      {/* Team Manager Modal */}
      <TeamManager
        isOpen={isTeamOpen}
        onClose={() => setIsTeamOpen(false)}
        team={team}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
}
