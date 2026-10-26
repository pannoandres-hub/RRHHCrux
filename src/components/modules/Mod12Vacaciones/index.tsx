import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { VacationRequest, VacationConfig, EmployeeProfile } from '../../../types';
import {
  Palmtree,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Plus,
  Search,
  Printer,
  Download,
  Mail,
  Filter,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Mod12Vacaciones: React.FC = () => {
  const {
    activeTenant,
    tenantData,
    updateActiveTenant,
    requestVacation,
    approveVacation,
    addNotificationAlert,
  } = useTenant();
  const { role, currentEmployee, currentJefe } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isJefe = role === 'jefe';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'informe' | 'solicitudes' | 'configuracion'>(
    'informe'
  );

  // Search & Filters in Report
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpiringOnly, setFilterExpiringOnly] = useState(false);
  const [areaFilter, setAreaFilter] = useState('Todas');

  // Vacation Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqEmpLegajo, setReqEmpLegajo] = useState(currentEmployee.legajo || 'LEG-1045');
  const [reqEmpName, setReqEmpName] = useState(currentEmployee.name || 'Javier Domínguez');
  const [reqStartDate, setReqStartDate] = useState('2026-11-01');
  const [reqEndDate, setReqEndDate] = useState('2026-11-14');
  const [reqSuccessMsg, setReqSuccessMsg] = useState('');

  // Vacation Config Editor State (Admin)
  const currentVacConfig: VacationConfig = activeTenant.vacationConfig || {
    cycleStartDayMonth: '10-01',
    cycleExpiryDayMonth: '09-30',
    lessThanSixMonthsRatioDays: 20,
    scales: [
      { minYears: 0.5, maxYears: 5, daysGranted: 14 },
      { minYears: 5, maxYears: 10, daysGranted: 21 },
      { minYears: 10, maxYears: 20, daysGranted: 28 },
      { minYears: 20, maxYears: 99, daysGranted: 35 },
    ],
  };

  const [cfgStart, setCfgStart] = useState(currentVacConfig.cycleStartDayMonth);
  const [cfgExpiry, setCfgExpiry] = useState(currentVacConfig.cycleExpiryDayMonth);
  const [cfgRatio, setCfgRatio] = useState<number>(currentVacConfig.lessThanSixMonthsRatioDays);
  const [cfgScales, setCfgScales] = useState(currentVacConfig.scales);
  const [configSavedMsg, setConfigSavedMsg] = useState('');

  // Active Employees
  const activeEmployees = tenantData.employees.filter((e) => e.status === 'Activo');

  // Calculate seniority at Dec 31 of current year (e.g. 2026-12-31)
  const referenceDateDec31 = new Date('2026-12-31');

  const calculateEmployeeVacationDays = (hireDateStr: string) => {
    if (!hireDateStr) return { seniorityYears: 0, entitledDays: 14, isLessThanSixMonths: false };
    const hireDate = new Date(hireDateStr);
    const diffMs = referenceDateDec31.getTime() - hireDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const seniorityYears = diffDays / 365.25;

    // Less than 6 months check (< ~180 days)
    if (diffDays < 180) {
      // 1 day per cfgRatio worked days
      const daysEarned = Math.max(1, Math.floor(diffDays / (cfgRatio || 20)));
      return {
        seniorityYears: Math.round(seniorityYears * 10) / 10,
        entitledDays: daysEarned,
        isLessThanSixMonths: true,
      };
    }

    // Match scales
    for (const rule of cfgScales) {
      if (seniorityYears >= rule.minYears && seniorityYears < rule.maxYears) {
        return {
          seniorityYears: Math.round(seniorityYears * 10) / 10,
          entitledDays: rule.daysGranted,
          isLessThanSixMonths: false,
        };
      }
    }

    return {
      seniorityYears: Math.round(seniorityYears * 10) / 10,
      entitledDays: 35,
      isLessThanSixMonths: false,
    };
  };

  // Compile Vacation Report rows
  interface VacationRow {
    employee: EmployeeProfile;
    seniorityYears: number;
    entitledDays: number;
    daysTaken: number;
    remainingDays: number;
    isExpiringSoon: boolean;
    isLessThanSixMonths: boolean;
  }

  const vacationReportRows: VacationRow[] = activeEmployees.map((emp) => {
    const { seniorityYears, entitledDays, isLessThanSixMonths } = calculateEmployeeVacationDays(
      emp.hireDate
    );

    // Count approved days taken in current cycle
    const approvedRequests = tenantData.vacationRequests.filter(
      (r) => (r.employeeId === emp.id || r.employeeLegajo === emp.legajo) && r.status === 'Aprobado'
    );
    const daysTaken = approvedRequests.reduce((sum, r) => sum + r.daysRequested, 0);
    const remainingDays = Math.max(0, entitledDays - daysTaken);

    // Expiring soon: has remaining days and cycle expiry is near (Sept 30)
    const isExpiringSoon = remainingDays > 0;

    return {
      employee: emp,
      seniorityYears,
      entitledDays,
      daysTaken,
      remainingDays,
      isExpiringSoon,
      isLessThanSixMonths,
    };
  });

  // Filter report rows
  const filteredReport = vacationReportRows.filter((row) => {
    if (areaFilter !== 'Todas' && row.employee.area !== areaFilter) return false;
    if (filterExpiringOnly && !row.isExpiringSoon) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${row.employee.name} ${row.employee.lastName}`.toLowerCase().includes(q);
      const matchLegajo = row.employee.legajo.toLowerCase().includes(q);
      return matchName || matchLegajo;
    }
    return true;
  });

  // Total metric summaries
  const totalEmployeesWithPendingVac = vacationReportRows.filter((r) => r.remainingDays > 0).length;
  const totalDaysPendingGov = vacationReportRows.reduce((acc, r) => acc + r.remainingDays, 0);

  // Submit Vacation Request
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(reqStartDate);
    const end = new Date(reqEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (end < start) {
      alert('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    const emp = activeEmployees.find((e) => e.legajo === reqEmpLegajo) || activeEmployees[0];

    requestVacation({
      employeeId: emp?.id || 'emp-1',
      employeeLegajo: reqEmpLegajo,
      employeeName: reqEmpName,
      startDate: reqStartDate,
      endDate: reqEndDate,
      daysRequested: days,
      cycleYear: 2026,
    });

    setIsRequestModalOpen(false);
    setReqSuccessMsg(`¡Solicitud por ${days} días registrada con éxito! Pendiente de aprobación.`);
    setTimeout(() => setReqSuccessMsg(''), 5000);
  };

  // Save Vacation Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveTenant({
      vacationConfig: {
        cycleStartDayMonth: cfgStart,
        cycleExpiryDayMonth: cfgExpiry,
        lessThanSixMonthsRatioDays: cfgRatio,
        scales: cfgScales,
      },
    });

    setConfigSavedMsg('¡Configuración del ciclo vacacional guardada correctamente para esta empresa!');
    setTimeout(() => setConfigSavedMsg(''), 4000);
  };

  // Send automated email reminder to employee
  const handleNotifyEmployee = (row: VacationRow) => {
    const recipient = row.employee.email;
    const body = `Estimado/a ${row.employee.name},\n\nLe recordamos que posee un saldo de ${row.remainingDays} días de vacaciones pendientes del ciclo anterior que vencen el ${cfgExpiry}.\nPor favor ingrese a NexusHR OS para programar su solicitud antes del cierre del ciclo.\n\nÁrea de Recursos Humanos\n${activeTenant.name}`;
    window.location.href = `mailto:${recipient}?subject=Aviso Preventivo: Días de Vacaciones Pendientes de Goce&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Palmtree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.vacaciones || 'Vacaciones & Licencias'}
            </h2>
            <p className="text-xs text-zinc-400">
              Cálculo de antigüedad al 31/12, informe preventivo de vencimiento ({cfgExpiry}) y circuito de solicitudes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Solicitar Vacaciones</span>
          </button>
        </div>
      </div>

      {reqSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{reqSuccessMsg}</span>
        </div>
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Colaboradores c/ Saldo Pendiente
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">
            {totalEmployeesWithPendingVac}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Debe gozarse antes del {cfgExpiry}</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Total Días Pendientes de Goce
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{totalDaysPendingGov}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Días acumulados en nómina</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Ciclo Vacacional Anual
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-400 font-mono">
            {cfgStart} al {cfgExpiry}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">Parametrizado por empresa</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Menos de 6 meses
          </div>
          <div className="mt-2 text-lg font-bold text-indigo-400 font-mono">
            1 día c/ {cfgRatio} trabajados
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Proporcional de ley editable</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('informe')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'informe'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Informe Preventivo de Vencimiento ({filteredReport.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'solicitudes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Solicitudes & Aprobaciones ({tenantData.vacationRequests.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('configuracion')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'configuracion'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración de Ciclo & Escalas</span>
          </button>
        )}
      </div>

      {/* TAB 1: INFORME PREVENTIVO DE VACACIONES */}
      {activeTab === 'informe' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por colaborador o legajo..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                <option value="Todas">Sector: Todos</option>
                {activeTenant.masterDropdowns.areas.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button
                onClick={() => setFilterExpiringOnly(!filterExpiringOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  filterExpiringOnly
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Solo con Saldo Pendiente</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Informe Oficial de Antigüedad y Vencimiento del Ciclo</span>
              <span className="text-[11px] text-amber-400 font-mono">
                Límite de goce: {cfgExpiry}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Legajo & Colaborador</th>
                    <th className="px-4 py-3">Área / Sector</th>
                    <th className="px-4 py-3">Fecha Ingreso</th>
                    <th className="px-4 py-3 text-center">Antigüedad al 31/12</th>
                    <th className="px-4 py-3 text-center">Días Asignados</th>
                    <th className="px-4 py-3 text-center">Gozados</th>
                    <th className="px-4 py-3 text-center">Saldo Pendiente</th>
                    <th className="px-4 py-3">Estado de Vencimiento</th>
                    <th className="px-4 py-3 text-right">Aviso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredReport.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">
                          {row.employee.name} {row.employee.lastName}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400">
                          {row.employee.legajo} · {row.employee.cargo}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {row.employee.area}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-400">
                        {row.employee.hireDate}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium text-zinc-200">
                        {row.seniorityYears} años
                        {row.isLessThanSixMonths && (
                          <span className="block text-[9px] text-indigo-400">&lt;6 meses</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {row.entitledDays} d
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-zinc-400">
                        {row.daysTaken} d
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            row.remainingDays > 0
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {row.remainingDays} días
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.remainingDays > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-medium flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vence {cfgExpiry}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ciclo Completado</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.remainingDays > 0 && (
                          <button
                            onClick={() => handleNotifyEmployee(row)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] flex items-center gap-1 ml-auto transition-colors"
                            title="Notificar por email al colaborador"
                          >
                            <Mail className="w-3 h-3 text-amber-400" />
                            <span>Avisar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredReport.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No se encontraron registros para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOLICITUDES & APROBACIONES */}
      {activeTab === 'solicitudes' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Historial de Solicitudes de Vacaciones ({tenantData.vacationRequests.length})
              </span>
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Solicitud</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-4 py-3">Legajo</th>
                    <th className="px-4 py-3">Desde</th>
                    <th className="px-4 py-3">Hasta</th>
                    <th className="px-4 py-3 text-center">Días</th>
                    <th className="px-4 py-3">Ciclo</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {tenantData.vacationRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{req.employeeName}</td>
                      <td className="px-4 py-3 font-mono text-zinc-400">{req.employeeLegajo}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{req.startDate}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{req.endDate}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {req.daysRequested}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-400">{req.cycleYear}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            req.status === 'Aprobado'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : req.status === 'Rechazado'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(isAdmin || isJefe) && req.status === 'Pendiente' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approveVacation(req.id, role === 'admin' ? 'Administración RRHH' : 'Jefatura')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition-colors"
                            >
                              Aprobar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500">
                            {req.approvedBy ? `Aprobó: ${req.approvedBy}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {tenantData.vacationRequests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No hay solicitudes de vacaciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURACIÓN DEL CICLO VACACIONAL (ADMIN) */}
      {activeTab === 'configuracion' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Parámetros del Ciclo Vacacional y Escalas de Antigüedad
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Configura las fechas límite de caducidad para alertas y las reglas de devengamiento según antigüedad al 31 de diciembre.
            </p>
          </div>

          {configSavedMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{configSavedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Inicio de Ciclo (Día y Mes)</label>
                <input
                  type="text"
                  value={cfgStart}
                  onChange={(e) => setCfgStart(e.target.value)}
                  placeholder="10-01 (1 de Octubre)"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Por defecto: 10-01</span>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Vencimiento del Ciclo Anterior</label>
                <input
                  type="text"
                  value={cfgExpiry}
                  onChange={(e) => setCfgExpiry(e.target.value)}
                  placeholder="09-30 (30 de Septiembre)"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Por defecto: 09-30</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-zinc-400 mb-1 font-semibold">
                Regla para Colaboradores con Menos de 6 Meses de Antigüedad
              </label>
              <div className="flex items-center gap-2">
                <span className="text-zinc-300">1 día de vacaciones cada</span>
                <input
                  type="number"
                  value={cfgRatio}
                  onChange={(e) => setCfgRatio(Number(e.target.value))}
                  min={5}
                  max={60}
                  className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white font-mono text-center"
                />
                <span className="text-zinc-300">días trabajados (editable por empresa).</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-zinc-200">Escalas de Ley & Política de Empresa (Antigüedad al 31/12)</h4>
                  <p className="text-[10px] text-zinc-400">
                    Modifica los rangos de años o días según cambios de convenio colectivo o ley laboral.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCfgScales([
                      ...cfgScales,
                      { minYears: 20, maxYears: 99, daysGranted: 40 },
                    ])
                  }
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar Tramo</span>
                </button>
              </div>

              <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px]">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-zinc-500 uppercase pb-1 border-b border-zinc-800">
                  <div className="col-span-3">Desde (Años)</div>
                  <div className="col-span-3">Hasta (Años)</div>
                  <div className="col-span-4">Días Concedidos</div>
                  <div className="col-span-2 text-right">Quitar</div>
                </div>

                {cfgScales.map((scale, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        value={scale.minYears}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCfgScales(
                            cfgScales.map((s, i) => (i === idx ? { ...s, minYears: val } : s))
                          );
                        }}
                        className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white font-mono text-center text-xs"
                      />
                      <span className="text-zinc-500 text-[10px]">a</span>
                    </div>

                    <div className="col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        value={scale.maxYears}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCfgScales(
                            cfgScales.map((s, i) => (i === idx ? { ...s, maxYears: val } : s))
                          );
                        }}
                        className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white font-mono text-center text-xs"
                      />
                      <span className="text-zinc-500 text-[10px]">años</span>
                    </div>

                    <div className="col-span-4 flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={scale.daysGranted}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCfgScales(
                            cfgScales.map((s, i) => (i === idx ? { ...s, daysGranted: val } : s))
                          );
                        }}
                        className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-emerald-400 font-mono font-bold text-center text-xs"
                      />
                      <span className="text-zinc-300 text-[11px]">días corridos</span>
                    </div>

                    <div className="col-span-2 text-right">
                      {cfgScales.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCfgScales(cfgScales.filter((_, i) => i !== idx))}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded cursor-pointer"
                          title="Eliminar tramo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: SOLICITUD DE VACACIONES */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <Palmtree className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-white">Solicitar Período de Vacaciones</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador Solicitante</label>
                <select
                  value={reqEmpLegajo}
                  onChange={(e) => {
                    const l = e.target.value;
                    setReqEmpLegajo(l);
                    const emp = activeEmployees.find((x) => x.legajo === l);
                    if (emp) setReqEmpName(`${emp.name} ${emp.lastName}`);
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.legajo}>
                      {emp.legajo} - {emp.name} {emp.lastName} ({emp.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={reqStartDate}
                    onChange={(e) => setReqStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Fecha de Finalización</label>
                  <input
                    type="date"
                    value={reqEndDate}
                    onChange={(e) => setReqEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Confirmar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
