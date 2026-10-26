import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { ScheduledCompanyAlert, UsefulProcedure } from '../../../types';
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Eye,
  Shield,
  Download,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const ModAlertas: React.FC = () => {
  const { role, currentEmployee, currentJefe } = useAuth();
  const {
    activeTenant,
    tenantData,
    addScheduledAlert,
    deleteScheduledAlert,
    acknowledgeScheduledAlert,
    addUsefulProcedure,
    deleteUsefulProcedure,
  } = useTenant();

  const alerts: ScheduledCompanyAlert[] = tenantData?.scheduledAlerts || [];
  const procedures: UsefulProcedure[] = tenantData?.usefulProcedures || [];

  const isJefeOrAdmin = role === 'admin' || role === 'superadmin' || role === 'jefe';
  const currentUserName = role === 'employee' ? currentEmployee?.name : role === 'jefe' ? (currentJefe?.name || 'Jefatura') : 'Administración';
  const currentUserId = role === 'employee' ? (currentEmployee?.legajo || 'emp') : (currentJefe?.id || 'admin');

  // Find full profile for collaborator to resolve area
  const currentEmployeeProfile = tenantData?.employees?.find(
    (e) => currentEmployee?.legajo && e.legajo.toLowerCase() === currentEmployee.legajo.toLowerCase()
  );

  const [activeTab, setActiveTab] = useState<'alerts' | 'procedures'>('alerts');

  // Form states: Alert
  const [showNewAlertModal, setShowNewAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertDate, setAlertDate] = useState(new Date().toISOString().split('T')[0]);
  const [alertTime, setAlertTime] = useState('09:00');
  const [alertTargetAudience, setAlertTargetAudience] = useState<'all' | 'sector' | 'specific_users'>('all');
  const [alertTargetSector, setAlertTargetSector] = useState('');
  const [alertTargetLegajo, setAlertTargetLegajo] = useState('');
  const [alertRequiresAck, setAlertRequiresAck] = useState(true);
  const [alertPriority, setAlertPriority] = useState<'normal' | 'alta' | 'urgente'>('normal');

  // Form states: Procedure
  const [showNewProcModal, setShowNewProcModal] = useState(false);
  const [procTitle, setProcTitle] = useState('');
  const [procCategory, setProcCategory] = useState('');
  const [procSector, setProcSector] = useState('');
  const [procDescription, setProcDescription] = useState('');
  const [procSteps, setProcSteps] = useState<string[]>(['', '', '']);
  const [expandedProcId, setExpandedProcId] = useState<string | null>(null);

  // Filter alerts based on role and target audience
  const visibleAlerts = alerts.filter((alert) => {
    if (role === 'employee') {
      if (alert.targetAudience === 'all') return true;
      if (alert.targetAudience === 'sector') {
        const empArea = currentEmployeeProfile?.area || '';
        return alert.targetSector?.toLowerCase() === empArea.toLowerCase();
      }
      if (alert.targetAudience === 'specific_users') {
        return alert.targetRecipients?.some(
          (r) => r.legajo?.toLowerCase() === currentEmployee?.legajo?.toLowerCase()
        );
      }
      return false;
    }
    return true;
  });

  // Create Alert handler
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    addScheduledAlert({
      title: alertTitle,
      message: alertMessage,
      scheduledDate: alertDate,
      scheduledTime: alertTime,
      targetAudience: alertTargetAudience,
      targetSector: alertTargetAudience === 'sector' ? alertTargetSector : undefined,
      targetRecipients:
        alertTargetAudience === 'specific_users' && alertTargetLegajo
          ? [{ legajo: alertTargetLegajo, role: 'employee' }]
          : undefined,
      requiresAck: alertRequiresAck,
      acknowledgedBy: [],
      priority: alertPriority,
      createdBy: currentUserName,
    });

    setAlertTitle('');
    setAlertMessage('');
    setAlertTargetLegajo('');
    setShowNewAlertModal(false);
  };

  // Create Procedure handler
  const handleCreateProc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procTitle.trim() || !procDescription.trim()) return;

    addUsefulProcedure({
      title: procTitle,
      category: procCategory || 'General',
      sector: procSector || 'Todos los Sectores',
      description: procDescription,
      steps: procSteps.filter((s) => s.trim().length > 0),
      createdBy: currentUserName,
    });

    setProcTitle('');
    setProcCategory('');
    setProcSector('');
    setProcDescription('');
    setProcSteps(['', '', '']);
    setShowNewProcModal(false);
  };

  const handleStepChange = (index: number, val: string) => {
    const updated = [...procSteps];
    updated[index] = val;
    setProcSteps(updated);
  };

  const addStepField = () => {
    setProcSteps([...procSteps, '']);
  };

  // Check if current user acknowledged
  const hasUserAck = (alert: ScheduledCompanyAlert) => {
    return alert.acknowledgedBy?.includes(currentUserId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Avisos Programados y Procedimientos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Notificaciones emergentes con confirmación de lectura y manuales de operaciones paso a paso.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'alerts' && isJefeOrAdmin && (
            <button
              onClick={() => setShowNewAlertModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-amber-600/30"
            >
              <Plus className="w-4 h-4" />
              Programar Nuevo Aviso
            </button>
          )}

          {activeTab === 'procedures' && isJefeOrAdmin && (
            <button
              onClick={() => setShowNewProcModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              Nuevo Procedimiento Útil
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'alerts'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Avisos de la Empresa ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('procedures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'procedures'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Procedimientos Útiles ({procedures.length})
        </button>
      </div>

      {/* Tab 1: Scheduled Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {visibleAlerts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No hay avisos para mostrar</h3>
              <p className="text-xs text-slate-400 mt-1">Los avisos programados por sector o individuales aparecerán aquí.</p>
            </div>
          ) : (
            visibleAlerts.map((alert) => {
              const acknowledged = hasUserAck(alert);
              const totalAcks = alert.acknowledgedBy?.length || 0;
              const individualRecipient = alert.targetRecipients?.[0]?.legajo
                ? tenantData.employees.find((e) => e.legajo === alert.targetRecipients?.[0]?.legajo)
                : null;

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    alert.priority === 'urgente'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : alert.priority === 'alta'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          alert.priority === 'urgente'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : alert.priority === 'alta'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {alert.priority}
                      </span>
                      <h3 className="text-base font-bold text-white">{alert.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {alert.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {alert.scheduledTime} hs
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {alert.targetAudience === 'all'
                          ? 'Toda la empresa'
                          : alert.targetAudience === 'sector'
                          ? `Sector: ${alert.targetSector}`
                          : `Individual: ${individualRecipient ? individualRecipient.name : 'Colaborador Específico'}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 py-3 leading-relaxed whitespace-pre-line">{alert.message}</p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>Programado por: {alert.createdBy}</span>
                      {alert.requiresAck && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          {totalAcks} colaboradores confirmaron lectura
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.requiresAck && (
                        <button
                          onClick={() => acknowledgeScheduledAlert(alert.id, currentUserId)}
                          disabled={acknowledged}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            acknowledged
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {acknowledged ? 'Lectura Confirmada' : 'Confirmar que he leído y acepto'}
                        </button>
                      )}

                      {isJefeOrAdmin && (
                        <button
                          onClick={() => deleteScheduledAlert(alert.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar aviso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Useful Procedures */}
      {activeTab === 'procedures' && (
        <div className="space-y-4">
          {procedures.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No hay procedimientos registrados</h3>
              <p className="text-xs text-slate-400 mt-1">
                Carga manuales de tareas y protocolos paso a paso para que el personal los tenga a mano.
              </p>
            </div>
          ) : (
            procedures.map((proc) => {
              const isExpanded = expandedProcId === proc.id;
              return (
                <div key={proc.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{proc.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {proc.category}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {proc.sector}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{proc.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedProcId(isExpanded ? null : proc.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? 'Ocultar Pasos' : `Ver ${proc.steps?.length || 0} Pasos`}
                      </button>

                      {isJefeOrAdmin && (
                        <button
                          onClick={() => deleteUsefulProcedure(proc.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar procedimiento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Step-by-Step */}
                  {isExpanded && (
                    <div className="mt-4 pt-2 space-y-2.5">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Protocolo Paso a Paso:
                      </h4>
                      {proc.steps?.map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-200 leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Autor / Supervisor: {proc.createdBy}</span>
                    <span>Actualizado recientemente</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: New Alert */}
      {showNewAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAlert}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg mb-2">
              <Bell className="w-5 h-5" />
              <span>Programar Aviso de Empresa</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Título del Comunicado *</label>
              <input
                type="text"
                required
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="Ej: Cambio de horario por feriado patrio"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mensaje del Comunicado *</label>
              <textarea
                rows={3}
                required
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Redactar el comunicado oficial..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Emisión</label>
                <input
                  type="date"
                  value={alertDate}
                  onChange={(e) => setAlertDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Hora Fijada</label>
                <input
                  type="time"
                  value={alertTime}
                  onChange={(e) => setAlertTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Prioridad</label>
                <select
                  value={alertPriority}
                  onChange={(e) => setAlertPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Destinatarios</label>
                <select
                  value={alertTargetAudience}
                  onChange={(e) => setAlertTargetAudience(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm cursor-pointer"
                >
                  <option value="all">Toda la empresa</option>
                  <option value="sector">Por Sector Específico</option>
                  <option value="specific_users">Individualizado por Colaborador</option>
                </select>
              </div>
            </div>

            {alertTargetAudience === 'sector' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sector Destinatario</label>
                <select
                  value={alertTargetSector}
                  onChange={(e) => setAlertTargetSector(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm cursor-pointer"
                  required
                >
                  <option value="">Selecciona un sector...</option>
                  {activeTenant.masterDropdowns.areas.map((a: string) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {alertTargetAudience === 'specific_users' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Colaborador Destinatario *
                </label>
                <select
                  value={alertTargetLegajo}
                  onChange={(e) => setAlertTargetLegajo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm cursor-pointer"
                  required
                >
                  <option value="">Selecciona un colaborador...</option>
                  {tenantData.employees.map((emp) => (
                    <option key={emp.id} value={emp.legajo}>
                      {emp.name} {emp.lastName} ({emp.legajo} · {emp.cargo} · {emp.area})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="reqAck"
                checked={alertRequiresAck}
                onChange={(e) => setAlertRequiresAck(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="reqAck" className="text-xs text-slate-300">
                Exigir confirmación obligatoria de lectura a cada colaborador al ingresar
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewAlertModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium shadow-md shadow-amber-600/30"
              >
                Guardar y Programar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Procedure */}
      {showNewProcModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProc}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-2 text-blue-400 font-bold text-lg mb-2">
              <BookOpen className="w-5 h-5" />
              <span>Nuevo Procedimiento / Manual de Tareas</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Título del Procedimiento *</label>
              <input
                type="text"
                required
                value={procTitle}
                onChange={(e) => setProcTitle(e.target.value)}
                placeholder="Ej: Protocolo de Apertura y Cierre de Local"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                <input
                  type="text"
                  value={procCategory}
                  onChange={(e) => setProcCategory(e.target.value)}
                  placeholder="Ej: Seguridad, Operaciones"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sector Aplicable</label>
                <input
                  type="text"
                  value={procSector}
                  onChange={(e) => setProcSector(e.target.value)}
                  placeholder="Ej: Cocina o Todos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Descripción General *</label>
              <textarea
                rows={2}
                required
                value={procDescription}
                onChange={(e) => setProcDescription(e.target.value)}
                placeholder="Resumen del objetivo del procedimiento..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm"
              />
            </div>

            {/* Steps list */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Pasos a Seguir (Paso a Paso)</label>
              <div className="space-y-2">
                {procSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-bold w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      placeholder={`Paso ${idx + 1}...`}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addStepField}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar otro paso
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewProcModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-600/30"
              >
                Guardar Procedimiento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
