import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { DocumentRequest, VacationRequest, VacationAdvanceRequest, UniformDefinition } from '../../../types';
import {
  FileText,
  FileSignature,
  Shirt,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Lock,
  Printer,
  Trash2,
  Clock,
  UserCheck,
  Search,
  X,
  DollarSign,
  ShieldAlert,
  Upload,
  Paperclip,
  Palmtree,
  Calendar,
  AlertTriangle,
  Layers,
  ChevronRight,
  Download,
} from 'lucide-react';

export const Mod5Documentos: React.FC = () => {
  const {
    activeTenant,
    tenantData,
    addDocumentRequest,
    approveDocumentRequest,
    rejectDocumentRequest,
    requestVacation,
    approveVacation,
    requestVacationAdvance,
    approveVacationAdvance,
    updateUniformDefinition,
    updateMasterDropdowns,
    addNotificationAlert,
  } = useTenant();

  const { role, currentEmployee, currentJefe, setIsJefeModalOpen } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isJefe = role === 'jefe';

  // Navigation tabs:
  // 1. Vacaciones & Saldos
  // 2. Adelanto de Vacaciones
  // 3. Licencias Médicas & Trámites
  // 4. Bandeja de Aprobaciones
  // 5. Stock de Uniformes (Strictly Admin-only)
  const [activeTab, setActiveTab] = useState<'vacaciones' | 'adelantos' | 'licencias' | 'bandeja' | 'uniformes'>(
    'vacaciones'
  );

  // Sync and lock collaborator demographic profile from payroll
  const employeeProfile =
    tenantData.employees.find((e) => e.legajo === currentEmployee.legajo) || tenantData.employees[0];

  // Locked demographic fields
  const empName = `${employeeProfile?.name || currentEmployee.name || 'Javier'} ${employeeProfile?.lastName || 'Domínguez'}`.trim();
  const empLegajo = employeeProfile?.legajo || currentEmployee.legajo || 'LEG-1045';
  const empCargo = employeeProfile?.cargo || 'Operario de Producción';
  const empArea = employeeProfile?.area || 'Producción & Mantenimiento';
  const empRazonSocial = employeeProfile?.razonSocial || activeTenant.masterDropdowns.razonesSociales[0] || 'Nexus Industrial S.A.';
  const empLugarTrabajo = employeeProfile?.lugarTrabajo || activeTenant.sedes[0]?.name || 'Planta Central Pacheco';

  // ==========================================
  // VACATION CALCULATIONS & STATUTORY RATIO
  // ==========================================
  const referenceDateDec31 = new Date('2026-12-31');
  const vacConfig = activeTenant.vacationConfig || {
    cycleStartDayMonth: '10-01',
    cycleExpiryDayMonth: '09-30',
    lessThanSixMonthsRatioDays: 20, // Company benefit ratio (floor is 20)
    statutoryMinRatioDays: 20,
    scales: [
      { minYears: 0.5, maxYears: 5, daysGranted: 14 },
      { minYears: 5, maxYears: 10, daysGranted: 21 },
      { minYears: 10, maxYears: 20, daysGranted: 28 },
      { minYears: 20, maxYears: 99, daysGranted: 35 },
    ],
  };

  const calculateVacationForEmployee = (hireDateStr: string, cargoName: string) => {
    if (!hireDateStr) return { seniorityYears: 0, entitledDays: 14, isLessThanSixMonths: false, exceptionApplied: false };
    const hireDate = new Date(hireDateStr);
    const diffMs = referenceDateDec31.getTime() - hireDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const seniorityYears = diffDays / 365.25;

    // Company ratio vs statutory ratio (floor: 20 days worked in Argentina LCT)
    const ratioToUse = Math.min(20, vacConfig.lessThanSixMonthsRatioDays || 20);

    let entitled = 14;
    let isLess = false;
    if (diffDays < 180) {
      isLess = true;
      entitled = Math.max(1, Math.floor(diffDays / ratioToUse));
    } else {
      for (const scale of vacConfig.scales) {
        if (seniorityYears >= scale.minYears && seniorityYears < scale.maxYears) {
          entitled = scale.daysGranted;
          break;
        }
      }
    }

    // Check custom exception by cargo or person
    let exceptionApplied = false;
    const exc = (vacConfig.exceptions || []).find((e) =>
      e.targetType === 'cargo'
        ? (e.targetIdentifier || e.targetValue) === cargoName
        : (e.targetIdentifier || e.targetValue) === empLegajo
    );
    if (exc) {
      entitled += exc.extraDays || 0;
      exceptionApplied = true;
    }

    return {
      seniorityYears: Math.round(seniorityYears * 10) / 10,
      entitledDays: entitled,
      isLessThanSixMonths: isLess,
      exceptionApplied,
    };
  };

  const myVacCalc = calculateVacationForEmployee(employeeProfile?.hireDate || employeeProfile?.fechaIngreso || '2021-03-15', empCargo);

  // Taken / approved days in current cycle 2026
  const myApprovedVacRequests = (tenantData.vacationRequests || []).filter(
    (v) => (v.employeeLegajo === empLegajo || v.employeeId === employeeProfile?.id) && v.status === 'Aprobado'
  );
  const myApprovedDaysUsed = myApprovedVacRequests.reduce((acc, curr) => acc + (curr.daysRequested || 0), 0);

  // Pending days
  const myPendingVacRequests = (tenantData.vacationRequests || []).filter(
    (v) => (v.employeeLegajo === empLegajo || v.employeeId === employeeProfile?.id) && v.status === 'Pendiente'
  );
  const myPendingDays = myPendingVacRequests.reduce((acc, curr) => acc + (curr.daysRequested || 0), 0);

  // Remaining balance
  const remainingVacBalance = Math.max(0, myVacCalc.entitledDays - myApprovedDaysUsed);

  // Vacation Request Modal State
  const [showVacRequestModal, setShowVacRequestModal] = useState(false);
  const [vacStartDate, setVacStartDate] = useState('2026-11-02');
  const [vacEndDate, setVacEndDate] = useState('2026-11-15');
  const [vacQuotaError, setVacQuotaError] = useState<string | null>(null);

  const calculateDaysBetween = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const requestedVacDays = calculateDaysBetween(vacStartDate, vacEndDate);

  useEffect(() => {
    if (requestedVacDays > remainingVacBalance) {
      setVacQuotaError(
        `Solicitud bloqueada: Has seleccionado ${requestedVacDays} días, pero tu saldo disponible restante es de solo ${remainingVacBalance} días. Reduce el período o solicita un Adelanto de Vacaciones en la pestaña contigua.`
      );
    } else {
      setVacQuotaError(null);
    }
  }, [requestedVacDays, remainingVacBalance]);

  const handleSubmitVacationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedVacDays > remainingVacBalance) {
      alert(vacQuotaError);
      return;
    }

    requestVacation({
      employeeId: employeeProfile?.id || 'emp-current',
      employeeName: empName,
      employeeLegajo: empLegajo,
      startDate: vacStartDate,
      endDate: vacEndDate,
      daysRequested: requestedVacDays,
      cycleYear: 2026,
    });

    setShowVacRequestModal(false);
  };

  // ==========================================
  // ADELANTO DE VACACIONES STATE
  // ==========================================
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceDaysReq, setAdvanceDaysReq] = useState<number>(7);
  const [advanceTakeDate, setAdvanceTakeDate] = useState<string>('2027-01-15');
  const [advanceReason, setAdvanceReason] = useState<string>('Viaje familiar impostergable fuera de temporada estival.');
  const [signingAdvanceReq, setSigningAdvanceReq] = useState<VacationAdvanceRequest | null>(null);
  const [jefeSignatureCanvas, setJefeSignatureCanvas] = useState<string | null>(null);
  const advanceSigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingAdvanceSig, setIsDrawingAdvanceSig] = useState(false);

  const handleRequestAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestVacationAdvance({
      employeeLegajo: empLegajo,
      employeeName: empName,
      cargo: empCargo,
      area: empArea,
      daysRequested: advanceDaysReq,
      targetPeriodYear: 2027,
      requestedTakeDate: advanceTakeDate,
      reason: advanceReason,
    });
    setShowAdvanceModal(false);
  };

  // Canvas drawing for Jefe advance signature
  const startDrawingAdvance = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawingAdvanceSig(true);
    const canvas = advanceSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const drawAdvance = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingAdvanceSig) return;
    const canvas = advanceSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingAdvance = () => {
    setIsDrawingAdvanceSig(false);
    if (advanceSigCanvasRef.current) {
      setJefeSignatureCanvas(advanceSigCanvasRef.current.toDataURL());
    }
  };

  const handleConfirmApproveAdvance = () => {
    if (!signingAdvanceReq) return;
    const signerName = currentJefe?.name || 'Jefatura de Operaciones';
    approveVacationAdvance(signingAdvanceReq.id, signerName, jefeSignatureCanvas || 'data:image/png;base64,mock');
    setSigningAdvanceReq(null);
    setJefeSignatureCanvas(null);
  };

  // ==========================================
  // LICENCIAS MEDICAS & TRAMITES FORM STATE
  // ==========================================
  const [reqType, setReqType] = useState<DocumentRequest['type']>('Licencia Médica');
  const [details, setDetails] = useState('');
  const [submissionCode, setSubmissionCode] = useState<string | null>(null);

  // File upload state for certificates
  const [attachmentFile, setAttachmentFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
    isPdf: boolean;
  } | null>(null);

  const [medicalDays, setMedicalDays] = useState<number>(3);
  const [medicalHours, setMedicalHours] = useState<number>(0);
  const [medicalStartDate, setMedicalStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [artClaimNumber, setArtClaimNumber] = useState<string>('ART-2026-9941');
  const [salaryAdvanceAmount, setSalaryAdvanceAmount] = useState<string>('50000');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      setAttachmentFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl: result,
        isPdf,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitLicenciaRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const isMedical = reqType === 'Licencia Médica';
    const isArt = reqType === 'Licencia por ART';
    const isAdvance = reqType === 'Anticipo de Sueldo';

    const code = addDocumentRequest({
      area: empArea,
      lugarTrabajo: empLugarTrabajo,
      razonSocial: empRazonSocial,
      employeeName: empName,
      cargo: empCargo,
      legajo: empLegajo,
      type: reqType,
      details: details.trim() || `Solicitud formal de ${reqType}.`,
      ...((isMedical || isArt) && {
        medicalDays: Number(medicalDays) || 1,
        medicalHours: Number(medicalHours) || 0,
        medicalLeaveStartDate: medicalStartDate,
        medicalCertificateUrl: attachmentFile?.dataUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=600&auto=format&fit=crop',
        isART: isArt,
        artClaimNumber: isArt ? artClaimNumber : undefined,
      }),
      ...(isAdvance && {
        advanceAmount: Number(salaryAdvanceAmount) || 0,
      }),
    });

    setSubmissionCode(code);
    setDetails('');
    setAttachmentFile(null);
  };

  // ==========================================
  // BANDEJA DE APROBACIONES & JEFE REVIEW
  // ==========================================
  const [reviewingReq, setReviewingReq] = useState<DocumentRequest | null>(null);
  const [approvedDaysOverride, setApprovedDaysOverride] = useState<number>(3);
  const [approvedStartDateOverride, setApprovedStartDateOverride] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleOpenReviewModal = (req: DocumentRequest) => {
    setReviewingReq(req);
    setApprovedDaysOverride(req.medicalDays || 3);
    setApprovedStartDateOverride(req.medicalLeaveStartDate || new Date().toISOString().split('T')[0]);
  };

  const handleConfirmApproval = () => {
    if (!reviewingReq) return;
    const signer = currentJefe ? `${currentJefe.name} (${currentJefe.sector})` : 'Jefatura de Operaciones';

    const start = new Date(approvedStartDateOverride);
    const end = new Date(start);
    end.setDate(end.getDate() + approvedDaysOverride - 1);
    const returnDate = new Date(end);
    returnDate.setDate(returnDate.getDate() + 1);

    approveDocumentRequest(reviewingReq.id, signer, `SIG-${Date.now()}`, {
      medicalDays: approvedDaysOverride,
      medicalLeaveStartDate: approvedStartDateOverride,
      medicalLeaveEndDate: end.toISOString().split('T')[0],
      returnToWorkDate: returnDate.toISOString().split('T')[0],
      advanceAmount: reviewingReq.advanceAmount,
    });

    setReviewingReq(null);
  };

  const activeDocumentRequests = (tenantData.documentRequests || []).filter((req) => {
    if (role === 'employee') {
      return req.legajo === empLegajo;
    }
    if (isJefe && currentJefe) {
      return req.area.toLowerCase() === currentJefe.sector.toLowerCase();
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Licencias y Solicitudes</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Portal Integral v2.0
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Saldos de vacaciones reglamentarias, adelantos autorizados, certificados médicos y trámites oficiales.
            </p>
          </div>
        </div>

        {/* Current User Pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="p-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-zinc-200 font-medium">{empName}</span>
              <span className="text-zinc-500 mx-1.5">·</span>
              <span className="text-zinc-400 font-mono text-[11px]">{empLegajo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Locked Demographic Strip for Payroll Compliance */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-zinc-300 font-medium">Campos demográficos bloqueados por nómina:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-zinc-300">
          <span>Cargo: <strong className="text-indigo-300 font-sans">{empCargo}</strong></span>
          <span>·</span>
          <span>Sector: <strong className="text-indigo-300 font-sans">{empArea}</strong></span>
          <span>·</span>
          <span>Razón Social: <strong className="text-indigo-300 font-sans">{empRazonSocial}</strong></span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('vacaciones')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'vacaciones'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Palmtree className="w-4 h-4" />
          <span>Mis Vacaciones & Saldos</span>
        </button>

        <button
          onClick={() => setActiveTab('adelantos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'adelantos'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Adelanto de Vacaciones</span>
          {(tenantData.vacationAdvances || []).filter((a) => a.status === 'Pendiente Jefatura').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('licencias')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'licencias'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Licencias Médicas & Trámites</span>
        </button>

        <button
          onClick={() => setActiveTab('bandeja')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'bandeja'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Bandeja de Aprobaciones {isJefe ? '(Tu Sector)' : ''}</span>
          <span className="px-1.5 py-0.2 bg-zinc-800 rounded-full text-[10px] text-zinc-300">
            {activeDocumentRequests.filter((r) => r.status === 'Pendiente Jefatura').length}
          </span>
        </button>

        {/* STRICTLY ADMIN-ONLY: Stock de Uniformes */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('uniformes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'uniformes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/50'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Stock de Uniformes (Admin)</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MIS VACACIONES & SALDOS */}
      {/* ============================================================== */}
      {activeTab === 'vacaciones' && (
        <div className="space-y-6">
          {/* Vacation Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Días por Antigüedad</span>
                <Palmtree className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{myVacCalc.entitledDays} días</div>
              <div className="text-[11px] text-zinc-400">
                {myVacCalc.isLessThanSixMonths
                  ? `Ingreso reciente (1 día cada ${vacConfig.lessThanSixMonthsRatioDays || 20} trab.)`
                  : `Antigüedad: ${myVacCalc.seniorityYears} años`}
                {myVacCalc.exceptionApplied && ' · Beneficio extra'}
              </div>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Días Gozados Ciclo 2026</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{myApprovedDaysUsed} días</div>
              <div className="text-[11px] text-zinc-400">Aprobados por Jefatura y RRHH</div>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Días en Proceso</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono">{myPendingDays} días</div>
              <div className="text-[11px] text-zinc-400">Pendientes de confirmación</div>
            </div>

            <div className="bg-zinc-900/70 border border-indigo-500/30 bg-indigo-950/20 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-indigo-300">
                <span>Saldo Restante Disponible</span>
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-indigo-200 font-mono">{remainingVacBalance} días</div>
              <div className="text-[11px] text-indigo-400 font-medium">Límite estricto de solicitud</div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
            <div className="text-xs text-zinc-300">
              <p className="font-semibold text-white">Período de Goce Legal: Octubre 2026 a Septiembre 2027</p>
              <p className="text-zinc-400">
                El sistema valida automáticamente tu cupo disponible según Art. 150 a 157 LCT y convenio de empresa.
              </p>
            </div>

            <button
              onClick={() => setShowVacRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Vacaciones</span>
            </button>
          </div>

          {/* Requests History Table */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Historial de Solicitudes de Vacaciones</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2.5 px-3">Colaborador</th>
                    <th className="py-2.5 px-3">Período Solicitado</th>
                    <th className="py-2.5 px-3">Días</th>
                    <th className="py-2.5 px-3">Ciclo</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Aprobador</th>
                    <th className="py-2.5 px-3">Fecha Solicitud</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {(tenantData.vacationRequests || [])
                    .filter((v) => (role === 'employee' ? v.employeeLegajo === empLegajo : true))
                    .map((vac) => (
                      <tr key={vac.id} className="hover:bg-zinc-800/30">
                        <td className="py-3 px-3">
                          <div className="font-medium text-white">{vac.employeeName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{vac.employeeLegajo}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-zinc-200">{vac.startDate}</span> al{' '}
                          <span className="font-mono text-zinc-200">{vac.endDate}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-white font-mono">{vac.daysRequested} d.</td>
                        <td className="py-3 px-3 font-mono text-zinc-400">{vac.cycleYear}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              vac.status === 'Aprobado'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : vac.status === 'Rechazado'
                                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            }`}
                          >
                            {vac.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400">{vac.approvedBy || '—'}</td>
                        <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">{vac.createdAt?.split('T')[0]}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ADELANTO DE VACACIONES */}
      {/* ============================================================== */}
      {activeTab === 'adelantos' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Calendar className="w-4 h-4" />
              <span>Régimen Especial: Adelanto de Vacaciones a Cuenta del Próximo Período</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Permite a los colaboradores gozar de días vacacionales imputados al período legal venidero (Ciclo 2027) antes del devengamiento formal. Requiere autorización expresa y firma digital de la Jefatura directa y se descuenta del cómputo semestral SAC.
            </p>
          </div>

          <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-white">Solicitudes de Adelanto Registradas</h3>
              <p className="text-xs text-zinc-400">Seguimiento de autorizaciones de Jefatura y pase a novedades SAC</p>
            </div>

            <button
              onClick={() => setShowAdvanceModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold rounded-lg text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Adelanto de Vacaciones</span>
            </button>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-3">Colaborador</th>
                  <th className="py-2.5 px-3">Días Solicitados</th>
                  <th className="py-2.5 px-3">Período Imputado</th>
                  <th className="py-2.5 px-3">Fecha de Goce</th>
                  <th className="py-2.5 px-3">Motivo</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Acción Jefatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {(tenantData.vacationAdvances || []).map((adv) => {
                  const canSignThis =
                    (isJefe || isAdmin) && adv.status === 'Pendiente Jefatura';

                  return (
                    <tr key={adv.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{adv.employeeName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {adv.employeeLegajo} · {adv.cargo}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">{adv.daysRequested} días</td>
                      <td className="py-3 px-3 font-mono text-zinc-300">Ciclo {adv.targetPeriodYear}</td>
                      <td className="py-3 px-3 font-mono text-zinc-300">{adv.requestedTakeDate}</td>
                      <td className="py-3 px-3 text-zinc-400 max-w-xs truncate" title={adv.reason}>
                        {adv.reason}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            adv.status === 'Autorizado'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {adv.status}
                        </span>
                        {adv.approvedByJefe && (
                          <div className="text-[10px] text-zinc-500 mt-0.5">Por: {adv.approvedByJefe}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {canSignThis ? (
                          <button
                            onClick={() => {
                              setSigningAdvanceReq(adv);
                              setJefeSignatureCanvas(null);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded text-[11px] transition-colors"
                          >
                            Firmar & Autorizar
                          </button>
                        ) : adv.status === 'Autorizado' ? (
                          <span className="text-[11px] text-emerald-400 font-medium">✓ Deducido en SAC</span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">En espera</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {(tenantData.vacationAdvances || []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      No hay adelantos de vacaciones solicitados actualmente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: LICENCIAS MEDICAS & TRAMITES */}
      {/* ============================================================== */}
      {activeTab === 'licencias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-900/70 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-1">Nueva Solicitud o Trámite</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Completa el tipo de trámite y adjunta los comprobantes obligatorios según corresponda.
            </p>

            {submissionCode && (
              <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">¡Solicitud transmitida exitosamente!</span>
                    <p className="text-[11px] text-zinc-400">Código único de seguimiento: {submissionCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSubmissionCode(null)}
                  className="px-3 py-1 bg-emerald-800/40 hover:bg-emerald-800/60 rounded text-[11px] text-emerald-200"
                >
                  Nueva carga
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitLicenciaRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de Solicitud</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Licencia Médica">Licencia Médica (Enfermedad / Certificado)</option>
                  <option value="Licencia por ART">Licencia por Accidente de Trabajo (ART)</option>
                  <option value="Licencia por Examen">Licencia por Examen / Estudio</option>
                  <option value="Licencia por Duelo">Licencia por Duelo Familiar</option>
                  <option value="Licencia por Mudanza">Licencia por Mudanza</option>
                  <option value="Anticipo de Sueldo">Anticipo de Sueldo Extraordinario</option>
                  <option value="Solicitud Uniforme">Reposición de Uniforme / EPP</option>
                </select>
              </div>

              {/* Conditional: Medical fields */}
              {(reqType === 'Licencia Médica' || reqType === 'Licencia por ART') && (
                <div className="p-4 bg-zinc-800/40 border border-zinc-700/80 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <FileText className="w-4 h-4" />
                    <span>Detalles del Certificado Médico</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Fecha de Inicio</label>
                      <input
                        type="date"
                        value={medicalStartDate}
                        onChange={(e) => setMedicalStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Días de Reposo</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={medicalDays}
                        onChange={(e) => setMedicalDays(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200"
                        required
                      />
                    </div>
                    {reqType === 'Licencia por ART' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Nº Denuncia ART</label>
                        <input
                          type="text"
                          value={artClaimNumber}
                          onChange={(e) => setArtClaimNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 font-mono"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Native File Upload */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Adjuntar Certificado Oficial (PDF o Foto de Receta)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Seleccionar Archivo...</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      {attachmentFile && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{attachmentFile.name} ({attachmentFile.size})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional: Anticipo de Sueldo */}
              {reqType === 'Anticipo de Sueldo' && (
                <div className="p-4 bg-zinc-800/40 border border-zinc-700/80 rounded-xl space-y-3">
                  <label className="block text-xs font-medium text-zinc-300">Monto del Anticipo ($ ARS)</label>
                  <input
                    type="number"
                    step="1000"
                    value={salaryAdvanceAmount}
                    onChange={(e) => setSalaryAdvanceAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 font-mono"
                    required
                  />
                  <p className="text-[11px] text-zinc-400">
                    Se descontará de la próxima liquidación de haberes previa autorización de Jefatura y RRHH.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Observaciones / Justificación</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Detalles complementarios del trámite..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
                >
                  Enviar Solicitud a Jefatura
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info Card */}
          <div className="space-y-4">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Lineamientos de Licencias</h4>
              <ul className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span><strong>Licencia Médica:</strong> Debe presentarse dentro de las 24 hs de iniciado el reposo con diagnóstico legible y matrícula profesional.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span><strong>Exámenes:</strong> 2 días corridos por examen, hasta un máximo legal de 10 días anuales (Ley 20.744).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span><strong>Firma Digital:</strong> Tu jefe inmediato revisará la solicitud y la rubricará con firma digital autorizada.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BANDEJA DE APROBACIONES */}
      {/* ============================================================== */}
      {activeTab === 'bandeja' && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Bandeja de Trámites y Licencias {isJefe ? `(Sector: ${currentJefe?.sector})` : '(Todas las Sedes)'}
              </h3>
              <p className="text-xs text-zinc-400">
                Rubricación y aprobación formal de solicitudes del personal.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Colaborador</th>
                  <th className="py-2.5 px-3">Tipo Solicitud</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Días / Monto</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Firma</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {activeDocumentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">{req.trackingCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{req.employeeName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{req.legajo} · {req.cargo}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-zinc-200">{req.type}</td>
                    <td className="py-3 px-3 text-zinc-400">{req.area}</td>
                    <td className="py-3 px-3 font-mono">
                      {req.medicalDays ? `${req.medicalDays} d.` : req.advanceAmount ? `$${req.advanceAmount.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          req.status === 'Aprobado y Firmado'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : req.status === 'Rechazado'
                            ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-zinc-400">
                      {req.signedBy ? `Firmado: ${req.signedBy}` : 'Pendiente'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === 'Pendiente Jefatura' && (isJefe || isAdmin) ? (
                        <button
                          onClick={() => handleOpenReviewModal(req)}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded text-[11px] transition-colors"
                        >
                          Revisar & Rubricar
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Procesado</span>
                      )}
                    </td>
                  </tr>
                ))}

                {activeDocumentRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      No hay solicitudes registradas en esta bandeja.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: STOCK DE UNIFORMES (ADMIN-ONLY) */}
      {/* ============================================================== */}
      {activeTab === 'uniformes' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                <Shirt className="w-4 h-4" />
                <span>Control de Inventario de Vestimenta y EPP (Exclusivo Administrador)</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Monitorea existencias por talle, proveedores autorizados y costos unitarios de reposición.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-3">Prenda / EPP</th>
                  <th className="py-2.5 px-3">Proveedor</th>
                  <th className="py-2.5 px-3">Talles Disponibles</th>
                  <th className="py-2.5 px-3">Stock Actual</th>
                  <th className="py-2.5 px-3">Mínimo</th>
                  <th className="py-2.5 px-3">Costo Unitario</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {activeTenant.uniformDefinitions.map((u) => {
                  const isLow = u.stock <= u.minStock;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-3 font-semibold text-white">{u.prenda}</td>
                      <td className="py-3 px-3 text-zinc-300">{u.provider}</td>
                      <td className="py-3 px-3 font-mono text-zinc-400">{u.availableSizes.join(', ')}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{u.stock} un.</td>
                      <td className="py-3 px-3 font-mono text-zinc-400">{u.minStock} un.</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">${u.price.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isLow
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {isLow ? 'Reposición Crítica' : 'Stock Óptimo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SOLICITUD DE VACACIONES CON QUOTA CHECK */}
      {/* ============================================================== */}
      {showVacRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palmtree className="w-5 h-5 text-indigo-400" />
                  <span>Solicitud de Vacaciones (Ciclo 2026)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Saldo disponible para este ciclo: <strong className="text-indigo-300 font-mono">{remainingVacBalance} días</strong>
                </p>
              </div>
              <button onClick={() => setShowVacRequestModal(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitVacationRequest} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={vacStartDate}
                    onChange={(e) => setVacStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    value={vacEndDate}
                    onChange={(e) => setVacEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/60 flex items-center justify-between text-xs">
                <span className="text-zinc-300">Días corridos solicitados:</span>
                <span className="font-mono font-bold text-white text-sm">{requestedVacDays} días</span>
              </div>

              {/* STRICT QUOTA BLOCKING ALERT */}
              {vacQuotaError && (
                <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Bloqueo Estricto de Cupo</span>
                  </div>
                  <p className="leading-relaxed">{vacQuotaError}</p>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVacRequestModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!!vacQuotaError}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                    vacQuotaError
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  Confirmar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SOLICITUD DE ADELANTO DE VACACIONES */}
      {/* ============================================================== */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-bold text-white mb-1">Solicitar Adelanto de Vacaciones</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Se imputará al próximo período 2027 previa conformidad de tu Jefatura directa.
            </p>

            <form onSubmit={handleRequestAdvanceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Días a Adelantar</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={advanceDaysReq}
                    onChange={(e) => setAdvanceDaysReq(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha Prevista de Goce</label>
                  <input
                    type="date"
                    value={advanceTakeDate}
                    onChange={(e) => setAdvanceTakeDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Motivo Justificado del Adelanto</label>
                <textarea
                  rows={3}
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  placeholder="Explica la urgencia o justificación del adelanto..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold text-xs rounded-lg shadow-sm transition-colors"
                >
                  Presentar Solicitud de Adelanto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: FIRMA Y AUTORIZACION JEFE ADELANTO */}
      {/* ============================================================== */}
      {signingAdvanceReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 space-y-4">
            <h3 className="text-base font-bold text-white">Autorización y Firma Digital de Adelanto</h3>
            <p className="text-xs text-zinc-400">
              Autorizando solicitud de <strong>{signingAdvanceReq.employeeName}</strong> por {signingAdvanceReq.daysRequested} días a cuenta del ciclo {signingAdvanceReq.targetPeriodYear}.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Firma Hológrafa Digital del Jefe / Autorizante
              </label>
              <div className="border border-zinc-700 rounded-lg bg-white overflow-hidden">
                <canvas
                  ref={advanceSigCanvasRef}
                  width={460}
                  height={130}
                  onMouseDown={startDrawingAdvance}
                  onMouseMove={drawAdvance}
                  onMouseUp={stopDrawingAdvance}
                  onMouseLeave={stopDrawingAdvance}
                  className="cursor-crosshair w-full h-[130px]"
                />
              </div>
              <p className="text-[10px] text-zinc-500">Dibuja tu firma sobre el panel blanco con el cursor o pantalla táctil.</p>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSigningAdvanceReq(null)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmApproveAdvance}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                Confirmar Firma & Descontar en SAC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REVISION Y RUBRICACION DE TRAMITE/LICENCIA JEFE */}
      {/* ============================================================== */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 space-y-4">
            <h3 className="text-base font-bold text-white">Rubricación de Solicitud #{reviewingReq.trackingCode}</h3>
            <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 text-xs text-zinc-300 space-y-1">
              <div>Colaborador: <strong className="text-white">{reviewingReq.employeeName}</strong> ({reviewingReq.legajo})</div>
              <div>Trámite: <strong className="text-indigo-300">{reviewingReq.type}</strong></div>
              <div>Observación: {reviewingReq.details}</div>
            </div>

            {reviewingReq.medicalDays && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Días Aprobados</label>
                  <input
                    type="number"
                    value={approvedDaysOverride}
                    onChange={(e) => setApprovedDaysOverride(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={approvedStartDateOverride}
                    onChange={(e) => setApprovedStartDateOverride(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewingReq(null)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                Aprobar y Rubricar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
