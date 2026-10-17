import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  User, 
  MoreHorizontal, 
  Info,
  Clock
} from 'lucide-react';
import { Task, EisenhowerQuadrant, QUADRANT_INFO, Person, getQuadrant } from '../../types';

interface EisenhowerMatrixProps {
  tasks: Task[];
  people: Person[];
  onToggleTaskComplete: (taskId: string) => void;
  onMoveTaskQuadrant: (taskId: string, targetQuadrant: EisenhowerQuadrant) => void;
  onEditTask: (task: Task) => void;
  onQuickAddTask: (quadrant: EisenhowerQuadrant) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  people,
  onToggleTaskComplete,
  onMoveTaskQuadrant,
  onEditTask,
  onQuickAddTask,
}) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<EisenhowerQuadrant | null>(null);

  const getPerson = (id: string | null) => {
    if (!id) return null;
    return people.find((p) => p.id === id) || null;
  };

  // Group tasks by quadrant
  const filteredTasks = showCompleted ? tasks : tasks.filter((t) => t.status !== 'done');
  
  const tasksByQuadrant: Record<EisenhowerQuadrant, Task[]> = {
    q1: filteredTasks.filter((t) => getQuadrant(t.urgent, t.important) === 'q1'),
    q2: filteredTasks.filter((t) => getQuadrant(t.urgent, t.important) === 'q2'),
    q3: filteredTasks.filter((t) => getQuadrant(t.urgent, t.important) === 'q3'),
    q4: filteredTasks.filter((t) => getQuadrant(t.urgent, t.important) === 'q4'),
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, quadrant: EisenhowerQuadrant) => {
    e.preventDefault();
    setDragOverQuadrant(quadrant);
  };

  const handleDragLeave = () => {
    setDragOverQuadrant(null);
  };

  const handleDrop = (e: React.DragEvent, targetQuadrant: EisenhowerQuadrant) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onMoveTaskQuadrant(taskId, targetQuadrant);
    }
    setDraggedTaskId(null);
    setDragOverQuadrant(null);
  };

  const quadrants: EisenhowerQuadrant[] = ['q1', 'q2', 'q3', 'q4'];

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Matriz de Eisenhower
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Prioriza según Urgencia e Importancia. Arrastra las tarjetas entre cuadrantes o usa el menú de acción rápida.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 accent-amber-400 rounded"
            />
            <span>Mostrar completadas</span>
          </label>
        </div>
      </div>

      {/* Axis Helper labels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((quadKey) => {
          const info = QUADRANT_INFO[quadKey];
          const quadTasks = tasksByQuadrant[quadKey];
          const isDragTarget = dragOverQuadrant === quadKey;

          return (
            <div
              key={quadKey}
              onDragOver={(e) => handleDragOver(e, quadKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, quadKey)}
              className={`flex flex-col min-h-[380px] bg-neutral-900/90 rounded-xl border transition-all duration-150 ${
                isDragTarget
                  ? 'border-amber-400 ring-2 ring-amber-400/30 scale-[1.01]'
                  : info.borderColor
              }`}
            >
              {/* Quadrant Header */}
              <div className={`p-4 border-b border-neutral-800/80 ${info.bgTint} rounded-t-xl flex items-start justify-between gap-3`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${info.textColor}`}>
                      {info.id.toUpperCase()}: {info.name}
                    </span>
                    <span data-tabular="true" className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-neutral-950 text-neutral-300 border border-neutral-800">
                      {quadTasks.length}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-medium mt-0.5">
                    {info.subtitle}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {info.action}
                  </p>
                </div>

                <button
                  onClick={() => onQuickAddTask(quadKey)}
                  title="Añadir tarea a este cuadrante"
                  className="p-1.5 text-neutral-400 hover:text-white bg-neutral-950/60 hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks in Quadrant */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[500px]">
                {quadTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center text-neutral-500">
                    <p className="text-xs">No hay tareas en este cuadrante</p>
                    <button
                      onClick={() => onQuickAddTask(quadKey)}
                      className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
                    >
                      <span>Crear tarea aquí</span>
                    </button>
                  </div>
                ) : (
                  quadTasks.map((task) => {
                    const assignee = getPerson(task.assignedTo);
                    const isDone = task.status === 'done';

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`group relative p-3 bg-neutral-950/90 rounded-lg border border-neutral-800 hover:border-neutral-700 shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                          isDone ? 'opacity-60 bg-neutral-950/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Complete Checkbox */}
                          <button
                            onClick={() => onToggleTaskComplete(task.id)}
                            className="mt-0.5 text-neutral-500 hover:text-amber-400 transition-colors shrink-0"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          {/* Task Content */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => onEditTask(task)}
                          >
                            <h4 className={`text-xs font-semibold text-white tracking-tight ${isDone ? 'line-through text-neutral-400' : ''}`}>
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                                {task.description}
                              </p>
                            )}

                            {/* Metadata row */}
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-400 flex-wrap">
                              {/* Due date */}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-neutral-500" />
                                <span data-tabular="true" className="font-mono">{task.dueDate}</span>
                              </span>

                              {/* Assignee if any */}
                              {assignee ? (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="flex items-center gap-1 font-medium text-sky-300">
                                    <span
                                      className="w-2 h-2 rounded-full inline-block"
                                      style={{ backgroundColor: assignee.avatarColor }}
                                    />
                                    <span>{assignee.name}</span>
                                  </span>
                                </>
                              ) : null}

                              {/* Category */}
                              <span aria-hidden="true">·</span>
                              <span className="text-neutral-500">{task.category}</span>
                            </div>
                          </div>

                          {/* Quick Quadrant Mover Dropdown */}
                          <div className="relative shrink-0">
                            <select
                              value={quadKey}
                              onChange={(e) => onMoveTaskQuadrant(task.id, e.target.value as EisenhowerQuadrant)}
                              className="text-[10px] bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-400 hover:text-white cursor-pointer focus:outline-none"
                              title="Mover cuadrante"
                            >
                              <option value="q1">Q1: Hacer</option>
                              <option value="q2">Q2: Planificar</option>
                              <option value="q3">Q3: Delegar</option>
                              <option value="q4">Q4: Eliminar</option>
                            </select>
                          </div>
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

      {/* Strategic Insight Box */}
      <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-400 space-y-1">
          <p className="font-medium text-neutral-200">
            Regla de Oro de Eisenhower: Prioriza el Cuadrante Q2 (No Urgente pero Importante)
          </p>
          <p>
            Las personas más productivas dedican la mayor parte de su tiempo a planificar, crear hábitos y avanzar retos en Q2 antes de que se conviertan en crisis urgentes (Q1). En Q3, asigna o delega las tareas a tus colaboradores o agentes registrados.
          </p>
        </div>
      </div>
    </div>
  );
};
