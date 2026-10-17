import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { Task, MonthlyChallenge, Person, getQuadrant, QUADRANT_INFO, EisenhowerQuadrant, AppView } from '../../types';

interface AnalyticsDashboardProps {
  tasks: Task[];
  challenges: MonthlyChallenge[];
  people: Person[];
  onNavigateView: (view: AppView) => void;
  onEditTask: (task: Task) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  tasks,
  challenges,
  people,
  onNavigateView,
  onEditTask,
}) => {
  // Current month string
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  // 1. KPI Computations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const currentMonthChallenges = challenges.filter((c) => c.targetMonth === currentMonthStr);
  const avgChallengeProgress = currentMonthChallenges.length > 0
    ? Math.round(
        currentMonthChallenges.reduce((acc, c) => {
          let p = 0;
          if (c.goalType === 'daily_habit') {
            const target = c.targetDays || 30;
            p = Math.min(100, Math.round(((c.completedDates?.length || 0) / target) * 100));
          } else if (c.goalType === 'numeric_target') {
            p = c.targetCount ? Math.min(100, Math.round(((c.currentCount || 0) / c.targetCount) * 100)) : 0;
          } else if (c.goalType === 'milestones' && c.milestones?.length) {
            const done = c.milestones.filter((m) => m.completed).length;
            p = Math.round((done / c.milestones.length) * 100);
          }
          return acc + p;
        }, 0) / currentMonthChallenges.length
      )
    : 0;

  // 2. Eisenhower Distribution
  const quadrantCounts: Record<EisenhowerQuadrant, number> = {
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
  };
  tasks.forEach((t) => {
    const q = getQuadrant(t.urgent, t.important);
    quadrantCounts[q]++;
  });

  // 3. Status Breakdown
  const statusCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: completedTasks.length,
  };

  // 4. Delegated vs Personal Breakdown
  const assignedTasksCount = tasks.filter((t) => t.assignedTo !== null).length;
  const personalTasksCount = tasks.filter((t) => t.assignedTo === null).length;

  // 5. Urgent Upcoming Tasks
  const upcomingDeadlines = activeTasks
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  // Eisenhower health diagnosis
  const q1Ratio = totalTasks > 0 ? Math.round((quadrantCounts.q1 / totalTasks) * 100) : 0;
  const q2Ratio = totalTasks > 0 ? Math.round((quadrantCounts.q2 / totalTasks) * 100) : 0;
  const q3Ratio = totalTasks > 0 ? Math.round((quadrantCounts.q3 / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-amber-400 block mb-1">
            Centro de Mando & Productividad
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Resumen General de Desempeño
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Visualiza el avance de tus retos mensuales, el equilibrio en tu matriz de Eisenhower y el estado de tareas asignadas a tus colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateView('tasks')}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
          >
            <span>Ver Tareas</span>
          </button>
          <button
            onClick={() => onNavigateView('challenges')}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
          >
            <span>Ver Retos</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner if 0 tasks and 0 challenges */}
      {totalTasks === 0 && challenges.length === 0 && (
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Base de datos JSON iniciada (0 registros)</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Los datos de ejemplo se han eliminado. Todas tus tareas, retos y colaboradores se guardan directamente en archivos JSON (<code className="text-amber-300 font-mono">data/kairon_db.json</code>).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => onNavigateView('tasks')}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              <span>Crear primera tarea</span>
            </button>
            <button
              onClick={() => onNavigateView('challenges')}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
            >
              <span>Crear reto del mes</span>
            </button>
          </div>
        </div>
      )}

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Completion Rate */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Tasa de Compleción
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span data-tabular="true" className="text-2xl font-bold text-white font-mono">
              {completionRate}%
            </span>
            <span className="text-xs text-neutral-500">
              ({completedTasks.length} de {totalTasks})
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        {/* KPI 2: Active Tasks */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Tareas Pendientes
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span data-tabular="true" className="text-2xl font-bold text-white font-mono">
              {activeTasks.length}
            </span>
            <span className="text-xs text-neutral-500">
              en flujo de trabajo
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            {statusCounts.in_progress} en progreso · {statusCounts.review} en revisión
          </p>
        </div>

        {/* KPI 3: Challenges Progress */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Retos de Este Mes
            </span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span data-tabular="true" className="text-2xl font-bold text-white font-mono">
              {avgChallengeProgress}%
            </span>
            <span className="text-xs text-neutral-500">
              avance promedio
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            {currentMonthChallenges.length} reto(s) activos en {currentMonthStr}
          </p>
        </div>

        {/* KPI 4: Delegated vs Personal */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Carga Asignada
            </span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span data-tabular="true" className="text-2xl font-bold text-white font-mono">
              {assignedTasksCount}
            </span>
            <span className="text-xs text-neutral-500">
              tareas delegadas ({people.length} colaboradores)
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            {personalTasksCount} de foco personal
          </p>
        </div>
      </div>

      {/* Main Analysis Section: Eisenhower + Status Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eisenhower Matrix Health & Breakdown */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Distribución Matriz Eisenhower</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Balance estratégico de esfuerzo y prevención
              </p>
            </div>
            <button
              onClick={() => onNavigateView('eisenhower')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
            >
              <span>Ver Matriz</span>
            </button>
          </div>

          {/* Quadrant Bars */}
          <div className="space-y-3">
            {(['q1', 'q2', 'q3', 'q4'] as EisenhowerQuadrant[]).map((qKey) => {
              const info = QUADRANT_INFO[qKey];
              const count = quadrantCounts[qKey];
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

              return (
                <div key={qKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                      <span className={`w-2 h-2 rounded-full ${
                        qKey === 'q1' ? 'bg-rose-400' :
                        qKey === 'q2' ? 'bg-amber-400' :
                        qKey === 'q3' ? 'bg-sky-400' : 'bg-neutral-500'
                      }`} />
                      <span>{info.id.toUpperCase()}: {info.name}</span>
                      <span className="text-neutral-500">({info.subtitle})</span>
                    </span>
                    <span data-tabular="true" className="font-mono text-neutral-400">
                      <strong className="text-white">{count}</strong> ({pct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full rounded-full ${
                        qKey === 'q1' ? 'bg-rose-500' :
                        qKey === 'q2' ? 'bg-amber-400' :
                        qKey === 'q3' ? 'bg-sky-400' : 'bg-neutral-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strategic Advice Diagnostic */}
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-neutral-400">
              {q2Ratio >= 35 ? (
                <span className="text-emerald-300">
                  <strong>Excelente balance:</strong> Tienes un alto porcentaje enfocado en Q2 (Planificación). Esto previene fuegos y crisis de última hora.
                </span>
              ) : q1Ratio > 40 ? (
                <span className="text-rose-300">
                  <strong>Alerta de sobrecarga:</strong> Más del 40% de tus tareas están en Q1 (Urgente). Considera delegar más a tus agentes/colaboradores (Q3) o anticiparte con Q2.
                </span>
              ) : (
                <span>
                  <strong>Tip de optimización:</strong> Asegúrate de que las tareas importantes sin urgencia inmediata (Q2) tengan bloques de tiempo reservados en tu agenda.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Kanban Flow Funnel */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Embudo de Estados (Kanban)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Flujo de tareas a través de las etapas
              </p>
            </div>
            <button
              onClick={() => onNavigateView('kanban')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
            >
              <span>Ver Tablero</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-neutral-400 block">Por Hacer</span>
              <span data-tabular="true" className="text-xl font-bold text-white font-mono block mt-1">
                {statusCounts.todo}
              </span>
              <span className="text-[10px] text-neutral-500">listas para iniciar</span>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-amber-400 block">En Progreso</span>
              <span data-tabular="true" className="text-xl font-bold text-amber-300 font-mono block mt-1">
                {statusCounts.in_progress}
              </span>
              <span className="text-[10px] text-neutral-500">en ejecución activa</span>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-sky-400 block">En Revisión</span>
              <span data-tabular="true" className="text-xl font-bold text-sky-300 font-mono block mt-1">
                {statusCounts.review}
              </span>
              <span className="text-[10px] text-neutral-500">esperando feedback</span>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-emerald-400 block">Completadas</span>
              <span data-tabular="true" className="text-xl font-bold text-emerald-300 font-mono block mt-1">
                {statusCounts.done}
              </span>
              <span className="text-[10px] text-neutral-500">objetivos alcanzados</span>
            </div>
          </div>

          {/* Workflow health bar */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] text-neutral-400 block">Composición visual del flujo:</span>
            <div className="w-full h-3 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex">
              <div style={{ width: `${totalTasks > 0 ? (statusCounts.todo / totalTasks) * 100 : 0}%` }} className="bg-neutral-600 h-full" title="Por Hacer" />
              <div style={{ width: `${totalTasks > 0 ? (statusCounts.in_progress / totalTasks) * 100 : 0}%` }} className="bg-amber-400 h-full" title="En Progreso" />
              <div style={{ width: `${totalTasks > 0 ? (statusCounts.review / totalTasks) * 100 : 0}%` }} className="bg-sky-400 h-full" title="En Revisión" />
              <div style={{ width: `${totalTasks > 0 ? (statusCounts.done / totalTasks) * 100 : 0}%` }} className="bg-emerald-400 h-full" title="Completadas" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Challenges Progress & People Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Challenges Spotlight */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Progreso de Retos ({currentMonthStr})</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Seguimiento de hábitos y metas del mes
              </p>
            </div>
            <button
              onClick={() => onNavigateView('challenges')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
            >
              <span>Gestionar Retos</span>
            </button>
          </div>

          {currentMonthChallenges.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              No hay retos creados para el mes actual.
            </p>
          ) : (
            <div className="space-y-3">
              {currentMonthChallenges.map((challenge) => {
                let p = 0;
                let detail = '';
                if (challenge.goalType === 'daily_habit') {
                  const target = challenge.targetDays || 30;
                  p = Math.min(100, Math.round(((challenge.completedDates?.length || 0) / target) * 100));
                  detail = `${challenge.completedDates?.length || 0} / ${target} días`;
                } else if (challenge.goalType === 'numeric_target') {
                  p = challenge.targetCount ? Math.min(100, Math.round(((challenge.currentCount || 0) / challenge.targetCount) * 100)) : 0;
                  detail = `${challenge.currentCount || 0} / ${challenge.targetCount} ${challenge.unit}`;
                } else if (challenge.goalType === 'milestones' && challenge.milestones?.length) {
                  const done = challenge.milestones.filter((m) => m.completed).length;
                  p = Math.round((done / challenge.milestones.length) * 100);
                  detail = `${done} / ${challenge.milestones.length} hitos`;
                }

                return (
                  <div key={challenge.id} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white tracking-tight truncate max-w-[220px]">
                        {challenge.title}
                      </span>
                      <span data-tabular="true" className="font-mono text-amber-400 font-bold">
                        {p}% <span className="text-neutral-500 font-normal">({detail})</span>
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${p}%`, backgroundColor: challenge.accentColor || '#f59e0b' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* People & Agent Assignments Workload */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Carga por Persona o Agente</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Tareas asignadas a colaboradores (informativo)
              </p>
            </div>
            <button
              onClick={() => onNavigateView('people')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
            >
              <span>Ver Colaboradores</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Self / Personal entry */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center text-xs font-bold font-mono">
                  YO
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Personal (Foco Propio)</span>
                  <span className="text-[10px] text-neutral-500">Ejecución directa por ti</span>
                </div>
              </div>

              <div className="text-right">
                <span data-tabular="true" className="text-xs font-mono font-bold text-white block">
                  {personalTasksCount} tareas
                </span>
                <span className="text-[10px] text-neutral-500">
                  {tasks.filter((t) => t.assignedTo === null && t.status !== 'done').length} activas
                </span>
              </div>
            </div>

            {/* Registered people/agents */}
            {people.map((person) => {
              const assigned = tasks.filter((t) => t.assignedTo === person.id);
              const pending = assigned.filter((t) => t.status !== 'done');

              return (
                <div key={person.id} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg text-neutral-950 flex items-center justify-center text-xs font-bold font-mono"
                      style={{ backgroundColor: person.avatarColor }}
                    >
                      {person.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block truncate max-w-[150px]">
                        {person.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 block truncate max-w-[150px]">
                        {person.role}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span data-tabular="true" className="text-xs font-mono font-bold text-sky-400 block">
                      {assigned.length} tareas
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {pending.length} pendientes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Critical Deadlines */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Próximas Tareas a Vencer</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Atención prioritaria para evitar retrasos
            </p>
          </div>
          <button
            onClick={() => onNavigateView('tasks')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
          >
            <span>Ver Todas</span>
          </button>
        </div>

        {upcomingDeadlines.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">
            No tienes tareas pendientes con fechas próximas. ¡Todo al día!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {upcomingDeadlines.map((task) => {
              const isOverdue = task.dueDate < todayStr;
              const assignee = people.find((p) => p.id === task.assignedTo);

              return (
                <div
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span data-tabular="true" className={`font-mono font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-neutral-400'}`}>
                      {task.dueDate} {isOverdue ? '(Vencida)' : ''}
                    </span>
                    <span className={`capitalize ${
                      task.priority === 'urgent' ? 'text-rose-400 font-bold' :
                      task.priority === 'high' ? 'text-amber-400' : 'text-neutral-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white tracking-tight line-clamp-1">
                    {task.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-900">
                    <span>{task.category}</span>
                    <span className="text-sky-300">
                      {assignee ? assignee.name : 'Personal'}
                    </span>
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
