import React, { useState, useEffect } from 'react';
import { ChefHat, Flame, Zap, Award, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import { WeekPlan, TeamMember, MealPrepTask } from '../types';
import { getMealPrepTasks } from '../recipesData';
import AssigneeSelector from './AssigneeSelector';

interface MealPrepProps {
  currentWeek: number;
  setWeek: (weekNum: number) => void;
  team: TeamMember[];
  checkedTasks: Record<string, boolean>;
  toggleCheckedTask: (taskKey: string) => void;
  assignments: Record<string, string>;
  onAssign: (id: string, memberId: string | undefined) => void;
}

export default function MealPrep({
  currentWeek,
  setWeek,
  team,
  checkedTasks,
  toggleCheckedTask,
  assignments,
  onAssign
}: MealPrepProps) {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const rawTasks = getMealPrepTasks(currentWeek);

  // Map to global checked/assigned state
  const tasksForWeek: MealPrepTask[] = rawTasks.map(task => {
    const globalKey = `week_${currentWeek}_mp_${task.id}`;
    return {
      ...task,
      id: globalKey, // unique global key
      checked: !!checkedTasks[globalKey],
      assignedTo: assignments[globalKey]
    };
  });

  // Filter tasks for active energy level
  const activeLevelTasks = activeLevel ? tasksForWeek.filter(t => t.level === activeLevel) : [];
  const completedCount = activeLevelTasks.filter(t => t.checked).length;
  const totalCount = activeLevelTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Check if level just became 100% complete
  useEffect(() => {
    if (activeLevel && progressPercent === 100 && totalCount > 0) {
      setShowCelebration(true);
    } else {
      setShowCelebration(false);
    }
  }, [progressPercent, totalCount, activeLevel]);

  const handleNextLevel = () => {
    setShowCelebration(false);
    if (activeLevel && activeLevel < 3) {
      setActiveLevel((activeLevel + 1) as 1 | 2 | 3);
    }
  };

  const handleChangeWeek = (weekNum: number) => {
    setWeek(weekNum);
    setActiveLevel(null);
    setShowCelebration(false);
  };

  const levelsInfo = [
    { num: 1, label: 'Mínimo Viable', duration: '15-20 min', desc: 'Lo urgente para arrancar con ventaja', icon: Zap },
    { num: 2, label: 'Modo Estándar', duration: '45-60 min', desc: 'Base estratégica más comodines', icon: Flame },
    { num: 3, label: 'Modo Pro', duration: '90+ min', desc: 'La primera mitad de la semana resuelta', icon: Award }
  ];

  return (
    <div className="space-y-6">
      {/* Step 1: Selector de Semana */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#4A7856] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
          <h3 className="font-serif font-bold text-sm text-[#2B2B28]">¿Qué semana querés preparar?</h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E4DC] pb-4">
          <div className="flex bg-[#FDFCFA] p-1 rounded-full border border-[#E8E4DC] self-start">
            {[1, 2, 3, 4].map((num) => (
              <button
                id={`mp-week-tab-${num}`}
                key={num}
                onClick={() => handleChangeWeek(num)}
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

          <div className="text-xs text-[#8A8579] bg-[#FDFCFA] px-3.5 py-2 border border-[#E8E4DC] rounded-xl self-start sm:self-center">
            ⏳ Prepará con anticipación y cociná en minutos
          </div>
        </div>
      </div>

      {/* Step 2: Energy Levels Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#4A7856] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
          <h3 className="font-serif font-bold text-sm text-[#2B2B28]">Elegí tu nivel de energía para la Semana {currentWeek}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levelsInfo.map((lvl) => {
            const Icon = lvl.icon;
            const isCurrent = activeLevel === lvl.num;

            // Calculate stats for level badges in selector
            const lvlTasks = tasksForWeek.filter(t => t.level === lvl.num);
            const lvlCompleted = lvlTasks.filter(t => t.checked).length;
            const isLvlDone = lvlCompleted === lvlTasks.length && lvlTasks.length > 0;

            return (
              <button
                id={`mp-level-btn-${lvl.num}`}
                key={lvl.num}
                onClick={() => {
                  setActiveLevel(lvl.num as 1 | 2 | 3);
                  setShowCelebration(false);
                }}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-[#FFFFFF] border-[#4A7856] ring-2 ring-[#4A7856]/10'
                    : 'bg-[#FFFFFF] hover:bg-[#FDFCFA] border-[#E8E4DC]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#8A8579] uppercase tracking-wider">
                      Nivel {lvl.num}
                    </span>
                    <span className="text-xs font-bold text-[#E08A3C]">
                      {lvl.duration}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#2B2B28] flex items-center gap-1.5">
                    <Icon className="w-4 h-4 shrink-0 text-[#4A7856]" />
                    {lvl.label}
                  </h4>
                  <p className="text-xs text-[#8A8579] mt-1.5 leading-snug">
                    {lvl.desc}
                  </p>
                </div>

                {/* Mini Status Badge */}
                <div className="mt-4 pt-2 border-t border-[#E8E4DC]/60 w-full flex justify-between items-center text-[10px] uppercase tracking-wider">
                  <span className="text-[#8A8579]">Progreso:</span>
                  <span className={`font-bold ${isLvlDone ? 'text-[#4A7856]' : 'text-[#2B2B28]'}`}>
                    {isLvlDone ? '✓ ¡Completo!' : `${lvlCompleted}/${lvlTasks.length} listas`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Plan de acción (checklist), only after choosing a level */}
      {activeLevel && (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#4A7856] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
          <h3 className="font-serif font-bold text-sm text-[#2B2B28]">Tu plan de acción</h3>
        </div>
        <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-extrabold text-[#2B2B28] text-lg">
              Meal Prep: {levelsInfo[activeLevel - 1].label}
            </h3>
            <p className="text-xs text-[#8A8579]">Completá el nivel para organizar la semana</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#4A7856] bg-[#4A7856]/10 px-2.5 py-1 rounded-full shrink-0 uppercase tracking-widest">
              {completedCount} de {totalCount} completadas
            </span>
            <span className="text-xs font-bold text-[#2B2B28]">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E8E4DC]/40 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#E08A3C] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Level 100% Celebration Achievement Screen */}
        {showCelebration ? (
          <div
            id="meal-prep-celebration-box"
            className="bg-[#E08A3C]/10 border border-[#E08A3C]/30 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-300"
          >
            <div className="flex items-center gap-4 text-center md:text-left flex-col sm:flex-row">
              <div className="w-12 h-12 rounded-full bg-[#E08A3C]/20 flex items-center justify-center text-[#E08A3C] shrink-0 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-sans font-bold text-[#2B2B28] text-base">
                  ¡Impresionante! Lograste el 100% de este nivel 🎉
                </h4>
                <p className="text-xs text-[#8A8579] mt-0.5">
                  Dejaste la cocina lista y ordenada. ¡Ya ganaste tiempo valioso para tu semana!
                </p>
              </div>
            </div>

            {activeLevel < 3 ? (
              <button
                id="celebration-next-level-btn"
                onClick={handleNextLevel}
                className="bg-[#E08A3C] hover:bg-[#E08A3C]/90 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Subir al siguiente nivel 🚀
              </button>
            ) : (
              <span className="text-xs font-bold text-[#E08A3C] bg-[#E08A3C]/20 px-4 py-2 rounded-xl">
                🏆 ¡Modo Pro Completado! Sos crack de la cocina.
              </span>
            )}
          </div>
        ) : null}

        {/* Checklist of Active Level Tasks */}
        <div className="divide-y divide-[#E8E4DC]/60 border-t border-[#E8E4DC]/60 pt-2 space-y-1">
          {activeLevelTasks.map((task) => (
            <div
              key={task.id}
              className={`py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-300 ${
                task.checked ? 'opacity-55' : ''
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <button
                  id={`mp-task-check-${task.id}`}
                  onClick={() => toggleCheckedTask(task.id)}
                  className="text-[#4A7856] mt-0.5 active:scale-95 transition-transform shrink-0"
                >
                  <div className={`w-5.5 h-5.5 border-2 rounded-md flex items-center justify-center transition-colors ${
                    task.checked
                      ? 'bg-[#4A7856] border-[#4A7856] text-white'
                      : 'border-[#E8E4DC] hover:border-[#8A8579] bg-[#FFFFFF]'
                  }`}>
                    {task.checked && (
                      <svg className="w-3.5 h-3.5 stroke-2 stroke-current fill-none" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>

                <div className="space-y-1">
                  <h4 className={`text-sm font-bold text-[#2B2B28] transition-all duration-300 ${
                    task.checked ? 'line-through text-[#8A8579]' : ''
                  }`}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-[#8A8579] leading-relaxed max-w-xl">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Transversal Assignee */}
              <div className="self-end sm:self-start">
                <AssigneeSelector
                  id={task.id}
                  assignedId={task.assignedTo}
                  team={team}
                  onAssign={onAssign}
                  align="right"
                />
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
      )}
    </div>
  );
}
