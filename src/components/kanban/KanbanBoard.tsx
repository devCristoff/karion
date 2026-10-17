import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  User, 
  Trophy, 
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { Task, TaskStatus, Person, MonthlyChallenge, getQuadrant, QUADRANT_INFO } from '../../types';

interface KanbanBoardProps {
  tasks: Task[];
  people: Person[];
  challenges: MonthlyChallenge[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onQuickAddTask: (status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: 'todo', label: 'Por Hacer', dotColor: 'bg-neutral-400' },
  { id: 'in_progress', label: 'En Progreso', dotColor: 'bg-amber-400' },
  { id: 'review', label: 'En Revisión', dotColor: 'bg-sky-400' },
  { id: 'done', label: 'Completadas', dotColor: 'bg-emerald-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  people,
  challenges,
  onUpdateTaskStatus,
  onEditTask,
  onQuickAddTask,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  const getPerson = (id: string | null) => {
    if (!id) return null;
    return people.find((p) => p.id === id) || null;
  };

  const getChallenge = (id: string | null) => {
    if (!id) return null;
    return challenges.find((c) => c.id === id) || null;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCat = task.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    if (selectedAssignee !== 'all') {
      if (selectedAssignee === 'unassigned') {
        if (task.assignedTo !== null) return false;
      } else if (task.assignedTo !== selectedAssignee) {
        return false;
      }
    }
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'done';
    return null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'done') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'todo';
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el tablero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todos los asignados</option>
              <option value="unassigned">Solo Personal (Yo)</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-neutral-400">
          Total visibles: <strong className="text-white font-mono">{filteredTasks.length}</strong> tareas
        </div>
      </div>

      {/* Kanban 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isDragTarget = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col bg-neutral-900/80 rounded-xl border min-h-[500px] transition-all duration-150 ${
                isDragTarget
                  ? 'border-amber-400 ring-2 ring-amber-400/20 bg-neutral-900'
                  : 'border-neutral-800'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-bold text-white tracking-tight uppercase">
                    {col.label}
                  </h3>
                  <span data-tabular="true" className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-neutral-950 text-neutral-300 border border-neutral-800">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => onQuickAddTask(col.id)}
                  title={`Añadir tarea a ${col.label}`}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Cards */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)]">
                {colTasks.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center text-neutral-500">
                    <p className="text-xs">Sin tareas en esta etapa</p>
                    <button
                      onClick={() => onQuickAddTask(col.id)}
                      className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
                    >
                      <span>Añadir</span>
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = getPerson(task.assignedTo);
                    const challenge = getChallenge(task.challengeId);
                    const quad = getQuadrant(task.urgent, task.important);
                    const quadInfo = QUADRANT_INFO[quad];
                    const isOverdue = task.status !== 'done' && task.dueDate < todayStr;
                    const prevStatus = getPrevStatus(task.status);
                    const nextStatus = getNextStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="group relative p-3 bg-neutral-950 rounded-lg border border-neutral-800 hover:border-neutral-700 shadow-sm cursor-grab active:cursor-grabbing transition-all space-y-2.5"
                      >
                        {/* Header: Priority & Eisenhower Pill */}
                        <div className="flex items-center justify-between text-[11px] gap-2">
                          <span className={`px-1.5 py-0.5 rounded font-medium border ${quadInfo.badgeBg}`}>
                            {quad.toUpperCase()} · {quadInfo.name.split(' ')[0]}
                          </span>

                          <span className={`capitalize font-medium ${
                            task.priority === 'urgent' ? 'text-rose-400 font-bold' :
                            task.priority === 'high' ? 'text-amber-400' :
                            task.priority === 'medium' ? 'text-sky-400' : 'text-neutral-400'
                          }`}>
                            {task.priority === 'urgent' ? 'Urgente' :
                             task.priority === 'high' ? 'Alta' :
                             task.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <div 
                          className="cursor-pointer"
                          onClick={() => onEditTask(task)}
                        >
                          <h4 className="text-xs font-semibold text-white tracking-tight leading-snug group-hover:text-amber-200 transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Challenge association if any */}
                        {challenge && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Trophy className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{challenge.title}</span>
                          </div>
                        )}

                        {/* Footer: Date & Assignee */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-900 text-neutral-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            <span data-tabular="true" className={`font-mono ${isOverdue ? 'text-rose-400 font-semibold flex items-center gap-0.5' : ''}`}>
                              {isOverdue && <AlertTriangle className="w-3 h-3" />}
                              {task.dueDate}
                            </span>
                          </div>

                          {/* Assignee pill */}
                          {assignee ? (
                            <div className="flex items-center gap-1 text-sky-300 font-medium" title={assignee.role}>
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: assignee.avatarColor }}
                              />
                              <span className="truncate max-w-[80px]">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[10px]">Personal</span>
                          )}
                        </div>

                        {/* Quick state movers */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-900/80">
                          {prevStatus ? (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, prevStatus)}
                              className="px-2 py-0.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors text-[10px]"
                              title="Retroceder estado"
                            >
                              <span>Atrás</span>
                            </button>
                          ) : <div />}

                          {nextStatus ? (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, nextStatus)}
                              className="px-2 py-0.5 text-neutral-300 hover:text-amber-300 rounded hover:bg-neutral-800 transition-colors text-[10px] font-medium ml-auto"
                              title="Avanzar estado"
                            >
                              <span>Avanzar</span>
                            </button>
                          ) : <div />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
