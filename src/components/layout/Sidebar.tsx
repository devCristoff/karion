import React from 'react';
import { 
  BarChart3,
  Trophy, 
  CheckSquare, 
  Grid2x2, 
  Kanban, 
  Users,
  X,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';
import { AppView, User } from '../../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  pendingTasksCount: number;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  pendingTasksCount,
  currentUser,
  onLogout,
}) => {
  // Navigation items with Dashboard as the first item
  const navItems: { id: AppView; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
    { id: 'challenges', label: 'Retos Mensuales', icon: <Trophy className="w-5 h-5 shrink-0" /> },
    { id: 'eisenhower', label: 'Matriz Eisenhower', icon: <Grid2x2 className="w-5 h-5 shrink-0" /> },
    { id: 'kanban', label: 'Tablero Kanban', icon: <Kanban className="w-5 h-5 shrink-0" /> },
    { id: 'tasks', label: 'Lista To-Do', icon: <CheckSquare className="w-5 h-5 shrink-0" />, count: pendingTasksCount },
    { id: 'people', label: 'Personas & Agentes', icon: <Users className="w-5 h-5 shrink-0" /> },
  ];

  const handleItemClick = (id: AppView) => {
    onViewChange(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-neutral-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-neutral-950 border-r border-neutral-800 flex flex-col transition-all duration-200 ease-in-out ${
          // Mobile state
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop collapsed state
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Brand Lockup & Top Toggle */}
        <div className={`h-16 border-b border-neutral-800 flex items-center px-4 ${
          isCollapsed ? 'justify-center lg:px-2' : 'justify-between'
        }`}>
          <button 
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none group overflow-hidden"
            title="Ir al Dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black text-sm shadow-sm shadow-amber-500/20 shrink-0">
              K
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors truncate">
                Kairon
              </span>
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'text-amber-300 bg-neutral-900 border border-neutral-800 shadow-inner'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
              >
                <div className={`${isActive ? 'text-amber-400' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
                  {item.icon}
                </div>

                {(!isCollapsed || isMobileOpen) ? (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span 
                        data-tabular="true"
                        className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700/60"
                      >
                        {item.count}
                      </span>
                    )}
                  </>
                ) : (
                  // Collapsed badge indicator
                  typeof item.count === 'number' && item.count > 0 && (
                    <span 
                      className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-neutral-950"
                      title={`${item.count} pendientes`}
                    />
                  )
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-neutral-800/80 space-y-2">
          {/* User Profile Badge */}
          {currentUser && (
            <div className={`p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-2.5 ${
              isCollapsed && !isMobileOpen ? 'justify-center p-1.5' : 'justify-between'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                  title={`${currentUser.name} (${currentUser.email})`}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-200 truncate leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate leading-tight font-mono">
                      {currentUser.email}
                    </p>
                  </div>
                )}
              </div>

              {(!isCollapsed || isMobileOpen) ? (
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          )}

          {/* Logout button when collapsed */}
          {isCollapsed && !isMobileOpen && currentUser && (
            <button
              onClick={onLogout}
              className="hidden lg:flex w-full items-center justify-center py-2 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-900 transition-colors"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Collapsed expand toggle button on desktop */}
          {isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-full items-center justify-center py-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
              title="Expandir barra lateral"
              aria-label="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
