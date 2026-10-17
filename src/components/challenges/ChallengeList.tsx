import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Flame, 
  Hash, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Edit3, 
  Trash2,
  Check,
  ListTodo
} from 'lucide-react';
import { MonthlyChallenge, Task } from '../../types';

interface ChallengeListProps {
  challenges: MonthlyChallenge[];
  tasks: Task[];
  onToggleDate: (challengeId: string, dateStr: string) => void;
  onUpdateNumericProgress: (challengeId: string, newCount: number) => void;
  onToggleMilestone: (challengeId: string, milestoneId: string) => void;
  onEditChallenge: (challenge: MonthlyChallenge) => void;
  onDeleteChallenge: (challengeId: string) => void;
  onNewChallenge: () => void;
  onGoToTasks: (challengeId?: string) => void;
}

export const ChallengeList: React.FC<ChallengeListProps> = ({
  challenges,
  tasks,
  onToggleDate,
  onUpdateNumericProgress,
  onToggleMilestone,
  onEditChallenge,
  onDeleteChallenge,
  onNewChallenge,
  onGoToTasks,
}) => {
  // Current selected month: defaults to current month (e.g., 2026-10)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Parse selected month
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 2, 1);
    setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month, 1);
    setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  // Filter challenges for this month
  const monthChallenges = challenges.filter((c) => c.targetMonth === selectedMonth);

  // Calculate overall stats for this month
  const totalInMonth = monthChallenges.length;
  const completedInMonth = monthChallenges.filter((c) => c.status === 'completed').length;
  
  // Calculate average progress
  const avgProgress = totalInMonth > 0
    ? Math.round(
        monthChallenges.reduce((acc, c) => {
          let p = 0;
          if (c.goalType === 'daily_habit') {
            const target = c.targetDays || daysInMonth;
            p = Math.min(100, Math.round(((c.completedDates?.length || 0) / target) * 100));
          } else if (c.goalType === 'numeric_target') {
            p = c.targetCount ? Math.min(100, Math.round(((c.currentCount || 0) / c.targetCount) * 100)) : 0;
          } else if (c.goalType === 'milestones' && c.milestones?.length) {
            const done = c.milestones.filter((m) => m.completed).length;
            p = Math.round((done / c.milestones.length) * 100);
          }
          return acc + p;
        }, 0) / totalInMonth
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Month Navigation & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-white capitalize min-w-[150px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400 border-l border-neutral-800 pl-4">
            <div>
              <span className="text-neutral-500 block">Retos en curso</span>
              <span data-tabular="true" className="font-semibold text-white font-mono">{totalInMonth}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Completados</span>
              <span data-tabular="true" className="font-semibold text-emerald-400 font-mono">{completedInMonth}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Progreso Global</span>
              <span data-tabular="true" className="font-semibold text-amber-400 font-mono">{avgProgress}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewChallenge}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
          >
            <span>Crear Reto para este Mes</span>
          </button>
        </div>
      </div>

      {/* Challenges List */}
      {monthChallenges.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40">
          <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No hay retos registrados para {monthName}</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Fija una meta mensual para mantenerte enfocado. Puede ser un hábito recurrente, una cifra de lectura o una serie de pasos.
          </p>
          <button
            onClick={onNewChallenge}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            <span>Agregar Primer Reto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {monthChallenges.map((challenge) => {
            // Associated tasks
            const linkedTasks = tasks.filter((t) => t.challengeId === challenge.id);
            const linkedCompleted = linkedTasks.filter((t) => t.status === 'done').length;

            // Calculate progress percentage
            let progressPct = 0;
            if (challenge.goalType === 'daily_habit') {
              const target = challenge.targetDays || daysInMonth;
              const completedCount = challenge.completedDates?.length || 0;
              progressPct = Math.min(100, Math.round((completedCount / target) * 100));
            } else if (challenge.goalType === 'numeric_target') {
              progressPct = challenge.targetCount 
                ? Math.min(100, Math.round(((challenge.currentCount || 0) / challenge.targetCount) * 100))
                : 0;
            } else if (challenge.goalType === 'milestones' && challenge.milestones?.length) {
              const done = challenge.milestones.filter((m) => m.completed).length;
              progressPct = Math.round((done / challenge.milestones.length) * 100);
            }

            return (
              <div
                key={challenge.id}
                className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700/80 transition-all flex flex-col justify-between"
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                        <span>{challenge.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{challenge.targetMonth}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-medium ${
                          challenge.status === 'completed' ? 'text-emerald-400' :
                          challenge.status === 'paused' ? 'text-amber-400' :
                          challenge.status === 'failed' ? 'text-rose-400' : 'text-neutral-300'
                        }`}>
                          {challenge.status === 'active' ? 'En marcha' :
                           challenge.status === 'completed' ? 'Completado' :
                           challenge.status === 'paused' ? 'Pausado' : 'No logrado'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white tracking-tight">
                        {challenge.title}
                      </h3>
                      {challenge.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                          {challenge.description}
                        </p>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === challenge.id ? null : challenge.id)}
                        className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenuId === challenge.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl z-20 py-1">
                          <button
                            onClick={() => {
                              onEditChallenge(challenge);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 flex items-center gap-2"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              onDeleteChallenge(challenge.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-neutral-800 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Header */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                        {challenge.goalType === 'daily_habit' && <Flame className="w-3.5 h-3.5 text-emerald-400" />}
                        {challenge.goalType === 'numeric_target' && <Hash className="w-3.5 h-3.5 text-amber-400" />}
                        {challenge.goalType === 'milestones' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                        {challenge.goalType === 'daily_habit' && 'Constancia Diaria'}
                        {challenge.goalType === 'numeric_target' && `Avance de ${challenge.unit || 'unidades'}`}
                        {challenge.goalType === 'milestones' && 'Hitos cumplidos'}
                      </span>
                      <span data-tabular="true" className="font-mono font-bold text-white">
                        {progressPct}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: challenge.accentColor || '#f59e0b',
                        }}
                      />
                    </div>
                  </div>

                  {/* Interactive Body based on goalType */}
                  <div className="mt-4">
                    {/* Goal Type: Daily Habit (interactive calendar grid) */}
                    {challenge.goalType === 'daily_habit' && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
                          <span>
                            Días completados: <strong className="text-white font-mono">{challenge.completedDates?.length || 0}</strong> / {challenge.targetDays || daysInMonth}
                          </span>
                          <span className="text-[10px] text-neutral-500">Toca un día para marcar</span>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`;
                            const isDone = challenge.completedDates?.includes(dateStr);
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                              <button
                                key={dateStr}
                                onClick={() => onToggleDate(challenge.id, dateStr)}
                                title={dateStr}
                                className={`h-7 rounded flex items-center justify-center text-xs font-mono transition-all relative ${
                                  isDone
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                    : 'bg-neutral-950 text-neutral-500 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-300'
                                } ${isToday ? 'ring-1 ring-amber-400' : ''}`}
                              >
                                {dayNum}
                                {isDone && (
                                  <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Goal Type: Numeric Target */}
                    {challenge.goalType === 'numeric_target' && (
                      <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">
                            Actual: <strong className="text-white font-mono text-sm">{challenge.currentCount || 0}</strong> / {challenge.targetCount} {challenge.unit}
                          </span>
                          <span className="text-xs font-mono text-neutral-500">
                            Resta: {Math.max(0, (challenge.targetCount || 0) - (challenge.currentCount || 0))} {challenge.unit}
                          </span>
                        </div>

                        {/* Quick increments */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-500">Sumar avance:</span>
                          {[+1, +5, +10, +25].map((delta) => (
                            <button
                              key={delta}
                              onClick={() => onUpdateNumericProgress(challenge.id, Math.max(0, (challenge.currentCount || 0) + delta))}
                              className="px-2 py-1 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-800 transition-colors"
                            >
                              +{delta}
                            </button>
                          ))}
                          <button
                            onClick={() => onUpdateNumericProgress(challenge.id, Math.max(0, (challenge.currentCount || 0) - 1))}
                            className="px-2 py-1 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 rounded border border-neutral-800 ml-auto"
                            title="Restar 1"
                          >
                            -1
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Goal Type: Milestones Checklist */}
                    {challenge.goalType === 'milestones' && challenge.milestones && (
                      <div className="space-y-1.5 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                        {challenge.milestones.map((m) => (
                          <label
                            key={m.id}
                            className="flex items-center gap-2.5 p-1.5 rounded hover:bg-neutral-900 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={m.completed}
                              onChange={() => onToggleMilestone(challenge.id, m.id)}
                              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                            />
                            <span
                              className={`text-xs ${
                                m.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                              }`}
                            >
                              {m.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Linked Tasks section */}
                <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-3.5 h-3.5 text-neutral-500" />
                    <span>
                      {linkedTasks.length > 0 ? (
                        <>
                          <strong className="text-neutral-200 font-mono">{linkedCompleted}/{linkedTasks.length}</strong> tareas asociadas
                        </>
                      ) : (
                        <span>Sin tareas vinculadas</span>
                      )}
                    </span>
                  </div>

                  <button
                    onClick={() => onGoToTasks(challenge.id)}
                    className="text-amber-400 hover:text-amber-300 font-medium text-xs hover:underline flex items-center gap-1"
                  >
                    <span>Ver Tareas</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
