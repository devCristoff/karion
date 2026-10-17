import React from 'react';
import { 
  Menu, 
  Trophy, 
  BarChart3, 
  CheckSquare, 
  Grid2x2, 
  Kanban, 
  Users, 
  LogOut 
} from 'lucide-react';
import { AppView, User } from '../../types';

interface TopHeaderProps {
  currentView: AppView;
  onToggleSidebar: () => void;
  onNewTask: () => void;
  onNewChallenge: () => void;
  onLogout?: () => void;
}

const VIEW_TITLES: Record<AppView, { title: string; subtitle: string; icon: React.ReactNode }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Métricas de productividad y balance general',
    icon: <BarChart3 className="w-4 h-4 text-amber-400" />,
  },
  challenges: {
    title: 'Retos Mensuales',
    subtitle: 'Constancia de hábitos y objetivos mensuales',
    icon: <Trophy className="w-4 h-4 text-amber-400" />,
  },
  tasks: {
    title: 'Lista To-Do',
    subtitle: 'Gestión detallada con filtros y estados',
    icon: <CheckSquare className="w-4 h-4 text-amber-400" />,
  },
  eisenhower: {
    title: 'Matriz de Eisenhower',
    subtitle: 'Priorización por urgencia e importancia',
    icon: <Grid2x2 className="w-4 h-4 text-amber-400" />,
  },
  kanban: {
    title: 'Tablero Kanban',
    subtitle: 'Flujo de trabajo por columnas de estado',
    icon: <Kanban className="w-4 h-4 text-amber-400" />,
  },
  people: {
    title: 'Personas & Agentes',
    subtitle: 'Asignación informativa de responsabilidades',
    icon: <Users className="w-4 h-4 text-sky-400" />,
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentView,
  onToggleSidebar,
  onNewTask,
  onNewChallenge,
  onLogout,
}) => {
  const viewInfo = VIEW_TITLES[currentView];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Hamburger menu toggle + Contextual title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
          title="Alternar barra lateral"
          aria-label="Abrir o colapsar menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            {viewInfo.icon}
            <span>{viewInfo.title}</span>
          </span>
          <span className="hidden md:inline-block text-xs text-neutral-400 border-l border-neutral-800 pl-2">
            {viewInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChallenge}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 hover:text-white rounded-lg border border-neutral-700/80 transition-all shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Nuevo Reto</span>
        </button>

        <button
          onClick={onNewTask}
          className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-all shadow-sm shadow-amber-500/20"
        >
          <span>Nueva Tarea</span>
        </button>
      </div>
    </header>
  );
};
