import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { PayrollScale, PayStubItem } from '../../../types';
import {
  Calculator,
  FileSpreadsheet,
  Settings,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  ShieldAlert,
  Percent,
} from 'lucide-react';

export const ModLiquidacion: React.FC = () => {
  const { role } = useAuth();
  const { activeTenant, tenantData, updatePayrollScales, updateTenantData, addNotificationAlert } = useTenant();

  const [activeTab, setActiveTab] = useState<'sabana' | 'escalas' | 'generar'>('sabana');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Octubre 2026');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedSuccess, setGeneratedSuccess] = useState<boolean>(false);

  // Editable scales state
  const [scales, setScales] = useState<PayrollScale[]>(() => tenantData.payrollScales || []);

  const handleUpdateScaleField = (id: string, field: keyof PayrollScale, val: any) => {
    const updated = scales.map((s) => (s.id === id ? { ...s, [field]: val } : s));
    setScales(updated);
    updatePayrollScales(updated);
  };

  // Cross-reference data between employees, sacRows (novelties + advance deduction), and scales
  const employees = tenantData.employees.filter((e) => e.status === 'Activo');
  const sacRows = tenantData.sacRows || [];

  const previewPayrollRows = employees.map((emp) => {
    // Find matching salary scale by cargo or category
    const matchingScale =
      scales.find((s) => s.cargo === emp.cargo || s.category === emp.cargo) ||
      scales[0] || {
        basicSalary: 950000,
        seniorityPercentage: 1,
        attendancePercentage: 8.33,
        nightHourPercentage: 13.33,
        overtime50Percentage: 50,
        overtime100Percentage: 100,
        isOutOfAgreement: false,
      };

    // Find SAC novelties
    const sacData = sacRows.find((r) => r.legajo === emp.legajo);
    const basic = matchingScale.basicSalary;

    // Seniority calculation based on hireDate
    const hireYear = new Date(emp.hireDate || '2023-01-01').getFullYear();
    const currentYear = 2026;
    const seniorityYears = Math.max(0, currentYear - hireYear);
    const seniorityAmount = Math.round(basic * (matchingScale.seniorityPercentage / 100) * seniorityYears);

    // Presentismo (attendance bonus if no unexcused absences)
    const medicalDays = sacData?.licMedicaDias || 0;
    const artDays = sacData?.licARTDias || 0;
    const totalDaysOff = sacData?.totalDiasNoTrabajados || medicalDays + artDays;
    const attendanceAmount = totalDaysOff > 2 ? 0 : Math.round(basic * (matchingScale.attendancePercentage / 100));

    // Night hours & Overtime (only if overtime allowed by admin)
    const nightHours = sacData?.horasNocturnas || 0;
    const nightAmount = Math.round(nightHours * (basic / 200) * (matchingScale.nightHourPercentage / 100));

    const allowOvertime = activeTenant.branding.allowOvertimeCalculation || false;
    const overtimeAmount = allowOvertime ? 35000 : 0;

    // Gross Remunerative
    const grossAmount = basic + seniorityAmount + attendanceAmount + nightAmount + overtimeAmount;

    // Legal Deductions (Argentine Labor Law 20.744)
    const jubilacion = Math.round(grossAmount * 0.11); // SIPA 11%
    const inssjp = Math.round(grossAmount * 0.03); // Ley 19.032 3%
    const obraSocial = Math.round(grossAmount * 0.03); // Obra Social 3%
    const totalDeductions = jubilacion + inssjp + obraSocial;

    // Anticipos deduction directly from SAC column
    const anticiposDeduction = sacData?.anticipos || 0;

    // Net to pay
    const netAmount = Math.max(0, grossAmount - totalDeductions - anticiposDeduction);

    return {
      emp,
      scale: matchingScale,
      frequency: emp.payrollFrequency || 'Mensual',
      basic,
      seniorityYears,
      seniorityAmount,
      attendanceAmount,
      nightAmount,
      overtimeAmount,
      grossAmount,
      totalDeductions,
      anticiposDeduction,
      netAmount,
    };
  });

  const totalGross = previewPayrollRows.reduce((a, b) => a + b.grossAmount, 0);
  const totalDeductions = previewPayrollRows.reduce((a, b) => a + b.totalDeductions, 0);
  const totalAnticipos = previewPayrollRows.reduce((a, b) => a + b.anticiposDeduction, 0);
  const totalNet = previewPayrollRows.reduce((a, b) => a + b.netAmount, 0);

  // Execute Batch Generation and push to Mod13Recibos
  const handleExecutePayroll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const batchId = `batch-${Date.now()}`;
      const newPayStubs: PayStubItem[] = previewPayrollRows.map((row, idx) => ({
        id: `stub-${Date.now()}-${idx}`,
        batchId,
        period: selectedPeriod,
        employeeId: row.emp.id,
        employeeName: `${row.emp.name} ${row.emp.lastName}`,
        employeeLegajo: row.emp.legajo,
        cuil: row.emp.cuil,
        cargo: row.emp.cargo,
        area: row.emp.area,
        grossAmount: row.grossAmount,
        deductionsAmount: row.totalDeductions + row.anticiposDeduction,
        netAmount: row.netAmount,
        employerSigned: false,
        employeeSigned: false,
        conformityStatus: 'Pendiente',
        assignedSheetPage: idx + 1,
        issueDate: new Date().toISOString().split('T')[0],
      }));

      const newBatch = {
        id: batchId,
        period: selectedPeriod,
        totalReceipts: newPayStubs.length,
        uploadedAt: new Date().toISOString(),
        status: 'Verificación Pendiente' as const,
      };

      updateTenantData({
        payStubBatches: [newBatch, ...(tenantData.payStubBatches || [])],
        payStubs: [...newPayStubs, ...(tenantData.payStubs || [])],
      });

      addNotificationAlert({
        type: 'receipt_dispatch',
        title: `Liquidación Completada: ${selectedPeriod}`,
        description: `Se generaron ${newPayStubs.length} recibos de sueldo listos para la firma patronal y de colaboradores en el módulo de Recibos.`,
        urgency: 'informativa',
      });

      setIsProcessing(false);
      setGeneratedSuccess(true);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-indigo-400" />
            <span>Motor Contable de Liquidación de Sueldos</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Cálculo por convenio y ley, cruce automático con novedades SAC, deducción de anticipos y generación de recibos oficiales.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('sabana')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sabana' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sábana de Liquidación
          </button>
          <button
            onClick={() => setActiveTab('escalas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'escalas' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Escalas & Paritarias ({scales.length})
          </button>
          <button
            onClick={() => setActiveTab('generar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'generar' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ejecutar Cierre
          </button>
        </div>
      </div>

      {/* KPI Totals Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400">Masa Salarial Bruta</span>
          <div className="text-xl font-bold text-white mt-1">
            ${totalGross.toLocaleString('es-AR')}
          </div>
          <span className="text-[10px] text-zinc-500">{employees.length} colaboradores activos</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400">Retenciones Ley (17%)</span>
          <div className="text-xl font-bold text-rose-400 mt-1">
            -${totalDeductions.toLocaleString('es-AR')}
          </div>
          <span className="text-[10px] text-zinc-500">SIPA, INSSJP y Obra Social</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400">Anticipos Deducidos (SAC)</span>
          <div className="text-xl font-bold text-amber-400 mt-1">
            -${totalAnticipos.toLocaleString('es-AR')}
          </div>
          <span className="text-[10px] text-zinc-500">Descuento automático de solicitudes</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400">Neto Total a Transferir</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ${totalNet.toLocaleString('es-AR')}
          </div>
          <span className="text-[10px] text-emerald-500/80">Listos para acreditación bancaria</span>
        </div>
      </div>

      {/* TAB 1: SÁBANA DE LIQUIDACIÓN DETALLADA */}
      {activeTab === 'sabana' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Sábana Oficial de Sueldos por Convenio</h3>
              <p className="text-[11px] text-zinc-400">
                Alimentada automáticamente por la planilla de Novedades de Liquidación (SAC).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Período:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
              >
                <option value="Octubre 2026">Octubre 2026</option>
                <option value="Noviembre 2026">Noviembre 2026</option>
                <option value="Diciembre 2026">Diciembre 2026</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-semibold">
                  <th className="py-2.5 px-3">Legajo</th>
                  <th className="py-2.5 px-3">Colaborador</th>
                  <th className="py-2.5 px-3">Cargo / Categoría</th>
                  <th className="py-2.5 px-3">Frecuencia</th>
                  <th className="py-2.5 px-3 text-right">Básico</th>
                  <th className="py-2.5 px-3 text-right">Antigüedad</th>
                  <th className="py-2.5 px-3 text-right">Presentismo</th>
                  <th className="py-2.5 px-3 text-right">Bruto</th>
                  <th className="py-2.5 px-3 text-right">Retenciones</th>
                  <th className="py-2.5 px-3 text-right">Anticipos (SAC)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-emerald-400">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {previewPayrollRows.map((row) => (
                  <tr key={row.emp.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-indigo-400 font-bold">{row.emp.legajo}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {row.emp.name} {row.emp.lastName}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      <div>{row.emp.cargo}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{row.scale.category}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-medium">
                        {row.frequency}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                      ${row.basic.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                      +${row.seniorityAmount.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                      +${row.attendanceAmount.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      ${row.grossAmount.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                      -${row.totalDeductions.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      {row.anticiposDeduction > 0 ? `-$${row.anticiposDeduction.toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-400">
                      ${row.netAmount.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ESCALAS Y PARITARIAS POR CONVENIO */}
      {activeTab === 'escalas' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>Configuración de Escalas de Convenio y Conceptos</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Editables por el Admin y actualizables con 1 clic por el Agente de IA Legal al detectar paritarias homologadas.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {scales.map((scale) => (
              <div
                key={scale.id}
                className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                      {scale.agreementName}
                    </span>
                    <h4 className="text-sm font-bold text-white">{scale.category} · {scale.cargo}</h4>
                  </div>
                  {scale.isOutOfAgreement ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
                      Fuera de Convenio
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                      Bajo CCT Oficial
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Básico Categoría ($)</label>
                    <input
                      type="number"
                      value={scale.basicSalary}
                      onChange={(e) => handleUpdateScaleField(scale.id, 'basicSalary', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Antigüedad (% x año)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={scale.seniorityPercentage}
                      onChange={(e) => handleUpdateScaleField(scale.id, 'seniorityPercentage', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Presentismo (% CCT)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={scale.attendancePercentage}
                      onChange={(e) => handleUpdateScaleField(scale.id, 'attendancePercentage', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Nocturnidad (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={scale.nightHourPercentage}
                      onChange={(e) => handleUpdateScaleField(scale.id, 'nightHourPercentage', Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GENERAR RECIBOS OFICIALES */}
      {activeTab === 'generar' && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Ejecución y Cierre de Liquidación</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Al confirmar, los recibos de sueldo individuales con todos los conceptos por ley serán generados automáticamente en el módulo de Recibos para las firmas digitales.
            </p>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="text-xs font-semibold text-zinc-200">Resumen del Lote a Generar:</div>
            <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
              <li>Período de liquidación: <strong>{selectedPeriod}</strong></li>
              <li>Cantidad de recibos a emitir: <strong>{previewPayrollRows.length} recibos individuales</strong></li>
              <li>Descuento automático de anticipos aprobados: <strong>${totalAnticipos.toLocaleString('es-AR')}</strong></li>
              <li>Monto neto total a transferir: <strong>${totalNet.toLocaleString('es-AR')}</strong></li>
            </ul>
          </div>

          {generatedSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong>¡Recibos de Sueldo Generados Exitosamente!</strong>
                <p className="mt-0.5 opacity-90">
                  Ya están disponibles en el módulo <strong>Recibos de Sueldo (Mod 13)</strong> con doble firma patronal y de colaborador, descarga PDF y envío por correo.
                </p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleExecutePayroll}
              disabled={isProcessing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>{isProcessing ? 'Liquidando Sueldos...' : `Generar ${previewPayrollRows.length} Recibos de Sueldo`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
