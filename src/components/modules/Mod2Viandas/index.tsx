import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { MealOptionType, MealMenuDay } from '../../../types';
import {
  UtensilsCrossed,
  MapPin,
  Lock,
  Unlock,
  Calendar,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  ChefHat,
  Search,
  Printer,
  CalendarDays,
  Clock,
  AlertCircle,
  Download,
  Upload,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Mod2Viandas: React.FC = () => {
  const {
    activeTenant,
    tenantData,
    addMealReservation,
    saveMealMenuDay,
    saveMealOptions,
    updateActiveTenant,
  } = useTenant();
  const { role, currentEmployee, currentJefe } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isCocina = role === 'cocina';
  const isJefe = role === 'jefe';
  const canManageKitchen = isAdmin || isCocina;

  // Selected Sede
  const [selectedSedeId, setSelectedSedeId] = useState<string>(activeTenant.sedes[0]?.id || '');
  const activeSede = activeTenant.sedes.find((s) => s.id === selectedSedeId) || activeTenant.sedes[0];

  // View tabs
  const [activeTab, setActiveTab] = useState<'consultar' | 'reservar' | 'admin_menu' | 'admin_cocina'>(
    canManageKitchen ? 'admin_cocina' : 'reservar'
  );

  // Search History State (General - Ver)
  const [searchName, setSearchName] = useState(currentEmployee.name || '');
  const [timeFilter, setTimeFilter] = useState<'todas' | 'hoy' | 'futuras' | 'anteriores'>('todas');

  // Reservation State (General - Agregar)
  const [resName, setResName] = useState(currentEmployee.name || '');
  const [resLegajo, setResLegajo] = useState(currentEmployee.legajo || 'LEG-1045');
  const [resDate, setResDate] = useState('2026-10-13');
  const [resOptionId, setResOptionId] = useState(activeTenant.mealOptions[0]?.id || '');
  const [resNotes, setResNotes] = useState('');
  const [resSuccessMessage, setResSuccessMessage] = useState('');

  // Admin: Meal Options Editor Modal
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [editableOptions, setEditableOptions] = useState<MealOptionType[]>([...activeTenant.mealOptions]);
  const [newOptName, setNewOptName] = useState('');
  const [newOptDesc, setNewOptDesc] = useState('');
  const [newOptColor, setNewOptColor] = useState('indigo');

  // Admin: Daily Menu Day Editor
  const [menuEditDate, setMenuEditDate] = useState('2026-10-14');
  const [dishMap, setDishMap] = useState<Record<string, string>>({});
  const [menuSavedMsg, setMenuSavedMsg] = useState('');

  // Excel / CSV Menu Upload State (Req 6)
  const [excelUploadSuccess, setExcelUploadSuccess] = useState('');
  const [excelUploadError, setExcelUploadError] = useState('');

  // Cocina Consolidation State (Req 5): Date Range Filtering
  const [kitchenStartDate, setKitchenStartDate] = useState('2026-10-12');
  const [kitchenEndDate, setKitchenEndDate] = useState('2026-10-18');
  const [kitchenSedeScope, setKitchenSedeScope] = useState<string>('sede_actual'); // 'sede_actual' or 'todas'

  const handleSedeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSedeId(e.target.value);
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSede) return;

    // Check if date is manually closed by Cocina / Admin
    const isClosedDate = (activeTenant.cocinaOrdersClosedDates || []).includes(resDate);
    if (isClosedDate) {
      alert(`La cocina ha cerrado la recepción de pedidos para la fecha ${resDate}.`);
      return;
    }

    // Check cutoff advance days
    const minCutoffDays = activeTenant.cocinaCutoffDaysBefore ?? 1;
    const diffDays = Math.floor(
      (new Date(resDate).getTime() - new Date('2026-10-12').getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < minCutoffDays) {
      alert(
        `Política de Cocina: Los pedidos deben realizarse con al menos ${minCutoffDays} día(s) de anticipación. Para ${resDate} el plazo se encuentra cerrado.`
      );
      return;
    }

    const option = activeTenant.mealOptions.find((o) => o.id === resOptionId);
    if (!option) return;

    addMealReservation({
      employeeName: resName.trim(),
      employeeLegajo: resLegajo.trim(),
      sedeId: activeSede.id,
      date: resDate,
      optionId: option.id,
      optionName: option.name,
      notes: resNotes.trim(),
    });

    setResSuccessMessage(`¡Vianda reservada con éxito para el ${resDate} (${option.name})!`);
    setTimeout(() => setResSuccessMessage(''), 4000);
  };

  // Filter history: time filter (hoy, futuras, anteriores), role privacy, and employee search
  const todayDateStr = '2026-10-12';
  const filteredHistory = tenantData.mealReservations.filter((res) => {
    // Privacy: Collaborators ONLY see their own meal reservations
    if (role === 'employee') {
      const isMyRes =
        (currentEmployee.legajo && res.employeeLegajo.toLowerCase() === currentEmployee.legajo.toLowerCase()) ||
        (currentEmployee.name && res.employeeName.toLowerCase() === currentEmployee.name.toLowerCase());
      if (!isMyRes) return false;
    }
    if (activeSede && res.sedeId !== activeSede.id) return false;
    if (searchName.trim()) {
      const matchesSearch =
        res.employeeName.toLowerCase().includes(searchName.toLowerCase()) ||
        res.employeeLegajo.toLowerCase().includes(searchName.toLowerCase());
      if (!matchesSearch) return false;
    }
    if (timeFilter === 'hoy') return res.date === todayDateStr;
    if (timeFilter === 'futuras') return res.date > todayDateStr;
    if (timeFilter === 'anteriores') return res.date < todayDateStr;
    return true;
  });

  // Calculate kitchen consolidation across date range (Requirement 5)
  // Generates date sequence between kitchenStartDate and kitchenEndDate
  const getDateRangeArray = (startStr: string, endStr: string): string[] => {
    const dates: string[] = [];
    const cur = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(cur.getTime()) || isNaN(end.getTime()) || cur > end) {
      return [startStr];
    }
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  const consolidationDates = getDateRangeArray(kitchenStartDate, kitchenEndDate);

  // Relevant reservations in the date range
  const rangeReservations = tenantData.mealReservations.filter((r) => {
    if (kitchenSedeScope === 'sede_actual' && activeSede && r.sedeId !== activeSede.id) {
      return false;
    }
    return r.date >= kitchenStartDate && r.date <= kitchenEndDate;
  });

  // Build matrix per day and per menu option
  interface DayConsolidationRow {
    date: string;
    dayOfWeek: string;
    countsByOption: Record<string, number>;
    totalDay: number;
  }

  const daysOfWeekNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const consolidationRows: DayConsolidationRow[] = consolidationDates.map((dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = daysOfWeekNames[d.getDay()] || '';
    const dayReservations = rangeReservations.filter((r) => r.date === dateStr);

    const countsByOption: Record<string, number> = {};
    activeTenant.mealOptions.forEach((opt) => {
      countsByOption[opt.id] = dayReservations.filter((r) => r.optionId === opt.id).length;
    });

    return {
      date: dateStr,
      dayOfWeek,
      countsByOption,
      totalDay: dayReservations.length,
    };
  });

  // Totals per menu option across the period
  const totalsByOption: Record<string, number> = {};
  activeTenant.mealOptions.forEach((opt) => {
    totalsByOption[opt.id] = consolidationRows.reduce((acc, r) => acc + (r.countsByOption[opt.id] || 0), 0);
  });
  const grandTotalPeriod = consolidationRows.reduce((acc, r) => acc + r.totalDay, 0);

  // Quick preset handlers for dates
  const handleSetQuickPeriod = (preset: 'hoy' | 'semana_actual' | 'semana_proxima' | 'mes') => {
    if (preset === 'hoy') {
      setKitchenStartDate('2026-10-12');
      setKitchenEndDate('2026-10-12');
    } else if (preset === 'semana_actual') {
      setKitchenStartDate('2026-10-12');
      setKitchenEndDate('2026-10-18');
    } else if (preset === 'semana_proxima') {
      setKitchenStartDate('2026-10-19');
      setKitchenEndDate('2026-10-25');
    } else if (preset === 'mes') {
      setKitchenStartDate('2026-10-01');
      setKitchenEndDate('2026-10-31');
    }
  };

  // Export Consolidation Pivot Table to Excel
  const handleExportConsolidationExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheetData: any[][] = [];

    sheetData.push([`CONSOLIDADO DE COCINA & VIANDAS - ${activeTenant.name.toUpperCase()}`]);
    sheetData.push([
      `Sede: ${kitchenSedeScope === 'todas' ? 'Todas las Sedes (Consolidado General)' : activeSede?.name || 'Sede Actual'} | Período: ${kitchenStartDate} al ${kitchenEndDate}`,
    ]);
    sheetData.push([`Generado el: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`]);
    sheetData.push([]);

    // Headers
    const headers = ['Fecha', 'Día', ...activeTenant.mealOptions.map((o) => o.name), 'Total Viandas del Día'];
    sheetData.push(headers);

    // Rows
    consolidationRows.forEach((row) => {
      sheetData.push([
        row.date,
        row.dayOfWeek,
        ...activeTenant.mealOptions.map((opt) => row.countsByOption[opt.id] || 0),
        row.totalDay,
      ]);
    });

    // Summary footer row
    sheetData.push([
      'TOTALES DEL PERÍODO',
      '—',
      ...activeTenant.mealOptions.map((opt) => totalsByOption[opt.id] || 0),
      grandTotalPeriod,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, ...activeTenant.mealOptions.map(() => ({ wch: 20 })), { wch: 22 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Consolidado_Cocina');
    XLSX.writeFile(wb, `Consolidado_Cocina_${activeTenant.slug}_${kitchenStartDate}_al_${kitchenEndDate}.xlsx`);
  };

  // Export Menu Template Download (Req 6)
  const handleDownloadMenuTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      'Fecha (YYYY-MM-DD)',
      ...activeTenant.mealOptions.map((o) => `Menú: ${o.name}`),
      'Postre / Guarnición (Opcional)',
      'Observaciones Especiales',
    ];

    const sampleRows = [
      [
        '2026-10-19',
        ...activeTenant.mealOptions.map((o, idx) =>
          idx === 0
            ? 'Pollo al horno con papas rústicas'
            : idx === 1
            ? 'Wok de vegetales y arroz yamaní'
            : 'Milanesa con puré apto sin TACC'
        ),
        'Flan casero o Fruta de estación',
        'Catering contratado Servifood',
      ],
      [
        '2026-10-20',
        ...activeTenant.mealOptions.map((o, idx) =>
          idx === 0
            ? 'Pastel de papas tradicional'
            : idx === 1
            ? 'Tarta integral de espinaca y ricota'
            : 'Pechuga grillé con ensalada mixta sin TACC'
        ),
        'Gelatina light o Fruta fresca',
        'Entregar antes de las 11:30 hs',
      ],
    ];

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
      ws['!cols'] = [{ wch: 20 }, ...activeTenant.mealOptions.map(() => ({ wch: 32 })), { wch: 28 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Menu');
      XLSX.writeFile(wb, `Plantilla_Menu_Viandas_${activeTenant.slug}.xlsx`);
    } else {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      const encoded = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encoded);
      link.setAttribute('download', `Plantilla_Menu_Viandas_${activeTenant.slug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Upload Menu File (Excel / CSV)
  const handleMenuFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelUploadSuccess('');
    setExcelUploadError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rows || rows.length < 2) {
          setExcelUploadError('El archivo no contiene suficientes filas de datos.');
          return;
        }

        const headerRow = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const dateColIdx = headerRow.findIndex((h) => h.includes('fecha'));

        if (dateColIdx === -1) {
          setExcelUploadError('No se encontró la columna obligatoria "Fecha" en el encabezado.');
          return;
        }

        let loadedCount = 0;
        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[dateColIdx]) continue;

          let rawDate = String(row[dateColIdx]).trim();
          // Normalize if excel serial date
          if (!rawDate.includes('-') && !isNaN(Number(rawDate))) {
            const parsed = new Date(Math.round((Number(rawDate) - 25569) * 86400 * 1000));
            rawDate = parsed.toISOString().split('T')[0];
          }

          const optionsMap: Record<string, string> = {};

          // Map each option
          activeTenant.mealOptions.forEach((opt, optIdx) => {
            // Find column matching option name or index
            const matchingColIdx = headerRow.findIndex((h) =>
              h.includes(opt.name.toLowerCase().substring(0, 6))
            );
            if (matchingColIdx !== -1 && row[matchingColIdx]) {
              optionsMap[opt.id] = String(row[matchingColIdx]).trim();
            } else if (row[dateColIdx + 1 + optIdx]) {
              optionsMap[opt.id] = String(row[dateColIdx + 1 + optIdx]).trim();
            } else {
              optionsMap[opt.id] = `Plato del día (${opt.name})`;
            }
          });

          saveMealMenuDay({
            id: `menu-${rawDate}`,
            date: rawDate,
            options: optionsMap,
          });
          loadedCount++;
        }

        setExcelUploadSuccess(
          `¡Carga exitosa! Se procesaron y guardaron ${loadedCount} días de menú con las opciones de viandas de ${activeTenant.name}.`
        );
        setTimeout(() => setExcelUploadSuccess(''), 6000);
      } catch (err: any) {
        setExcelUploadError(`Error al leer el archivo: ${err.message || 'Formato no soportado.'}`);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  // Options editor handlers
  const handleSaveMealOptions = () => {
    saveMealOptions(editableOptions);
    setIsOptionsModalOpen(false);
  };

  const handleAddOption = () => {
    if (!newOptName.trim()) return;
    const newOpt: MealOptionType = {
      id: `opt-${Date.now()}`,
      name: newOptName.trim(),
      description: newOptDesc.trim() || 'Opción configurada por la empresa',
      badgeColor: newOptColor,
      isAvailable: true,
    };
    setEditableOptions([...editableOptions, newOpt]);
    setNewOptName('');
    setNewOptDesc('');
  };

  const handleRemoveOption = (id: string) => {
    setEditableOptions(editableOptions.filter((o) => o.id !== id));
  };

  // Menu day manual save
  const handleSaveDayMenu = (e: React.FormEvent) => {
    e.preventDefault();
    saveMealMenuDay({
      id: `menu-${menuEditDate}`,
      date: menuEditDate,
      options: dishMap,
    });
    setMenuSavedMsg(`¡Menú guardado para la fecha ${menuEditDate}!`);
    setTimeout(() => setMenuSavedMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sede Security Gate */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.viandas || 'Viandas & Comedor de Sede'}
            </h2>
            <p className="text-xs text-zinc-400">
              Gestión descentralizada de catering, pedidos diarios y reporte consolidado para cocina
            </p>
          </div>
        </div>

        {/* Sede Selector with Lock Status */}
        <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800 self-start md:self-auto">
          <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
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
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('reservar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'reservar'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Reservar Vianda (Agregar)
              </button>
              <button
                onClick={() => setActiveTab('consultar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'consultar'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Consultar Reservas (Ver Historial)
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('admin_cocina')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'admin_cocina'
                        ? 'bg-amber-600 text-zinc-950 shadow-sm font-bold'
                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-900/40'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Consolidado Cocina Multi-Fecha (Mod 2)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('admin_menu')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'admin_menu'
                        ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                        : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/40'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Carga de Menú & Excel Masivo</span>
                  </button>
                </>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsOptionsModalOpen(true)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Opciones de Menú Empresa ({activeTenant.mealOptions.length})</span>
              </button>
            )}
          </div>

          {/* TAB 1: RESERVAR VIANDA (COLABORADOR) */}
          {activeTab === 'reservar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-zinc-900/70 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Reserva Diaria en {activeSede.name}
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Selecciona la fecha y el tipo de menú. La vianda se reservará automáticamente a tu nombre.
                </p>

                {resSuccessMessage && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{resSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleReservationSubmit} className="space-y-4 text-xs">
                  {(role === 'jefe' || isAdmin) && (
                    <div className="p-3 bg-zinc-800/40 border border-zinc-700/80 rounded-lg space-y-1.5">
                      <label className="block text-zinc-300 font-semibold flex items-center justify-between">
                        <span>
                          {role === 'jefe'
                            ? `Asignar Vianda a Miembro del Equipo (${currentJefe?.sector || 'Mi Sector'})`
                            : 'Asignar Vianda a Colaborador de Nómina'}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-normal">
                          {role === 'jefe' ? 'Filtro exclusivo de sector' : 'Acceso global Admin'}
                        </span>
                      </label>
                      <select
                        onChange={(e) => {
                          const emp = tenantData.employees.find((x) => x.id === e.target.value);
                          if (emp) {
                            setResName(`${emp.name} ${emp.lastName}`.trim());
                            setResLegajo(emp.legajo);
                          }
                        }}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                      >
                        <option value="">-- Seleccionar colaborador para encargar vianda --</option>
                        {(role === 'jefe'
                          ? tenantData.employees.filter(
                              (e) =>
                                e.status === 'Activo' &&
                                (e.area === currentJefe?.sector || e.department === currentJefe?.sector)
                            )
                          : tenantData.employees.filter((e) => e.status === 'Activo')
                        ).map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.lastName} ({emp.legajo}) · {emp.cargo}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center justify-between">
                        <span>Nombre Completo</span>
                        {role === 'employee' && (
                          <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Vinculado a nómina
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={resName}
                        onChange={(e) => setResName(e.target.value)}
                        disabled={role === 'employee'}
                        className={`w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white ${
                          role === 'employee' ? 'opacity-70 cursor-not-allowed bg-zinc-800/60' : ''
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1 flex items-center justify-between">
                        <span>Legajo</span>
                        {role === 'employee' && (
                          <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Vinculado a nómina
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={resLegajo}
                        onChange={(e) => setResLegajo(e.target.value)}
                        disabled={role === 'employee'}
                        className={`w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono ${
                          role === 'employee' ? 'opacity-70 cursor-not-allowed bg-zinc-800/60' : ''
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Fecha de Consumo</label>
                      <input
                        type="date"
                        value={resDate}
                        onChange={(e) => setResDate(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1">Opción de Menú</label>
                      <select
                        value={resOptionId}
                        onChange={(e) => setResOptionId(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
                      >
                        {activeTenant.mealOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} ({opt.description})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">
                      Observaciones / Restricciones Nutricionales
                    </label>
                    <input
                      type="text"
                      value={resNotes}
                      onChange={(e) => setResNotes(e.target.value)}
                      placeholder="Ej. Sin sal agregada / Con cubiertos descartables..."
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Confirmar Reserva
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Menu del Día */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <CalendarDays className="w-4 h-4" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider">Menú para el {resDate}</h4>
                </div>

                <div className="space-y-3 text-xs">
                  {activeTenant.mealOptions.map((opt) => {
                    const dayMenu = tenantData.mealMenus.find((m) => m.date === resDate);
                    const dish = dayMenu?.options[opt.id] || 'Plato especial del concesionario';
                    const isSelected = resOptionId === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => setResOptionId(opt.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 text-white'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">{opt.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{dish}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSULTAR HISTORIAL */}
          {activeTab === 'consultar' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Filtrar por nombre o legajo..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setTimeFilter('todas')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      timeFilter === 'todas' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('hoy')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      timeFilter === 'hoy' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('futuras')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      timeFilter === 'futuras' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Futuras
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('anteriores')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      timeFilter === 'anteriores' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Anteriores
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-300">
                  Registros de Viandas ({filteredHistory.length} encontrados)
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">Fecha de Consumo</th>
                        <th className="px-4 py-3">Colaborador</th>
                        <th className="px-4 py-3">Legajo</th>
                        <th className="px-4 py-3">Opción Seleccionada</th>
                        <th className="px-4 py-3">Observaciones</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredHistory.map((res) => {
                        const isPast = new Date(res.date) < new Date('2026-10-12');
                        return (
                          <tr key={res.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="px-4 py-3 font-mono text-zinc-200">{res.date}</td>
                            <td className="px-4 py-3 font-medium text-white">{res.employeeName}</td>
                            <td className="px-4 py-3 font-mono text-zinc-400">{res.employeeLegajo}</td>
                            <td className="px-4 py-3 text-zinc-300">{res.optionName}</td>
                            <td className="px-4 py-3 text-zinc-400 text-[11px]">{res.notes || '—'}</td>
                            <td className="px-4 py-3">
                              {isPast ? (
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                                  Consumido (Histórico)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                                  Confirmado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredHistory.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-xs">
                            No se encontraron reservas para los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN CONSOLIDADO COCINA MULTI-FECHA & PIVOT (REQ 5) */}
          {activeTab === 'admin_cocina' && isAdmin && (
            <div className="space-y-6">
              {/* Filter Panel: Date Range & Sede Scope */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-amber-400" />
                      <span>Consolidación de Viandas por Rango de Fechas</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Filtra por día único o selecciona un período completo. Muestra matriz por fecha con totales por menú y totales diarios.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportConsolidationExcel}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Excel (.xlsx)</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Fecha Desde *</label>
                    <input
                      type="date"
                      value={kitchenStartDate}
                      onChange={(e) => setKitchenStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Fecha Hasta *</label>
                    <input
                      type="date"
                      value={kitchenEndDate}
                      onChange={(e) => setKitchenEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Alcance Geográfico</label>
                    <select
                      value={kitchenSedeScope}
                      onChange={(e) => setKitchenSedeScope(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    >
                      <option value="sede_actual">Solo {activeSede.name}</option>
                      <option value="todas">Todas las Sedes (Consolidado General)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] text-zinc-500 mb-1">Atajos rápidos de período:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetQuickPeriod('hoy')}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickPeriod('semana_actual')}
                        className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-[10px] cursor-pointer"
                      >
                        Esta Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickPeriod('semana_proxima')}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                      >
                        Próx. Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickPeriod('mes')}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                      >
                        Mes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kitchen Closure Controls & Cutoff */}
                <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Políticas de Cierre y Anticipación de Cocina</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Configura la anticipación mínima de pedidos y bloquea fechas específicas por feriado o mantenimiento.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentClosed = activeTenant.cocinaOrdersClosedDates || [];
                          const isClosed = currentClosed.includes(kitchenStartDate);
                          const updated = isClosed
                            ? currentClosed.filter((d) => d !== kitchenStartDate)
                            : [...currentClosed, kitchenStartDate];
                          updateActiveTenant({ cocinaOrdersClosedDates: updated });
                          alert(
                            isClosed
                              ? `Recepción de pedidos reabierta para ${kitchenStartDate}.`
                              : `Pedidos cerrados para ${kitchenStartDate}. Ningún usuario podrá reservar.`
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          (activeTenant.cocinaOrdersClosedDates || []).includes(kitchenStartDate)
                            ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        {(activeTenant.cocinaOrdersClosedDates || []).includes(kitchenStartDate)
                          ? `🔓 Reabrir Fecha (${kitchenStartDate})`
                          : `🔒 Cerrar Pedidos (${kitchenStartDate})`}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Anticipación mínima:</span>
                      <select
                        value={activeTenant.cocinaCutoffDaysBefore ?? 1}
                        onChange={(e) =>
                          updateActiveTenant({ cocinaCutoffDaysBefore: parseInt(e.target.value, 10) })
                        }
                        className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                      >
                        <option value={0}>Mismo día (hasta 10:00 AM)</option>
                        <option value={1}>1 día de anticipación (Estándar)</option>
                        <option value={2}>2 días de anticipación</option>
                        <option value={3}>3 días de anticipación</option>
                      </select>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">Módulos para rol Cocina:</span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {(['viandas', 'cartelera', 'horarios', 'documentos'] as const).map((modKey) => {
                            const isChecked = (activeTenant.cocinaEnabledModules || ['viandas']).includes(modKey);
                            return (
                              <label key={modKey} className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const current = activeTenant.cocinaEnabledModules || ['viandas'];
                                    const updated = isChecked
                                      ? current.filter((k) => k !== modKey)
                                      : [...current, modKey];
                                    updateActiveTenant({ cocinaEnabledModules: updated });
                                  }}
                                  className="accent-indigo-500 rounded"
                                />
                                <span className={isChecked ? 'text-indigo-300' : 'text-zinc-500'}>{modKey}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
                  <div className="text-[11px] text-zinc-400 uppercase font-medium">Total Raciones Período</div>
                  <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{grandTotalPeriod}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {consolidationDates.length} días analizados
                  </div>
                </div>

                {activeTenant.mealOptions.slice(0, 3).map((opt) => (
                  <div key={opt.id} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
                    <div className="text-[11px] text-zinc-400 uppercase font-medium truncate">{opt.name}</div>
                    <div className="mt-2 text-2xl font-bold text-indigo-400 font-mono">
                      {totalsByOption[opt.id] || 0}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 truncate">Raciones totales</div>
                  </div>
                ))}
              </div>

              {/* PIVOT CONSOLIDATION TABLE (REQ 5 EXACT SPECIFICATION) */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
                  <div className="text-xs font-semibold text-white">
                    Matriz Consolidada de Pedidos por Día y Tipo de Menú
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {kitchenStartDate} al {kitchenEndDate}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3 sticky left-0 bg-zinc-950 z-10">Fecha / Día</th>
                        {activeTenant.mealOptions.map((opt) => (
                          <th key={opt.id} className="px-4 py-3 text-right">
                            {opt.name}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right bg-zinc-900/60 font-bold text-amber-300">
                          Total Viandas del Día
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {consolidationRows.map((row) => (
                        <tr key={row.date} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 sticky left-0 bg-zinc-900/90 z-10 font-mono font-medium text-white border-r border-zinc-800/60">
                            <span>{row.date}</span>
                            <span className="text-zinc-500 ml-2 font-sans text-[11px]">({row.dayOfWeek})</span>
                          </td>
                          {activeTenant.mealOptions.map((opt) => {
                            const cnt = row.countsByOption[opt.id] || 0;
                            return (
                              <td key={opt.id} className="px-4 py-3 text-right font-mono">
                                {cnt > 0 ? (
                                  <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                    {cnt}
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">0</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-400 bg-amber-500/5">
                            {row.totalDay}
                          </td>
                        </tr>
                      ))}

                      {consolidationRows.length === 0 && (
                        <tr>
                          <td colSpan={activeTenant.mealOptions.length + 2} className="px-4 py-8 text-center text-zinc-500">
                            No se configuraron fechas para el rango seleccionado.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Bottom Summary Row: Totals per menu option + Grand Total */}
                    <tfoot className="bg-zinc-950 font-bold border-t-2 border-zinc-700">
                      <tr>
                        <td className="px-4 py-3 text-amber-400 uppercase tracking-wider sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800/60">
                          TOTALES DEL PERÍODO:
                        </td>
                        {activeTenant.mealOptions.map((opt) => (
                          <td key={opt.id} className="px-4 py-3 text-right font-mono text-indigo-400 text-sm">
                            {totalsByOption[opt.id] || 0}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-mono text-base text-amber-300 bg-amber-500/10 border-l border-amber-500/20">
                          {grandTotalPeriod}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN CARGA DE MENÚ & IMPORTACIÓN EXCEL MASIVA (REQ 6) */}
          {activeTab === 'admin_menu' && isAdmin && (
            <div className="space-y-6">
              {/* Sección A: Carga Masiva a través de Excel / CSV */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Carga Masiva de Menú Mensual / Semanal por Excel o CSV</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Sube una planilla con el cronograma de platos y la plataforma lo leerá automáticamente.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadMenuTemplate('xlsx')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Plantilla Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadMenuTemplate('csv')}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Instructions banner: exact columns required as requested in user comment */}
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <span className="font-semibold text-emerald-400 block text-[11px] uppercase tracking-wider">
                    Estructura de Columnas Aceptadas para {activeTenant.name}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Columna 1 (Obligatoria):</span>
                      <strong className="text-white font-mono">Fecha</strong>
                      <span className="text-zinc-400 block text-[10px]">Formato: YYYY-MM-DD</span>
                    </div>
                    {activeTenant.mealOptions.map((opt, i) => (
                      <div key={opt.id} className="p-2 bg-zinc-900 rounded border border-zinc-800">
                        <span className="text-zinc-500 block text-[10px]">Columna {i + 2}:</span>
                        <strong className="text-indigo-300 font-mono">{opt.name}</strong>
                        <span className="text-zinc-400 block text-[10px]">Descripción plato</span>
                      </div>
                    ))}
                    <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Opcionales:</span>
                      <strong className="text-zinc-300 font-mono">Postre / Guarnición</strong>
                      <span className="text-zinc-400 block text-[10px]">Agregado nutricional</span>
                    </div>
                  </div>
                </div>

                {excelUploadSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{excelUploadSuccess}</span>
                  </div>
                )}

                {excelUploadError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{excelUploadError}</span>
                  </div>
                )}

                {/* File Upload Box */}
                <div className="p-6 bg-zinc-950/80 border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 rounded-xl text-center space-y-3 transition-colors">
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="font-semibold text-white text-sm">Subir Archivo de Menú (Excel o CSV)</h4>
                    <p className="text-[11px] text-zinc-400">
                      Arrastra tu archivo aquí o haz clic para seleccionarlo de tu dispositivo (.xlsx, .xls o .csv)
                    </p>
                  </div>
                  <label className="inline-block px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer shadow-sm transition-colors text-xs">
                    <span>Seleccionar Archivo Excel de Menús</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleMenuFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sección B: Carga Manual Día a Día */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 max-w-2xl space-y-4">
                <h3 className="font-semibold text-sm text-white">Carga Manual Individual de Menú por Día</h3>
                <p className="text-xs text-zinc-400">
                  Asigna o modifica los platos específicos para cada tipo de vianda en una fecha determinada.
                </p>

                {menuSavedMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{menuSavedMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveDayMenu} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={menuEditDate}
                      onChange={(e) => setMenuEditDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {activeTenant.mealOptions.map((opt) => (
                    <div key={opt.id}>
                      <label className="block font-medium text-zinc-300 mb-1">
                        {opt.name} <span className="text-zinc-500">({opt.description})</span>
                      </label>
                      <input
                        type="text"
                        value={dishMap[opt.id] || ''}
                        onChange={(e) => setDishMap({ ...dishMap, [opt.id]: e.target.value })}
                        placeholder={`Plato asignado para ${opt.name}...`}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  ))}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Guardar Menú del Día
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

      {/* Modal: Configuración de Opciones de Menú (White-label & Editable por Empresa) */}
      {isOptionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white mb-1">Personalizar Opciones de Menú</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Cada empresa puede definir los nombres y tipos de vianda ofrecidos en sus comedores.
            </p>

            {/* List of current options */}
            <div className="space-y-3 mb-6">
              {editableOptions.map((opt) => (
                <div key={opt.id} className="p-3 bg-zinc-800/60 rounded-lg border border-zinc-700 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-white">{opt.name}</div>
                    <div className="text-[11px] text-zinc-400">{opt.description}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveOption(opt.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                    title="Eliminar opción"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new option form */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-lg space-y-3 mb-6 text-xs">
              <div className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px]">
                Agregar Nueva Opción Personalizada
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Nombre de la Opción</label>
                  <input
                    type="text"
                    value={newOptName}
                    onChange={(e) => setNewOptName(e.target.value)}
                    placeholder="Ej. Menú Ejecutivo Premium"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Descripción / Restricciones</label>
                  <input
                    type="text"
                    value={newOptDesc}
                    onChange={(e) => setNewOptDesc(e.target.value)}
                    placeholder="Ej. Alto aporte proteico para turno operativo"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 rounded text-xs font-medium hover:bg-indigo-600/50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar a la lista</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 text-xs">
              <button
                onClick={() => setIsOptionsModalOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMealOptions}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg cursor-pointer"
              >
                Guardar Configuración de Viandas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
