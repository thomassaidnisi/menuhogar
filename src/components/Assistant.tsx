import React, { useState, useRef, useEffect } from 'react';
import { Send, User, ChefHat, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Recipe } from '../types';
import { weeklyPlans } from '../recipesData';
import { loadCustomRecipes } from '../customRecipesData';

interface AssistantProps {
  currentWeek: number;
}

const PLANNER_STORAGE_KEY = 'mh_planner_state_v1';
const PLANNER_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Static help text shown when the user taps the "?" button — never goes through Gemini, it's
// inserted straight into the visual message history like any other assistant message.
const HELP_MESSAGE_TEXT = `¡Hola! Soy tu asistente de cocina de MenuHogar. Esto es lo que puedo hacer por vos:

**Con tu semana**
- Generarte la lista de compras y el meal prep a partir de lo que armaste en el Planificador Interactivo
- Reorganizar tu semana si se te desordenó
- Armarte una semana nueva con platos del recetario

**Para el día a día**
- Si me contás qué ingredientes tenés a mano, te digo qué podés cocinar
- Si no tenés energía, te tiro una opción rápida y simple
- Te sugiero reemplazos si te falta algún ingrediente

**Sobre las recetas**
- Respondo dudas sobre cualquier receta del sistema (ingredientes, tiempos, procedimiento)
- Busco opciones de desayunos y snacks

Lo que no hago: no invento recetas nuevas ni cuento calorías exactas — trabajo siempre con lo que ya está cargado en la app. ¿En qué te ayudo?`;

// Mirrors InteractivePlanner's resolveRecipe(), so the assistant can name the actual dish
// the user picked from the ebook rather than just a reference id.
function resolvePlannerRecipeName(ref: { week: number; day: string; mealType: 'almuerzo' | 'cena' }): string | undefined {
  const wp = weeklyPlans[ref.week];
  if (!wp) return undefined;
  const dm = wp.days.find((d) => d.day === ref.day);
  if (!dm) return undefined;
  return dm[ref.mealType]?.name;
}

// Builds a plain-language snapshot of the user's Planificador Interactivo state (if any) to send
// as fresh per-request context, so the assistant can generate a real shopping list / meal prep
// from what the user actually built there — this data lives only in the browser's localStorage.
function buildPlannerContext(): string | undefined {
  const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
  if (!saved) return undefined;

  try {
    const state = JSON.parse(saved);
    if (!state?.days) return undefined;

    const lines: string[] = [];
    PLANNER_DAYS.forEach((day) => {
      const dayPlan = state.days[day];
      if (!dayPlan) return;
      (['almuerzo', 'cena'] as const).forEach((mealType) => {
        const slot = dayPlan[mealType];
        if (!slot) return;
        const name = slot.recipeRef ? resolvePlannerRecipeName(slot.recipeRef) : slot.customText?.trim();
        if (name) {
          const source = slot.recipeRef ? '(receta del sistema)' : '(escrito a mano por el usuario, sin ingredientes estructurados)';
          lines.push(`- ${day} · ${mealType}: ${name} ${source}`);
        }
      });
    });

    if (lines.length === 0) return undefined;

    return `Comensales: ${state.diners || 2} personas.\nPlatos elegidos:\n${lines.join('\n')}`;
  } catch {
    return undefined;
  }
}

// Mirrors server.ts's formatRecipe() so imported recipes read the same way to the assistant as
// the ebook ones — these live only in the browser's localStorage, so they get sent fresh per request.
function formatCustomRecipe(recipe: Recipe): string {
  const ingredients = recipe.ingredients
    .map((ing) => `${ing.amount} ${ing.unit} de ${ing.name} (${ing.category})`)
    .join('; ');
  const steps = recipe.steps.map((s, i) => `${i + 1}) ${s}`).join(' ');
  const note = recipe.note ? ` Nota: ${recipe.note}` : '';
  const category = recipe.category ? ` [${recipe.category}]` : '';
  return `"${recipe.name}"${category} (${recipe.prepTime} min). Ingredientes: ${ingredients}. Preparación: ${steps}.${note}`;
}

