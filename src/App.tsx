import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ChallengeList } from './components/challenges/ChallengeList';
import { ChallengeModal } from './components/challenges/ChallengeModal';
import { TodoList } from './components/tasks/TodoList';
import { TaskModal } from './components/tasks/TaskModal';
import { EisenhowerMatrix } from './components/eisenhower/EisenhowerMatrix';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { PeopleManager } from './components/people/PeopleManager';
import { PersonModal } from './components/people/PersonModal';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { AuthView } from './components/auth/AuthView';
import { storageService } from './services/storage';
import { authService } from './services/auth';
import { 
  AppView, 
  Task, 
  MonthlyChallenge, 
  Person, 
  EisenhowerQuadrant, 
  TaskStatus,
  User 
} from './types';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCachedUser());
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // First page is Dashboard as requested
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  
  // Sidebar collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Primary datasets
  const [tasks, setTasks] = useState<Task[]>([]);
  const [challenges, setChallenges] = useState<MonthlyChallenge[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialQuadrant, setInitialQuadrant] = useState<EisenhowerQuadrant | null>(null);
  const [initialStatus, setInitialStatus] = useState<TaskStatus | null>(null);

  // Challenge modal state
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<MonthlyChallenge | null>(null);

  // Person modal state
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Navigation filter helper
  const [selectedChallengeFilter, setSelectedChallengeFilter] = useState<string | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Load initial data for the current user
  const refreshAllData = async () => {
    // 1. Instant synchronous load from local user-scoped cache
    setTasks(storageService.getTasks());
    setChallenges(storageService.getChallenges());
    setPeople(storageService.getPeople());

    // 2. Fetch latest data from server SQLite via Bearer token
    const serverData = await storageService.fetchFromServer();
    if (serverData) {
      setTasks(serverData.tasks);
      setChallenges(serverData.challenges);
      setPeople(serverData.people);
    }
  };

  // Check active session on mount
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const user = await authService.fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
          await refreshAllData();
        } else {
          setCurrentUser(null);
          setTasks([]);
          setChallenges([]);
          setPeople([]);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthAndLoad();
  }, []);

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    showToast(`¡Bienvenido a Kairon, ${user.name}!`);
    await refreshAllData();
  };

  const handleLogout = async () => {
    if (window.confirm('¿Seguro que deseas cerrar la sesión?')) {
      await authService.logout();
      setCurrentUser(null);
      setTasks([]);
      setChallenges([]);
      setPeople([]);
      showToast('Has cerrado la sesión.');
    }
  };

  // Save tasks and sync
  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    storageService.saveTasks(newTasks);
  };

  // Save challenges and sync
  const updateChallenges = (newChallenges: MonthlyChallenge[]) => {
    setChallenges(newChallenges);
    storageService.saveChallenges(newChallenges);
  };

  // Save people and sync
  const updatePeople = (newPeople: Person[]) => {
    setPeople(newPeople);
    storageService.savePeople(newPeople);
  };

  // -------------------------------------------------------------
  // Task Handlers
  // -------------------------------------------------------------
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      const updated = tasks.map((t) =>
        t.id === existingId
          ? { ...t, ...taskData }
          : t
      );
      updateTasks(updated);
      showToast('Tarea actualizada con éxito.');
    } else {
      const newTask: Task = {
        ...taskData,
        id: `t-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      updateTasks([newTask, ...tasks]);
      showToast('Nueva tarea creada correctamente.');
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const isNowDone = t.status !== 'done';
        return {
          ...t,
          status: isNowDone ? ('done' as TaskStatus) : ('todo' as TaskStatus),
          completedAt: isNowDone ? new Date().toISOString() : null,
        };
      }
      return t;
    });
    updateTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarea?')) {
      updateTasks(tasks.filter((t) => t.id !== taskId));
      showToast('Tarea eliminada.');
    }
  };

  const handleMoveTaskQuadrant = (taskId: string, targetQuadrant: EisenhowerQuadrant) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        let urgent = t.urgent;
        let important = t.important;
        if (targetQuadrant === 'q1') {
          urgent = true;
          important = true;
        } else if (targetQuadrant === 'q2') {
          urgent = false;
          important = true;
        } else if (targetQuadrant === 'q3') {
          urgent = true;
          important = false;
        } else if (targetQuadrant === 'q4') {
          urgent = false;
          important = false;
        }
        return { ...t, urgent, important };
      }
      return t;
    });
    updateTasks(updated);
    showToast(`Tarea reasignada a cuadrante ${targetQuadrant.toUpperCase()}`);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'done' ? (t.completedAt || new Date().toISOString()) : null,
        };
      }
      return t;
    });
    updateTasks(updated);
  };

  const openNewTaskModal = (quadrant?: EisenhowerQuadrant, status?: TaskStatus) => {
    setEditingTask(null);
    setInitialQuadrant(quadrant || null);
    setInitialStatus(status || null);
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setInitialQuadrant(null);
    setInitialStatus(null);
    setTaskModalOpen(true);
  };

  // -------------------------------------------------------------
  // Challenge Handlers
  // -------------------------------------------------------------
  const handleSaveChallenge = (
    challengeData: Omit<MonthlyChallenge, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = challenges.map((c) =>
        c.id === existingId
          ? { ...c, ...challengeData }
          : c
      );
      updateChallenges(updated);
      showToast('Reto mensual actualizado.');
    } else {
      const newChallenge: MonthlyChallenge = {
        ...challengeData,
        id: `ch-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      updateChallenges([newChallenge, ...challenges]);
      showToast('Nuevo reto mensual programado.');
    }
  };

  const handleDeleteChallenge = (challengeId: string) => {
    if (window.confirm('¿Eliminar este reto mensual? Las tareas vinculadas continuarán existiendo.')) {
      updateChallenges(challenges.filter((c) => c.id !== challengeId));
      // Unlink tasks
      const updatedTasks = tasks.map((t) =>
        t.challengeId === challengeId ? { ...t, challengeId: null } : t
      );
      updateTasks(updatedTasks);
      showToast('Reto eliminado.');
    }
  };

  const handleToggleChallengeDate = (challengeId: string, dateStr: string) => {
    const updated = challenges.map((c) => {
      if (c.id === challengeId) {
        const currentDates = c.completedDates || [];
        const exists = currentDates.includes(dateStr);
        const newDates = exists
          ? currentDates.filter((d) => d !== dateStr)
          : [...currentDates, dateStr];
        return { ...c, completedDates: newDates };
      }
      return c;
    });
    updateChallenges(updated);
  };

  const handleUpdateNumericProgress = (challengeId: string, newCount: number) => {
    const updated = challenges.map((c) => {
      if (c.id === challengeId) {
        return { ...c, currentCount: newCount };
      }
      return c;
    });
    updateChallenges(updated);
  };

  const handleToggleMilestone = (challengeId: string, milestoneId: string) => {
    const updated = challenges.map((c) => {
      if (c.id === challengeId && c.milestones) {
        const updatedMilestones = c.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        return { ...c, milestones: updatedMilestones };
      }
      return c;
    });
    updateChallenges(updated);
  };

  // -------------------------------------------------------------
  // People & Agents Handlers
  // -------------------------------------------------------------
  const handleSavePerson = (
    personData: Omit<Person, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = people.map((p) =>
        p.id === existingId
          ? { ...p, ...personData }
          : p
      );
      updatePeople(updated);
      showToast('Datos de colaborador actualizados.');
    } else {
      const newPerson: Person = {
        ...personData,
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      updatePeople([...people, newPerson]);
      showToast('Colaborador o agente añadido con éxito.');
    }
  };

  const handleDeletePerson = (personId: string) => {
    const assignedCount = tasks.filter((t) => t.assignedTo === personId).length;
    let message = '¿Deseas eliminar a este colaborador?';
    if (assignedCount > 0) {
      message = `Este colaborador tiene ${assignedCount} tarea(s) asignada(s). Si lo eliminas, esas tareas pasarán a ser personales (sin asignar). ¿Continuar?`;
    }

    if (window.confirm(message)) {
      updatePeople(people.filter((p) => p.id !== personId));
      if (assignedCount > 0) {
        const updatedTasks = tasks.map((t) =>
          t.assignedTo === personId ? { ...t, assignedTo: null } : t
        );
        updateTasks(updatedTasks);
      }
      showToast('Colaborador eliminado.');
    }
  };

  const handleGoToTasksFromChallenge = (challengeId?: string) => {
    setSelectedChallengeFilter(challengeId || null);
    setCurrentView('tasks');
  };

  const pendingTasksCount = tasks.filter((t) => t.status !== 'done').length;

  // 1. Initial Authentication Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-400">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black text-xl shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          K
        </div>
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated: Render Secure Login/Register Screen
  if (!currentUser) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. Authenticated: Render Main Kairon Application
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Collapsible Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setSelectedChallengeFilter(null);
          setCurrentView(view);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingTasksCount={pendingTasksCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Area with Dynamic Margin for Sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Top Header with Hamburger toggle and contextual breadcrumb */}
        <TopHeader
          currentView={currentView}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen((prev) => !prev);
            } else {
              setIsSidebarCollapsed((prev) => !prev);
            }
          }}
          onNewTask={() => openNewTaskModal()}
          onNewChallenge={() => {
            setEditingChallenge(null);
            setChallengeModalOpen(true);
          }}
          onLogout={handleLogout}
        />

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentView === 'dashboard' && (
            <AnalyticsDashboard
              tasks={tasks}
              challenges={challenges}
              people={people}
              onNavigateView={(view) => {
                setSelectedChallengeFilter(null);
                setCurrentView(view);
              }}
              onEditTask={openEditTaskModal}
            />
          )}

          {currentView === 'challenges' && (
            <ChallengeList
              challenges={challenges}
              tasks={tasks}
              onToggleDate={handleToggleChallengeDate}
              onUpdateNumericProgress={handleUpdateNumericProgress}
              onToggleMilestone={handleToggleMilestone}
              onEditChallenge={(c) => {
                setEditingChallenge(c);
                setChallengeModalOpen(true);
              }}
              onDeleteChallenge={handleDeleteChallenge}
              onNewChallenge={() => {
                setEditingChallenge(null);
                setChallengeModalOpen(true);
              }}
              onGoToTasks={handleGoToTasksFromChallenge}
            />
          )}

          {currentView === 'tasks' && (
            <TodoList
              tasks={tasks}
              people={people}
              challenges={challenges}
              onToggleTaskComplete={handleToggleTaskComplete}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onNewTask={() => openNewTaskModal()}
              preselectedChallengeId={selectedChallengeFilter}
            />
          )}

          {currentView === 'eisenhower' && (
            <EisenhowerMatrix
              tasks={tasks}
              people={people}
              onToggleTaskComplete={handleToggleTaskComplete}
              onMoveTaskQuadrant={handleMoveTaskQuadrant}
              onEditTask={openEditTaskModal}
              onQuickAddTask={(quadrant) => openNewTaskModal(quadrant)}
            />
          )}

          {currentView === 'kanban' && (
            <KanbanBoard
              tasks={tasks}
              people={people}
              challenges={challenges}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onEditTask={openEditTaskModal}
              onQuickAddTask={(status) => openNewTaskModal(undefined, status)}
            />
          )}

          {currentView === 'people' && (
            <PeopleManager
              people={people}
              tasks={tasks}
              onNewPerson={() => {
                setEditingPerson(null);
                setPersonModalOpen(true);
              }}
              onEditPerson={(p) => {
                setEditingPerson(p);
                setPersonModalOpen(true);
              }}
              onDeletePerson={handleDeletePerson}
              onEditTask={openEditTaskModal}
              onToggleTaskComplete={handleToggleTaskComplete}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 border border-amber-500/40 text-neutral-200 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        people={people}
        challenges={challenges}
        initialQuadrant={initialQuadrant}
        initialStatus={initialStatus}
      />

      <ChallengeModal
        isOpen={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        onSave={handleSaveChallenge}
        editingChallenge={editingChallenge}
      />

      <PersonModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        onSave={handleSavePerson}
        editingPerson={editingPerson}
      />
    </div>
  );
}
