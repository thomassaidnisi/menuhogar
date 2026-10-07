import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckSquare, Square, Trash2 } from 'lucide-react';
import { WeekPlan, TeamMember, ShoppingItem } from '../types';
import AssigneeSelector from './AssigneeSelector';

interface ShoppingListProps {
  currentWeek: number;
  setWeek: (weekNum: number) => void;
  weekPlan: WeekPlan;
  portionsCount: number;
  setPortionsCount: (count: number) => void;
  team: TeamMember[];
  checkedItems: Record<string, boolean>;
  toggleCheckedItem: (itemKey: string) => void;
  assignments: Record<string, string>;
  onAssign: (id: string, memberId: string | undefined) => void;
  onResetList: () => void;
}

export default function ShoppingList({
  currentWeek,
  setWeek,
  weekPlan,
  portionsCount,
  setPortionsCount,
  team,
  checkedItems,
  toggleCheckedItem,
  assignments,
  onAssign,
  onResetList
}: ShoppingListProps) {
  // Aggregate all ingredients for the selected week dynamically!
  const categoriesList: ('Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén')[] = [
    'Verdulería',
    'Carnicería',
    'Lácteos y Huevos',
    'Almacén'
  ];

  // We can group identical ingredients together
  const aggregatedIngredients: Record<string, {
    name: string;
    amount: number; // base amount per person
    unit: string;
    category: 'Verdulería' | 'Carnicería' | 'Lácteos y Huevos' | 'Almacén';
  }> = {};

  weekPlan.days.forEach(day => {
    const meals = [day.almuerzo, day.cena];
    meals.forEach(meal => {
      meal.ingredients.forEach(ing => {
        // Unique key for aggregation: e.g. "Cebolla_ud" or "Papa_g"
        const key = `${ing.name}_${ing.unit}`;
        if (aggregatedIngredients[key]) {
          aggregatedIngredients[key].amount += ing.amount;
        } else {
          aggregatedIngredients[key] = {
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category
          };
        }
      });
    });
  });

  // Convert to flat array and multiply by portionsCount
  const items: ShoppingItem[] = Object.values(aggregatedIngredients).map((ing, idx) => {
    const itemKey = `week_${currentWeek}_shop_${ing.category}_${ing.name}`.replace(/\s+/g, '_');
    return {
      id: itemKey,
      name: ing.name,
      amount: Number((ing.amount * portionsCount).toFixed(1)),
      unit: ing.unit,
      category: ing.category,
      checked: !!checkedItems[itemKey],
      assignedTo: assignments[itemKey]
    };
  });

  // Expand / collapse state for categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'Verdulería': false,
    'Carnicería': false,
    'Lácteos y Huevos': false,
    'Almacén': false
  });

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Calculations for progress
  const totalItems = items.length;
  const boughtItems = items.filter(i => i.checked).length;
  const progressPercent = totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0;

  const handleAdjustPortions = (diff: number) => {
    setPortionsCount(Math.max(1, portionsCount + diff));
  };

  // WhatsApp Exporter link generator
  const handleSendWhatsApp = () => {
    let text = `🛒 *LISTA DE COMPRAS - SEMANA ${currentWeek}* %0A`;
    text += `👥 _Calculado para ${portionsCount} personas_ %0A%0A`;

    categoriesList.forEach(cat => {
      const catItems = items.filter(i => i.category === cat);
      if (catItems.length > 0) {
        text += `*【 ${cat.toUpperCase()} 】* %0A`;
        catItems.forEach(item => {
          const checkEmoji = item.checked ? '✅' : '⬜';
          const assigneeName = item.assignedTo ? ` (Asignado: ${team.find(t => t.id === item.assignedTo)?.name || ''})` : '';
          text += `${checkEmoji} ${item.name} — ${item.amount} ${item.unit}${assigneeName}%0A`;
        });
        text += `%0A`;
      }
    });

    text += `_Enviado desde MenuHogar 🍳_`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Selector and Portions Adjuster */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E8E4DC] pb-4">
        {/* Week tab switcher */}
        <div className="flex bg-[#FDFCFA] p-1 rounded-full border border-[#E8E4DC] self-start">
          {[1, 2, 3, 4].map((num) => (
            <button
              id={`shop-week-tab-${num}`}
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

        {/* Global Portions Modifier */}
        <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl px-4 py-3 flex items-center justify-between gap-6 self-start lg:self-center">
          <div>
            <div className="text-xs font-semibold uppercase leading-none text-[#8A8579]">
              Calculado para
            </div>
            <div className="text-sm font-bold text-[#2B2B28] mt-1 whitespace-nowrap">
              {portionsCount} {portionsCount === 1 ? 'Persona' : 'Personas'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              id="shop-portions-decrease"
              onClick={() => handleAdjustPortions(-1)}
              className="w-8 h-8 bg-[#FFFFFF] hover:bg-[#FDFCFA] text-[#2B2B28] font-bold rounded-lg flex items-center justify-center text-sm transition-colors border border-[#E8E4DC]"
            >
              -
            </button>
            <button
              id="shop-portions-increase"
              onClick={() => handleAdjustPortions(1)}
              className="w-8 h-8 bg-[#FFFFFF] hover:bg-[#FDFCFA] text-[#2B2B28] font-bold rounded-lg flex items-center justify-center text-sm transition-colors border border-[#E8E4DC]"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* General Progress Bar & Action Buttons */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="font-serif font-semibold text-[#2B2B28] text-base">Progreso de Compras</h3>
            <p className="text-xs text-[#8A8579]">Compraste {boughtItems} de {totalItems} ingredientes para esta semana</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-[10px] font-medium text-[#8A8579] uppercase tracking-wider">
              {progressPercent}%
            </span>
            <button
              id="whatsapp-share-btn"
              onClick={handleSendWhatsApp}
              title="Enviar a WhatsApp"
              className="bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 0 0 5.723 1.457h.005c11.687 0 17.712-13.972 9.397-22.181l.06.01v-.185zM12.06 21.785h-.005a9.83 9.83 0 0 1-5.024-1.375l-.36-.214-3.744.982.998-3.647-.235-.375a9.83 9.83 0 0 1-1.51-5.264c0-5.445 4.436-9.87 9.885-9.87 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.892 6.988c-.003 5.444-4.438 9.877-9.885 9.877z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full bg-[#E8E4DC]/40 h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#E08A3C] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Secondary action */}
        <div className="flex justify-end">
          <button
            id="empty-list-btn"
            onClick={onResetList}
            className="text-[#8A8579] hover:text-red-600 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar / Reiniciar lista</span>
          </button>
        </div>
      </div>

      {/* Expandable/Collapsible Categories */}
      <div className="space-y-3">
        {categoriesList.map((cat) => {
          const catItems = items.filter(i => i.category === cat);
          if (catItems.length === 0) return null;

          const catTotal = catItems.length;
          const catBought = catItems.filter(i => i.checked).length;
          const isCollapsed = collapsedCategories[cat];

          // Color coding for categories
          const getCategoryStyles = (category: string) => {
            switch(category) {
              case 'Verdulería':
                return { text: 'text-[#4A7856]', bg: 'bg-[#4A7856]/10', bullet: 'bg-[#4A7856]' };
              case 'Carnicería':
                return { text: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', bullet: 'bg-[#EF4444]' };
              case 'Lácteos y Huevos':
                return { text: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10', bullet: 'bg-[#3B82F6]' };
              case 'Almacén':
              default:
                return { text: 'text-[#E08A3C]', bg: 'bg-[#E08A3C]/10', bullet: 'bg-[#E08A3C]' };
            }
          };

          const catStyle = getCategoryStyles(cat);

          return (
            <div 
              key={cat} 
              id={`shop-category-box-${cat}`}
              className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl overflow-hidden transition-all duration-200"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full px-5 py-4 flex items-center justify-between bg-[#FFFFFF] hover:bg-[#FDFCFA] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${catStyle.bullet}`} />
                    <h4 className="font-serif font-extrabold text-base text-[#2B2B28]">
                      {cat}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-[#8A8579] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E8E4DC] uppercase tracking-wider">
                    {catBought} de {catTotal} listos
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-[#8A8579]" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-[#8A8579]" />
                )}
              </button>

              {/* Items List */}
              {!isCollapsed && (
                <div className="border-t border-[#E8E4DC]/40 divide-y divide-[#E8E4DC]/40 bg-[#FFFFFF] px-5 py-2">
                  {catItems.map((item) => (
                    <div 
                       key={item.id} 
                       className={`flex items-center justify-between py-3 gap-4 group transition-colors ${
                         item.checked ? 'opacity-55' : ''
                       }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          id={`shop-item-check-${item.id}`}
                          onClick={() => toggleCheckedItem(item.id)}
                          className="text-[#4A7856] transition-transform active:scale-95 shrink-0"
                        >
                          {item.checked ? (
                            <CheckSquare className="w-5.5 h-5.5 fill-[#4A7856]/10" />
                          ) : (
                            <Square className="w-5.5 h-5.5 text-[#E8E4DC] hover:text-[#8A8579]" />
                          )}
                        </button>
                        <span className={`text-sm text-[#2B2B28] font-semibold leading-none ${
                          item.checked ? 'line-through text-[#8A8579]' : ''
                        }`}>
                          {item.name} — <span className={`font-mono text-xs font-bold ${catStyle.text} ${catStyle.bg} px-1.5 py-0.5 rounded-md`}>{item.amount} {item.unit}</span>
                        </span>
                      </div>

                      {/* Transversal Assignee */}
                      <AssigneeSelector
                        id={item.id}
                        assignedId={item.assignedTo}
                        team={team}
                        onAssign={onAssign}
                        align="right"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
