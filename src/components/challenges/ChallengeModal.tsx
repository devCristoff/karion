import React, { useState, useEffect } from 'react';
import { X, Calendar, Trash2, CheckCircle2, Hash, Flame } from 'lucide-react';
import { MonthlyChallenge, ChallengeGoalType, ChallengeMilestone, ChallengeStatus } from '../../types';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challenge: Omit<MonthlyChallenge, 'id' | 'createdAt'>, existingId?: string) => void;
  editingChallenge?: MonthlyChallenge | null;
}

const ACCENT_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#8b5cf6'];

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingChallenge,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Salud & Bienestar');
  const [targetMonth, setTargetMonth] = useState('2026-10');
  const [goalType, setGoalType] = useState<ChallengeGoalType>('daily_habit');
  const [targetDays, setTargetDays] = useState(25);
  const [targetCount, setTargetCount] = useState(100);
  const [currentCount, setCurrentCount] = useState(0);
  const [unit, setUnit] = useState('veces');
  const [milestones, setMilestones] = useState<ChallengeMilestone[]>([
    { id: '1', title: 'Fase 1: Preparación inicial', completed: false },
    { id: '2', title: 'Fase 2: Ejecución consistente', completed: false },
  ]);
  const [status, setStatus] = useState<ChallengeStatus>('active');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);

  useEffect(() => {
    if (editingChallenge) {
      setTitle(editingChallenge.title);
      setDescription(editingChallenge.description);
      setCategory(editingChallenge.category);
      setTargetMonth(editingChallenge.targetMonth);
      setGoalType(editingChallenge.goalType);
      setTargetDays(editingChallenge.targetDays || 25);
      setTargetCount(editingChallenge.targetCount || 100);
      setCurrentCount(editingChallenge.currentCount || 0);
      setUnit(editingChallenge.unit || 'veces');
      setMilestones(editingChallenge.milestones || []);
      setStatus(editingChallenge.status);
      setAccentColor(editingChallenge.accentColor || ACCENT_COLORS[0]);
    } else {
      // Default month to current
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      setTitle('');
      setDescription('');
      setCategory('Salud & Bienestar');
      setTargetMonth(monthStr);
      setGoalType('daily_habit');
      setTargetDays(25);
      setTargetCount(100);
      setCurrentCount(0);
      setUnit('veces');
      setMilestones([
        { id: 'm-1', title: 'Definir horario y plan', completed: false },
        { id: 'm-2', title: 'Completar mitad del objetivo', completed: false },
        { id: 'm-3', title: 'Evaluación final y cierre', completed: false },
      ]);
      setStatus('active');
      setAccentColor(ACCENT_COLORS[0]);
    }
  }, [editingChallenge, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      { id: `m-${Date.now()}`, title: '', completed: false },
    ]);
  };

  const handleUpdateMilestone = (index: number, val: string) => {
    const updated = [...milestones];
    updated[index].title = val;
    setMilestones(updated);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        targetMonth,
        goalType,
        targetDays: goalType === 'daily_habit' ? Number(targetDays) : undefined,
        completedDates: editingChallenge?.completedDates || [],
        targetCount: goalType === 'numeric_target' ? Number(targetCount) : undefined,
        currentCount: goalType === 'numeric_target' ? Number(currentCount) : undefined,
        unit: goalType === 'numeric_target' ? unit.trim() : undefined,
        milestones: goalType === 'milestones' ? milestones.filter((m) => m.title.trim().length > 0) : undefined,
        status,
        accentColor,
      },
      editingChallenge?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingChallenge ? 'Editar Reto Mensual' : 'Nuevo Reto Mensual'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Establece un hábito, meta cuantitativa o serie de hitos para este mes.
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Título del Reto <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 30 Días de Ejercicio Matutino, Leer 2 Libros..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Propósito / Motivación
            </label>
            <textarea
              rows={2}
              placeholder="¿Por qué este reto es importante para ti este mes?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Month & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Mes del Reto
              </label>
              <input
                type="month"
                required
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Categoría
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Salud, Finanzas, Aprendizaje..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Goal Type Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Tipo de Meta
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGoalType('daily_habit')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  goalType === 'daily_habit'
                    ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <Flame className="w-4 h-4 mb-1" />
                <span className="text-xs font-semibold block">Hábito Diario</span>
                <span className="text-[10px] opacity-75">Días del mes</span>
              </button>

              <button
                type="button"
                onClick={() => setGoalType('numeric_target')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  goalType === 'numeric_target'
                    ? 'border-amber-500/80 bg-amber-500/10 text-amber-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <Hash className="w-4 h-4 mb-1" />
                <span className="text-xs font-semibold block">Numérico</span>
                <span className="text-[10px] opacity-75">Páginas, km, horas</span>
              </button>

              <button
                type="button"
                onClick={() => setGoalType('milestones')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  goalType === 'milestones'
                    ? 'border-indigo-500/80 bg-indigo-500/10 text-indigo-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mb-1" />
                <span className="text-xs font-semibold block">Hitos</span>
                <span className="text-[10px] opacity-75">Fases o pasos</span>
              </button>
            </div>
          </div>

          {/* Conditional Goal Type Parameters */}
          {goalType === 'daily_habit' && (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Objetivo de días cumplidos en el mes:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-white font-mono"
                />
                <span className="text-xs text-neutral-400">
                  días mínimos recomendados (ej. 25 de 31 días)
                </span>
              </div>
            </div>
          )}

          {goalType === 'numeric_target' && (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Meta Total</label>
                  <input
                    type="number"
                    min="1"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Progreso Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={currentCount}
                    onChange={(e) => setCurrentCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Unidad</label>
                  <input
                    type="text"
                    placeholder="páginas, km, horas"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {goalType === 'milestones' && (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Checklist de Hitos Clave:
                </span>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-medium hover:underline"
                >
                  Agregar Hito
                </button>
              </div>
              {milestones.map((m, idx) => (
                <div key={m.id || idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-500 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder={`Hito #${idx + 1}`}
                    value={m.title}
                    onChange={(e) => handleUpdateMilestone(idx, e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(idx)}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Accent Color & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Color Distintivo
              </label>
              <div className="flex items-center gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      accentColor === c ? 'scale-120 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ChallengeStatus)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="paused">En Pausa</option>
                <option value="failed">No Logrado</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
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
              {editingChallenge ? 'Guardar Cambios' : 'Crear Reto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
