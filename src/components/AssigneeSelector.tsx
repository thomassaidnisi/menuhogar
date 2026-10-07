import React, { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { TeamMember } from '../types';

interface AssigneeSelectorProps {
  id: string;
  assignedId?: string;
  team: TeamMember[];
  onAssign: (id: string, memberId: string | undefined) => void;
  align?: 'left' | 'right';
}

export default function AssigneeSelector({ id, assignedId, team, onAssign, align = 'left' }: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentMember = team.find(m => m.id === assignedId);

  const handleSelect = (memberId: string | undefined) => {
    onAssign(id, memberId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left shrink-0">
      <button
        id={`assignee-btn-${id}`}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-[#F3EEE4] transition-all text-[#7A6F5F] hover:text-[#3A2E22]"
        title="Asignar tarea"
      >
        {currentMember ? (
          <div className="flex items-center gap-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${currentMember.color}`}>
              {currentMember.initials}
            </span>
            <span className="text-xs max-w-[60px] truncate font-medium hidden sm:inline">
              {currentMember.name === 'Yo' ? 'Yo' : currentMember.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
            <span className="w-6 h-6 rounded-full border border-dashed border-[#7A6F5F] flex items-center justify-center text-[#7A6F5F]">
              <User className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs hidden sm:inline">Asignar</span>
          </div>
        )}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            id={`assignee-dropdown-${id}`}
            className={`absolute z-50 mt-1 w-44 rounded-lg bg-[#FBF8F1] border border-[#E4DCC9] shadow-md py-1 text-sm ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            <div className="px-3 py-1 text-[11px] font-mono text-[#7A6F5F] uppercase border-b border-[#E4DCC9] mb-1">
              Asignar tarea a:
            </div>
            {team.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#F3EEE4] text-[#3A2E22] ${
                  assignedId === member.id ? 'bg-[#F3EEE4] font-medium' : ''
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-mono ${member.color}`}>
                  {member.initials}
                </span>
                <span className="truncate">{member.name}</span>
              </button>
            ))}
            {assignedId && (
              <button
                onClick={() => handleSelect(undefined)}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-[#E4DCC9] mt-1"
              >
                Desasignar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
