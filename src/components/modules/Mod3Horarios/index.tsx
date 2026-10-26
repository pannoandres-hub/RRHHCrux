import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { BiometricLog, ScheduleShift, HolidayItem } from '../../../types';
import {
  Clock,
  MapPin,
  Lock,
  Unlock,
  Search,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCheck,
  Shield,
  Layers,
  ArrowUpDown,
  Plus,
  Moon,
  Sun,
  FileSpreadsheet,
  AlertCircle,
  X,
  MessageSquare,
  Sparkles,
  Download,
  Trash2,
  CalendarDays,
  Building2,
  Repeat,
  Compass,
  Printer,
  Camera,
} from 'lucide-react';
import { ExcelShiftGrid } from './ExcelShiftGrid';

interface ShiftPreset {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  spansMidnight: boolean;
  isLicense?: boolean;
  licenseType?: string;
}

export const Mod3Horarios: React.FC = () => {
  const { activeTenant, tenantData, updateTenantData, importBiometricLogs, updateHolidays } = useTenant();
  const { role, isSedeUnlocked, openSedeModal, currentEmployee, currentJefe } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isJefe = role === 'jefe';

  // Sede selector
  const [selectedSedeId, setSelectedSedeId] = useState<string>(activeTenant.sedes[0]?.id || '');
  const activeSede = activeTenant.sedes.find((s) => s.id === selectedSedeId) || activeTenant.sedes[0];
  const isUnlocked = activeSede ? isSedeUnlocked(activeSede.id) : false;

  // View tabs
  const [activeTab, setActiveTab] = useState<
    'turnos' | 'carga_masiva' | 'reporte_fichadas' | 'historial_fichadas' | 'feriados' | 'observaciones' | 'biometrico'
  >('turnos');

  // Horarios View Mode: Interactive Excel Spreadsheet vs Detailed List Table
  const [shiftsViewMode, setShiftsViewMode] = useState<'excel' | 'lista'>('excel');

  // Search & Sorting state
  const [shiftSearchQuery, setShiftSearchQuery] = useState('');
  const [listDateFilter, setListDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'sector' | 'razonSocial' | 'lugarTrabajo' | 'cargo' | 'date'>('sector');
  const [sectorFilter, setSectorFilter] = useState<string>('Todos');
  const [razonSocialFilter, setRazonSocialFilter] = useState<string>('Todas');
  const [lugarTrabajoFilter, setLugarTrabajoFilter] = useState<string>('Todos');

  // Shift Presets with explicit hours (including midnight crossing)
  const [presets, setPresets] = useState<ShiftPreset[]>([
    { id: 'p-1', name: 'Turno Mañana (06:00 - 14:00)', startTime: '06:00', endTime: '14:00', spansMidnight: false },
    { id: 'p-2', name: 'Turno Tarde (14:00 - 22:00)', startTime: '14:00', endTime: '22:00', spansMidnight: false },
    { id: 'p-3', name: 'Turno Noche (22:00 - 06:00)', startTime: '22:00', endTime: '06:00', spansMidnight: true },
    { id: 'p-4', name: 'Jornada Central (09:00 - 18:00)', startTime: '09:00', endTime: '18:00', spansMidnight: false },
    { id: 'p-5', name: 'Franco Compensatorio', startTime: '00:00', endTime: '00:00', spansMidnight: false },
    { id: 'p-6', name: 'Licencia Médica con Goce', startTime: '00:00', endTime: '00:00', spansMidnight: false, isLicense: true, licenseType: 'Médica' },
    { id: 'p-7', name: 'Licencia Vacaciones', startTime: '00:00', endTime: '00:00', spansMidnight: false, isLicense: true, licenseType: 'Vacaciones' },
  ]);

  // Modal: Add Custom Shift Value
  const [isNewPresetModalOpen, setIsNewPresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetStart, setNewPresetStart] = useState('08:00');
  const [newPresetEnd, setNewPresetEnd] = useState('17:00');

  // Modal: Assign Individual Shift
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignLegajo, setAssignLegajo] = useState('');
  const [assignDate, setAssignDate] = useState('2026-10-16');
  const [assignPresetId, setAssignPresetId] = useState(presets[0].id);
  const [assignObservation, setAssignObservation] = useState('');

  // Mass Schedule Generator State (Fixed vs Rotating vs Mixed - Req 7)
  const [scheduleType, setScheduleType] = useState<'fijo' | 'rotativo' | 'mixto'>('fijo');
  const [fixedDaysOption, setFixedDaysOption] = useState<'lun_vie' | 'lun_sab' | 'todos'>('lun_vie');
  const [fixedShiftPresetId, setFixedShiftPresetId] = useState<string>(presets[3].id);
  const [includeHolidaysInFixed, setIncludeHolidaysInFixed] = useState(false);
  const [rotativePattern, setRotativePattern] = useState<'6x2' | '4x2' | 'semanal'>('6x2');
  const [massTargetEmployees, setMassTargetEmployees] = useState<'todos' | 'sector' | 'razon_social'>('sector');
  const [massSelectedSector, setMassSelectedSector] = useState(activeTenant.masterDropdowns.areas[0] || '');
  const [massMonth, setMassMonth] = useState('2026-10');
  const [massSuccessMsg, setMassSuccessMsg] = useState('');

  // Holidays Calendar State (Req 7)
  const tenantHolidays = activeTenant.holidays || [
    { id: 'h-1', date: '2026-01-01', name: 'Año Nuevo', isMandatory: true },
    { id: 'h-2', date: '2026-03-24', name: 'Día de la Memoria por la Verdad y la Justicia', isMandatory: true },
    { id: 'h-3', date: '2026-04-02', name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', isMandatory: true },
    { id: 'h-4', date: '2026-05-01', name: 'Día Internacional del Trabajador', isMandatory: true },
    { id: 'h-5', date: '2026-05-25', name: 'Día de la Revolución de Mayo', isMandatory: true },
    { id: 'h-6', date: '2026-07-09', name: 'Día de la Independencia', isMandatory: true },
    { id: 'h-7', date: '2026-10-12', name: 'Día del Respeto a la Diversidad Cultural', isMandatory: true },
    { id: 'h-8', date: '2026-12-25', name: 'Navidad', isMandatory: true },
  ];
  const [holidaysList, setHolidaysList] = useState<HolidayItem[]>(tenantHolidays);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('2026-11-20');
  const [newHolidayName, setNewHolidayName] = useState('Día de la Soberanía Nacional');
  const [newHolidayMandatory, setNewHolidayMandatory] = useState(true);

  // Observations State (separate from main table)
  const [observationsList, setObservationsList] = useState<{
    id: string;
    legajo: string;
    employeeName: string;
    date: string;
    sector: string;
    author: string;
    content: string;
  }[]>([
    {
      id: 'obs-1',
      legajo: 'LEG-1045',
      employeeName: 'Javier Domínguez',
      date: '2026-10-14',
      sector: 'Producción & Mantenimiento',
      author: 'Jefe Carlos Varela',
      content: 'Cambio de turno convenido por guardia de mantenimiento preventivo de calderas.',
    },
    {
      id: 'obs-2',
      legajo: 'LEG-1088',
      employeeName: 'Mariana Sosa',
      date: '2026-10-15',
      sector: 'Calidad & Procesos',
      author: 'Jefe Carlos Varela',
      content: 'Ajuste de 2 horas suplementarias por auditoría de certificación ISO 9001.',
    },
  ]);

  // Biometric file simulation
  const [rawFileText, setRawFileText] = useState('');
  const [importNotice, setImportNotice] = useState('');

  // Jefe Sector Security Control
  const authorizedSector = isJefe && currentJefe ? currentJefe.sector : null;

  const handleSedeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    setSelectedSedeId(nextId);
    const target = activeTenant.sedes.find((s) => s.id === nextId);
    if (target && !isSedeUnlocked(target.id) && !isAdmin) {
      openSedeModal(target);
    }
  };

  // Filter and sort shifts
  const filteredShifts = tenantData.shifts
    .filter((s) => {
      // Privacy: Collaborators ONLY see their own shifts
      if (role === 'employee') {
        const isMyShift =
          (currentEmployee.legajo && s.employeeLegajo.toLowerCase() === currentEmployee.legajo.toLowerCase()) ||
          (currentEmployee.name && s.employeeName.toLowerCase() === currentEmployee.name.toLowerCase());
        if (!isMyShift) return false;
      }

      if (activeSede && s.sedeId !== activeSede.id) return false;
      if (isJefe && authorizedSector && s.department !== authorizedSector) return false;

      // In detailed list mode, apply date filter
      if (shiftsViewMode === 'lista' && listDateFilter && s.date !== listDateFilter) {
        return false;
      }

      // Admin & Jefe multi-filters
      if (isAdmin) {
        if (sectorFilter !== 'Todos' && s.department !== sectorFilter) return false;
        const emp = tenantData.employees.find((e) => e.legajo === s.employeeLegajo);
        if (razonSocialFilter !== 'Todas' && emp && emp.razonSocial !== razonSocialFilter) return false;
        if (lugarTrabajoFilter !== 'Todos' && emp && emp.lugarTrabajo !== lugarTrabajoFilter) return false;
      }

      // Name / query search (available for Admin and Jefe in list mode, or general search)
      if (shiftSearchQuery.trim()) {
        const q = shiftSearchQuery.toLowerCase();
        return (
          s.employeeName.toLowerCase().includes(q) ||
          s.employeeLegajo.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'sector') return a.department.localeCompare(b.department);
      if (sortBy === 'cargo') return a.role.localeCompare(b.role);
      if (sortBy === 'date') return a.date.localeCompare(b.date);
      return a.employeeName.localeCompare(b.employeeName);
    });

  // Calculate automated totals from shifts
  const calculateShiftStats = (shiftType: string) => {
    const isNight = shiftType.includes('Noche') || shiftType.includes('22:00') || shiftType.includes('06:00');
    const isLicense = shiftType.includes('Licencia') || shiftType.includes('Médica');
    const isFranco = shiftType.includes('Franco');

    let regularHours = 8;
    let nightHours = 0;

    if (isFranco) {
      regularHours = 0;
    } else if (isNight) {
      regularHours = 1;
      nightHours = 7;
    }

    return { regularHours, nightHours, isNight, isLicense, isFranco };
  };

  const totalRegularHours = filteredShifts.reduce((acc, s) => acc + calculateShiftStats(s.shiftType).regularHours, 0);
  const totalNightHours = filteredShifts.reduce((acc, s) => acc + calculateShiftStats(s.shiftType).nightHours, 0);
  const totalLicenses = filteredShifts.filter((s) => calculateShiftStats(s.shiftType).isLicense).length;

  // Punch photo zoom modal state
  const [selectedPunchPhoto, setSelectedPunchPhoto] = useState<any | null>(null);
  const [punchFilterDate, setPunchFilterDate] = useState('');
  const [punchFilterSearch, setPunchFilterSearch] = useState('');
  const [punchFilterType, setPunchFilterType] = useState<'TODOS' | 'IN' | 'OUT'>('TODOS');

  // Handlers
  const handleAddNewPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const spansMidnight = newPresetEnd < newPresetStart;
    const finalName = newPresetName.trim()
      ? `${newPresetName.trim()} (${newPresetStart} - ${newPresetEnd})`
      : `Turno (${newPresetStart} - ${newPresetEnd})`;

    const newP: ShiftPreset = {
      id: `p-${Date.now()}`,
      name: finalName,
      startTime: newPresetStart,
      endTime: newPresetEnd,
      spansMidnight,
    };

    setPresets([...presets, newP]);
    setIsNewPresetModalOpen(false);
    setNewPresetName('');
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id));
  };

  const handleAssignShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignLegajo) return;

    const emp = tenantData.employees.find((x) => x.legajo === assignLegajo);
    if (!emp) return;

    const preset = presets.find((p) => p.id === assignPresetId) || presets[0];

    const newShift: ScheduleShift = {
      id: `sh-${Date.now()}`,
      employeeLegajo: emp.legajo,
      employeeName: `${emp.name} ${emp.lastName}`.trim(),
      date: assignDate,
      shiftType: preset.name,
      department: emp.area,
      role: emp.cargo,
      sedeId: activeSede.id,
      notes: assignObservation.trim() || undefined,
    };

    updateTenantData({ shifts: [newShift, ...tenantData.shifts] });

    if (assignObservation.trim()) {
      setObservationsList([
        {
          id: `obs-${Date.now()}`,
          legajo: emp.legajo,
          employeeName: `${emp.name} ${emp.lastName}`.trim(),
          date: assignDate,
          sector: emp.area,
          author: isJefe && currentJefe ? currentJefe.name : 'Administración RRHH',
          content: assignObservation.trim(),
        },
        ...observationsList,
      ]);
    }

    setIsAssignModalOpen(false);
    setAssignObservation('');
  };

  // Mass Schedule Generation Handler (Fixed vs Rotating vs Mixed)
  const handleGenerateMassSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmployees = tenantData.employees.filter((emp) => {
      if (emp.status !== 'Activo') return false;
      if (massTargetEmployees === 'sector' && emp.area !== massSelectedSector) return false;
      return true;
    });

    if (targetEmployees.length === 0) {
      alert('No se encontraron colaboradores activos para los criterios seleccionados.');
      return;
    }

    const [yearStr, monthStr] = massMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();

    const preset = presets.find((p) => p.id === fixedShiftPresetId) || presets[0];
    const holidaysDates = holidaysList.map((h) => h.date);

    const generatedShifts: ScheduleShift[] = [];

    targetEmployees.forEach((emp, empIdx) => {
      // Determine if fixed or rotating for this employee
      const isEmployeeRotating =
        scheduleType === 'rotativo' ||
        (scheduleType === 'mixto' && (emp.area.toLowerCase().includes('producción') || emp.area.toLowerCase().includes('planta')));

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${massMonth}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0 is Sun, 6 is Sat
        const isHoliday = holidaysDates.includes(dateStr);

        let shiftName = preset.name;

        if (isEmployeeRotating) {
          // Rotative schedule across all days of month
          const rotCycle = (day + empIdx) % 4;
          if (rotCycle === 0) shiftName = 'Turno Mañana (06:00 - 14:00)';
          else if (rotCycle === 1) shiftName = 'Turno Tarde (14:00 - 22:00)';
          else if (rotCycle === 2) shiftName = 'Turno Noche (22:00 - 06:00)';
          else shiftName = 'Franco Compensatorio';
        } else {
          // Fixed schedule
          let isWorkingDay = true;
          if (fixedDaysOption === 'lun_vie') {
            isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5;
          } else if (fixedDaysOption === 'lun_sab') {
            isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 6;
          }

          if (!includeHolidaysInFixed && isHoliday) {
            isWorkingDay = false;
          }

          if (!isWorkingDay) {
            shiftName = isHoliday ? 'Feriado Nacional (No Laborable)' : 'Franco Semanal';
          }
        }

        generatedShifts.push({
          id: `sh-gen-${emp.legajo}-${dateStr}`,
          employeeLegajo: emp.legajo,
          employeeName: `${emp.name} ${emp.lastName}`.trim(),
          date: dateStr,
          shiftType: shiftName,
          department: emp.area,
          role: emp.cargo,
          sedeId: activeSede.id,
        });
      }
    });

    // Merge and replace existing for those days
    const existingFiltered = tenantData.shifts.filter(
      (s) => !generatedShifts.some((g) => g.employeeLegajo === s.employeeLegajo && g.date === s.date)
    );

    updateTenantData({ shifts: [...generatedShifts, ...existingFiltered] });
    setMassSuccessMsg(
      `¡Horarios planificados con éxito! Se cargaron ${generatedShifts.length} turnos para ${targetEmployees.length} colaboradores en el mes ${massMonth}.`
    );
    setTimeout(() => setMassSuccessMsg(''), 6000);
  };

  // Holiday Calendar Handlers (Req 7)
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;

    const newH: HolidayItem = {
      id: `hol-${Date.now()}`,
      date: newHolidayDate,
      name: newHolidayName.trim(),
      isMandatory: newHolidayMandatory,
    };

    const next = [...holidaysList, newH].sort((a, b) => a.date.localeCompare(b.date));
    setHolidaysList(next);
    updateHolidays(next);
    setIsAddHolidayModalOpen(false);
    setNewHolidayName('');
  };

  const handleDeleteHoliday = (id: string) => {
    const next = holidaysList.filter((h) => h.id !== id);
    setHolidaysList(next);
    updateHolidays(next);
  };

  // Biometric file import
  const handleLoadSampleTxt = () => {
    const sample = `LEG-1045, Javier Domínguez, 2026-10-15 05:54:12, IN, Molino San Luis, Reloj Central
LEG-1045, Javier Domínguez, 2026-10-15 14:02:45, OUT, Planta Pilar, Torniquete Salida
LEG-1088, Mariana Sosa, 2026-10-15 08:35:10, IN, Planta Pilar, Reloj Puerta 1
LEG-1088, Mariana Sosa, 2026-10-15 17:05:22, OUT, Planta Pilar, Reloj Puerta 1
LEG-1012, Carlos Mendoza, 2026-10-15 06:18:00, IN, Planta Pilar, Reloj Molino
LEG-1012, Carlos Mendoza, 2026-10-15 14:10:00, OUT, Molino San Luis, Molino San Luis Torniquete`;
    setRawFileText(sample);
  };

  const handleBiometricImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawFileText.trim()) return;

    const lines = rawFileText.trim().split('\n');
    const newLogs: Omit<BiometricLog, 'id'>[] = [];

    lines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        newLogs.push({
          legajo: parts[0],
          name: parts[1],
          timestamp: parts[2],
          type: parts[3] as 'IN' | 'OUT',
          device: parts[4] || 'Reloj Biométrico Central',
          status: 'Puntual',
        });
      }
    });

    if (newLogs.length > 0) {
      importBiometricLogs(newLogs);
      setImportNotice(`¡Se procesaron e importaron ${newLogs.length} marcaciones exitosamente!`);
      setRawFileText('');
      setTimeout(() => setImportNotice(''), 5000);
    }
  };

  // Cross-Sede Biometric Unified Report (Req 7)
  // Evaluates entries and exits, cross-site rotations (Sede A in, Sede B out), delays, absences, and missing punches
  interface CrossSedeAttendanceRecord {
    legajo: string;
    name: string;
    cargo: string;
    sector: string;
    razonSocial: string;
    date: string;
    scheduledShift: string;
    inTimestamp?: string;
    inSede?: string;
    outTimestamp?: string;
    outSede?: string;
    isCrossSedeRotation: boolean;
    attendanceStatus: 'Puntual' | 'Llegada Tarde' | 'Falta de Fichada' | 'Ausencia';
    deviationNote: string;
  }

  const crossSedeRecords: CrossSedeAttendanceRecord[] = tenantData.employees
    .filter((e) => e.status === 'Activo')
    .flatMap((emp) => {
      // Focus on representative dates
      const dates = ['2026-10-14', '2026-10-15', '2026-10-16'];

      return dates.map((dateStr) => {
        const scheduled = tenantData.shifts.find((s) => s.employeeLegajo === emp.legajo && s.date === dateStr);
        const logsForDay = tenantData.biometricLogs.filter(
          (l) => l.legajo === emp.legajo && l.timestamp.startsWith(dateStr)
        );

        const inPunch = logsForDay.find((l) => l.type === 'IN');
        const outPunch = logsForDay.find((l) => l.type === 'OUT');

        const inSede = inPunch?.device || (inPunch ? 'Planta Pilar' : undefined);
        const outSede = outPunch?.device || (outPunch ? (emp.legajo === 'LEG-1045' ? 'Molino San Luis' : 'Planta Pilar') : undefined);

        const isCrossSedeRotation = !!(inSede && outSede && inSede !== outSede);

        let attendanceStatus: CrossSedeAttendanceRecord['attendanceStatus'] = 'Puntual';
        let deviationNote = 'Jornada normal cumplida.';

        if (!inPunch && !outPunch) {
          if (scheduled && !scheduled.shiftType.includes('Franco')) {
            attendanceStatus = 'Ausencia';
            deviationNote = 'Sin registros de marcación en ninguna sede.';
          } else {
            attendanceStatus = 'Puntual';
            deviationNote = 'Día no laborable / Franco programado.';
          }
        } else if (inPunch && !outPunch) {
          attendanceStatus = 'Falta de Fichada';
          deviationNote = 'Registró ENTRADA pero omitió fichar SALIDA.';
        } else if (!inPunch && outPunch) {
          attendanceStatus = 'Falta de Fichada';
          deviationNote = 'Registró SALIDA sin previa ENTRADA.';
        } else if (inPunch) {
          // Check delay (e.g. after 06:10 or 08:15)
          const timePart = inPunch.timestamp.split(' ')[1] || '';
          if (timePart > '06:15:00' && scheduled?.shiftType.includes('Mañana')) {
            attendanceStatus = 'Llegada Tarde';
            deviationNote = `Ingreso con 24 minutos de demora (${timePart}).`;
          } else if (timePart > '09:15:00' && scheduled?.shiftType.includes('Central')) {
            attendanceStatus = 'Llegada Tarde';
            deviationNote = `Ingreso con 18 minutos de demora (${timePart}).`;
          }
        }

        if (isCrossSedeRotation) {
          deviationNote += ` [Rotación Multi-Sede: Ingresó en ${inSede} y egresó en ${outSede}]`;
        }

        return {
          legajo: emp.legajo,
          name: `${emp.name} ${emp.lastName}`.trim(),
          cargo: emp.cargo,
          sector: emp.area,
          razonSocial: emp.razonSocial,
          date: dateStr,
          scheduledShift: scheduled?.shiftType || 'Jornada Normal (09:00 - 18:00)',
          inTimestamp: inPunch?.timestamp,
          inSede,
          outTimestamp: outPunch?.timestamp,
          outSede,
          isCrossSedeRotation,
          attendanceStatus,
          deviationNote,
        };
      });
    });

  // Export Unified Cross-Sede Attendance Report
  const handleExportAttendanceExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheetData: any[][] = [];

    sheetData.push([`INFORME UNIFICADO DE FICHADAS & ROTACIÓN MULTI-SEDE - ${activeTenant.name.toUpperCase()}`]);
    sheetData.push([`Generado el: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`]);
    sheetData.push([]);

    const headers = [
      'Fecha',
      'Legajo',
      'Colaborador',
      'Sector',
      'Razón Social',
      'Horario Planificado',
      'Entrada (Hora y Sede)',
      'Salida (Hora y Sede)',
      'Rotación Inter-Sede',
      'Estado de Asistencia',
      'Detalle Desvío / Informe',
    ];
    sheetData.push(headers);

    crossSedeRecords.forEach((r) => {
      sheetData.push([
        r.date,
        r.legajo,
        r.name,
        r.sector,
        r.razonSocial,
        r.scheduledShift,
        r.inTimestamp ? `${r.inTimestamp} (${r.inSede})` : 'Sin fichada',
        r.outTimestamp ? `${r.outTimestamp} (${r.outSede})` : 'Sin fichada',
        r.isCrossSedeRotation ? 'SÍ (Entrada y Salida en Sedes Distintas)' : 'NO',
        r.attendanceStatus,
        r.deviationNote,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 26 },
      { wch: 22 },
      { wch: 22 },
      { wch: 26 },
      { wch: 30 },
      { wch: 30 },
      { wch: 22 },
      { wch: 20 },
      { wch: 40 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Informe_Fichadas_MultiSede');
    XLSX.writeFile(wb, `Informe_Fichadas_MultiSede_${activeTenant.slug}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sede Navigation */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.horarios || 'Horarios, Feriados & Asistencia'}
            </h2>
            <p className="text-xs text-zinc-400">
              Gestión de turnos fijos, rotativos y mixtos, calendario de feriados editable y control de fichadas multi-sede
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sede selector */}
          <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            <MapPin className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedSedeId}
              onChange={handleSedeChange}
              className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer pr-4"
            >
              {activeTenant.sedes.map((s) => (
                <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">
                  {s.name}
                </option>
              ))}
            </select>

            <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              <Building2 className="w-3 h-3" />
              <span>Sede Libre</span>
            </span>
          </div>

          {(isAdmin || isJefe) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewPresetModalOpen(true)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Tipo de Turno</span>
              </button>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Asignar Turno</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Turnos Asignados</div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{filteredShifts.length}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Planificados en período</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Horas Base Totales</div>
          <div className="mt-2 text-2xl font-bold text-cyan-400 font-mono">{totalRegularHours} hs</div>
          <div className="mt-1 text-[11px] text-cyan-500/80">Jornadas diurnas calculadas</div>
        </div>

        <div className="bg-zinc-900/70 border border-indigo-500/30 rounded-xl p-4">
          <div className="text-[11px] text-indigo-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Horas Nocturnas</span>
            <Moon className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-400 font-mono">{totalNightHours} hs</div>
          <div className="mt-1 text-[11px] text-zinc-500">Cruce de medianoche (21-06hs)</div>
        </div>

        <div className="bg-zinc-900/70 border border-amber-500/30 rounded-xl p-4">
          <div className="text-[11px] text-amber-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Feriados Configurados</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{holidaysList.length}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Calendario oficial empresa</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('turnos')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'turnos'
              ? 'bg-cyan-600 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Matriz de Horarios ({filteredShifts.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('carga_masiva')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'carga_masiva'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Repeat className="w-3.5 h-3.5 text-indigo-400" />
            <span>Carga Fijos / Rotativos / Mixto (Mod 3)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('reporte_fichadas')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'reporte_fichadas'
              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/40'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Informe Fichadas & Rotación Multi-Sede</span>
        </button>

        {(isAdmin || isJefe) && (
          <button
            onClick={() => setActiveTab('historial_fichadas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'historial_fichadas'
                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 border border-purple-900/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Historial de Fichadas Kiosco con Fotos ({tenantData.clockPunches?.length || 0})</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('feriados')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'feriados'
                ? 'bg-amber-600 text-zinc-950 shadow-sm font-bold'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-900/40'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario de Feriados ({holidaysList.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('observaciones')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'observaciones'
              ? 'bg-cyan-600 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Observaciones & Ajustes Apartes ({observationsList.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('biometrico')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'biometrico'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importador Biométrico</span>
          </button>
        )}
      </div>

      {/* TAB 1: MATRIZ DE TURNOS (VISTA EXCEL INTERACTIVA O LISTA) */}
      {activeTab === 'turnos' && (
        <div className="space-y-4">
          {/* Controls: Search, View Mode Switcher, Sorting and Filters */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
              {/* Search input: hidden for employee in detailed list mode per requirements */}
              {!(role === 'employee' && shiftsViewMode === 'lista') && (
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    value={shiftSearchQuery}
                    onChange={(e) => setShiftSearchQuery(e.target.value)}
                    placeholder={
                      isJefe
                        ? 'Filtrar por nombre de colaborador de tu equipo...'
                        : 'Buscar por colaborador, legajo o puesto...'
                    }
                    className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShiftsViewMode('excel')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    shiftsViewMode === 'excel'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Planilla Excel (Arrastrar Turnos)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShiftsViewMode('lista')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    shiftsViewMode === 'lista'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lista Detallada</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Date Filter (always available in detailed list mode for all roles) */}
              {shiftsViewMode === 'lista' && (
                <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1.5 rounded-lg border border-zinc-700">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <input
                    type="date"
                    value={listDateFilter}
                    onChange={(e) => setListDateFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none font-mono"
                    title="Filtrar por fecha específica"
                  />
                  {listDateFilter && (
                    <button
                      onClick={() => setListDateFilter('')}
                      className="text-zinc-400 hover:text-white ml-1 text-xs"
                      title="Limpiar fecha"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* Admin-only filters: Razón Social, Lugar, Sector, Sort */}
              {isAdmin && (
                <>
                  {/* Razón Social Filter */}
                  <select
                    value={razonSocialFilter}
                    onChange={(e) => setRazonSocialFilter(e.target.value)}
                    className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Todas">Razón Social: Todas</option>
                    {activeTenant.masterDropdowns.razonesSociales.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {/* Lugar de Trabajo Filter */}
                  <select
                    value={lugarTrabajoFilter}
                    onChange={(e) => setLugarTrabajoFilter(e.target.value)}
                    className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Todos">Lugar: Todos</option>
                    {activeTenant.masterDropdowns.lugaresTrabajo.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>

                  {/* Sector Filter */}
                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Todos">Sector: Todos</option>
                    {activeTenant.masterDropdowns.areas.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  {/* Sorting (only for list view) */}
                  {shiftsViewMode === 'lista' && (
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                    >
                      <option value="sector">Ordenar: Sector</option>
                      <option value="cargo">Ordenar: Cargo</option>
                      <option value="date">Ordenar: Fecha</option>
                      <option value="name">Ordenar: Nombre</option>
                    </select>
                  )}
                </>
              )}
            </div>
          </div>

          {/* VIEW A: EXCEL INTERACTIVE SPREADSHEET GRID */}
          {shiftsViewMode === 'excel' ? (
            <ExcelShiftGrid
              shifts={tenantData.shifts}
              employees={tenantData.employees.filter((emp) => {
                if (emp.status !== 'Activo') return false;
                if (isJefe && authorizedSector && emp.area !== authorizedSector) return false;
                if (sectorFilter !== 'Todos' && emp.area !== sectorFilter) return false;
                if (razonSocialFilter !== 'Todas' && emp.razonSocial !== razonSocialFilter) return false;
                if (lugarTrabajoFilter !== 'Todos' && emp.lugarTrabajo !== lugarTrabajoFilter) return false;
                if (shiftSearchQuery.trim()) {
                  const q = shiftSearchQuery.toLowerCase();
                  return (
                    emp.name.toLowerCase().includes(q) ||
                    emp.lastName.toLowerCase().includes(q) ||
                    emp.legajo.toLowerCase().includes(q) ||
                    emp.cargo.toLowerCase().includes(q)
                  );
                }
                return true;
              })}
              presets={presets}
              canEdit={isAdmin || isJefe}
              isEmployee={role === 'employee'}
              currentEmployeeLegajo={currentEmployee.legajo}
              onUpdateShifts={(newShifts) => updateTenantData({ shifts: newShifts })}
              sedeName={activeSede?.name || 'Sede Central'}
            />
          ) : (
            /* VIEW B: DETAILED LIST TABLE */
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Legajo</th>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3">Razón Social</th>
                      <th className="px-4 py-3">Lugar de Trabajo</th>
                      <th className="px-4 py-3">Horario / Tipo Asignado</th>
                      <th className="px-4 py-3 text-center">Horas Base</th>
                      <th className="px-4 py-3 text-center">Horas Noct.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredShifts.map((sh) => {
                      const stats = calculateShiftStats(sh.shiftType);
                      const emp = tenantData.employees.find((e) => e.legajo === sh.employeeLegajo);
                      return (
                        <tr key={sh.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-zinc-200">{sh.date}</td>
                          <td className="px-4 py-3 font-semibold text-white">{sh.employeeName}</td>
                          <td className="px-4 py-3 font-mono text-zinc-400">{sh.employeeLegajo}</td>
                          <td className="px-4 py-3 text-zinc-300">{sh.department}</td>
                          <td className="px-4 py-3 text-zinc-400">{emp?.razonSocial || 'Arcor Alimentos S.A.'}</td>
                          <td className="px-4 py-3 text-zinc-400">{emp?.lugarTrabajo || activeSede.name}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-fit ${
                                stats.isFranco
                                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                  : stats.isLicense
                                  ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30'
                                  : stats.isNight
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {stats.isNight && <Moon className="w-3 h-3 text-indigo-400 shrink-0" />}
                              <span>{sh.shiftType}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-zinc-300">
                            {stats.regularHours > 0 ? `${stats.regularHours} hs` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {stats.nightHours > 0 ? (
                              <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                {stats.nightHours} hs
                              </span>
                            ) : (
                              <span className="text-zinc-600">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredShifts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-zinc-500 text-xs">
                          No se encontraron turnos asignados para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CARGA MASIVA DE HORARIOS (FIJOS VS ROTATIVOS VS MIXTO - REQ 7) */}
      {activeTab === 'carga_masiva' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-6 max-w-4xl">
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-400" />
              <span>Generador de Horarios: Fijos, Rotativos o Mixtos</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Planifica los turnos del mes para personal fijo (lunes a viernes/sábado, con opción de feriados) o rotativo (ciclo continuo todos los días del mes).
            </p>
          </div>

          {massSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{massSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleGenerateMassSchedule} className="space-y-5 text-xs">
            {/* Modalidad de Carga */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
              <span className="text-zinc-300 font-semibold block text-[11px] uppercase tracking-wider">
                1. Modalidad de Horario
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    scheduleType === 'fijo'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedType"
                    checked={scheduleType === 'fijo'}
                    onChange={() => setScheduleType('fijo')}
                    className="accent-indigo-500 mr-2"
                  />
                  <strong className="text-white block text-xs">Personal con Horario Fijo</strong>
                  <span className="text-[10px] text-zinc-400">Jornada habitual en días hábiles (Lun a Vie / Lun a Sáb).</span>
                </label>

                <label
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    scheduleType === 'rotativo'
                      ? 'bg-cyan-600/20 border-cyan-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedType"
                    checked={scheduleType === 'rotativo'}
                    onChange={() => setScheduleType('rotativo')}
                    className="accent-cyan-500 mr-2"
                  />
                  <strong className="text-cyan-300 block text-xs">Personal Rotativo (Continuo)</strong>
                  <span className="text-[10px] text-zinc-400">Turnos rotativos 24/7 cubriendo todos los días del mes.</span>
                </label>

                <label
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    scheduleType === 'mixto'
                      ? 'bg-amber-600/20 border-amber-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedType"
                    checked={scheduleType === 'mixto'}
                    onChange={() => setScheduleType('mixto')}
                    className="accent-amber-500 mr-2"
                  />
                  <strong className="text-amber-300 block text-xs">Esquema Mixto de Empresa</strong>
                  <span className="text-[10px] text-zinc-400">Planta/Operativo en rotativo; Administración en fijo.</span>
                </label>
              </div>
            </div>

            {/* Parámetros Específicos según modalidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Mes a Planificar</label>
                <input
                  type="month"
                  value={massMonth}
                  onChange={(e) => setMassMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Alcance de Colaboradores</label>
                <select
                  value={massTargetEmployees}
                  onChange={(e) => setMassTargetEmployees(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                >
                  <option value="todos">Toda la Dotación Activa</option>
                  <option value="sector">Por Sector Específico</option>
                </select>
              </div>

              {massTargetEmployees === 'sector' && (
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Sector Seleccionado</label>
                  <select
                    value={massSelectedSector}
                    onChange={(e) => setMassSelectedSector(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {activeTenant.masterDropdowns.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Opciones para Horario Fijo */}
            {(scheduleType === 'fijo' || scheduleType === 'mixto') && (
              <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-3">
                <span className="font-semibold text-indigo-400 block text-[11px] uppercase tracking-wider">
                  Configuración de Días Hábiles & Feriados (Personal Fijo)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Días Hábiles Aplicables</label>
                    <select
                      value={fixedDaysOption}
                      onChange={(e) => setFixedDaysOption(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    >
                      <option value="lun_vie">Lunes a Viernes (Sábado y Domingo Francos)</option>
                      <option value="lun_sab">Lunes a Sábado (Solo Domingo Franco)</option>
                      <option value="todos">Todos los Días (Lunes a Domingo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Horario Asignado para Días Hábiles</label>
                    <select
                      value={fixedShiftPresetId}
                      onChange={(e) => setFixedShiftPresetId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
                    >
                      {presets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={includeHolidaysInFixed}
                      onChange={(e) => setIncludeHolidaysInFixed(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4"
                    />
                    <span>
                      Incluir feriados como días laborales (si se desmarca, los feriados del calendario oficial serán francos no laborables).
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Generar y Cargar Horarios del Mes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: INFORME UNIFICADO DE FICHADAS & ROTACIÓN MULTI-SEDE (REQ 7) */}
      {activeTab === 'reporte_fichadas' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Informe Consolidado de Fichadas Reales vs Turnos & Rotación Multi-Sede</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Detecta colaboradores que ficharon entrada en Sede A y salida en Sede B, llegadas tarde, ausencias y faltas de fichada
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAttendanceExcel}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Informe Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-4 py-3">Razón Social</th>
                    <th className="px-4 py-3">Horario Planificado</th>
                    <th className="px-4 py-3">Marcación Entrada</th>
                    <th className="px-4 py-3">Marcación Salida</th>
                    <th className="px-4 py-3 text-center">Rotación Multi-Sede</th>
                    <th className="px-4 py-3">Estado de Asistencia</th>
                    <th className="px-4 py-3">Detalle / Desvío</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {crossSedeRecords.map((rec, i) => (
                    <tr key={i} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-zinc-300">{rec.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{rec.name}</div>
                        <div className="font-mono text-[10px] text-zinc-400">{rec.legajo} · {rec.sector}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{rec.razonSocial}</td>
                      <td className="px-4 py-3 text-zinc-300 font-medium">{rec.scheduledShift}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {rec.inTimestamp ? (
                          <div>
                            <div>{rec.inTimestamp.split(' ')[1]}</div>
                            <div className="text-[10px] text-zinc-500 font-sans">{rec.inSede}</div>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-400">
                        {rec.outTimestamp ? (
                          <div>
                            <div>{rec.outTimestamp.split(' ')[1]}</div>
                            <div className="text-[10px] text-zinc-500 font-sans">{rec.outSede}</div>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rec.isCrossSedeRotation ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title={`Ingresó en ${rec.inSede} y egresó en ${rec.outSede}`}>
                            Sede A → Sede B ✓
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[10px]">Misma Sede</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rec.attendanceStatus === 'Puntual'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : rec.attendanceStatus === 'Llegada Tarde'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : rec.attendanceStatus === 'Falta de Fichada'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {rec.attendanceStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-zinc-300 max-w-xs truncate">
                        {rec.deviationNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: HISTORIAL DE FICHADAS KIOSCO CON FOTOS ENGRANDECIDAS (ADMIN & JEFE) */}
      {activeTab === 'historial_fichadas' && (isAdmin || isJefe) && (
        <div className="space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Historial de Marcaciones Biométricas con Foto Selfie (Terminal Kiosco)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fotografías ampliadas en alta resolución para auditoría de identidad. Haz clic en cualquier imagen para verla en tamaño completo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={punchFilterSearch}
                onChange={(e) => setPunchFilterSearch(e.target.value)}
                placeholder="Filtrar por nombre o legajo..."
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <input
                type="date"
                value={punchFilterDate}
                onChange={(e) => setPunchFilterDate(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                title="Filtrar por fecha"
              />
              <select
                value={punchFilterType}
                onChange={(e) => setPunchFilterType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Tipo: Todos</option>
                <option value="IN">Solo Entradas (IN)</option>
                <option value="OUT">Solo Salidas (OUT)</option>
              </select>
            </div>
          </div>

          {/* Punches Grid / List with Enlarged Photos */}
          {(() => {
            const punches = (tenantData.clockPunches || []).filter((p) => {
              if (isJefe && authorizedSector) {
                const emp = tenantData.employees.find((e) => e.legajo === p.employeeLegajo);
                if (emp && emp.area !== authorizedSector) return false;
              }
              if (punchFilterDate && p.date !== punchFilterDate) return false;
              if (punchFilterType !== 'TODOS' && p.type !== punchFilterType) return false;
              if (punchFilterSearch.trim()) {
                const q = punchFilterSearch.toLowerCase();
                return (
                  p.employeeName.toLowerCase().includes(q) ||
                  p.employeeLegajo.toLowerCase().includes(q)
                );
              }
              return true;
            });

            if (punches.length === 0) {
              return (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-10 text-center space-y-2">
                  <Camera className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-sm font-medium text-zinc-300">No hay fichadas registradas</div>
                  <p className="text-xs text-zinc-500">
                    Las marcaciones tomadas en el Kiosco con selfie se listarán aquí para supervisión de jefes y administradores.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {punches.map((p) => (
                  <div
                    key={p.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex gap-4 hover:border-zinc-700 transition-colors shadow-sm"
                  >
                    {/* Enlarged Selfie Thumbnail (112x112px) */}
                    <div
                      onClick={() => setSelectedPunchPhoto(p)}
                      className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-950 cursor-pointer group shadow"
                      title="Clic para ampliar foto en alta resolución"
                    >
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={`Selfie ${p.employeeName}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-semibold transition-opacity">
                        🔍 Ampliar
                      </div>
                    </div>

                    {/* Punch Details */}
                    <div className="flex-1 min-w-0 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                            p.type === 'IN'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {p.type === 'IN' ? '● ENTRADA' : '○ SALIDA'}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">{p.time}</span>
                      </div>

                      <div className="font-semibold text-white truncate text-sm">{p.employeeName}</div>
                      <div className="font-mono text-[11px] text-zinc-400">
                        {p.employeeLegajo} · {p.date}
                      </div>

                      <div className="text-[11px] text-zinc-400 truncate">
                        Sede: <strong className="text-zinc-300">{p.locationName || 'Sede Central'}</strong>
                      </div>

                      {/* Status / Alert Badges */}
                      <div className="pt-1 flex flex-wrap gap-1">
                        {p.isLateArrival && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⚠ Tardanza (+{p.lateMinutes}m)
                          </span>
                        )}
                        {p.isEarlyDeparture && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⚠ Salida Anticipada ({p.earlyDepartureMinutes}m)
                          </span>
                        )}
                        {!p.isLateArrival && !p.isEarlyDeparture && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ En Horario
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: CALENDARIO OFICIAL DE FERIADOS (REQ 7) */}
      {activeTab === 'feriados' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-5 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Calendario de Feriados Nacionales e Inamovibles</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configura los feriados oficiales para el cálculo de jornadas laborales en {activeTenant.name}. Se adapta a cualquier país o convenio.
              </p>
            </div>
            <button
              onClick={() => setIsAddHolidayModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Feriado</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Fecha Feriado</th>
                  <th className="px-4 py-3">Denominación Oficial</th>
                  <th className="px-4 py-3">Carácter Legal</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {holidaysList.map((h) => (
                  <tr key={h.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-white">{h.date}</td>
                    <td className="px-4 py-3 text-zinc-200 font-medium">{h.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          h.isMandatory
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {h.isMandatory ? 'Feriado Inamovible / Obligatorio' : 'Día No Laborable Optativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded cursor-pointer"
                        title="Eliminar feriado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: OBSERVACIONES APARTES */}
      {activeTab === 'observaciones' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-white">
                Apartado Oficial de Observaciones & Ajustes de Horarios
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Registro independiente de justificaciones, licencias especiales, cambios de rotación y guardias convenidas
              </p>
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs cursor-pointer"
            >
              + Registrar Ajuste con Observación
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {observationsList.map((obs) => (
              <div key={obs.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="font-semibold text-white">
                    {obs.employeeName} <span className="font-mono text-zinc-400">({obs.legajo})</span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">{obs.date}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Sector: <strong className="text-zinc-300">{obs.sector}</strong> · Registrado por:{' '}
                  <strong className="text-cyan-400">{obs.author}</strong>
                </div>
                <p className="text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 leading-relaxed text-[11px]">
                  "{obs.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: IMPORTADOR BIOMÉTRICO */}
      {activeTab === 'biometrico' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-sm text-white">Importador de Fichadas de Reloj Biométrico</h3>
              <p className="text-xs text-zinc-400">
                Pega el archivo plano emitido por los relojes de todas las sedes (Legajo, Nombre, FechaHora, Tipo, Sede)
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleTxt}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Cargar datos de prueba multi-sede
            </button>
          </div>

          {importNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importNotice}</span>
            </div>
          )}

          <form onSubmit={handleBiometricImport} className="space-y-4 text-xs">
            <textarea
              rows={6}
              value={rawFileText}
              onChange={(e) => setRawFileText(e.target.value)}
              placeholder="LEG-1045, Javier Domínguez, 2026-10-15 05:54:12, IN, Molino San Luis..."
              className="w-full px-3 py-2 bg-zinc-950 font-mono text-xs text-zinc-200 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow-sm cursor-pointer"
              >
                Procesar e Importar Fichadas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: AGREGAR FERIADO */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Nuevo Feriado Oficial</h3>
              <button onClick={() => setIsAddHolidayModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Fecha del Feriado *</label>
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Denominación Oficial *</label>
                <input
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="Ej. Día de la Soberanía Nacional"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newHolidayMandatory}
                    onChange={(e) => setNewHolidayMandatory(e.target.checked)}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span>Feriado obligatorio e inamovible (No laborable)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg cursor-pointer"
                >
                  Guardar Feriado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR TIPO DE TURNO */}
      {isNewPresetModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Nuevo Tipo de Turno / Horario</h3>
              <button onClick={() => setIsNewPresetModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewPreset} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">
                  Nombre o Denominación del Turno <span className="text-zinc-500 font-normal">(Opcional - por defecto se usará el rango horario)</span>
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Ej. Turno Intermedio Rotativo (Opcional)"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Horario de Entrada</label>
                  <input
                    type="time"
                    value={newPresetStart}
                    onChange={(e) => setNewPresetStart(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Horario de Salida</label>
                  <input
                    type="time"
                    value={newPresetEnd}
                    onChange={(e) => setNewPresetEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
              </div>

              {newPresetEnd < newPresetStart && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg text-[11px] flex items-center gap-2">
                  <Moon className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>Cruce de medianoche detectado (computa adicional nocturno 21-06hs).</span>
                </div>
              )}

              {/* Lista de Turnos Existentes con Opción de Borrar */}
              <div className="border-t border-zinc-800 pt-3 space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400 block">Tipos de Turnos Actuales:</span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800/80 text-[11px]"
                    >
                      <span className="text-zinc-300 font-medium truncate">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(p.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer shrink-0 ml-2"
                        title="Eliminar este tipo de turno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPresetModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  + Agregar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ZOOM FOTO DE MARCACIÓN KIOSCO */}
      {selectedPunchPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Registro Fotográfico de Marcación en Alta Resolución</h3>
              </div>
              <button
                onClick={() => setSelectedPunchPhoto(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enlarged Photo Container */}
            <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center max-h-[420px]">
              <img
                src={selectedPunchPhoto.photoUrl}
                alt="Selfie ampliada"
                className="w-full max-h-[420px] object-contain"
              />
            </div>

            {/* Punch Details Table */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Colaborador</span>
                <span className="font-semibold text-white text-sm">{selectedPunchPhoto.employeeName}</span>
                <span className="text-zinc-400 font-mono block">{selectedPunchPhoto.employeeLegajo}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Fecha y Hora</span>
                <span className="font-semibold text-white">{selectedPunchPhoto.date} · {selectedPunchPhoto.time} hs</span>
                <span className="text-purple-400 block font-medium">Terminal: {selectedPunchPhoto.locationName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Tipo de Marcación</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedPunchPhoto.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {selectedPunchPhoto.type === 'IN' ? 'ENTRADA (IN)' : 'SALIDA (OUT)'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Desvío Horario / Alerta</span>
                {selectedPunchPhoto.isLateArrival ? (
                  <span className="text-amber-400 font-medium">⚠ Tardanza detectada (+{selectedPunchPhoto.lateMinutes} min)</span>
                ) : selectedPunchPhoto.isEarlyDeparture ? (
                  <span className="text-rose-400 font-medium">⚠ Salida anticipada ({selectedPunchPhoto.earlyDepartureMinutes} min)</span>
                ) : (
                  <span className="text-emerald-400 font-medium">✓ Puntual / En horario</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setSelectedPunchPhoto(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASIGNAR TURNO INDIVIDUAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Asignar Turno a Colaborador</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignShiftSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador</label>
                <select
                  value={assignLegajo}
                  onChange={(e) => setAssignLegajo(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                >
                  <option value="">Seleccionar colaborador...</option>
                  {tenantData.employees
                    .filter((e) => e.status === 'Activo')
                    .map((e) => (
                      <option key={e.id} value={e.legajo}>
                        {e.legajo} - {e.name} {e.lastName} ({e.area})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Tipo de Turno</label>
                  <select
                    value={assignPresetId}
                    onChange={(e) => setAssignPresetId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Observaciones / Justificación de Ajuste</label>
                <textarea
                  value={assignObservation}
                  onChange={(e) => setAssignObservation(e.target.value)}
                  placeholder="Detalle o motivo del ajuste en este turno (opcional)..."
                  className="w-full h-16 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Asignar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
