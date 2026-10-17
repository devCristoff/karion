import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Sparkles, User, Trophy, Tag, Clock } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Person, MonthlyChallenge, getQuadrant, QUADRANT_INFO } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>, existingId?: string) => void;
  editingTask?: Task | null;
  people: Person[];
  challenges: MonthlyChallenge[];
  initialQuadrant?: 'q1' | 'q2' | 'q3' | 'q4' | null;
  initialStatus?: TaskStatus | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  people,
  challenges,
  initialQuadrant,
  initialStatus,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [category, setCategory] = useState('General');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(30);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDueDate(editingTask.dueDate || '');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setCategory(editingTask.category || 'General');
      setUrgent(editingTask.urgent);
      setImportant(editingTask.important);
      setAssignedTo(editingTask.assignedTo);
      setChallengeId(editingTask.challengeId);
      setTagsInput(editingTask.tags ? editingTask.tags.join(', ') : '');
      setEstimatedMinutes(editingTask.estimatedMinutes);
    } else {
      // Default new task
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const defaultDate = tomorrow.toISOString().split('T')[0];

      setTitle('');
      setDescription('');
      setDueDate(defaultDate);
      setPriority('medium');
      setStatus(initialStatus || 'todo');
      setCategory('Trabajo');
      setAssignedTo(null);
      setChallengeId(null);
      setTagsInput('');
      setEstimatedMinutes(30);

      // Pre-set quadrant if opened from a specific quadrant
      if (initialQuadrant) {
        if (initialQuadrant === 'q1') {
          setUrgent(true);
          setImportant(true);
        } else if (initialQuadrant === 'q2') {
          setUrgent(false);
          setImportant(true);
        } else if (initialQuadrant === 'q3') {
          setUrgent(true);
          setImportant(false);
        } else if (initialQuadrant === 'q4') {
          setUrgent(false);
          setImportant(false);
        }
      } else {
        setUrgent(false);
        setImportant(true);
      }
    }
  }, [editingTask, initialQuadrant, initialStatus, isOpen]);

  if (!isOpen) return null;

  const currentQuadrant = getQuadrant(urgent, important);
  const quadInfo = QUADRANT_INFO[currentQuadrant];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        priority,
        status,
        category: category.trim() || 'General',
        urgent,
        important,
        assignedTo: assignedTo || null,
        challengeId: challengeId || null,
        tags,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        completedAt: status === 'done' ? (editingTask?.completedAt || new Date().toISOString()) : null,
      },
      editingTask ? editingTask.id : undefined
    );

    onClose();
  };

  const categories = ['General', 'Trabajo', 'Hogar & Mantenimiento', 'Crecimiento', 'Salud & Deporte', 'Finanzas', 'Investigación', 'Tecnología'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {editingTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gestiona los detalles, prioridad, asignación y posición en la matriz.
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
              Título de la tarea <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Realizar cambio de aceite al carro..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Descripción / Notas adicionales
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre lo que se necesita, especificaciones, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors resize-none"
            />
          </div>

          {/* Eisenhower Toggles & Visual Preview */}
          <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Matriz de Eisenhower
              </span>
              <span className={`text-xs px-2.5 py-1 rounded border font-medium ${quadInfo.badgeBg}`}>
                {quadInfo.name} ({quadInfo.subtitle})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Urgent Toggle */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/60 cursor-pointer hover:border-neutral-700 transition-colors">
                <div>
                  <span className="text-sm font-medium text-white block">¿Es Urgente?</span>
                  <span className="text-xs text-neutral-400">Requiere acción inmediata o fecha próxima</span>
                </div>
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </label>

              {/* Important Toggle */}
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/60 cursor-pointer hover:border-neutral-700 transition-colors">
                <div>
                  <span className="text-sm font-medium text-white block">¿Es Importante?</span>
                  <span className="text-xs text-neutral-400">Aporta a metas cruciales o de alto impacto</span>
                </div>
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </label>
            </div>
            <p className="text-xs text-neutral-500 italic">
              {quadInfo.description}
            </p>
          </div>

          {/* Row: Assignee & Challenge link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Informative Assignee */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                Asignar a Persona o Agente
              </label>
              <select
                value={assignedTo || ''}
                onChange={(e) => setAssignedTo(e.target.value || null)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">Personal / Yo mismo</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Fines informativos del usuario (ej: Hermano, Agente IA, etc.).
              </span>
            </div>

            {/* Monthly Challenge Link */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Vincular a Reto Mensual
              </label>
              <select
                value={challengeId || ''}
                onChange={(e) => setChallengeId(e.target.value || null)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">Sin vincular a retos</option>
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.targetMonth})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Contribuirá al avance de tu meta del mes.
              </span>
            </div>
          </div>

          {/* Row: Due Date, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Fecha Límite
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Estado Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                <option value="todo">Por Hacer</option>
                <option value="in_progress">En Progreso</option>
                <option value="review">En Revisión</option>
                <option value="done">Completada</option>
              </select>
            </div>
          </div>

          {/* Row: Category, Estimated Minutes, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Categoría
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Trabajo"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                Minutos Estimados
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes || ''}
                onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="30"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                Etiquetas (separadas por coma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Urgente, Taller, Finanzas"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-amber-400"
              />
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
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-colors shadow-sm shadow-amber-500/20"
            >
              {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