function buildCustomRecipesContext(): string | undefined {
  const customRecipes = loadCustomRecipes();
  if (customRecipes.length === 0) return undefined;
  return customRecipes.map((r) => `- ${formatCustomRecipe(r)}`).join('\n');
}

export default function Assistant({ currentWeek }: AssistantProps) {
  // Seeding the default initial conversation in Spanish (Argentine style)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: '¡Hola! Qué lindo charlar. Soy tu asistente de cocina de MenuHogar. Te puedo ayudar a organizar tu semana, buscar reemplazos de ingredientes, o darte ideas rápidas si no tenés energía para cocinar hoy. ¿Cómo te sentís hoy?',
      timestamp: new Date()
    },
    {
      id: 'init_2',
      sender: 'user',
      text: 'Estoy cansada, ¿qué hago de comer?',
      timestamp: new Date()
    },
    {
      id: 'init_3',
      sender: 'assistant',
      text: '¡Uy, te entiendo un montón! Después de un día largo, lo último que queremos es complicarnos la vida en la cocina. Mirá, de la planificación de la Semana ' + currentWeek + ' podés hacer algo súper rápido como unos Fideos con Manteca y Queso (te lleva 12 minutitos de reloj) o una Ensalada de Atún y Arroz. ¿Te convence alguna o querés que busquemos otra opción?',
      timestamp: new Date()
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Most chips send their text straight away, but the ingredients one needs the user to actually
  // type what they have — so it fills the input and places the cursor where they should type,
  // instead of sending a message with an empty ingredients list.
  const INGREDIENTS_TEMPLATE_PREFIX = 'Tengo ';
  const INGREDIENTS_TEMPLATE_SUFFIX = ' — ¿qué puedo cocinar?';

  const suggestionChips: { label: string; action: 'send' | 'fill' }[] = [
    { label: 'Estoy cansada, ¿qué hago de comer?', action: 'send' },
    { label: 'Se me desordenó la semana', action: 'send' },
    { label: 'Sugerime reemplazo para la carne picada', action: 'send' },
    { label: '¿Qué cocino de la Semana ' + currentWeek + '?', action: 'send' },
    { label: 'Tengo estos ingredientes, ¿qué cocino?', action: 'fill' }
  ];

  const handleChipClick = (chip: { label: string; action: 'send' | 'fill' }) => {
    if (chip.action === 'send') {
      handleSendMessage(chip.label);
      return;
    }
    const template = `${INGREDIENTS_TEMPLATE_PREFIX}${INGREDIENTS_TEMPLATE_SUFFIX}`;
    setInputVal(template);
    // Wait a tick for the input to render the new value before placing the cursor
    requestAnimationFrame(() => {
      const cursorPos = INGREDIENTS_TEMPLATE_PREFIX.length;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursorPos, cursorPos);
    });
  };

  // Static help card — inserted directly into the visual history, never touches the API.
  const handleShowHelp = () => {
    const helpMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: HELP_MESSAGE_TEXT,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, helpMsg]);
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      // Extract last 6 messages as history
      const history = messages.slice(-6);
      const plannerContext = buildPlannerContext();
      const customRecipesContext = buildCustomRecipesContext();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history, plannerContext, customRecipesContext })
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: data.text || 'No pude procesar tu mensaje. ¿Me lo repetís?',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error fetching chat response:', err);
      // Friendly local fallback response directly in client in case server is unavailable
      setTimeout(() => {
        const fallbackMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'assistant',
          text: 'Che, se me complicó la conexión por un segundo, pero te ayudo igual: si estás cansada, recordá que podés hacer algo rápido como una tortilla express o unos fideos con manteca y queso de la planificación actual. ¡Escribime de nuevo que te leo!',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputVal);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl flex flex-col h-[75vh] max-h-[600px] overflow-hidden shadow-xs">
      {/* Assistant Header */}
      <div className="bg-[#FFFFFF] border-b border-[#E8E4DC] p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#4A7856]/10 flex items-center justify-center text-[#4A7856] border border-[#4A7856]/20 shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif font-extrabold text-base text-[#2B2B28] leading-tight">
                Asistente de Cocina
              </h3>
              <button
                id="assistant-help-btn"
                onClick={handleShowHelp}
                title="¿Qué puede hacer el asistente?"
                className="text-[#8A8579] hover:text-[#4A7856] transition-colors shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[10px] text-[#8A8579] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A7856] animate-pulse shrink-0" />
              En línea
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#4A7856] bg-[#4A7856]/10 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 hidden sm:inline-block">
          Semana {currentWeek}
        </span>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#FDFCFA]">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                isAssistant ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-full bg-[#4A7856]/10 border border-[#4A7856]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ChefHat className="w-4 h-4 text-[#4A7856]" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isAssistant
                    ? 'bg-[#FFFFFF] text-[#2B2B28] border border-[#E8E4DC] shadow-[0_1px_2px_rgba(43,43,40,0.04)] rounded-tl-none'
                    : 'bg-[#4A7856] text-white rounded-tr-none'
                }`}
              >
                {isAssistant ? (
                  <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 space-y-2">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-[#2B2B28]">{children}</strong>,
                        h1: ({ children }) => <h4 className="font-serif font-extrabold text-base text-[#2B2B28] mt-3">{children}</h4>,
                        h2: ({ children }) => <h4 className="font-serif font-extrabold text-sm text-[#2B2B28] mt-3">{children}</h4>,
                        h3: ({ children }) => <h5 className="font-serif font-bold text-sm text-[#2B2B28] mt-2">{children}</h5>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        a: ({ children, href }) => (
                          <a href={href} target="_blank" rel="noreferrer" className="text-[#4A7856] underline">
                            {children}
                          </a>
                        ),
                        hr: () => <hr className="border-[#E8E4DC] my-2" />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{msg.text}</p>
                )}
                <span className={`block text-[9px] mt-1.5 text-right ${
                  isAssistant ? 'text-[#8A8579]' : 'text-white/70'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-full bg-[#FDFCFA] border border-[#E8E4DC] flex items-center justify-center text-[#8A8579] shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#4A7856]/10 border border-[#4A7856]/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <ChefHat className="w-4 h-4 text-[#4A7856]" />
            </div>
            <div className="bg-[#FFFFFF] text-[#8A8579] border border-[#E8E4DC] rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#8A8579] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#8A8579] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#8A8579] rounded-full animate-bounce" />
              </span>
              <span>Pensando una respuesta casera...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips and Input Bar */}
      <div className="p-3 border-t border-[#E8E4DC] bg-[#FFFFFF] space-y-3">
        {/* Suggestion Chips list */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mask-image shrink-0">
          {suggestionChips.map((chip, idx) => (
            <button
              id={`assistant-chip-${idx}`}
              key={idx}
              onClick={() => handleChipClick(chip)}
              className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#4A7856]/5 hover:border-[#4A7856]/40 hover:text-[#4A7856] text-[#8A8579] rounded-full text-xs font-semibold border border-[#4A7856]/20 whitespace-nowrap transition-all cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Text Input area */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="assistant-chat-input"
            type="text"
            placeholder="¿Qué necesitás resolver hoy?"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-[#FDFCFA] border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
          />
          <button
            id="assistant-send-btn"
            onClick={() => handleSendMessage(inputVal)}
            disabled={!inputVal.trim() || isLoading}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
              inputVal.trim() && !isLoading
                ? 'bg-[#4A7856] text-white hover:bg-[#4A7856]/90 cursor-pointer'
                : 'bg-[#FDFCFA] text-[#8A8579]/40 border border-[#E8E4DC] cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
