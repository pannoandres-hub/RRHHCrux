import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { AIAgentConfig, AIAgentReport } from '../../../types';
import {
  Bot,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Key,
  Calendar,
  Layers,
  ArrowRight,
  Sliders,
  Bell
} from 'lucide-react';

export const ModAgenteIA: React.FC = () => {
  const { role } = useAuth();
  const { tenantData, updateAIAgentConfig, runAIAgentAudit, applyAIAgentReportScales } = useTenant();

  const config: AIAgentConfig = tenantData?.aiAgentConfig || {
    enabled: true,
    prompt:
      'Monitorear Boletín Oficial y acuerdos de paritarias vigentes (UOCRA, Comercio, Gastronómicos, Sanidad). Identificar aumentos obligatorios de salarios básicos, adicionales de convenio y modificaciones en topes indemnizatorios o cargas sociales.',
    scheduledTime: '08:00',
    frequency: 'daily',
    portableApiKey: '',
    lastRunAt: new Date().toISOString(),
    status: 'idle',
  };

  const reports: AIAgentReport[] = tenantData?.aiAgentReports || [];

  const [promptInput, setPromptInput] = useState(config.prompt);
  const [scheduledTimeInput, setScheduledTimeInput] = useState(config.scheduledTime);
  const [apiKeyInput, setApiKeyInput] = useState(config.portableApiKey || '');
  const [isRunning, setIsRunning] = useState(false);
  const [filterAgreement, setFilterAgreement] = useState<string>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isAdmin = role === 'admin' || role === 'superadmin';

  const handleSaveConfig = () => {
    updateAIAgentConfig({
      prompt: promptInput,
      scheduledTime: scheduledTimeInput,
      portableApiKey: apiKeyInput,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRunAudit = () => {
    setIsRunning(true);
    setTimeout(() => {
      runAIAgentAudit();
      setIsRunning(false);
    }, 1200);
  };

  const handleApplyReport = (reportId: string) => {
    applyAIAgentReportScales(reportId);
  };

  const filteredReports = reports.filter((r) => {
    if (filterAgreement === 'all') return true;
    return r.agreementName ? r.agreementName.toLowerCase().includes(filterAgreement.toLowerCase()) : true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-indigo-900/40 border border-violet-500/30 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/20">
            <Bot className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Agente IA de Convenios y Leyes</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Portable (Vercel, Bolt, Lovable)
              </span>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Monitoreo diario programado del Boletín Oficial, aumentos de paritarias y sugerencias automáticas de actualización salarial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAudit}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Auditoría en Progreso...' : 'Auditar Convenios Ahora'}
          </button>
        </div>
      </div>

      {/* Main Grid: Config + Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Card (Admin Only) */}
        <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-violet-400 font-semibold text-sm uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>Configuración del Agente</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span>Horario de Chequeo Automático</span>
                  <span className="text-slate-500">Formato 24h</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="time"
                    value={scheduledTimeInput}
                    disabled={!isAdmin}
                    onChange={(e) => setScheduledTimeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Se ejecuta todos los días a las {scheduledTimeInput} hs para alertar al inicio de jornada.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                  <span>Prompt de Instrucción para IA</span>
                  <span className="text-violet-400 text-xs">Editable</span>
                </label>
                <textarea
                  rows={4}
                  value={promptInput}
                  disabled={!isAdmin}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
                  placeholder="Instrucciones para el análisis..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>API Key Portabilidad (Opcional)</span>
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  disabled={!isAdmin}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-... o Gemini API Key (Funciona en demo si se deja vacío)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Si no se ingresa clave, el agente corre en modo motor heurístico simulado de alta precisión.
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              {saveSuccess && (
                <div className="mb-2 p-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Configuración guardada exitosamente
                </div>
              )}
              <button
                onClick={handleSaveConfig}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-slate-700"
              >
                Guardar Criterios del Agente
              </button>
            </div>
          )}
        </div>

        {/* Right: Agent Status & Audit Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Estado del Motor
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Vigilancia Activa
              </div>
              <p className="text-xs text-slate-500 mt-1">Frecuencia: Diaria a las {config.scheduledTime} hs</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <Clock className="w-4 h-4 text-violet-400" />
                Última Ejecución
              </div>
              <div className="text-base font-bold text-white truncate">
                {config.lastRunAt ? new Date(config.lastRunAt).toLocaleDateString() : 'Pendiente'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {config.lastRunAt ? new Date(config.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sin registro'}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Novedades Detectadas
              </div>
              <div className="text-lg font-bold text-amber-300">
                {reports.filter((r) => r.status === 'pending_review').length} Pendientes
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {reports.filter((r) => r.status === 'applied').length} Aplicadas a escalas
              </p>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h2 className="text-base font-bold text-white">Historial de Reportes y Modificaciones Sugeridas</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Convenio:</span>
                <select
                  value={filterAgreement}
                  onChange={(e) => setFilterAgreement(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
                >
                  <option value="all">Todos los convenios</option>
                  <option value="Comercio">Comercio (CCT 130/75)</option>
                  <option value="UOCRA">UOCRA (CCT 76/75)</option>
                  <option value="Gastronómicos">Gastronómicos (UTHGRA)</option>
                  <option value="Sanidad">Sanidad</option>
                </select>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <Bot className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No hay reportes de auditoría en este filtro.</p>
                <p className="text-xs text-slate-500 mt-1">Presiona "Auditar Convenios Ahora" para lanzar el chequeo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-xl border transition-all ${
                      report.status === 'applied'
                        ? 'bg-slate-950/40 border-slate-800/80 opacity-80'
                        : 'bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/20 border-violet-500/30 shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{report.agreementName}</span>
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {report.bulletinNumber}
                          </span>
                          {report.status === 'applied' ? (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Aplicado a Escalas
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Requiere Aprobación
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Fecha de publicación: {report.publishDate ? new Date(report.publishDate).toLocaleDateString() : 'Oficial'} • Vigencia desde:{' '}
                          <strong className="text-slate-300">{report.effectiveMonth || 'Inmediata'}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Aumento homologado</span>
                        <span className="text-base font-bold text-violet-300">+{report.increasePercent}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 py-3 leading-relaxed">{report.summary}</p>

                    {/* Proposed changes table / preview */}
                    {report.proposedChanges && report.proposedChanges.length > 0 && (
                      <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 mb-3 overflow-x-auto">
                        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-violet-400" />
                          <span>Impacto en Categorías Salariales:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {report.proposedChanges.map((change, idx) => (
                            <div key={idx} className="bg-slate-900/90 border border-slate-800 p-2 rounded text-xs">
                              <span className="text-slate-300 font-medium block truncate">{change.category}</span>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                                <span className="text-slate-500 line-through">${change.currentBase.toLocaleString()}</span>
                                <ArrowRight className="w-3 h-3 text-violet-400" />
                                <span className="text-emerald-400 font-bold">${change.proposedBase.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-xs">
                      <div className="text-slate-500">
                        {report.appliedAt ? (
                          <span>Aplicado por administración el {new Date(report.appliedAt).toLocaleString()}</span>
                        ) : (
                          <span>El cambio actualizará automáticamente la tabla de Escalas Salariales de la empresa.</span>
                        )}
                      </div>

                      {isAdmin && report.status === 'pending_review' && (
                        <button
                          onClick={() => handleApplyReport(report.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aplicar Actualización a Escalas Salariales
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
