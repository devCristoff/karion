export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type EisenhowerQuadrant = 'q1' | 'q2' | 'q3' | 'q4';

export type PersonType = 'person' | 'agent' | 'family' | 'service' | 'colleague';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Person {
  id: string;
  userId?: string;
  name: string;
  type: PersonType;
  role: string;
  avatarColor: string;
  contactInfo?: string;
  notes?: string;
  createdAt: string;
}

export type ChallengeGoalType = 'daily_habit' | 'numeric_target' | 'milestones';
export type ChallengeStatus = 'active' | 'completed' | 'paused' | 'failed';

export interface ChallengeMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface MonthlyChallenge {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  targetMonth: string; // YYYY-MM (e.g. "2026-10")
  goalType: ChallengeGoalType;
  // For daily_habit:
  targetDays?: number; // e.g., 25 days out of 31
  completedDates?: string[]; // ['2026-10-01', '2026-10-02', ...]
  // For numeric_target:
  targetCount?: number; // e.g. 150
  currentCount?: number; // e.g. 45
  unit?: string; // e.g. "páginas", "km", "horas"
  // For milestones:
  milestones?: ChallengeMilestone[];
  status: ChallengeStatus;
  accentColor?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  urgent: boolean;
  important: boolean;
  assignedTo: string | null; // Person.id or null (Personal)
  challengeId: string | null; // MonthlyChallenge.id or null
  tags: string[];
  estimatedMinutes?: number;
  completedAt: string | null;
  createdAt: string;
}

export type AppView = 'dashboard' | 'challenges' | 'tasks' | 'eisenhower' | 'kanban' | 'people';

export function getQuadrant(urgent: boolean, important: boolean): EisenhowerQuadrant {
  if (urgent && important) return 'q1';
  if (!urgent && important) return 'q2';
  if (urgent && !important) return 'q3';
  return 'q4';
}

export const QUADRANT_INFO: Record<EisenhowerQuadrant, {
  id: EisenhowerQuadrant;
  name: string;
  subtitle: string;
  action: string;
  colorName: string;
  borderColor: string;
  bgTint: string;
  textColor: string;
  badgeBg: string;
  description: string;
}> = {
  q1: {
    id: 'q1',
    name: 'Hacer Primero',
    subtitle: 'Urgente e Importante',
    action: 'Crisis, fechas límite inmediatas y problemas apremiantes',
    colorName: 'rose',
    borderColor: 'border-rose-500/40',
    bgTint: 'bg-rose-950/10',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    description: 'Atiende estas tareas hoy mismo para evitar cuellos de botella.',
  },
  q2: {
    id: 'q2',
    name: 'Planificar & Agendar',
    subtitle: 'No Urgente pero Importante',
    action: 'Crecimiento estratégico, desarrollo personal, prevención',
    colorName: 'amber',
    borderColor: 'border-amber-500/40',
    bgTint: 'bg-amber-950/10',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    description: 'El cuadrante del éxito a largo plazo. Bloquea tiempo para avanzar sin prisas.',
  },
  q3: {
    id: 'q3',
    name: 'Delegar & Asignar',
    subtitle: 'Urgente pero No Importante',
    action: 'Interrupciones, recados operativos y tareas para otros',
    colorName: 'sky',
    borderColor: 'border-sky-500/40',
    bgTint: 'bg-sky-950/10',
    textColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    description: 'Asígnalas a personas o agentes colaboradores para proteger tu foco.',
  },
  q4: {
    id: 'q4',
    name: 'Eliminar o Postergar',
    subtitle: 'Ni Urgente Ni Importante',
    action: 'Distracciones, tareas de escape y micro-detalles irrelevantes',
    colorName: 'neutral',
    borderColor: 'border-neutral-700/60',
    bgTint: 'bg-neutral-900/30',
    textColor: 'text-neutral-400',
    badgeBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    description: 'Cuestiona si realmente aportan valor o bórralas sin remordimiento.',
  },
};
