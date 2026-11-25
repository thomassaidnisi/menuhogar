import React, { useState } from 'react';
import { Search, X, ArrowLeft, ChevronDown } from 'lucide-react';
import { guideSections, GuideSection } from '../nutritionData';

const matches = (s: GuideSection, q: string) =>
  [s.title, s.summary, ...s.items, ...(s.table?.rows.flat() ?? [])].some((t) => t.toLowerCase().includes(q));

export default function Guia() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GuideSection | null>(null);
  const q = search.trim().toLowerCase();
  const sections = q ? guideSections.filter((s) => matches(s, q)) : guideSections;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif font-extrabold text-2xl text-[#2B2B28] tracking-tight">Guía</h2>
        <p className="text-sm text-[#8A8579] mt-1">
          Pautas de la nutricionista y del taller antiinflamatorio, para leer y tener a mano.
        </p>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8579] opacity-70" />
        <input
          id="guia-search-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en la guía..."
          className="w-full bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2B2B28] focus:outline-hidden focus:border-[#4A7856] placeholder-[#8A8579]/60"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s)}
            className="w-full text-left bg-[#FFFFFF] border border-[#E8E4DC] rounded-xl p-4 flex items-center justify-between gap-3 hover:border-[#4A7856]/50 hover:bg-[#FDFCFA] transition-all"
          >
            <div className="min-w-0 space-y-1">
              <span className="text-[9px] font-bold text-[#4A7856] bg-[#4A7856]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {s.source}
              </span>
              <h5 className="font-serif font-bold text-sm text-[#2B2B28] tracking-tight">{s.title}</h5>
              <p className="text-xs text-[#8A8579] leading-snug line-clamp-2">{s.summary}</p>
            </div>
            <ChevronDown className="w-4.5 h-4.5 text-[#8A8579] shrink-0 -rotate-90" />
          </button>
        ))}
        {sections.length === 0 && (
          <div className="md:col-span-2 text-center text-sm text-[#8A8579] py-10">
            No hay secciones que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelected(null)} />
          <div
            id="guia-modal"
            className="relative bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-md z-10 flex flex-col"
          >
            <div className="border-b border-[#E8E4DC] p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-[#FDFCFA] text-[#8A8579] hover:text-[#2B2B28] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-serif font-extrabold text-lg text-[#2B2B28] tracking-tight">Guía</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-[#FDFCFA] text-[#8A8579] hover:text-[#2B2B28]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              <div>
                <span className="text-[10px] font-bold text-[#4A7856] bg-[#4A7856]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selected.source}
                </span>
                <h2 className="font-serif font-black text-2xl text-[#2B2B28] tracking-tight mt-2">{selected.title}</h2>
                <p className="text-sm text-[#8A8579] mt-1">{selected.summary}</p>
              </div>

              <ul className="space-y-2.5">
                {selected.items.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-[#2B2B28]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E08A3C] shrink-0 mt-2" />
                    <p className="leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>

              {selected.table && (
                <div className="space-y-2">
                  <h4 className="font-serif font-extrabold text-sm text-[#2B2B28] uppercase tracking-wider border-b border-[#E8E4DC] pb-1.5">
                    {selected.table.title}
                  </h4>
                  <div className="overflow-x-auto border border-[#E8E4DC] rounded-xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#4A7856]/8">
                        <tr>
                          {selected.table.columns.map((c, i) => (
                            <th key={i} className="px-3 py-2 text-xs font-bold text-[#4A7856] uppercase tracking-wider">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E4DC]">
                        {selected.table.rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-[#2B2B28] align-top">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
