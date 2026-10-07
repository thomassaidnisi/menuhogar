import React from 'react';
import { Home as HomeIcon, Calendar, ShoppingBag, ChefHat, MessageSquare, Users, LayoutGrid, Coffee, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  teamCount: number;
  onOpenTeam: () => void;
}

export default function Sidebar({ activeSection, setActiveSection, teamCount, onOpenTeam }: SidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'semana', label: 'Semana y Recetas', icon: Calendar },
    { id: 'importar', label: 'Importar Recetas', icon: Sparkles },
    { id: 'compras', label: 'Lista de Compras', icon: ShoppingBag },
    { id: 'mealprep', label: 'Meal Prep', icon: ChefHat },
    { id: 'snacks', label: 'Desayunos y Snacks', icon: Coffee },
    { id: 'planificador', label: 'Planificador Interactivo', icon: LayoutGrid },
    { id: 'asistente', label: 'Asistente', icon: MessageSquare },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar (fixed left) */}
      <aside 
        id="desktop-sidebar" 
        className="hidden md:flex flex-col w-64 bg-[#FFFFFF] border-r border-[#E8E4DC] h-screen sticky top-0 p-5 text-[#2B2B28] justify-between"
      >
        <div className="flex flex-col gap-8">
          {/* Brand/Title */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-[#4A7856] flex items-center justify-center text-white font-serif font-black text-xl italic shadow-xs">
              M
            </div>
            <div>
              <h1 className="font-serif font-extrabold text-xl tracking-tight leading-none text-[#2B2B28]">
                MenuHogar
              </h1>
              <span className="text-[10px] text-[#8A8579] uppercase tracking-wider">Cocina Editorial</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  id={`nav-btn-${item.id}`}
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#4A7856]/30 ${
                    isActive
                      ? 'bg-[#4A7856]/10 text-[#4A7856] border-l-2 border-[#4A7856]'
                      : 'text-[#8A8579] hover:bg-[#FDFCFA] hover:text-[#2B2B28] border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Transversal Kitchen Team (Equipo de cocina) link in sidebar footer */}
        <div className="border-t border-[#E8E4DC] pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs text-[#8A8579]">
              <Users className="w-4 h-4 text-[#4A7856]" />
              EQUIPO ({teamCount})
            </div>
            <button 
              id="sidebar-manage-team-btn"
              onClick={onOpenTeam}
              className="text-xs text-[#4A7856] hover:underline font-medium"
            >
              Gestionar
            </button>
          </div>
          <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl p-3 text-xs text-[#8A8579] leading-tight">
            Coordiná las tareas del hogar asignando platos, compras y meal prep.
          </div>
        </div>
      </aside>

      {/* Mobile Navigation (Tabs bottom bar) */}
      <nav 
        id="mobile-navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#E8E4DC] h-16 flex items-center justify-around z-50 px-2"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              id={`nav-mobile-${item.id}`}
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#4A7856]/30 rounded-lg"
            >
              <div className={`p-1.5 rounded-lg transition-all ${
                isActive ? 'text-[#4A7856] scale-110' : 'text-[#8A8579]'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium leading-none ${
                isActive ? 'text-[#2B2B28] font-semibold' : 'text-[#8A8579]'
              }`}>
                {item.id === 'semana' ? 'Semana' : item.id === 'planificador' ? 'Planificador' : item.id === 'snacks' ? 'Snacks' : item.id === 'importar' ? 'Importar' : item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
