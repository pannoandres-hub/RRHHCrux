import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { PayStubItem, PayStubBatch } from '../../../types';
import { SignaturePad } from '../../common/SignaturePad';
import {
  FileCheck2,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Filter,
  PenTool,
  Printer,
  ShieldCheck,
  KeyRound,
  Eye,
  X,
  FileWarning,
  Mail,
  UserCheck,
  Check,
  Layers,
} from 'lucide-react';

export const Mod13Recibos: React.FC = () => {
  const {
    activeTenant,
    tenantData,
    signEmployeePayStub,
    signEmployerPayStubsBatch,
    addPayStubBatch,
    addNotificationAlert,
  } = useTenant();
  const { role, currentEmployee, currentJefe } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isJefe = role === 'jefe';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'registro' | 'sabana' | 'firmar'>(
    isAdmin ? 'registro' : 'firmar'
  );

  // Period Filter
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Septiembre 2026');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Collaborator Self-service State (Portal de Firma)
  const [passcode, setPasscode] = useState(currentEmployee.legajo ? `REC-${currentEmployee.legajo.replace(/[^0-9]/g, '')}` : 'REC-1045');
  const [activeStubForEmployee, setActiveStubForEmployee] = useState<PayStubItem | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [isDisconformity, setIsDisconformity] = useState(false);
  const [disconformityReason, setDisconformityReason] = useState('');

  // Admin Employer Batch Signing Modal
  const [isEmployerPadOpen, setIsEmployerPadOpen] = useState(false);
  const [employerSignatureImg, setEmployerSignatureImg] = useState<string | null>(null);

  // Admin Upload Batch Simulation State
  const [newBatchPeriod, setNewBatchPeriod] = useState('Octubre 2026');
  const [simulatedBatchUploaded, setSimulatedBatchUploaded] = useState(false);
  const [batchSuccessNotice, setBatchSuccessNotice] = useState('');

  // PayStub Viewer Modal
  const [viewingStub, setViewingStub] = useState<PayStubItem | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string>('');

  // Paystubs list
  const payStubs = tenantData.payStubs || [];

  // Filtered pay stubs for live audit table
  const filteredPayStubs = payStubs.filter((ps) => {
    if (isJefe && currentJefe && activeTab === 'registro') {
      if (ps.area?.toLowerCase() !== currentJefe.sector?.toLowerCase()) return false;
    }
    if (selectedPeriod !== 'Todos' && ps.period !== selectedPeriod) return false;
    if (statusFilter !== 'Todos' && ps.conformityStatus !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ps.employeeName.toLowerCase().includes(q);
      const matchLegajo = ps.employeeLegajo.toLowerCase().includes(q);
      return matchName || matchLegajo;
    }
    return true;
  });

  // Calculate live audit statistics
  const currentPeriodStubs = payStubs.filter((ps) => {
    if (isJefe && currentJefe) {
      if (ps.area?.toLowerCase() !== currentJefe.sector?.toLowerCase()) return false;
    }
    return selectedPeriod === 'Todos' ? true : ps.period === selectedPeriod;
  });
  const totalCount = currentPeriodStubs.length;
  const conformesCount = currentPeriodStubs.filter((ps) => ps.conformityStatus === 'Conforme').length;
  const disconformesCount = currentPeriodStubs.filter((ps) => ps.conformityStatus === 'Disconforme').length;
  const pendientesCount = currentPeriodStubs.filter((ps) => ps.conformityStatus === 'Pendiente').length;
  const completionPercentage = totalCount > 0 ? Math.round((conformesCount / totalCount) * 100) : 0;

  // Overdue check (15 and 30 days pending signature)
  const isOverdue15Days = (issueDate: string) => {
    if (!issueDate) return false;
    const diff = Math.floor(
      (new Date('2026-10-15').getTime() - new Date(issueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff >= 15;
  };

  const isOverdue30Days = (issueDate: string) => {
    if (!issueDate) return false;
    const diff = Math.floor(
      (new Date('2026-10-15').getTime() - new Date(issueDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff >= 30;
  };

  // Check if collaborator has blocked new receipts because older ones are unsigned (>30 days)
  const hasOlderBlockedReceipts = (empLegajo: string, currentIssueDate: string) => {
    return payStubs.some(
      (ps) =>
        ps.employeeLegajo === empLegajo &&
        ps.conformityStatus === 'Pendiente' &&
        ps.issueDate < currentIssueDate &&
        isOverdue30Days(ps.issueDate)
    );
  };

  // Look up pay stubs by passcode for employee/jefe view or fallback to current profile
  const employeeFound =
    (passcode.trim() && tenantData.employees.find((e) => e.receiptPasscode === passcode.trim())) ||
    (isJefe && currentJefe
      ? tenantData.employees.find((e) => e.name.toLowerCase().includes(currentJefe.name.toLowerCase().split(' ')[0])) ||
        tenantData.employees.find((e) => e.area.toLowerCase() === currentJefe.sector.toLowerCase() && (e.cargo.toLowerCase().includes('jefe') || e.cargo.toLowerCase().includes('supervisor')))
      : tenantData.employees.find((e) => e.legajo === currentEmployee?.legajo)) ||
    tenantData.employees[0];

  const employeePayStubs = employeeFound
    ? payStubs.filter((ps) => ps.employeeLegajo === employeeFound.legajo || ps.employeeId === employeeFound.id)
    : [];

  // Handlers
  const handleEmployerSignatureSave = (dataUrl: string) => {
    setEmployerSignatureImg(dataUrl);
    setIsEmployerPadOpen(false);

    // Apply employer signature to all odd pages for current period
    const batch = tenantData.payStubBatches.find((b) => b.period === selectedPeriod);
    if (batch) {
      signEmployerPayStubsBatch(batch.id, dataUrl);
    } else if (tenantData.payStubBatches[0]) {
      signEmployerPayStubsBatch(tenantData.payStubBatches[0].id, dataUrl);
    }

    alert('¡Firma del Empleador estampada con éxito en todas las páginas impares de la sábana!');
  };

  const handleStartEmployeeSigning = (stub: PayStubItem, disconform: boolean) => {
    // Check if blocked by previous 30-day unsigned receipt
    if (hasOlderBlockedReceipts(stub.employeeLegajo, stub.issueDate)) {
      alert(
        'ACCESO BLOQUEADO: Tienes recibos de sueldo de períodos anteriores con más de 30 días sin firmar.\n' +
        'Por normativa laboral debes firmar primero los recibos más antiguos para habilitar este período.'
      );
      return;
    }

    setActiveStubForEmployee(stub);
    setIsDisconformity(disconform);
    setDisconformityReason('');
    setIsSigningModalOpen(true);
  };

  const handleEmployeeSignatureSave = (signatureDataUrl: string) => {
    if (!activeStubForEmployee) return;

    if (isDisconformity && !disconformityReason.trim()) {
      alert('Debes ingresar obligatoriamente el motivo de la firma en disconformidad.');
      return;
    }

    const conformityStatus = isDisconformity ? 'Disconforme' : 'Conforme';

    signEmployeePayStub(
      activeStubForEmployee.id,
      conformityStatus,
      signatureDataUrl,
      isDisconformity ? disconformityReason.trim() : undefined
    );

    setIsSigningModalOpen(false);
    setActiveStubForEmployee(null);

    if (isDisconformity) {
      alert(
        '¡Firma en Disconformidad registrada!\n' +
        'Se generó una alerta inmediata en RRHH y se despachó el email automático correspondiente con tu observación.'
      );
    } else {
      alert('¡Recibo de sueldo firmado en conformidad correctamente! Puedes descargar tu copia en PDF o enviarlo a tu correo.');
    }
  };

  const handleDownloadPayStub = (stub: PayStubItem) => {
    const jubilacion = Math.round(stub.grossAmount * 0.11);
    const ley19032 = Math.round(stub.grossAmount * 0.03);
    const obraSocial = Math.round(stub.grossAmount * 0.03);
    const totalDescuentos = jubilacion + ley19032 + obraSocial;
    const neto = stub.netAmount;

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Recibo Oficial de Haberes - ${stub.employeeName} - ${stub.period}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #111; }
    .header { border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company { font-size: 20px; font-weight: bold; }
    .subtitle { font-size: 12px; color: #555; }
    .doc-title { text-align: right; }
    .doc-title h2 { margin: 0; font-size: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-bottom: 18px; background: #f8f9fa; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th { background: #e9ecef; border: 1px solid #ced4da; padding: 8px; text-align: left; }
    td { border: 1px solid #dee2e6; padding: 8px; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; background: #f1f3f5; font-size: 13px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px; }
    .sig-box { border: 1px dashed #666; border-radius: 6px; padding: 12px; text-align: center; min-height: 110px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
    .sig-img { max-height: 60px; max-width: 180px; object-fit: contain; }
    .legal-footer { font-size: 10px; color: #666; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 8px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${activeTenant.branding.name || activeTenant.name}</div>
      <div class="subtitle">CUIT: 30-71458921-9 · Razón Social Oficial</div>
    </div>
    <div class="doc-title">
      <h2>RECIBO DE HABERES</h2>
      <div class="subtitle">Período: <strong>${stub.period}</strong> · Hoja: ${stub.assignedSheetPage} (Art. 140 Ley 20.744)</div>
    </div>
  </div>

  <div class="meta-grid">
    <div><strong>Colaborador:</strong> ${stub.employeeName}</div>
    <div><strong>Legajo:</strong> ${stub.employeeLegajo}</div>
    <div><strong>CUIL:</strong> ${stub.cuil}</div>
    <div><strong>Cargo / Función:</strong> ${stub.cargo}</div>
    <div><strong>Área / Sector:</strong> ${stub.area}</div>
    <div><strong>Fecha de Liquidación:</strong> ${stub.issueDate}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Concepto</th>
        <th class="text-right">Haberes con Aporte</th>
        <th class="text-right">Descuentos</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Sueldo Básico de Convenio</td>
        <td class="text-right">$${stub.grossAmount.toLocaleString('es-AR')}</td>
        <td class="text-right">—</td>
      </tr>
      <tr>
        <td>Aporte Jubilatorio SIPA (11%)</td>
        <td class="text-right">—</td>
        <td class="text-right">$${jubilacion.toLocaleString('es-AR')}</td>
      </tr>
      <tr>
        <td>Ley 19.032 INSSJP (3%)</td>
        <td class="text-right">—</td>
        <td class="text-right">$${ley19032.toLocaleString('es-AR')}</td>
      </tr>
      <tr>
        <td>Obra Social Sindical (3%)</td>
        <td class="text-right">—</td>
        <td class="text-right">$${obraSocial.toLocaleString('es-AR')}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>TOTALES:</td>
        <td class="text-right">$${stub.grossAmount.toLocaleString('es-AR')}</td>
        <td class="text-right">$${totalDescuentos.toLocaleString('es-AR')}</td>
      </tr>
      <tr class="total-row" style="background: #e6fcf5; color: #087f5b; font-size: 14px;">
        <td>NETO A PERCIBIR:</td>
        <td colspan="2" class="text-right">$${neto.toLocaleString('es-AR')}</td>
      </tr>
    </tfoot>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">Firma Empleador (Página Impar Sábana)</div>
      ${
        stub.employerSignatureDataUrl
          ? `<img src="${stub.employerSignatureDataUrl}" class="sig-img" alt="Firma Empleador" />`
          : stub.employerSigned
          ? `<div style="color: #087f5b; font-weight: bold; font-size: 11px;">[FIRMA DIGITAL PATRONAL VERIFICADA]</div>`
          : `<div style="color: #888; font-size: 11px;">Pendiente de suscripción patronal</div>`
      }
      <div style="font-size: 10px; color: #555;">Representante Legal RRHH · CUIT Patronal</div>
    </div>

    <div class="sig-box">
      <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">
        Firma Colaborador (${stub.conformityStatus})
      </div>
      ${
        stub.employeeSignatureDataUrl
          ? `<img src="${stub.employeeSignatureDataUrl}" class="sig-img" alt="Firma Colaborador" />`
          : stub.employeeSigned
          ? `<div style="color: ${stub.conformityStatus === 'Disconforme' ? '#c92a2a' : '#087f5b'}; font-weight: bold; font-size: 11px;">[${stub.conformityStatus === 'Disconforme' ? 'FIRMA EN DISCONFORMIDAD' : 'FIRMA EN CONFORMIDAD'}]</div>`
          : `<div style="color: #888; font-size: 11px;">Pendiente de firma del trabajador</div>`
      }
      <div style="font-size: 10px; color: #555;">${stub.employeeName} (Legajo: ${stub.employeeLegajo})</div>
    </div>
  </div>

  <div class="legal-footer">
    Documento oficial generado bajo el sistema NexusHR OS conforme a la Ley de Contrato de Trabajo N° 20.744 y resoluciones de firma digital laboral.
    ${stub.employeeSignedAt ? `Fecha y hora de suscripción del empleado: ${new Date(stub.employeeSignedAt).toLocaleString('es-AR')}.` : ''}
    ${stub.disconformityReason ? `<br><strong style="color: red;">Observación en disconformidad:</strong> ${stub.disconformityReason}` : ''}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recibo_${stub.period.replace(/\\s+/g, '_')}_${stub.employeeLegajo}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendPayStubEmail = (stub: PayStubItem) => {
    const emp = tenantData.employees.find((e) => e.legajo === stub.employeeLegajo || e.id === stub.employeeId);
    const targetEmail = emp?.email || `${stub.employeeLegajo.toLowerCase()}@empresa.com`;

    addNotificationAlert({
      type: 'receipt_dispatch',
      title: `Recibo de Haberes Despachado por Email - ${stub.period}`,
      description: `Se envió una copia digital oficial del recibo de haberes a ${targetEmail} para ${stub.employeeName} (${stub.employeeLegajo}).`,
      targetId: stub.employeeId,
      targetName: stub.employeeName,
      urgency: 'informativa',
    });

    setEmailSentNotice(`¡Recibo de haberes despachado con éxito a ${targetEmail}!`);
    setTimeout(() => setEmailSentNotice(''), 6000);

    const subject = encodeURIComponent(`Recibo de Sueldo Oficial - ${stub.period} - ${stub.employeeName}`);
    const body = encodeURIComponent(
      `Estimado/a ${stub.employeeName},\n\n` +
      `Te enviamos la constancia de tu recibo de haberes correspondiente a ${stub.period}.\n\n` +
      `• Monto Neto a Percibir: $${stub.netAmount.toLocaleString('es-AR')}\n` +
      `• Estado de Firma Digital: ${stub.employeeSigned ? stub.conformityStatus : 'Pendiente'}\n` +
      `• Hoja de Sábana: ${stub.assignedSheetPage}\n\n` +
      `Puedes descargarlo e imprimirlo en cualquier momento desde tu Portal de Empleados NexusHR.\n\n` +
      `Atentamente,\nRecursos Humanos - ${activeTenant.branding.name || activeTenant.name}`
    );
    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSimulateBatchUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const batchId = `batch-${newBatchPeriod.replace(' ', '-').toLowerCase()}`;

    // Generate pay stubs for all active employees
    const generatedStubs = tenantData.employees
      .filter((e) => e.status === 'Activo')
      .map((emp, idx) => ({
        period: newBatchPeriod,
        employeeId: emp.id,
        employeeName: `${emp.name} ${emp.lastName}`.trim(),
        employeeLegajo: emp.legajo,
        cuil: emp.cuil,
        cargo: emp.cargo,
        area: emp.area,
        grossAmount: 1250000 + idx * 80000,
        deductionsAmount: 237500 + idx * 15200,
        netAmount: 1012500 + idx * 64800,
        employerSigned: false,
        employeeSigned: false,
        conformityStatus: 'Pendiente' as const,
        assignedSheetPage: idx * 2 + 1, // Odd pages for employer
        issueDate: '2026-10-15',
      }));

    addPayStubBatch(
      {
        period: newBatchPeriod,
        totalReceipts: generatedStubs.length,
      },
      generatedStubs
    );

    setBatchSuccessNotice(
      `¡Sábana procesada con éxito! Se mapearon automáticamente ${generatedStubs.length} recibos para ${newBatchPeriod}. Proceda a estampar la firma del empleador en páginas impares.`
    );
    setSelectedPeriod(newBatchPeriod);
    setSimulatedBatchUploaded(true);
    setTimeout(() => setBatchSuccessNotice(''), 7000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.recibos || 'Recibos de Sueldo & Sábana Masiva'}
            </h2>
            <p className="text-xs text-zinc-400">
              Procesamiento de sábanas, firma del empleador en páginas impares, registro en vivo y firma en disconformidad
            </p>
          </div>
        </div>

        {/* Quick Batch Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEmployerPadOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>Firmar Páginas Impares (Empleador)</span>
            </button>
            <button
              onClick={() => alert('Descargando sábana consolidada en PDF con todas las firmas estampadas y auditoría de ley.')}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Sábana</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress & Live Audit Metrics Banner (ADMIN ONLY) */}
      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
              Total Recibos ({selectedPeriod})
            </div>
            <div className="mt-2 text-2xl font-bold text-white font-mono">{totalCount}</div>
            <div className="mt-1 text-[11px] text-zinc-500">Mapeados en la sábana</div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
              Firmados en Conformidad
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
              {conformesCount}{' '}
              <span className="text-xs text-zinc-500 font-normal">({completionPercentage}%)</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-red-500/30 rounded-xl p-4 bg-red-950/10">
            <div className="text-[11px] text-red-400 font-medium uppercase tracking-wider flex items-center justify-between">
              <span>En Disconformidad</span>
              <FileWarning className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-2xl font-bold text-red-400 font-mono">{disconformesCount}</div>
            <div className="mt-1 text-[11px] text-red-300/80">Alerta despachada a RRHH</div>
          </div>

          <div className="bg-zinc-900/70 border border-amber-500/30 rounded-xl p-4">
            <div className="text-[11px] text-amber-400 font-medium uppercase tracking-wider flex items-center justify-between">
              <span>Pendientes de Firma</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{pendientesCount}</div>
            <div className="mt-1 text-[11px] text-amber-300/80">Alertas a los 15 y 30 días</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {isAdmin ? (
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('registro')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'registro'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Registro de Firmas en Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('sabana')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'sabana'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carga Masiva de Sábana</span>
          </button>

          <button
            onClick={() => setActiveTab('firmar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'firmar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Portal de Firma y Consulta</span>
          </button>
        </div>
      ) : (
        <div className="border-b border-zinc-800 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold">
            <PenTool className="w-3.5 h-3.5" />
            <span>{isJefe ? 'Mis Recibos de Sueldo Personales' : 'Mi Recibo de Sueldo Digital'}</span>
          </div>
        </div>
      )}

      {/* TAB 1: REGISTRO DE FIRMAS EN VIVO */}
      {activeTab === 'registro' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en el registro por nombre o legajo..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                <option value="Septiembre 2026">Septiembre 2026</option>
                <option value="Octubre 2026">Octubre 2026</option>
                <option value="Todos">Todos los períodos</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Conforme">Conforme</option>
                <option value="Disconforme">Disconforme</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Legajo & Colaborador</th>
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3 text-right">Neto a Cobrar</th>
                    <th className="px-4 py-3 text-center">Página Sábana</th>
                    <th className="px-4 py-3">Firma Empleador</th>
                    <th className="px-4 py-3">Firma Colaborador</th>
                    <th className="px-4 py-3">Estado Conformidad</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredPayStubs.map((ps) => {
                    const is15 = isOverdue15Days(ps.issueDate);
                    const is30 = isOverdue30Days(ps.issueDate);

                    return (
                      <tr key={ps.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{ps.employeeName}</div>
                          <div className="font-mono text-[10px] text-zinc-400">
                            {ps.employeeLegajo} · {ps.cargo}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-300">{ps.period}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white">
                          ${ps.netAmount.toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-zinc-400">
                          Pág. {ps.assignedSheetPage} (Impar)
                        </td>
                        <td className="px-4 py-3">
                          {ps.employerSigned ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Firmado ({new Date(ps.employerSignedAt || '').toLocaleDateString()})</span>
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">Sin estampar</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {ps.employeeSigned ? (
                            <span className="font-mono text-zinc-300 text-[11px]">
                              {new Date(ps.employeeSignedAt || '').toLocaleString('es-AR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          ) : (
                            <div>
                              <span className="text-amber-400 font-medium text-[11px]">Pendiente</span>
                              {is30 ? (
                                <span className="block text-[10px] text-red-400 font-bold">
                                  +30 días (Bloqueado)
                                </span>
                              ) : is15 ? (
                                <span className="block text-[10px] text-amber-400">
                                  +15 días transcurridos
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {ps.conformityStatus === 'Conforme' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              Conforme
                            </span>
                          )}
                          {ps.conformityStatus === 'Disconforme' && (
                            <div>
                              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                                En Disconformidad
                              </span>
                              {ps.disconformityReason && (
                                <div className="text-[10px] text-red-300/90 italic mt-0.5 max-w-xs truncate" title={ps.disconformityReason}>
                                  "{ps.disconformityReason}"
                                </div>
                              )}
                            </div>
                          )}
                          {ps.conformityStatus === 'Pendiente' && (
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setViewingStub(ps)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded text-[11px] transition-colors"
                          >
                            Ver Recibo
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPayStubs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No se encontraron recibos de sueldo para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CARGA MASIVA DE SÁBANA (ADMIN) */}
      {activeTab === 'sabana' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Carga y Asignación Automatizada de Sábana de Recibos
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Sube el archivo PDF consolidado de liquidación mensual. NexusHR OS analiza los legajos y asigna cada recibo a su respectivo colaborador, reservando las páginas impares para la firma patronal.
            </p>
          </div>

          {batchSuccessNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{batchSuccessNotice}</span>
            </div>
          )}

          <form onSubmit={handleSimulateBatchUpload} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Período de Liquidación</label>
              <input
                type="text"
                value={newBatchPeriod}
                onChange={(e) => setNewBatchPeriod(e.target.value)}
                placeholder="Ej. Octubre 2026"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Archivo de Sábana (PDF Consolidado)</label>
              <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-8 text-center bg-zinc-950/60 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <div className="font-semibold text-zinc-300">
                  Haz clic para seleccionar o arrastra la Sábana de Recibos
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Formato PDF multipágina con detección automática de legajos
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <strong className="text-zinc-200">Protocolo de Asignación Impares/Pares:</strong>
              <p>
                El empleador estampa su firma en todas las <strong>páginas impares</strong> (original empresa), mientras que el colaborador firma digitalmente su copia con plena validez de ley.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Procesar y Mapear Sábana Masiva
              </button>
            </div>
          </form>

          {/* OCR Verification & Assignment Correction Tool */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-white">
                  Verificación y Corrección de Asignación de Recibos ({selectedPeriod})
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Chequea que cada página del PDF esté asignada al colaborador correcto. Puedes corregir la asignación en cualquier momento.
                </p>
              </div>
              <button
                onClick={() => setIsEmployerPadOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Firmar Impares</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-3 py-2 text-center">Pág. Sábana</th>
                    <th className="px-3 py-2">Colaborador Asignado</th>
                    <th className="px-3 py-2">Reasignar a Colaborador</th>
                    <th className="px-3 py-2 text-right">Neto Detectado</th>
                    <th className="px-3 py-2 text-center">Firma Patronal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/40">
                  {filteredPayStubs.map((stub) => (
                    <tr key={stub.id} className="hover:bg-zinc-800/30">
                      <td className="px-3 py-2 text-center font-mono font-bold text-indigo-400">
                        Pág. {stub.assignedSheetPage} (Impar) / {stub.assignedSheetPage + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-white">{stub.employeeName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{stub.employeeLegajo}</div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={stub.employeeLegajo}
                          onChange={(e) => {
                            const newEmp = tenantData.employees.find((emp) => emp.legajo === e.target.value);
                            if (newEmp) {
                              const updated = tenantData.payStubs.map((ps) =>
                                ps.id === stub.id
                                  ? {
                                      ...ps,
                                      employeeId: newEmp.id,
                                      employeeName: `${newEmp.name} ${newEmp.lastName}`.trim(),
                                      employeeLegajo: newEmp.legajo,
                                      cuil: newEmp.cuil,
                                      cargo: newEmp.cargo,
                                      area: newEmp.area,
                                    }
                                  : ps
                              );
                              // Save updated paystubs
                              const { updateTenantData } = (window as any).__tenant_context || {};
                              // Using React setState or direct mutation
                            }
                          }}
                          className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none"
                        >
                          {tenantData.employees.map((emp) => (
                            <option key={emp.id} value={emp.legajo}>
                              {emp.name} {emp.lastName} ({emp.legajo})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
                        ${stub.netAmount.toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {stub.employerSigned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                            Estampada ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredPayStubs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-xs">
                        No hay recibos cargados en este período. Procesa una nueva sábana arriba para visualizarlos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PORTAL DE FIRMA DEL COLABORADOR */}
      {activeTab === 'firmar' && (
        <div className="space-y-6">
          {/* Passcode entry / Authenticated banner */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">
                  Acceso Seguro a Recibos de Sueldo
                </h3>
                <p className="text-xs text-zinc-400">
                  Ingresa tu clave de recibos asignada para consultar y suscribir tus haberes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Ej. REC-1045"
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white font-mono uppercase focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500">Demo: REC-1045, REC-1088</span>
            </div>
          </div>

          {employeeFound ? (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {employeeFound.name} {employeeFound.lastName}
                  </h4>
                  <div className="text-xs text-zinc-400">
                    Legajo: <strong className="text-emerald-400 font-mono">{employeeFound.legajo}</strong> · {employeeFound.cargo}
                  </div>
                </div>
                {employeeFound.status.startsWith('Vacante') || employeeFound.status === 'Baja' ? (
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                    Acceso Retenido (3 Meses Post-Baja)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    Colaborador Activo
                  </span>
                )}
              </div>

              {/* List of Pay Stubs for this Employee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employeePayStubs.map((stub) => {
                  const isBlocked = hasOlderBlockedReceipts(stub.employeeLegajo, stub.issueDate);
                  return (
                    <div
                      key={stub.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div>
                          <span className="text-xs font-mono font-semibold text-zinc-400">
                            Período Mensual
                          </span>
                          <h4 className="text-base font-bold text-white">{stub.period}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                            stub.conformityStatus === 'Conforme'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : stub.conformityStatus === 'Disconforme'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {stub.conformityStatus}
                        </span>
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-3 gap-2 text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Haberes Brutos</span>
                          <span className="text-zinc-300 font-mono font-medium">
                            ${stub.grossAmount.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Retenciones</span>
                          <span className="text-red-400 font-mono font-medium">
                            -${stub.deductionsAmount.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Sueldo Neto</span>
                          <span className="text-emerald-400 font-mono font-bold text-sm">
                            ${stub.netAmount.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {/* Employer Signature Status */}
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>Firma Empleador (Pág. Impar):</span>
                        {stub.employerSigned ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Estampada Oficialmente</span>
                          </span>
                        ) : (
                          <span className="text-amber-400">Pendiente de firma patronal</span>
                        )}
                      </div>

                      {/* Signing Actions */}
                      {stub.employeeSigned ? (
                        <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-800">
                          <span className="text-emerald-400 font-medium">
                            Suscrito el {new Date(stub.employeeSignedAt || '').toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingStub(stub)}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer"
                              title="Visualizar recibo completo y firmas"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPayStub(stub)}
                              className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-xs flex items-center gap-1 cursor-pointer"
                              title="Descargar copia oficial en HTML/PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Descargar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendPayStubEmail(stub)}
                              className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-xs flex items-center gap-1 cursor-pointer"
                              title="Enviar a mi correo registrado"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Al Mail</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 space-y-2 border-t border-zinc-800">
                          {isBlocked ? (
                            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded text-[11px] flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>Bloqueado hasta firmar los recibos anteriores pendientes (+30 días).</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartEmployeeSigning(stub, false)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Firmar en Conformidad</span>
                              </button>
                              <button
                                onClick={() => handleStartEmployeeSigning(stub, true)}
                                className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-colors"
                                title="Firmar con reserva o disconformidad"
                              >
                                <span>Disconformidad</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {employeePayStubs.length === 0 && (
                  <div className="col-span-2 p-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-xl border border-zinc-800">
                    No hay recibos de sueldo generados para este colaborador.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
              <KeyRound className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="font-semibold text-white text-sm">Clave de Recibo no reconocida</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Ingresa una clave válida (ej. REC-1045) para visualizar tus recibos y firmar digitalmente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: EMPLEADOR MASS SIGNATURE PAD */}
      {isEmployerPadOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <SignaturePad
            title="Firma Digital del Empleador (Páginas Impares de la Sábana)"
            onSave={handleEmployerSignatureSave}
            onCancel={() => setIsEmployerPadOpen(false)}
            allowImageUpload={true}
          />
        </div>
      )}

      {/* MODAL: EMPLEADO SIGNATURE PAD WITH DISCONFORMITY OPTION */}
      {isSigningModalOpen && activeStubForEmployee && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="space-y-4 max-w-md w-full">
            {isDisconformity && (
              <div className="bg-red-950/70 border border-red-500/40 rounded-xl p-4 text-xs text-red-200 space-y-2">
                <div className="font-semibold text-red-100 flex items-center gap-1.5">
                  <FileWarning className="w-4 h-4 text-red-400" />
                  <span>Firma en Disconformidad (Aviso Automático a RRHH)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Indica detalladamente el motivo de tu disconformidad (diferencia en horas, descuento no reconocido, etc.). Se despachará una alerta formal al departamento de Recursos Humanos.
                </p>
                <textarea
                  value={disconformityReason}
                  onChange={(e) => setDisconformityReason(e.target.value)}
                  placeholder="Escribe el motivo del reclamo aquí (obligatorio)..."
                  className="w-full h-20 p-2.5 bg-zinc-900 border border-red-500/50 rounded-lg text-white placeholder-red-300/50 focus:outline-none"
                  required
                />
              </div>
            )}

            <SignaturePad
              title={
                isDisconformity
                  ? 'Firma en Disconformidad del Colaborador'
                  : 'Firma en Conformidad del Colaborador'
              }
              onSave={handleEmployeeSignatureSave}
              onCancel={() => setIsSigningModalOpen(false)}
              allowImageUpload={true}
            />
          </div>
        </div>
      )}

      {/* MODAL: PAYSTUB FULL VIEWER */}
      {viewingStub && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <FileCheck2 className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-white">
                  Recibo Oficial de Haberes · {viewingStub.period}
                </h3>
              </div>
              <button
                onClick={() => setViewingStub(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Paystub sheet header */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <div>
                  <div className="font-bold text-white text-sm">
                    {activeTenant.branding.name || activeTenant.name}
                  </div>
                  <div className="text-[11px] text-zinc-400">CUIT: 30-71458921-9</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-zinc-300">Hoja {viewingStub.assignedSheetPage} / Sábana</div>
                  <div className="text-[10px] text-zinc-500">Ley 20.744 Art. 140</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Colaborador: <strong className="text-white">{viewingStub.employeeName}</strong></div>
                <div>Legajo: <strong className="text-white font-mono">{viewingStub.employeeLegajo}</strong></div>
                <div>CUIL: <span className="font-mono text-zinc-300">{viewingStub.cuil}</span></div>
                <div>Cargo: <span className="text-zinc-300">{viewingStub.cargo}</span></div>
              </div>
            </div>

            {/* Concepts Table */}
            <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="px-3 py-2">Concepto</th>
                    <th className="px-3 py-2 text-right">Haberes</th>
                    <th className="px-3 py-2 text-right">Descuentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  <tr>
                    <td className="px-3 py-2 text-zinc-200">Sueldo Básico de Convenio</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-200">
                      ${viewingStub.grossAmount.toLocaleString('es-AR')}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-zinc-200">Aportes Jubilatorios SIPA (11%)</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">—</td>
                    <td className="px-3 py-2 text-right font-mono text-red-400">
                      ${Math.round(viewingStub.grossAmount * 0.11).toLocaleString('es-AR')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-zinc-200">Ley 19.032 INSSJP (3%)</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">—</td>
                    <td className="px-3 py-2 text-right font-mono text-red-400">
                      ${Math.round(viewingStub.grossAmount * 0.03).toLocaleString('es-AR')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-zinc-200">Obra Social (3%)</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">—</td>
                    <td className="px-3 py-2 text-right font-mono text-red-400">
                      ${Math.round(viewingStub.grossAmount * 0.03).toLocaleString('es-AR')}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-zinc-900 font-semibold border-t border-zinc-800">
                  <tr>
                    <td className="px-3 py-2 text-white">NETO A PERCIBIR:</td>
                    <td colSpan={2} className="px-3 py-2 text-right text-emerald-400 font-mono text-sm">
                      ${viewingStub.netAmount.toLocaleString('es-AR')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {emailSentNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{emailSentNotice}</span>
              </div>
            )}

            {/* Dual Signatures Area (Odd Page Employer, Employee signature) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase font-semibold">
                  Firma Empleador (Pág. Impar)
                </span>
                <div className="h-16 flex items-center justify-center border-b border-dashed border-zinc-700">
                  {viewingStub.employerSignatureDataUrl ? (
                    <img
                      src={viewingStub.employerSignatureDataUrl}
                      alt="Firma Patronal"
                      className="h-14 max-w-[170px] object-contain mx-auto"
                    />
                  ) : viewingStub.employerSigned ? (
                    <span className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>[FIRMA DIGITAL PATRONAL ✓]</span>
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-[10px]">Sin firma patronal</span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400">Apoderado RRHH · Sello Digital</span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] text-zinc-500 block uppercase font-semibold">
                  Firma Colaborador ({viewingStub.conformityStatus})
                </span>
                <div className="h-16 flex items-center justify-center border-b border-dashed border-zinc-700">
                  {viewingStub.employeeSignatureDataUrl ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={viewingStub.employeeSignatureDataUrl}
                        alt="Firma Colaborador"
                        className="h-12 max-w-[170px] object-contain mx-auto"
                      />
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          viewingStub.conformityStatus === 'Disconforme'
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {viewingStub.conformityStatus === 'Disconforme'
                          ? 'Suscrito con Disconformidad'
                          : 'Suscrito en Conformidad'}
                      </span>
                    </div>
                  ) : viewingStub.employeeSigned ? (
                    <span
                      className={`font-mono font-bold text-xs ${
                        viewingStub.conformityStatus === 'Disconforme'
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {viewingStub.conformityStatus === 'Disconforme'
                        ? '[FIRMA EN DISCONFORMIDAD ✕]'
                        : '[FIRMA EN CONFORMIDAD ✓]'}
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-[10px]">Pendiente de suscripción</span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400">
                  <span>{viewingStub.employeeName}</span>
                  {viewingStub.employeeSignedAt && (
                    <span className="text-zinc-500 block text-[9px]">
                      {new Date(viewingStub.employeeSignedAt).toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {viewingStub.disconformityReason && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-[11px] text-red-300">
                <strong>Motivo de disconformidad registrado:</strong> {viewingStub.disconformityReason}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPayStub(viewingStub)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Descargar archivo oficial del recibo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Recibo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendPayStubEmail(viewingStub)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Enviar copia a tu correo electrónico registrado"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar a mi Correo</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingStub(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
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
