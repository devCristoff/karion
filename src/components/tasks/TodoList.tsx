import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  User, 
  Trophy, 
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, EisenhowerQuadrant, Person, MonthlyChallenge, getQuadrant, QUADRANT_INFO } from '../../types';

interface TodoListProps {
  tasks: Task[];
  people: Person[];
  challenges: MonthlyChallenge[];
  onToggleTaskComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onNewTask: () => void;
  preselectedChallengeId?: string | null;
}

export const TodoList: React.FC<TodoListProps> = ({
  tasks,
  people,
  challenges,
  onToggleTaskComplete,
  onEditTask,
  onDeleteTask,
  onNewTask,
  preselectedChallengeId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [quadrantFilter, setQuadrantFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [challengeFilter, setChallengeFilter] = useState<string>(preselectedChallengeId || 'all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getPerson = (id: string | null) => {
    if (!id) return null;
    return people.find((p) => p.id === id) || null;
  };

  const getChallenge = (id: string | null) => {
    if (!id) return null;
    return challenges.find((c) => c.id === id) || null;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const priorityWeights: Record<TaskPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCat = task.category?.toLowerCase().includes(q);
      const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchCat && !matchTags) return false;
    }

    // Status
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;

    // Priority
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Quadrant
    if (quadrantFilter !== 'all') {
      const q = getQuadrant(task.urgent, task.important);
      if (q !== quadrantFilter) return false;
    }

    // Assignee
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        if (task.assignedTo !== null) return false;
      } else if (task.assignedTo !== assigneeFilter) {
        return false;
      }
    }

    // Challenge
    if (challengeFilter !== 'all') {
      if (challengeFilter === 'none') {
        if (task.challengeId !== null) return false;
      } else if (task.challengeId !== challengeFilter) {
        return false;
      }
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'dueDate') {
      comparison = a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === 'priority') {
      comparison = priorityWeights[b.priority] - priorityWeights[a.priority];
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'createdAt') {
      comparison = a.createdAt.localeCompare(b.createdAt);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: 'dueDate' | 'priority' | 'title' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const statusLabels: Record<TaskStatus, string> = {
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    review: 'En Revisión',
    done: 'Completada',
  };

  return (
    <div className="space-y-4">
      {/* Search & Main Filter Controls */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tareas por título, notas, categoría o etiqueta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Quick Add CTA */}
          <button
            onClick={onNewTask}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shrink-0 shadow-sm"
          >
            <span>Crear Tarea</span>
          </button>
        </div>

        {/* Filter dropdowns row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-neutral-800/80">
          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-500 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todos los estados</option>
              <option value="todo">Por Hacer</option>
              <option value="in_progress">En Progreso</option>
              <option value="review">En Revisión</option>
              <option value="done">Completadas</option>
            </select>
          </div>

          {/* Eisenhower */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-500 mb-1">Matriz Eisenhower</label>
            <select
              value={quadrantFilter}
              onChange={(e) => setQuadrantFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todos los cuadrantes</option>
              <option value="q1">Q1: Hacer Primero (Urg+Imp)</option>
              <option value="q2">Q2: Planificar (NoUrg+Imp)</option>
              <option value="q3">Q3: Delegar (Urg+NoImp)</option>
              <option value="q4">Q4: Eliminar (NoUrg+NoImp)</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-500 mb-1">Prioridad</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todas las prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-500 mb-1">Asignado a</label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Cualquier persona</option>
              <option value="unassigned">Personal (Yo mismo)</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Challenge */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-neutral-500 mb-1">Reto Mensual</label>
            <select
              value={challengeFilter}
              onChange={(e) => setChallengeFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todos los retos</option>
              <option value="none">Sin vincular</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task Table List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-3 bg-neutral-950 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          <div className="col-span-5 flex items-center gap-1.5 cursor-pointer hover:text-white" onClick={() => toggleSort('title')}>
            <span>Tarea & Detalle</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>
          <div className="col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-white" onClick={() => toggleSort('dueDate')}>
            <span>Vencimiento</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>
          <div className="col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-white" onClick={() => toggleSort('priority')}>
            <span>Prioridad & Matriz</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>
          <div className="col-span-2">
            <span>Asignado</span>
          </div>
          <div className="col-span-1 text-right">
            <span>Acciones</span>
          </div>
        </div>

        {/* Rows */}
        {sortedTasks.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <p className="text-sm font-medium text-neutral-300">No se encontraron tareas con estos filtros</p>
            <p className="text-xs text-neutral-500 mt-1">Prueba relajando los filtros de búsqueda o crea una nueva tarea.</p>
            <button
              onClick={onNewTask}
              className="mt-4 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors inline-flex items-center justify-center"
            >
              <span>Crear Tarea</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {sortedTasks.map((task) => {
              const assignee = getPerson(task.assignedTo);
              const challenge = getChallenge(task.challengeId);
              const quad = getQuadrant(task.urgent, task.important);
              const quadInfo = QUADRANT_INFO[quad];
              const isDone = task.status === 'done';
              const isOverdue = !isDone && task.dueDate < todayStr;

              return (
                <div
                  key={task.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 p-4 items-center hover:bg-neutral-950/40 transition-colors ${
                    isDone ? 'opacity-60 bg-neutral-950/30' : ''
                  }`}
                >
                  {/* Title & Checkbox */}
                  <div className="col-span-5 flex items-start gap-3">
                    <button
                      onClick={() => onToggleTaskComplete(task.id)}
                      className="mt-0.5 text-neutral-500 hover:text-amber-400 transition-colors shrink-0"
                      aria-label={isDone ? 'Marcar pendiente' : 'Marcar completada'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold tracking-tight ${
                          isDone ? 'line-through text-neutral-400' : 'text-white'
                        }`}>
                          {task.title}
                        </span>

                        <span className="text-[11px] text-neutral-500">
                          [{task.category}]
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      {/* Tag chips or linked challenge */}
                      {(challenge || (task.tags && task.tags.length > 0)) && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {challenge && (
                            <span className="text-[10px] text-amber-400/90 flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              <Trophy className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[140px]">{challenge.title}</span>
                            </span>
                          )}

                          {task.tags?.map((tag) => (
                            <span key={tag} className="text-[10px] text-neutral-400 bg-neutral-800/80 px-1.5 py-0.2 rounded font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Due Date & Status */}
                  <div className="col-span-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span data-tabular="true" className={`font-mono ${isOverdue ? 'text-rose-400 font-semibold' : 'text-neutral-300'}`}>
                        {task.dueDate}
                      </span>
                      {isOverdue && (
                        <span title="Vencida">
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      {statusLabels[task.status]}
                    </span>
                  </div>

                  {/* Priority & Eisenhower */}
                  <div className="col-span-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${quadInfo.badgeBg} inline-block`}>
                      {quad.toUpperCase()} · {quadInfo.name.split(' ')[0]}
                    </span>
                    <span className={`block text-[11px] mt-0.5 capitalize ${
                      task.priority === 'urgent' ? 'text-rose-400 font-semibold' :
                      task.priority === 'high' ? 'text-amber-400' :
                      task.priority === 'medium' ? 'text-sky-400' : 'text-neutral-400'
                    }`}>
                      Prioridad {task.priority}
                    </span>
                  </div>

                  {/* Assignee */}
                  <div className="col-span-2 text-xs">
                    {assignee ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: assignee.avatarColor }}
                        />
                        <div className="min-w-0">
                          <span className="font-medium text-neutral-200 block truncate">
                            {assignee.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 block truncate">
                            {assignee.role}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <User className="w-3 h-3 text-neutral-500" />
                        <span className="text-xs">Personal (Yo)</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                      title="Editar tarea"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
