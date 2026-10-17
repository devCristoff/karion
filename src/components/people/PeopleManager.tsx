import React, { useState } from 'react';
import { 
  Users, 
  Edit3, 
  Trash2, 
  Bot, 
  User, 
  Heart, 
  Wrench, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Phone, 
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Person, PersonType, Task } from '../../types';

interface PeopleManagerProps {
  people: Person[];
  tasks: Task[];
  onNewPerson: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  onEditTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
}

export const PeopleManager: React.FC<PeopleManagerProps> = ({
  people,
  tasks,
  onNewPerson,
  onEditPerson,
  onDeletePerson,
  onEditTask,
  onToggleTaskComplete,
}) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const typeIcons: Record<PersonType, React.ReactNode> = {
    person: <User className="w-3.5 h-3.5" />,
    agent: <Bot className="w-3.5 h-3.5" />,
    family: <Heart className="w-3.5 h-3.5" />,
    service: <Wrench className="w-3.5 h-3.5" />,
    colleague: <Briefcase className="w-3.5 h-3.5" />,
  };

  const typeLabels: Record<PersonType, string> = {
    person: 'Persona / Amigo',
    agent: 'Agente IA',
    family: 'Familiar',
    service: 'Servicio / Técnico',
    colleague: 'Colega de Trabajo',
  };

  return (
    <div className="space-y-6">
      {/* Informative Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Personas & Agentes Asignados
            </h2>
            <span data-tabular="true" className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-neutral-950 text-neutral-300 border border-neutral-800">
              {people.length} registros
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Asignación <strong>informativa</strong> para tu control personal. Registra familiares (ej: Hermano), agentes virtuales de IA, técnicos o colegas para delegar y saber quién es responsable de cada encargo.
          </p>
        </div>

        <button
          onClick={onNewPerson}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm self-start md:self-auto"
        >
          <span>Nuevo Colaborador o Agente</span>
        </button>
      </div>

      {/* Grid of People */}
      {people.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40">
          <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No tienes colaboradores o agentes registrados</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Agrega a tu "Hermano", un "Agente IA", familiares o técnicos para asignarles tareas de forma informativa.
          </p>
          <button
            onClick={onNewPerson}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            <span>Agregar Primer Colaborador</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const assignedTasks = tasks.filter((t) => t.assignedTo === person.id);
            const pendingTasks = assignedTasks.filter((t) => t.status !== 'done');
            const completedTasks = assignedTasks.filter((t) => t.status === 'done');

            return (
              <div
                key={person.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Avatar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-neutral-950 font-mono shadow-sm"
                        style={{ backgroundColor: person.avatarColor || '#38bdf8' }}
                      >
                        {person.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {person.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
                          {typeIcons[person.type]}
                          <span>{typeLabels[person.type]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Edit/Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditPerson(person)}
                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                        title="Editar colaborador"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePerson(person.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Role / Parentesco */}
                  <div className="mt-3 text-xs text-neutral-300 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                    <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Rol / Función:</span>
                    <span className="font-medium text-neutral-200 mt-0.5 block">{person.role}</span>
                  </div>

                  {/* Contact / Notes */}
                  {(person.contactInfo || person.notes) && (
                    <div className="mt-2.5 space-y-1 text-[11px] text-neutral-400">
                      {person.contactInfo && (
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span className="truncate">{person.contactInfo}</span>
                        </div>
                      )}
                      {person.notes && (
                        <div className="flex items-start gap-1.5 text-neutral-400">
                          <FileText className="w-3 h-3 text-neutral-500 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{person.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Task Stats Footer & Ledger Open */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-neutral-400">
                      Tareas: <strong className="text-white font-mono">{assignedTasks.length}</strong>
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-amber-400 font-mono">{pendingTasks.length} activas</span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="text-emerald-400 font-mono">{completedTasks.length} hechas</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPerson(person)}
                    className="w-full py-1.5 px-3 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Ver Tareas Asignadas ({assignedTasks.length})</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Person Tasks Ledger Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-neutral-950 font-mono"
                  style={{ backgroundColor: selectedPerson.avatarColor || '#38bdf8' }}
                >
                  {selectedPerson.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Tareas asignadas a {selectedPerson.name}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {selectedPerson.role} ({typeLabels[selectedPerson.type]})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPerson(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* List of assigned tasks */}
            <div className="mt-4 space-y-2">
              {tasks.filter((t) => t.assignedTo === selectedPerson.id).length === 0 ? (
                <div className="py-8 text-center text-neutral-500 text-xs">
                  No hay tareas asignadas actualmente a {selectedPerson.name}.
                </div>
              ) : (
                tasks
                  .filter((t) => t.assignedTo === selectedPerson.id)
                  .map((task) => {
                    const isDone = task.status === 'done';
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => onToggleTaskComplete(task.id)}
                            className="text-neutral-500 hover:text-amber-400 transition-colors"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <span className={`text-xs font-semibold block truncate ${isDone ? 'line-through text-neutral-500' : 'text-white'}`}>
                              {task.title}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              Vence: <span className="font-mono">{task.dueDate}</span> · Estado: {task.status}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedPerson(null);
                            onEditTask(task);
                          }}
                          className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-900 rounded border border-neutral-800 shrink-0"
                        >
                          Ver / Editar
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setSelectedPerson(null)}
                className="px-4 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
