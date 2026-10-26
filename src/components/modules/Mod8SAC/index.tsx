import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { SACNoveltyColumn, SACNoveltyRow, SACAdjustmentItem, SACNoteToConsiderItem } from '../../../types';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  BarChart2,
  Download,
  Shield,
  Layers,
  Edit2,
  Plus,
  Trash2,
  ArrowRight,
  UserPlus,
  UserX,
  Printer,
  Sparkles,
  Settings,
  Search,
  X,
  Lock,
  Unlock,
  Calculator,
  Info,
  Clock,
} from 'lucide-react';

export const Mod8SAC: React.FC = () => {
  const {
    tenantData,
    activeTenant,
    updateTenantData,
    saveSACNoveltyRow,
    updateSACNoveltyColumns,
    closeSACMonth,
    reopenSACMonth,
    updateSACAdjustments,
  } = useTenant();
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  // Period Selector State
  const availablePeriods = [
    { id: '2026-08', label: 'Agosto 2026 (Pasado)', isPast: true },
    { id: '2026-09', label: 'Septiembre 2026 (Pasado)', isPast: true },
    { id: '2026-10', label: 'Octubre 2026 (Mes Actual)', isCurrent: true },
    { id: '2026-11', label: 'Noviembre 2026 (Próximo)', isFuture: true },
    { id: '2026-12', label: 'Diciembre 2026 (SAC 2do Semestre)', isFuture: true },
  ];
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');

  // Closed periods state tracked by period ID
  const [closedPeriodsMap, setClosedPeriodsMap] = useState<Record<string, boolean>>({
    '2026-08': true,
    '2026-09': true,
    '2026-10': tenantData.sacReport?.isClosed || false,
  });

  const isCurrentPeriodClosed = !!closedPeriodsMap[selectedPeriod];

  // Tabs
  const [activeTab, setActiveTab] = useState<'matriz' | 'ajustes_notas' | 'altas_bajas' | 'columnas' | 'sac_semestral'>('matriz');

  // Feriados 3-Mode Selector: 'summary' (Columna única), 'daily' (Desglose por día), 'none' (Ocultar)
  const [feriadosDisplayMode, setFeriadosDisplayMode] = useState<'summary' | 'daily' | 'none'>('summary');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('Todos');
  const [sacSemester, setSacSemester] = useState<'1' | '2'>('2');

  // Editing Note state
  const [editingNote, setEditingNote] = useState<SACNoteToConsiderItem | null>(null);
  const [editNoteDetalle, setEditNoteDetalle] = useState('');

  // Column Editor State
  const defaultColumns: SACNoveltyColumn[] =
    tenantData.sacColumns && tenantData.sacColumns.length > 0
      ? tenantData.sacColumns
      : [
          { key: 'horasJMG', label: 'Horas JMG (Normales)', type: 'number' },
          { key: 'feriadosTrabajados', label: 'Feriados Trab.', type: 'number' },
          { key: 'horasNocturnas', label: 'Horas Nocturnas', type: 'number' },
          { key: 'licMedicaDias', label: 'Lic. Médica (Días)', type: 'number' },
          { key: 'licVacacionesDias', label: 'Vacaciones (Días)', type: 'number' },
          { key: 'anticipos', label: 'Anticipos ($)', type: 'currency' },
          { key: 'descuentoPrepaga', label: 'Desc. Prepaga ($)', type: 'currency' },
          {
            key: 'adicionalTotal',
            label: 'Total Adicionales ($)',
            type: 'formula',
            formula: 'horasNocturnas * 1.5 + feriadosTrabajados * 2',
          },
        ];

  const [columns, setColumns] = useState<SACNoveltyColumn[]>(defaultColumns);
  const [isNewColModalOpen, setIsNewColModalOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<SACNoveltyColumn['type']>('number');
  const [newColFormula, setNewColFormula] = useState('');

  // Notifications
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Apartado de Ajustes y Apartado A Tener en Cuenta
  const initialAdjustments: SACAdjustmentItem[] = tenantData.sacReport?.adjustments || [
    {
      id: 'adj-1',
      legajo: 'LEG-1045',
      name: 'Javier Domínguez',
      categoriaCargo: 'Operario Técnico de Línea · Cat. Especializada',
      novedadAjuste: 'Ajuste retroactivo paritaria Agosto: +$45.000 no remunerativo homologado por sindicato.',
      monto: 45000,
    },
    {
      id: 'adj-2',
      legajo: 'LEG-1088',
      name: 'Mariana Sosa',
      categoriaCargo: 'Analista de Aseguramiento de Calidad · Administrativo B',
      novedadAjuste: 'Reintegro de viáticos por auditoría en Planta Pilar: +$18.500.',
      monto: 18500,
    },
  ];

  const initialNotes: SACNoteToConsiderItem[] = tenantData.sacReport?.notesToConsider || [
    {
      id: 'note-1',
      legajo: 'LEG-1012',
      name: 'Carlos Mendoza',
      categoriaCargo: 'Supervisor de Planta Industrial · Fuera de Convenio',
      detalleActualizacion:
        'Pase a categoría Senior a partir del 1° de mes. Actualizar básico de convenio a $920.000.',
    },
    {
      id: 'note-2',
      legajo: 'LEG-1067',
      name: 'Romina Fernández',
      categoriaCargo: 'Operaria de Envasado · Turno Rotativo',
      detalleActualizacion:
        'Finalización de período de prueba el 28/10. Confirmación de efectivización en nómina.',
    },
  ];

  const [adjustments, setAdjustments] = useState<SACAdjustmentItem[]>(initialAdjustments);
  const [notesToConsider, setNotesToConsider] = useState<SACNoteToConsiderItem[]>(initialNotes);

  // Modals for adding adjustments and notes
  const [isAddAdjModalOpen, setIsAddAdjModalOpen] = useState(false);
  const [adjLegajo, setAdjLegajo] = useState('');
  const [adjNovedad, setAdjNovedad] = useState('');
  const [adjMonto, setAdjMonto] = useState<number>(0);

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteLegajo, setNoteLegajo] = useState('');
  const [noteDetalle, setNoteDetalle] = useState('');

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
        <Shield className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-white">Módulo Exclusivo de Liquidación RRHH</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          El generador de novedades contiene datos salariales e información confidencial. Requiere privilegios de Administrador. Ningún colaborador regular puede acceder a este módulo.
        </p>
      </div>
    );
  }

  // Rows logic: Altas are included in the main table, Bajas are excluded
  const bajasLegajos = tenantData.sacReport?.bajas?.map((b) => b.legajo) || [];
  const activeAndAltaRows = (tenantData.sacRows || []).filter((row) => !bajasLegajos.includes(row.legajo));

  const filteredRows = activeAndAltaRows.filter((row) => {
    if (sectorFilter !== 'Todos' && row.sector !== sectorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.legajo.toLowerCase().includes(q) ||
        row.cargo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Evaluate formula for a row
  const evaluateFormula = (row: SACNoveltyRow, formulaStr?: string): number => {
    if (!formulaStr) return 0;
    try {
      // Replace tokens with row values
      let expression = formulaStr;
      columns.forEach((col) => {
        const val = Number((row as any)[col.key] ?? row.customFields?.[col.key] ?? 0);
        const regex = new RegExp(`\\b${col.key}\\b`, 'g');
        expression = expression.replace(regex, String(val));
      });
      // Safety check: only allow digits, operators, parens, decimal
      if (/^[0-9+\-*/().\s]+$/.test(expression)) {
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${expression})`)();
        return Number.isFinite(result) ? Math.round(result * 100) / 100 : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  // Period Closing & Reopening
  const handleToggleCloseMonth = () => {
    if (isCurrentPeriodClosed) {
      // Reopen
      setClosedPeriodsMap({ ...closedPeriodsMap, [selectedPeriod]: false });
      reopenSACMonth(selectedPeriod);
      setFeedbackMsg(`¡Novedades del período ${selectedPeriod} reabiertas para edición!`);
    } else {
      // Close
      setClosedPeriodsMap({ ...closedPeriodsMap, [selectedPeriod]: true });
      closeSACMonth(selectedPeriod);
      setFeedbackMsg(`¡Novedades de ${selectedPeriod} cerradas exitosamente! Bloqueadas en modo solo lectura.`);
    }
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  // Column Handlers
  const handleSaveColumns = (updatedCols: SACNoveltyColumn[]) => {
    setColumns(updatedCols);
    updateSACNoveltyColumns(updatedCols);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;

    const newKey = `col_${Date.now()}`;
    const newCol: SACNoveltyColumn = {
      key: newKey,
      label: newColLabel.trim(),
      type: newColType,
      formula: newColType === 'formula' ? newColFormula.trim() : undefined,
    };

    const next = [...columns, newCol];
    handleSaveColumns(next);
    setNewColLabel('');
    setNewColFormula('');
    setIsNewColModalOpen(false);
  };

  const handleDeleteColumn = (key: string) => {
    const next = columns.filter((c) => c.key !== key);
    handleSaveColumns(next);
  };

  const handleUpdateRowValue = (row: SACNoveltyRow, key: string, value: any) => {
    if (isCurrentPeriodClosed) {
      alert('Este período se encuentra cerrado para liquidación. Reabre el mes si precisas aplicar correcciones.');
      return;
    }
    const updated: SACNoveltyRow = {
      ...row,
      [key]: value,
      customFields: {
        ...(row.customFields || {}),
        [key]: value,
      },
    };
    saveSACNoveltyRow(updated);
  };

  // Adjustments & Notes Handlers
  const handleAddAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentPeriodClosed) {
      alert('El período seleccionado está cerrado. No se pueden agregar ajustes.');
      return;
    }
    const emp = tenantData.employees.find((x) => x.legajo === adjLegajo) || tenantData.employees[0];
    if (!emp) return;

    const newAdj: SACAdjustmentItem = {
      id: `adj-${Date.now()}`,
      legajo: emp.legajo,
      name: `${emp.name} ${emp.lastName}`.trim(),
      categoriaCargo: `${emp.cargo} · ${emp.area}`,
      novedadAjuste: adjNovedad.trim(),
      monto: adjMonto || undefined,
    };

    const updated = [newAdj, ...adjustments];
    setAdjustments(updated);
    updateSACAdjustments(selectedPeriod, updated, notesToConsider);
    setIsAddAdjModalOpen(false);
    setAdjNovedad('');
    setAdjMonto(0);
    setFeedbackMsg('¡Ajuste salarial registrado correctamente!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleDeleteAdjustment = (id: string) => {
    if (isCurrentPeriodClosed) return;
    const updated = adjustments.filter((a) => a.id !== id);
    setAdjustments(updated);
    updateSACAdjustments(selectedPeriod, updated, notesToConsider);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentPeriodClosed) {
      alert('El período seleccionado está cerrado. No se pueden agregar notas.');
      return;
    }
    const emp = tenantData.employees.find((x) => x.legajo === noteLegajo) || tenantData.employees[0];
    if (!emp) return;

    const newNote: SACNoteToConsiderItem = {
      id: `note-${Date.now()}`,
      legajo: emp.legajo,
      name: `${emp.name} ${emp.lastName}`.trim(),
      categoriaCargo: `${emp.cargo} · ${emp.area}`,
      detalleActualizacion: noteDetalle.trim(),
    };

    const updated = [newNote, ...notesToConsider];
    setNotesToConsider(updated);
    updateSACAdjustments(selectedPeriod, adjustments, updated);
    setIsAddNoteModalOpen(false);
    setNoteDetalle('');
    setFeedbackMsg('¡Observación "A Tener en Cuenta" guardada correctamente!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleDeleteNote = (id: string) => {
    if (isCurrentPeriodClosed) return;
    const updated = notesToConsider.filter((n) => n.id !== id);
    setNotesToConsider(updated);
    updateSACAdjustments(selectedPeriod, adjustments, updated);
  };

  const handleOpenEditNote = (note: SACNoteToConsiderItem) => {
    setEditingNote(note);
    setEditNoteDetalle(note.detalleActualizacion || '');
  };

  const handleSaveEditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    const updated = notesToConsider.map((n) =>
      n.id === editingNote.id ? { ...n, detalleActualizacion: editNoteDetalle.trim() } : n
    );
    setNotesToConsider(updated);
    updateSACAdjustments(selectedPeriod, adjustments, updated);
    setEditingNote(null);
    setFeedbackMsg('¡Nota "A Tener en Cuenta" actualizada correctamente!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleSyncPunchesToNotes = () => {
    const latePunches = (tenantData.clockPunches || []).filter(
      (p) => p.isLateArrival || p.isEarlyDeparture
    );

    if (latePunches.length === 0) {
      alert('No se detectaron tardanzas ni salidas anticipadas en las fichadas del período.');
      return;
    }

    const newSyncNotes: SACNoteToConsiderItem[] = latePunches.slice(0, 5).map((p, idx) => ({
      id: `punch-note-${Date.now()}-${idx}`,
      legajo: p.employeeLegajo,
      name: p.employeeName,
      categoriaCargo: `Fichada Sede ${p.locationName}`,
      detalleActualizacion: `Inconsistencia horaria el ${p.date}: ${
        p.isLateArrival ? `Tardanza de ${p.lateMinutes} min.` : ''
      }${p.isEarlyDeparture ? `Salida anticipada de ${p.earlyDepartureMinutes} min.` : ''}`,
    }));

    const updated = [...newSyncNotes, ...notesToConsider];
    setNotesToConsider(updated);
    updateSACAdjustments(selectedPeriod, adjustments, updated);
    setFeedbackMsg(`¡Se sincronizaron ${newSyncNotes.length} inconsistencias de fichadas al panel "A Tener en Cuenta"!`);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  // Combined Excel (.xlsx) Export in ONE single sheet as requested in requirement 14
  const handleExportFullExcel = () => {
    const wb = XLSX.utils.book_new();

    // Build single combined sheet array
    const sheetData: any[][] = [];

    // Header title
    sheetData.push([`PLANILLA CONSOLIDADA DE NOVEDADES Y SAC - ${activeTenant.name.toUpperCase()}`]);
    sheetData.push([`Período Liquidado: ${selectedPeriod} | Estado: ${isCurrentPeriodClosed ? 'CERRADO / LIQUIDADO' : 'ABIERTO'}`]);
    sheetData.push([`Fecha de Generación: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`]);
    sheetData.push([]);

    // 1. TABLA PRINCIPAL DE NOVEDADES
    sheetData.push(['--- 1. TABLA PRINCIPAL DE NOVEDADES DE NÓMINA ---']);
    const mainHeaders = ['Legajo', 'Colaborador', 'Cargo', 'Sector', 'Razón Social', ...columns.map((c) => c.label)];
    sheetData.push(mainHeaders);

    filteredRows.forEach((r) => {
      const rowVals = [
        r.legajo,
        r.name,
        r.cargo,
        r.sector,
        r.razonSocial,
        ...columns.map((col) => {
          if (col.type === 'formula') {
            return evaluateFormula(r, col.formula);
          }
          return (r as any)[col.key] ?? r.customFields?.[col.key] ?? 0;
        }),
      ];
      sheetData.push(rowVals);
    });

    // Blank separator
    sheetData.push([]);
    sheetData.push([]);

    // 2. APARTADO DE AJUSTES SALARIALES Y CORRECCIONES
    sheetData.push(['--- 2. APARTADO DE AJUSTES SALARIALES Y CORRECCIONES ---']);
    sheetData.push(['Legajo', 'Nombre', 'Categoría y Cargo', 'Novedad / Actualización / Corrección', 'Monto ($)']);
    adjustments.forEach((adj) => {
      sheetData.push([adj.legajo, adj.name, adj.categoriaCargo, adj.novedadAjuste, adj.monto || '—']);
    });

    // Blank separator
    sheetData.push([]);
    sheetData.push([]);

    // 3. APARTADO A TENER EN CUENTA
    sheetData.push(['--- 3. APARTADO "A TENER EN CUENTA" PARA LIQUIDACIÓN ---']);
    sheetData.push(['Legajo', 'Nombre', 'Categoría y Cargo', 'Detalle de Novedad / Actualización']);
    notesToConsider.forEach((note) => {
      sheetData.push([note.legajo, note.name, note.categoriaCargo, note.detalleActualizacion]);
    });

    // Blank separator
    sheetData.push([]);
    sheetData.push([]);

    // 4. APARTADO DE ALTAS Y BAJAS OFICIALES
    sheetData.push(['--- 4. MOVIMIENTOS OFICIALES DE ALTAS Y BAJAS ---']);
    sheetData.push(['Tipo', 'Legajo', 'Nombre', 'Cargo', 'Fecha', 'Detalle / Razón Social']);
    (tenantData.sacReport?.altas || []).forEach((a) => {
      sheetData.push(['ALTA', a.legajo, a.name, a.cargo, a.fechaIngreso, a.razonSocial]);
    });
    (tenantData.sacReport?.bajas || []).forEach((b) => {
      sheetData.push(['BAJA', b.legajo, b.name, b.cargo, b.fechaBaja, b.motivo]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Auto width
    ws['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 28 },
      { wch: 24 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Novedades_${selectedPeriod}`);
    XLSX.writeFile(wb, `Planilla_Novedades_Consolidada_${activeTenant.slug}_${selectedPeriod}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = ['Legajo', 'Colaborador', 'Cargo', 'Sector', 'Razón Social', ...columns.map((c) => c.label)];
    const csvRows = filteredRows.map((r) => [
      r.legajo,
      `"${r.name}"`,
      `"${r.cargo}"`,
      `"${r.sector}"`,
      `"${r.razonSocial}"`,
      ...columns.map((c) => {
        if (c.type === 'formula') return evaluateFormula(r, c.formula);
        return (r as any)[c.key] ?? r.customFields?.[c.key] ?? 0;
      }),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Novedades_Liquidacion_${activeTenant.slug}_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector & Closing Actions */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                {activeTenant.branding.moduleTitles.sac || 'SAC · Novedades para Liquidación'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Solo Administrador
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Generador de novedades salariales con fórmulas, control de períodos cerrados y apartados de ajustes
            </p>
          </div>
        </div>

        {/* Period Selector & Month Closure Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {availablePeriods.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Indicator */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
              isCurrentPeriodClosed
                ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isCurrentPeriodClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isCurrentPeriodClosed ? 'Mes Cerrado' : 'Mes Abierto'}</span>
          </div>

          {/* Toggle Close / Reopen Month Button */}
          <button
            onClick={handleToggleCloseMonth}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
              isCurrentPeriodClosed
                ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
            }`}
            title={
              isCurrentPeriodClosed
                ? 'Reabrir mes para permitir correcciones'
                : 'Cerrar mes e impedir nuevas modificaciones'
            }
          >
            {isCurrentPeriodClosed ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Reabrir Novedades del Mes</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Cerrar Novedades del Mes</span>
              </>
            )}
          </button>

          {/* Export Full Excel (.xlsx) Button */}
          <button
            onClick={handleExportFullExcel}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Descarga la planilla completa con matriz y apartados en un único archivo Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Excel (.xlsx) Completo</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('matriz')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'matriz'
              ? 'bg-purple-600 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Matriz Principal ({filteredRows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ajustes_notas')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'ajustes_notas'
              ? 'bg-purple-600 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Apartado de Ajustes ({adjustments.length}) & A Tener en Cuenta ({notesToConsider.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('altas_bajas')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'altas_bajas'
              ? 'bg-purple-600 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Altas ({tenantData.sacReport?.altas?.length || 0}) & Bajas ({tenantData.sacReport?.bajas?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('columnas')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'columnas'
              ? 'bg-zinc-700 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>Configurar Columnas & Fórmulas ({columns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sac_semestral')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'sac_semestral'
              ? 'bg-purple-600 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cálculo SAC Semestral</span>
        </button>
      </div>

      {/* TAB 1: MATRIZ PRINCIPAL DE NOVEDADES */}
      {activeTab === 'matriz' && (
        <div className="space-y-4">
          {/* Rules and Integrity Banner */}
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Integridad Salarial Garantizada:</strong> Los datos de filiación (Legajo, Nombre Completo, Cargo y Sector) se sincronizan exclusivamente desde <span className="text-white font-medium">Nómina de Personal</span>. Cualquier cambio allí actualiza automáticamente todas las planillas.
              </span>
            </div>
            {isCurrentPeriodClosed && (
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold font-mono text-[11px] whitespace-nowrap">
                PERÍODO CERRADO (SOLO LECTURA)
              </span>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nombre, legajo o cargo..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
            >
              <option value="Todos">Sector: Todos</option>
              {activeTenant.masterDropdowns.areas.map((s: string) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Feriados 3-Mode Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-800/90 border border-zinc-700 p-1 rounded-lg text-xs">
              <span className="text-[11px] text-zinc-400 px-1 font-medium">Feriados:</span>
              <button
                type="button"
                onClick={() => setFeriadosDisplayMode('summary')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  feriadosDisplayMode === 'summary'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Mostrar una única columna consolidada de feriados trabajados"
              >
                Única
              </button>
              <button
                type="button"
                onClick={() => setFeriadosDisplayMode('daily')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  feriadosDisplayMode === 'daily'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Mostrar columnas separadas por cada feriado patrio (12/10, 16/10)"
              >
                Por Día
              </button>
              <button
                type="button"
                onClick={() => setFeriadosDisplayMode('none')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  feriadosDisplayMode === 'none'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Ocultar las columnas de feriados de la liquidación"
              >
                Ocultar
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>CSV</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 sticky left-0 bg-zinc-950/90 z-10">
                      Legajo & Colaborador (Nómina)
                    </th>
                    <th className="px-4 py-3">Sector</th>
                    <th className="px-4 py-3">Razón Social</th>
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {col.type === 'formula' && (
                            <span className="px-1 bg-purple-500/20 text-purple-300 text-[9px] rounded font-mono font-bold" title={`Fórmula: ${col.formula}`}>
                              fx
                            </span>
                          )}
                          <span>{col.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredRows.map((row) => (
                    <tr key={row.employeeId} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Read-Only Employee Identity */}
                      <td className="px-4 py-3 sticky left-0 bg-zinc-900/90 z-10 border-r border-zinc-800/60">
                        <div className="font-semibold text-white">{row.name}</div>
                        <div className="font-mono text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <span>{row.legajo}</span>
                          <span>·</span>
                          <span className="text-zinc-300">{row.cargo}</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">Nómina ✓</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{row.sector}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.razonSocial}</td>

                      {/* Operational & Formula Columns */}
                      {columns.map((col) => {
                        if (col.type === 'formula') {
                          const calculatedVal = evaluateFormula(row, col.formula);
                          return (
                            <td key={col.key} className="px-4 py-3 text-right">
                              <span
                                className="px-2 py-1 bg-purple-950/50 border border-purple-800/50 rounded font-mono text-purple-200 font-bold inline-block text-xs"
                                title={`Calculado por fórmula: ${col.formula}`}
                              >
                                {calculatedVal.toLocaleString('es-AR')}
                              </span>
                            </td>
                          );
                        }

                        const val = (row as any)[col.key] ?? row.customFields?.[col.key] ?? 0;
                        return (
                          <td key={col.key} className="px-4 py-3 text-right">
                            <input
                              type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                              value={val}
                              disabled={isCurrentPeriodClosed}
                              onChange={(e) =>
                                handleUpdateRowValue(
                                  row,
                                  col.key,
                                  col.type === 'number' || col.type === 'currency'
                                    ? Number(e.target.value)
                                    : e.target.value
                                )
                              }
                              className={`w-20 px-2 py-1 border rounded text-right font-mono text-xs focus:outline-none ${
                                isCurrentPeriodClosed
                                  ? 'bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed'
                                  : 'bg-zinc-950 border-zinc-800 text-white focus:border-purple-500'
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 3} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No se encontraron colaboradores activos en la matriz de novedades para el filtro actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APARTADO DE AJUSTES Y APARTADO A TENER EN CUENTA (REQ 14) */}
      {activeTab === 'ajustes_notas' && (
        <div className="space-y-6">
          {/* APARTADO 1: AJUSTES SALARIALES Y CORRECCIONES */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h3 className="font-semibold text-sm text-white">
                    Apartado de Ajustes Salariales y Correcciones
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Detalle de correcciones retroactivas, plus excepcionales, errores de liquidación previa o bonos convenidos
                </p>
              </div>

              {!isCurrentPeriodClosed && (
                <button
                  onClick={() => setIsAddAdjModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Ajuste</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Legajo</th>
                    <th className="px-4 py-3">Nombre Colaborador</th>
                    <th className="px-4 py-3">Categoría y Cargo</th>
                    <th className="px-4 py-3">Novedad / Actualización / Corrección</th>
                    <th className="px-4 py-3 text-right">Monto ($)</th>
                    {!isCurrentPeriodClosed && <th className="px-4 py-3 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-mono font-semibold text-purple-400">{adj.legajo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{adj.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{adj.categoriaCargo}</td>
                      <td className="px-4 py-3 text-zinc-200 bg-zinc-950/40 font-mono text-[11px]">
                        {adj.novedadAjuste}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {adj.monto ? `$${adj.monto.toLocaleString('es-AR')}` : '—'}
                      </td>
                      {!isCurrentPeriodClosed && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteAdjustment(adj.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded cursor-pointer"
                            title="Eliminar ajuste"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {adjustments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 text-xs">
                        No hay ajustes salariales registrados para este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* APARTADO 2: A TENER EN CUENTA / ACTUALIZACIONES DE SUELDO */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h3 className="font-semibold text-sm text-white">
                    Apartado "A Tener en Cuenta" para Liquidación
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cambios de convenio, ascensos de categoría, novedades de efectivización y pautas particulares para el liquidador
                </p>
              </div>

              {!isCurrentPeriodClosed && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncPunchesToNotes}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-900/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Importa tardanzas y salidas anticipadas de fichadas al panel de liquidación"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sincronizar Inconsistencias Fichadas</span>
                  </button>
                  <button
                    onClick={() => setIsAddNoteModalOpen(true)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Nota</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Legajo</th>
                    <th className="px-4 py-3">Nombre Colaborador</th>
                    <th className="px-4 py-3">Categoría y Cargo</th>
                    <th className="px-4 py-3">Detalle Novedad / Actualización a Considerar</th>
                    {!isCurrentPeriodClosed && <th className="px-4 py-3 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {notesToConsider.map((note) => (
                    <tr key={note.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-mono font-semibold text-cyan-400">{note.legajo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{note.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{note.categoriaCargo}</td>
                      <td className="px-4 py-3 text-zinc-200 bg-zinc-950/40 leading-relaxed text-[11px]">
                        {note.detalleActualizacion}
                      </td>
                      {!isCurrentPeriodClosed && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditNote(note)}
                              className="p-1 text-zinc-400 hover:text-cyan-300 rounded cursor-pointer"
                              title="Editar observación"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-zinc-500 hover:text-red-400 rounded cursor-pointer"
                              title="Eliminar observación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {notesToConsider.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-xs">
                        No hay notas u observaciones registradas en este apartado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APARTADO DE ALTAS & BAJAS */}
      {activeTab === 'altas_bajas' && (
        <div className="space-y-6">
          {/* Altas */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-xs text-white">
                  Apartado Oficial de Altas del Período ({tenantData.sacReport?.altas?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Impactan en matriz principal
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Fecha de Ingreso</th>
                    <th className="px-4 py-3">Legajo</th>
                    <th className="px-4 py-3">Nombre Colaborador</th>
                    <th className="px-4 py-3">Cargo Asignado</th>
                    <th className="px-4 py-3">Razón Social</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {(tenantData.sacReport?.altas || []).map((a, i) => (
                    <tr key={i} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-mono text-emerald-400">{a.fechaIngreso}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{a.legajo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{a.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{a.cargo}</td>
                      <td className="px-4 py-3 text-zinc-400">{a.razonSocial}</td>
                    </tr>
                  ))}
                  {(!tenantData.sacReport?.altas || tenantData.sacReport.altas.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-xs">
                        No hay altas registradas para este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bajas */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-400" />
                <h3 className="font-semibold text-xs text-white">
                  Apartado Oficial de Bajas del Período ({tenantData.sacReport?.bajas?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                Excluidas de matriz principal
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Fecha de Baja</th>
                    <th className="px-4 py-3">Legajo</th>
                    <th className="px-4 py-3">Nombre Colaborador</th>
                    <th className="px-4 py-3">Último Cargo</th>
                    <th className="px-4 py-3">Motivo Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {(tenantData.sacReport?.bajas || []).map((b, i) => (
                    <tr key={i} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-mono text-red-400">{b.fechaBaja}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{b.legajo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{b.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{b.cargo}</td>
                      <td className="px-4 py-3 text-zinc-300">{b.motivo}</td>
                    </tr>
                  ))}
                  {(!tenantData.sacReport?.bajas || tenantData.sacReport.bajas.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-xs">
                        No hay bajas registradas para este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURADOR DE COLUMNAS & FÓRMULAS */}
      {activeTab === 'columnas' && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-5 max-w-4xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-sm text-white">
                Personalización de Columnas y Fórmulas de Liquidación
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Define columnas monetarias, numéricas o automáticas calculadas con fórmulas de sumas o multiplicaciones tipo Excel.
              </p>
            </div>
            <button
              onClick={() => setIsNewColModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Columna / Fórmula</span>
            </button>
          </div>

          <div className="space-y-3">
            {columns.map((col, index) => (
              <div
                key={col.key}
                className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Etiqueta Columna</span>
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => {
                      const updated = columns.map((c, i) => (i === index ? { ...c, label: e.target.value } : c));
                      handleSaveColumns(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-40">
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Formato</span>
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const updated = columns.map((c, i) =>
                        i === index ? { ...c, type: e.target.value as any } : c
                      );
                      handleSaveColumns(updated);
                    }}
                    className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 focus:outline-none"
                  >
                    <option value="number">Numérico</option>
                    <option value="currency">Monetario ($)</option>
                    <option value="text">Texto</option>
                    <option value="date">Fecha</option>
                    <option value="formula">Fórmula (fx)</option>
                  </select>
                </div>

                {col.type === 'formula' && (
                  <div className="flex-1 w-full sm:w-auto">
                    <span className="text-[10px] text-purple-400 uppercase block font-mono">Fórmula (ej: horas * 1.5)</span>
                    <input
                      type="text"
                      value={col.formula || ''}
                      placeholder="horasNocturnas * 1.5"
                      onChange={(e) => {
                        const updated = columns.map((c, i) =>
                          i === index ? { ...c, formula: e.target.value } : c
                        );
                        handleSaveColumns(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-purple-800/60 rounded text-purple-300 font-mono text-[11px] focus:outline-none"
                    />
                  </div>
                )}

                <button
                  onClick={() => handleDeleteColumn(col.key)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded cursor-pointer self-end sm:self-center"
                  title="Eliminar columna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CÁLCULO SAC SEMESTRAL (SUELDO ANUAL COMPLEMENTARIO) */}
      {activeTab === 'sac_semestral' && (() => {
        const semesterMonths =
          sacSemester === '1'
            ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio']
            : ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const activeEmployees = tenantData.employees.filter((e) => e.status === 'Activo');

        const sacRowsData = activeEmployees.map((emp) => {
          // Estimated base from scale or legajo
          const baseEstimated = 780000 + ((parseInt(emp.legajo.replace(/\D/g, ''), 10) || 1000) % 15) * 22000;
          // Monthly salaries
          const monthlySalaries = semesterMonths.map((_, idx) => {
            const factor = 1 + (idx === 4 ? 0.12 : idx === 2 ? 0.06 : (idx * 0.02));
            return Math.round(baseEstimated * factor);
          });

          const bestGross = Math.max(...monthlySalaries);
          // Check hireDate for semester proportionality
          const hireYear = emp.hireDate ? new Date(emp.hireDate).getFullYear() : 2021;
          const hireMonth = emp.hireDate ? new Date(emp.hireDate).getMonth() + 1 : 1;
          let daysWorked = 180;
          if (hireYear === 2026) {
            const startSemMonth = sacSemester === '1' ? 1 : 7;
            const endSemMonth = sacSemester === '1' ? 6 : 12;
            if (hireMonth >= startSemMonth && hireMonth <= endSemMonth) {
              const monthsInSem = endSemMonth - hireMonth + 1;
              daysWorked = Math.min(180, monthsInSem * 30);
            }
          }

          const sacBruto = Math.round((bestGross / 2) * (daysWorked / 180));
          const deducciones = Math.round(sacBruto * 0.17); // 17% aportes de ley
          const sacNeto = sacBruto - deducciones;

          return {
            emp,
            monthlySalaries,
            bestGross,
            daysWorked,
            sacBruto,
            deducciones,
            sacNeto,
          };
        });

        const totalSacBruto = sacRowsData.reduce((acc, curr) => acc + curr.sacBruto, 0);
        const totalSacNeto = sacRowsData.reduce((acc, curr) => acc + curr.sacNeto, 0);

        const handleExportSacExcel = () => {
          const wb = XLSX.utils.book_new();
          const sheetData: any[][] = [];
          sheetData.push([`PLANILLA OFICIAL DE CÁLCULO SAC - ${sacSemester}° SEMESTRE 2026`]);
          sheetData.push([`Empresa: ${activeTenant.name} | Razón Social: ${activeTenant.masterDropdowns.razonesSociales[0] || 'Grupo Industrial'}`]);
          sheetData.push([]);
          sheetData.push([
            'Legajo',
            'Colaborador',
            'Cargo',
            'Sector',
            ...semesterMonths,
            'Mejor Remun. Bruta',
            'Días Trab.',
            'SAC Bruto',
            'Deducciones (17%)',
            'SAC Neto a Pagar',
          ]);

          sacRowsData.forEach((row) => {
            sheetData.push([
              row.emp.legajo,
              `${row.emp.name} ${row.emp.lastName}`,
              row.emp.cargo,
              row.emp.area,
              ...row.monthlySalaries,
              row.bestGross,
              row.daysWorked,
              row.sacBruto,
              row.deducciones,
              row.sacNeto,
            ]);
          });

          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(wb, ws, `SAC_Semestre_${sacSemester}`);
          XLSX.writeFile(wb, `SAC_Semestre_${sacSemester}_${activeTenant.slug}_2026.xlsx`);
        };

        return (
          <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-zinc-400">Total Provisión SAC Bruto</div>
                <div className="text-2xl font-bold text-white font-mono">${totalSacBruto.toLocaleString('es-AR')}</div>
                <div className="text-[11px] text-zinc-500">Monto devengado a liquidar</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-zinc-400">Total SAC Neto a Bolsillo</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">${totalSacNeto.toLocaleString('es-AR')}</div>
                <div className="text-[11px] text-zinc-500">Monto final neto transferible</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-zinc-400">Colaboradores Beneficiarios</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">{activeEmployees.length} activos</div>
                <div className="text-[11px] text-zinc-500">Cómputo proporcional según LCT</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-300 font-semibold">Semestre a Liquidar:</span>
                <div className="flex items-center bg-zinc-800 p-1 rounded-lg border border-zinc-700 text-xs">
                  <button
                    onClick={() => setSacSemester('1')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      sacSemester === '1' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    1° Semestre (Ene - Jun)
                  </button>
                  <button
                    onClick={() => setSacSemester('2')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      sacSemester === '2' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    2° Semestre (Jul - Dic)
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportSacExcel}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Planilla SAC Semestral (.xlsx)</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 bg-zinc-950/90 z-10">Colaborador</th>
                      <th className="px-4 py-3">Sector</th>
                      {semesterMonths.map((m) => (
                        <th key={m} className="px-3 py-3 text-right">{m.slice(0, 3)}</th>
                      ))}
                      <th className="px-4 py-3 text-right">Mejor Bruto</th>
                      <th className="px-3 py-3 text-right">Días</th>
                      <th className="px-4 py-3 text-right">SAC Bruto</th>
                      <th className="px-4 py-3 text-right">Ret. 17%</th>
                      <th className="px-4 py-3 text-right text-emerald-300">SAC Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {sacRowsData.map((r) => (
                      <tr key={r.emp.id} className="hover:bg-zinc-800/40">
                        <td className="px-4 py-3 sticky left-0 bg-zinc-900/90 z-10 border-r border-zinc-800/60">
                          <div className="font-semibold text-white">{r.emp.name} {r.emp.lastName}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{r.emp.legajo} · {r.emp.cargo}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{r.emp.area}</td>
                        {r.monthlySalaries.map((sal, idx) => (
                          <td key={idx} className="px-3 py-3 text-right font-mono text-zinc-400">
                            ${(sal / 1000).toFixed(0)}k
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                          ${r.bestGross.toLocaleString('es-AR')}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-zinc-300">{r.daysWorked} d.</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-white">
                          ${r.sacBruto.toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-red-400">
                          -${r.deducciones.toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 bg-emerald-950/20">
                          ${r.sacNeto.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: EDITAR NOTA "A TENER EN CUENTA" */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Editar Nota "A Tener en Cuenta"</h3>
              <button onClick={() => setEditingNote(null)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditNote} className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-300 space-y-1">
                <div>Colaborador: <strong className="text-white">{editingNote.name}</strong> ({editingNote.legajo})</div>
                <div className="text-zinc-400">{editingNote.categoriaCargo}</div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Detalle de Novedad / Pauta para Liquidación
                </label>
                <textarea
                  rows={4}
                  value={editNoteDetalle}
                  onChange={(e) => setEditNoteDetalle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isNewColModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Nueva Columna o Fórmula de Liquidación</h3>
              <button onClick={() => setIsNewColModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Título de la Columna *</label>
                <input
                  type="text"
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="Ej. Plus Productividad / Total Remunerativo"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tipo de Formato Aceptado</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                >
                  <option value="number">Numérico (horas, días)</option>
                  <option value="currency">Monetario en Pesos ($)</option>
                  <option value="text">Texto / Observación</option>
                  <option value="date">Fecha</option>
                  <option value="formula">Fórmula Calculada (fx)</option>
                </select>
              </div>

              {newColType === 'formula' && (
                <div>
                  <label className="block text-zinc-400 mb-1">Expresión de Fórmula (ej: horasNocturnas * 1.5)</label>
                  <input
                    type="text"
                    value={newColFormula}
                    onChange={(e) => setNewColFormula(e.target.value)}
                    placeholder="horasNocturnas * 1.5 + feriadosTrabajados * 2"
                    className="w-full px-3 py-2 bg-zinc-800 border border-purple-700 rounded-lg text-purple-300 font-mono text-[11px] focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Puedes operar sumas, restas y multiplicaciones referenciando columnas como <code className="text-purple-300">horasJMG</code>, <code className="text-purple-300">horasNocturnas</code>, <code className="text-purple-300">anticipos</code>, etc.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewColModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Crear Columna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR AJUSTE SALARIAL */}
      {isAddAdjModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Nuevo Ajuste Salarial / Corrección</h3>
              <button onClick={() => setIsAddAdjModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdjustmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador (Nómina Activa) *</label>
                <select
                  value={adjLegajo}
                  onChange={(e) => setAdjLegajo(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                >
                  <option value="">Selecciona un colaborador...</option>
                  {tenantData.employees
                    .filter((e) => e.status === 'Activo')
                    .map((e) => (
                      <option key={e.id} value={e.legajo}>
                        {e.legajo} · {e.name} {e.lastName} ({e.cargo})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Novedad / Actualización / Corrección *</label>
                <textarea
                  value={adjNovedad}
                  onChange={(e) => setAdjNovedad(e.target.value)}
                  placeholder="Detalla el motivo del ajuste o retroactivo..."
                  className="w-full h-20 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Monto del Ajuste en Pesos ($)</label>
                <input
                  type="number"
                  value={adjMonto || ''}
                  onChange={(e) => setAdjMonto(Number(e.target.value))}
                  placeholder="Ej. 35000"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdjModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg cursor-pointer"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR NOTA A TENER EN CUENTA */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Nueva Nota "A Tener en Cuenta"</h3>
              <button onClick={() => setIsAddNoteModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Colaborador (Nómina Activa) *</label>
                <select
                  value={noteLegajo}
                  onChange={(e) => setNoteLegajo(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                >
                  <option value="">Selecciona un colaborador...</option>
                  {tenantData.employees
                    .filter((e) => e.status === 'Activo')
                    .map((e) => (
                      <option key={e.id} value={e.legajo}>
                        {e.legajo} · {e.name} {e.lastName} ({e.cargo})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Detalle de Novedad / Actualización de Sueldo *</label>
                <textarea
                  value={noteDetalle}
                  onChange={(e) => setNoteDetalle(e.target.value)}
                  placeholder="Detalla cambios de categoría, actualización de básico, o particularidades para el liquidador..."
                  className="w-full h-24 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Guardar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
