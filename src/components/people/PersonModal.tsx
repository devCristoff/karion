import React, { useState, useEffect } from 'react';
import { X, User, Bot, Heart, Wrench, Briefcase, Palette } from 'lucide-react';
import { Person, PersonType } from '../../types';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: Omit<Person, 'id' | 'createdAt'>, existingId?: string) => void;
  editingPerson?: Person | null;
}

const COLOR_OPTIONS = [
  '#38bdf8', // sky
  '#a855f7', // purple
  '#fb7185', // rose
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#94a3b8', // slate
];

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPerson,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<PersonType>('person');
  const [role, setRole] = useState('');
  const [avatarColor, setAvatarColor] = useState(COLOR_OPTIONS[0]);
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name);
      setType(editingPerson.type);
      setRole(editingPerson.role || '');
      setAvatarColor(editingPerson.avatarColor || COLOR_OPTIONS[0]);
      setContactInfo(editingPerson.contactInfo || '');
      setNotes(editingPerson.notes || '');
    } else {
      setName('');
      setType('person');
      setRole('');
      setAvatarColor(COLOR_OPTIONS[0]);
      setContactInfo('');
      setNotes('');
    }
  }, [editingPerson, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        type,
        role: role.trim() || 'Colaborador',
        avatarColor,
        contactInfo: contactInfo.trim(),
        notes: notes.trim(),
      },
      editingPerson?.id
    );

    onClose();
  };

  const typeIcons: Record<PersonType, React.ReactNode> = {
    person: <User className="w-3.5 h-3.5" />,
    agent: <Bot className="w-3.5 h-3.5" />,
    family: <Heart className="w-3.5 h-3.5" />,
    service: <Wrench className="w-3.5 h-3.5" />,
    colleague: <Briefcase className="w-3.5 h-3.5" />,
  };

  const typeLabels: Record<PersonType, string> = {
    person: 'Persona / Amigo',
    agent: 'Agente IA / Asistente',
    family: 'Familiar',
    service: 'Proveedor / Servicio',
    colleague: 'Colega de Trabajo',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingPerson ? 'Editar Persona / Agente' : 'Agregar Persona o Agente'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Útil para asignación informativa de tareas (ej: Hermano, Agente IA, etc.).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Name & Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Nombre o Denominación <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Hermano, Agente Virtual IA, Mamá, Mecánico..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Tipo de Colaborador
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(typeLabels) as PersonType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all text-left ${
                    type === t
                      ? 'border-amber-400/80 bg-amber-400/10 text-amber-300 font-medium'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {typeIcons[t]}
                  <span className="truncate">{typeLabels[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Role or Relationship */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Rol / Parentesco / Función
            </label>
            <input
              type="text"
              placeholder="Ej: Ayuda en taller automotriz, Resúmenes de texto, Soporte..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Color accent */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-neutral-400" />
              Color de Identificación
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    avatarColor === c ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'hover:scale-105 opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Contact info & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Contacto / Referencia
              </label>
              <input
                type="text"
                placeholder="Tel, correo, @usuario..."
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Notas / Disponibilidad
              </label>
              <input
                type="text"
                placeholder="Solo fines de semana, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm shadow-amber-500/20"
            >
              {editingPerson ? 'Guardar Cambios' : 'Crear Colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
