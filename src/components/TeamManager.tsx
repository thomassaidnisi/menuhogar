import React, { useState } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { TeamMember } from '../types';

interface TeamManagerProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamMember[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
}

export default function TeamManager({ isOpen, onClose, team, onAddMember, onRemoveMember }: TeamManagerProps) {
  const [nameInput, setNameInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onAddMember(nameInput.trim());
    setNameInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative bg-[#FBF8F1] border border-[#E4DCC9] rounded-2xl w-full max-w-md p-6 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#F3EEE4] text-[#7A6F5F] hover:text-[#3A2E22] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#A9762A]/10 flex items-center justify-center text-[#A9762A]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-extrabold text-xl text-[#3A2E22]">
              Equipo de Cocina
            </h3>
            <p className="text-xs text-[#7A6F5F]">Gestioná las personas de tu casa</p>
          </div>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            id="team-name-input"
            type="text"
            placeholder="Ej: Mamá, Juan, Sofía..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="flex-1 bg-[#F3EEE4] border border-[#E4DCC9] rounded-xl px-4 py-2.5 text-sm text-[#3A2E22] focus:outline-hidden focus:border-[#A9762A] placeholder-[#7A6F5F]/60"
            maxLength={18}
          />
          <button
            id="team-add-btn"
            type="submit"
            className="bg-[#A9762A] hover:bg-[#A9762A]/90 text-white rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </form>

        {/* Member List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <div className="text-xs font-mono text-[#7A6F5F] uppercase tracking-wider mb-2">Miembros actuales</div>
          {team.map((member) => (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 bg-[#F3EEE4]/50 border border-[#E4DCC9] rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono ${member.color}`}>
                  {member.initials}
                </span>
                <span className="font-medium text-sm text-[#3A2E22]">
                  {member.name} {member.name === 'Yo' ? <span className="text-xs font-mono text-[#7A6F5F]/80 ml-1">(Default)</span> : ''}
                </span>
              </div>
              {member.name !== 'Yo' && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[#7A6F5F] hover:text-red-600 transition-colors"
                  title="Eliminar miembro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-[#E4DCC9] pt-4 text-[11px] text-[#7A6F5F] leading-tight text-center">
          Una vez agregados, vas a poder asignarles tareas puntuales en la planificación, lista de compras o meal prep.
        </div>
      </div>
    </div>
  );
}
