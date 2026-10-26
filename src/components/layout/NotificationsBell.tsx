import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  Mail,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const NotificationsBell: React.FC = () => {
  const { tenantData, updateTenantData, activeTenant } = useTenant();
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Filter unresolved alerts
  const unresolvedAlerts = tenantData.alerts.filter((a) => !a.resolved);
  const totalCount = unresolvedAlerts.length;

  const handleResolveAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tenantData.alerts.map((a) => (a.id === id ? { ...a, resolved: true } : a));
    updateTenantData({ alerts: updated });
  };

  const handleResolveAll = () => {
    const updated = tenantData.alerts.map((a) => ({ ...a, resolved: true }));
    updateTenantData({ alerts: updated });
  };

  const handleResendEmail = (alertId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const mailto = `mailto:${encodeURIComponent(
      activeTenant.branding.adminNotificationEmails || 'rrhh@empresa.com'
    )}?subject=${encodeURIComponent(`[ALERTA AUTOMÁTICA RRHH] ${title}`)}&body=${encodeURIComponent(
      `Alerta generada por el sistema NexusHR OS:\n\n${title}\nFecha: ${new Date().toLocaleString()}\nEmpresa: ${activeTenant.name}`
    )}`;
    window.location.href = mailto;
  };

  // Only show to Admin & SuperAdmin
  if (role !== 'admin' && role !== 'superadmin') return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
        title="Centro de Alertas y Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden text-zinc-100 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-white">Alertas Operativas ({totalCount})</span>
            </div>
            {totalCount > 0 && (
              <button
                onClick={handleResolveAll}
                className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Marcar todas resueltas
              </button>
            )}
          </div>

          <div className="p-2 text-[10px] bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 flex items-center justify-between">
            <span className="truncate">Auto-Email a: {activeTenant.branding.adminNotificationEmails || 'rrhh@empresa.com'}</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/80">
            {unresolvedAlerts.length > 0 ? (
              unresolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 hover:bg-zinc-800/40 transition-colors space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alert.urgency === 'critica'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : alert.urgency === 'alta'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{alert.date}</span>
                  </div>

                  <h5 className="font-semibold text-zinc-200 text-xs">{alert.title}</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{alert.description}</p>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="truncate">Email enviado: {alert.autoEmailDispatchedTo}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleResendEmail(alert.id, alert.title, e)}
                        title="Reenviar aviso por mail"
                        className="text-zinc-400 hover:text-indigo-400 p-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleResolveAlert(alert.id, e)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-emerald-600/30 text-zinc-300 hover:text-emerald-300 text-[10px] transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Resolver</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-zinc-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                <span>No hay alertas operativas pendientes de resolución.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
