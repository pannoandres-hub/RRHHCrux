import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { TaskItem } from '../../../types';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Filter,
  CheckCircle2,
  User,
  Users,
  Search,
  Check
} from 'lucide-react';

export const ModTareas: React.FC = () => {
  const { role, currentEmployee, currentJefe } = useAuth();
  const { tenantData, addTaskItem, toggleTaskItem, deleteTaskItem } = useTenant();

  const tasks: TaskItem[] = tenantData?.taskItems || [];
  const employees = tenantData?.employees || [];

  const [activeTab, setActiveTab] = useState<'my_tasks' | 'team_tasks' | 'new_task'>('my_tasks');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [dueDate, setDueDate] = useState('');
  const [sector, setSector] = useState('');

  const isJefeOrAdmin = role === 'admin' || role === 'superadmin' || role === 'jefe';

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedToId) return;

    const assignedEmp = employees.find((emp) => emp.legajo === assignedToId || emp.id === assignedToId);

    addTaskItem({
      title,
      description,
      assignedToId: assignedEmp?.legajo || assignedToId,
      assignedToName: assignedEmp ? `${assignedEmp.name} ${assignedEmp.lastName || ''}`.trim() : 'Colaborador',
      assignedToLegajos: [assignedEmp?.legajo || assignedToId],
      assignedById: role === 'jefe' ? (currentJefe?.name || 'Jefatura') : 'Administración',
      assignedByName: role === 'jefe' ? (currentJefe?.name || 'Jefatura') : 'Administración',
      priority,
      dueDate,
      status: 'pending',
      sector: sector || assignedEmp?.area || 'General',
    });

    setTitle('');
    setDescription('');
    setAssignedToId('');
    setDueDate('');
    setActiveTab('team_tasks');
  };

  const myEmployeeLegajo = currentEmployee?.legajo || '';
  const myTasks = tasks.filter(
    (t) =>
      t.assignedToId === myEmployeeLegajo ||
      (t.assignedToLegajos && t.assignedToLegajos.includes(myEmployeeLegajo)) ||
      (currentEmployee?.name && t.assignedToName?.includes(currentEmployee.name))
  );
  const displayedTasks = activeTab === 'my_tasks' ? myTasks : tasks;

  const filteredTasks = displayedTasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus === 'pending' && t.status !== 'pending') return false;
    if (filterStatus === 'completed' && t.status !== 'completed') return false;
    if (
      searchTerm &&
      !t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(t.assignedToName && t.assignedToName.toLowerCase().includes(searchTerm.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const totalTasks = displayedTasks.length;
  const completedTasks = displayedTasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Tareas y Objetivos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Asignación por sector, seguimiento de avances y checklist interactivo para el personal.
            </p>
          </div>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-xl">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Cumplimiento General</span>
            <span className="text-lg font-bold text-emerald-400">{progressPercent}%</span>
          </div>
          <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my_tasks')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'my_tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Mis Tareas Asignadas ({myTasks.length})
          </button>

          {isJefeOrAdmin && (
            <button
              onClick={() => setActiveTab('team_tasks')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'team_tasks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Control de Todo el Equipo ({tasks.length})
            </button>
          )}

          {isJefeOrAdmin && (
            <button
              onClick={() => setActiveTab('new_task')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'new_task'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              Nueva Tarea
            </button>
          )}
        </div>

        {/* Filters */}
        {activeTab !== 'new_task' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">Todas las prioridades</option>
              <option value="alta">Prioridad Alta</option>
              <option value="media">Prioridad Media</option>
              <option value="baja">Prioridad Baja</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab: New Task Form */}
      {activeTab === 'new_task' && isJefeOrAdmin && (
        <form onSubmit={handleCreateTask} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-md max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base mb-2">
            <Plus className="w-5 h-5" />
            <span>Crear y Asignar Nueva Tarea</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Título de la Tarea / Objetivo *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Revisar stock de cámaras frigoríficas y registrar merma"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descripción / Instrucciones Detalladas</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre cómo ejecutar la tarea, estándares requeridos o enlaces..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Asignar a Colaborador *</label>
              <select
                required
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar colaborador...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.legajo}>
                    {emp.name} {emp.lastName || ''} ({emp.cargo || 'General'} - {emp.area || 'Sin sector'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta (Crítica)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fecha Límite (Opcional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Sector Responsable</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ej: Cocina, Mantenimiento, Ventas"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('team_tasks')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-600/30"
            >
              Guardar y Asignar Tarea
            </button>
          </div>
        </form>
      )}

      {/* Task List (My tasks or Team tasks) */}
      {activeTab !== 'new_task' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
              <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No hay tareas pendientes en esta vista</h3>
              <p className="text-xs text-slate-400 mt-1">Todas las tareas están al día o no coinciden con los filtros.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => toggleTaskItem(task.id)}
                      className="mt-1 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isCompleted ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            task.priority === 'alta'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : task.priority === 'media'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {task.sector && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                            {task.sector}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className={`text-xs ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          Asignada a: <strong className="text-slate-300">{task.assignedToName}</strong>
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Límite: <strong className="text-slate-300">{task.dueDate}</strong>
                          </span>
                        )}
                        <span>Por: {task.assignedByName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => toggleTaskItem(task.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        isCompleted
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isCompleted ? 'Reabrir Tarea' : 'Completar'}
                    </button>

                    {isJefeOrAdmin && (
                      <button
                        onClick={() => deleteTaskItem(task.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
