import React from 'react';
import { Calendar, ShoppingBag, ChefHat, MessageSquare, ArrowRight, CheckCircle2, User, HelpCircle } from 'lucide-react';
import { DayMenu, TeamMember, WeekPlan } from '../types';

interface HomeProps {
  currentWeek: number;
  weekPlan: WeekPlan;
  portionsCount: number;
  shoppingProgress: { bought: number; total: number; percentage: number };
  mealPrepProgress: { level: number; completed: number; total: number; percentage: number };
  team: TeamMember[];
  assignments: Record<string, string>;
  onAssign: (id: string, memberId: string | undefined) => void;
  onNavigate: (section: string) => void;
}

export default function Home({
  currentWeek,
  weekPlan,
  portionsCount,
  shoppingProgress,
  mealPrepProgress,
  team,
  assignments,
  onAssign,
  onNavigate
}: HomeProps) {
  // Determine current day of the week (Spanish)
  const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  
  // For the demo / domestic use, if it is Saturday or Sunday, let's show Lunes or Viernes,
  // but let's default to Lunes if Sunday, and Viernes if Saturday, or simply show the actual day if Lunes-Viernes.
  let todayName = daysInSpanish[todayIndex];
  if (todayName === 'Domingo' || todayName === 'Sábado') {
    todayName = 'Lunes'; // Fallback for weekends so the planner is always active
  }

  // Find today's menu
  const todayMenu = weekPlan.days.find(d => d.day === todayName) || weekPlan.days[0];

  // Helper to get initials badge
  const renderAssigneeBadge = (assignmentKey: string) => {
    const assignedId = assignments[assignmentKey];
    if (!assignedId) return null;
    const member = team.find(m => m.id === assignedId);
    if (!member) return null;
    return (
      <span 
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${member.color}`}
        title={`Asignado a ${member.name}`}
      >
        {member.initials}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E4DC] pb-4">
        <div>
          <h2 className="font-serif font-extrabold text-3xl text-[#2B2B28] tracking-tight">
            ¡Hola de nuevo!
          </h2>
          <p className="text-[#8A8579] text-sm mt-1">
            Esta es la planificación para la <span className="font-semibold text-[#4A7856]">Semana {currentWeek}</span>, calculada para <span className="font-semibold text-[#4A7856] bg-[#FFFFFF] px-1.5 py-0.5 rounded-md border border-[#E8E4DC]">{portionsCount} {portionsCount === 1 ? 'persona' : 'personas'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl px-4 py-2 text-xs text-[#8A8579]">
          <span className="w-2 h-2 rounded-full bg-[#4A7856] animate-pulse"></span>
          Hoy es {todayName}
        </div>
      </div>

      {/* Qué toca hoy - Destacado arriba */}
      <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-5 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#4A7856]/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-[#4A7856] bg-[#4A7856]/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
            Menú de Hoy — {todayName}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Almuerzo */}
          <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl p-5 flex flex-col justify-between hover:border-[#4A7856]/50 hover:bg-[#4A7856]/5 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] text-[#8A8579] font-bold uppercase tracking-wider">Almuerzo</span>
                {renderAssigneeBadge(`week_${currentWeek}_${todayName}_almuerzo`)}
              </div>
              <h4 className="font-serif font-bold text-lg text-[#2B2B28] line-clamp-1">
                {todayMenu.almuerzo.name}
              </h4>
              <p className="text-xs text-[#8A8579] mt-1">
                Tiempo: {todayMenu.almuerzo.prepTime} mins
              </p>
            </div>
            <button 
              onClick={() => onNavigate('semana')}
              className="mt-4 text-xs font-bold text-[#4A7856] hover:text-[#4A7856]/80 flex items-center gap-1.5 self-start uppercase tracking-wider"
            >
              Ver receta completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cena */}
          <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl p-5 flex flex-col justify-between hover:border-[#4A7856]/50 hover:bg-[#4A7856]/5 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] text-[#8A8579] font-bold uppercase tracking-wider">Cena</span>
                {renderAssigneeBadge(`week_${currentWeek}_${todayName}_cena`)}
              </div>
              <h4 className="font-serif font-bold text-lg text-[#2B2B28] line-clamp-1">
                {todayMenu.cena.name}
              </h4>
              <p className="text-xs text-[#8A8579] mt-1">
                Tiempo: {todayMenu.cena.prepTime} mins
              </p>
            </div>
            <button 
              onClick={() => onNavigate('semana')}
              className="mt-4 text-xs font-bold text-[#4A7856] hover:text-[#4A7856]/80 flex items-center gap-1.5 self-start uppercase tracking-wider"
            >
              Ver receta completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Cards: Shopping and Meal Prep side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compras Progress */}
        <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E08A3C]/10 flex items-center justify-center text-[#E08A3C]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#2B2B28]">Lista de Compras</h3>
              </div>
              <span className="text-[10px] font-bold text-[#E08A3C] bg-[#E08A3C]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {shoppingProgress.bought} de {shoppingProgress.total} ítems
              </span>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs text-[#8A8579]">
                <span>Progreso de compra semanal</span>
                <span className="font-bold text-[#2B2B28]">{shoppingProgress.percentage}%</span>
              </div>
              {/* Custom progress bar */}
              <div className="w-full bg-[#E8E4DC]/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#E08A3C] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${shoppingProgress.percentage}%` }}
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('compras')}
            className="mt-6 w-full py-2.5 bg-[#4A7856] hover:bg-[#4A7856]/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
          >
            <span>Ir al supermercado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Meal Prep Progress */}
        <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E08A3C]/10 flex items-center justify-center text-[#E08A3C]">
                  <ChefHat className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#2B2B28]">Meal Prep Semanal</h3>
              </div>
              <span className="text-[10px] font-bold text-[#E08A3C] bg-[#E08A3C]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Nivel {mealPrepProgress.level} Activo
              </span>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs text-[#8A8579]">
                <span>Tareas listas ({mealPrepProgress.completed}/{mealPrepProgress.total})</span>
                <span className="font-bold text-[#2B2B28]">{mealPrepProgress.percentage}%</span>
              </div>
              {/* Custom progress bar */}
              <div className="w-full bg-[#E8E4DC]/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#E08A3C] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${mealPrepProgress.percentage}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('mealprep')}
            className="mt-6 w-full py-2.5 bg-[#4A7856] hover:bg-[#4A7856]/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
          >
            <span>Adelantar tareas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Accesos Directos Rápidos (Bento) */}
      <div className="space-y-3">
        <h3 className="text-[10px] text-[#8A8579] uppercase tracking-widest font-bold opacity-75">
          Accesos Rápidos
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => onNavigate('semana')}
            className="p-5 bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl hover:border-[#4A7856]/60 hover:bg-[#4A7856]/5 transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <Calendar className="w-6 h-6 text-[#4A7856] mb-4 group-hover:scale-110 transition-transform" />
            <div>
              <h4 className="font-serif font-bold text-sm text-[#2B2B28]">Semana Completa</h4>
              <p className="text-xs text-[#8A8579] mt-1 leading-snug">Revisá la grilla de Lunes a Viernes</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('compras')}
            className="p-5 bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl hover:border-[#E08A3C]/60 hover:bg-[#E08A3C]/5 transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <ShoppingBag className="w-6 h-6 text-[#E08A3C] mb-4 group-hover:scale-110 transition-transform" />
            <div>
              <h4 className="font-serif font-bold text-sm text-[#2B2B28]">Supermercado</h4>
              <p className="text-xs text-[#8A8579] mt-1 leading-snug">Categorías de alimentos y cantidades</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('mealprep')}
            className="p-5 bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl hover:border-[#4A7856]/60 hover:bg-[#4A7856]/5 transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <ChefHat className="w-6 h-6 text-[#4A7856] mb-4 group-hover:scale-110 transition-transform" />
            <div>
              <h4 className="font-serif font-bold text-sm text-[#2B2B28]">Cocina Estratégica</h4>
              <p className="text-xs text-[#8A8579] mt-1 leading-snug">Elegí tu energía y ganá tiempo</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('asistente')}
            className="p-5 bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl hover:border-[#4A7856]/60 hover:bg-[#4A7856]/5 transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 text-[#4A7856] mb-4 group-hover:scale-110 transition-transform" />
            <div>
              <h4 className="font-serif font-bold text-sm text-[#2B2B28]">Asistente Amiga</h4>
              <p className="text-xs text-[#8A8579] mt-1 leading-snug">Reemplazos de comida y consejos</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
