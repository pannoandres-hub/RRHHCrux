import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ScheduleShift, EmployeeProfile } from '../../../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  Download,
  Clock,
  Layers,
  Lock,
  Moon,
  Info,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface ShiftPreset {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  spansMidnight: boolean;
  isLicense?: boolean;
}

interface ExcelShiftGridProps {
  shifts: ScheduleShift[];
  employees: EmployeeProfile[];
  presets: ShiftPreset[];
  canEdit: boolean;
  isEmployee: boolean;
  currentEmployeeLegajo?: string;
  onUpdateShifts: (newShifts: ScheduleShift[]) => void;
  sedeName: string;
}

export const ExcelShiftGrid: React.FC<ExcelShiftGridProps> = ({
  shifts,
  employees,
  presets,
  canEdit,
  isEmployee,
  currentEmployeeLegajo,
  onUpdateShifts,
  sedeName,
}) => {
  // Current Range base date (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('2026-10-12');
  const [viewRange, setViewRange] = useState<'semanal' | 'quincenal' | 'mensual' | 'custom'>('semanal');
  const [customDays, setCustomDays] = useState<number>(10);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Drag-and-repeat state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ legajo: string; dayIndex: number; shiftType: string } | null>(null);
  const [dragTarget, setDragTarget] = useState<{ legajo: string; dayIndex: number } | null>(null);

  // Quick shift picker popup
  const [activeCell, setActiveCell] = useState<{ legajo: string; date: string; x: number; y: number } | null>(null);

  const daysCount = viewRange === 'semanal' ? 7 : viewRange === 'quincenal' ? 14 : viewRange === 'mensual' ? 30 : Math.max(1, Math.min(60, customDays));

  // Compute days of the selected view range starting from currentWeekStart
  const weekDays = React.useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNum: string; isWeekend: boolean }[] = [];
    const base = new Date(currentWeekStart + 'T12:00:00');
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      days.push({
        dateStr,
        dayName: dayNames[dayOfWeek],
        dayNum: `${d.getDate()}/${d.getMonth() + 1}`,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return days;
  }, [currentWeekStart, daysCount]);

  // Navigate periods by daysCount
  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart + 'T12:00:00');
    d.setDate(d.getDate() - daysCount);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart + 'T12:00:00');
    d.setDate(d.getDate() + daysCount);
    setCurrentWeekStart(d.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart('2026-10-12');
  };

  // Filter employees: if employee role, show only them
  const visibleEmployees = React.useMemo(() => {
    if (isEmployee) {
      return employees.filter(
        (e) => currentEmployeeLegajo && e.legajo.toLowerCase() === currentEmployeeLegajo.toLowerCase()
      );
    }
    return employees;
  }, [employees, isEmployee, currentEmployeeLegajo]);

  // Lookup shift for employee on specific date
  const getShiftFor = (legajo: string, dateStr: string): ScheduleShift | undefined => {
    return shifts.find((s) => s.employeeLegajo === legajo && s.date === dateStr);
  };

  // Handle cell click (open quick shift selector if allowed)
  const handleCellClick = (legajo: string, dateStr: string, e: React.MouseEvent) => {
    if (!canEdit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveCell({
      legajo,
      date: dateStr,
      x: Math.min(rect.left, window.innerWidth - 240),
      y: rect.bottom + window.scrollY,
    });
  };

  // Change single cell shift
  const applyShiftToCell = (legajo: string, dateStr: string, newShiftType: string) => {
    const emp = employees.find((e) => e.legajo === legajo);
    if (!emp) return;

    const existingIdx = shifts.findIndex((s) => s.employeeLegajo === legajo && s.date === dateStr);
    let updated: ScheduleShift[];

    if (existingIdx >= 0) {
      updated = [...shifts];
      updated[existingIdx] = {
        ...updated[existingIdx],
        shiftType: newShiftType,
      };
    } else {
      const newShift: ScheduleShift = {
        id: `sh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeLegajo: emp.legajo,
        employeeName: `${emp.name} ${emp.lastName}`.trim(),
        date: dateStr,
        shiftType: newShiftType,
        department: emp.area,
        role: emp.cargo,
        sedeId: emp.lugarTrabajo || 'sede-1',
      };
      updated = [newShift, ...shifts];
    }

    onUpdateShifts(updated);
    setActiveCell(null);
  };

  // Drag handle mousedown
  const handleDragHandleMouseDown = (
    legajo: string,
    dayIndex: number,
    shiftType: string,
    e: React.MouseEvent
  ) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setDragOrigin({ legajo, dayIndex, shiftType });
    setDragTarget({ legajo, dayIndex });
  };

  // Cell mouse enter during drag
  const handleCellMouseEnter = (legajo: string, dayIndex: number) => {
    if (isDragging && dragOrigin && dragOrigin.legajo === legajo) {
      setDragTarget({ legajo, dayIndex });
    }
  };

  // Mouse up to commit dragged shifts
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isDragging || !dragOrigin || !dragTarget) {
        setIsDragging(false);
        setDragOrigin(null);
        setDragTarget(null);
        return;
      }

      if (dragOrigin.legajo === dragTarget.legajo) {
        const startIdx = Math.min(dragOrigin.dayIndex, dragTarget.dayIndex);
        const endIdx = Math.max(dragOrigin.dayIndex, dragTarget.dayIndex);
        const legajo = dragOrigin.legajo;
        const shiftTypeToApply = dragOrigin.shiftType;
        const emp = employees.find((e) => e.legajo === legajo);

        if (emp && startIdx !== endIdx) {
          const newShiftsList = [...shifts];
          let updatedCount = 0;

          for (let i = startIdx; i <= endIdx; i++) {
            const targetDate = weekDays[i].dateStr;
            const existingIdx = newShiftsList.findIndex(
              (s) => s.employeeLegajo === legajo && s.date === targetDate
            );

            if (existingIdx >= 0) {
              newShiftsList[existingIdx] = {
                ...newShiftsList[existingIdx],
                shiftType: shiftTypeToApply,
              };
            } else {
              newShiftsList.unshift({
                id: `sh-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                employeeLegajo: emp.legajo,
                employeeName: `${emp.name} ${emp.lastName}`.trim(),
                date: targetDate,
                shiftType: shiftTypeToApply,
                department: emp.area,
                role: emp.cargo,
                sedeId: emp.lugarTrabajo || 'sede-1',
              });
            }
            updatedCount++;
          }

          onUpdateShifts(newShiftsList);
          setToastMessage(
            `¡Turno "${shiftTypeToApply}" replicado en ${updatedCount} días para ${emp.name} ${emp.lastName}!`
          );
          setTimeout(() => setToastMessage(''), 4500);
        }
      }

      setIsDragging(false);
      setDragOrigin(null);
      setDragTarget(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragOrigin, dragTarget, shifts, employees, weekDays, onUpdateShifts]);

  // Replicate full week pattern for an employee across next 3 weeks
  const handleReplicatePatternMonth = (legajo: string) => {
    const emp = employees.find((e) => e.legajo === legajo);
    if (!emp) return;

    // Grab current 7 days pattern
    const weekPattern = weekDays.map((d) => {
      const s = getShiftFor(legajo, d.dateStr);
      return s ? s.shiftType : 'Jornada Central (09:00 - 18:00)';
    });

    const newShifts = [...shifts];
    let created = 0;

    // Apply for next 3 weeks (21 days)
    const base = new Date(currentWeekStart + 'T12:00:00');
    for (let dayOffset = 7; dayOffset < 28; dayOffset++) {
      const nextDate = new Date(base);
      nextDate.setDate(base.getDate() + dayOffset);
      const dateStr = nextDate.toISOString().split('T')[0];
      const patternShift = weekPattern[dayOffset % 7];

      const exIdx = newShifts.findIndex((s) => s.employeeLegajo === legajo && s.date === dateStr);
      if (exIdx >= 0) {
        newShifts[exIdx] = { ...newShifts[exIdx], shiftType: patternShift };
      } else {
        newShifts.unshift({
          id: `sh-rep-${Date.now()}-${dayOffset}`,
          employeeLegajo: emp.legajo,
          employeeName: `${emp.name} ${emp.lastName}`.trim(),
          date: dateStr,
          shiftType: patternShift,
          department: emp.area,
          role: emp.cargo,
          sedeId: emp.lugarTrabajo || 'sede-1',
        });
      }
      created++;
    }

    onUpdateShifts(newShifts);
    setToastMessage(`¡Intervalo semanal replicado exitosamente durante 3 semanas adicionales (${created} turnos)!`);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Export spreadsheet to Excel
  const handleExportGridExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows: any[][] = [];

    rows.push([`PLANILLA HORARIA EXCEL - SEMANA DEL ${weekDays[0].dateStr} AL ${weekDays[6].dateStr}`]);
    rows.push([`Sede: ${sedeName}`]);
    rows.push([]);

    const headers = [
      'Legajo',
      'Colaborador',
      'Sector',
      'Cargo',
      ...weekDays.map((d) => `${d.dayName} ${d.dayNum}`),
    ];
    rows.push(headers);

    visibleEmployees.forEach((emp) => {
      const row = [
        emp.legajo,
        `${emp.name} ${emp.lastName}`.trim(),
        emp.area,
        emp.cargo,
        ...weekDays.map((d) => {
          const sh = getShiftFor(emp.legajo, d.dateStr);
          return sh ? sh.shiftType : 'Sin Asignar';
        }),
      ];
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, ...weekDays.map(() => ({ wch: 22 }))];
    XLSX.utils.book_append_sheet(wb, ws, 'Planilla_Semanal');
    XLSX.writeFile(wb, `Planilla_Horaria_${weekDays[0].dateStr}_al_${weekDays[6].dateStr}.xlsx`);
  };

  // Color helper for badges
  const getBadgeStyle = (shiftType: string) => {
    if (!shiftType || shiftType === 'Sin Asignar') {
      return 'bg-zinc-800 text-zinc-500 border border-zinc-700/60';
    }
    if (shiftType.includes('Franco')) {
      return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
    }
    if (shiftType.includes('Licencia') || shiftType.includes('Médica') || shiftType.includes('Vacaciones')) {
      return 'bg-pink-500/10 text-pink-300 border border-pink-500/30';
    }
    if (shiftType.includes('Noche') || shiftType.includes('22:00')) {
      return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40';
    }
    if (shiftType.includes('Tarde') || shiftType.includes('14:00')) {
      return 'bg-amber-500/10 text-amber-300 border border-amber-500/30';
    }
    return 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30';
  };

  const getShortName = (shiftType: string) => {
    if (!shiftType) return 'Sin asignar';
    if (shiftType.includes('Franco')) return 'Franco Comp.';
    if (shiftType.includes('Licencia Médica')) return 'Lic. Médica';
    if (shiftType.includes('Licencia Vacaciones')) return 'Vacaciones';
    if (shiftType.includes('Turno Mañana')) return 'Mañana 06-14';
    if (shiftType.includes('Turno Tarde')) return 'Tarde 14-22';
    if (shiftType.includes('Turno Noche')) return 'Noche 22-06';
    if (shiftType.includes('Jornada Central')) return 'Central 09-18';
    return shiftType;
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Toolbar: Navigation, Format Range & Actions */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
        {/* Navigation & Range Format */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewRange('semanal')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                viewRange === 'semanal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semanal (7d)
            </button>
            <button
              onClick={() => setViewRange('quincenal')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                viewRange === 'quincenal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Quincenal (14d)
            </button>
            <button
              onClick={() => setViewRange('mensual')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                viewRange === 'mensual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensual (30d)
            </button>
            <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
              <button
                onClick={() => setViewRange('custom')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  viewRange === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Personalizado
              </button>
              {viewRange === 'custom' && (
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white text-center font-mono"
                  title="Cantidad de días a visualizar"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-white px-2.5 py-1 bg-zinc-950 rounded-lg border border-zinc-800 font-mono">
              {weekDays[0]?.dayName} {weekDays[0]?.dayNum} — {weekDays[weekDays.length - 1]?.dayName} {weekDays[weekDays.length - 1]?.dayNum}
            </span>

            <button
              onClick={handleNextWeek}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Período siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentWeek}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Hoy</span>
            </button>
          </div>
        </div>

        {canEdit && (
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                <strong>Modo Excel:</strong> Arrastra el punto azul de una celda hacia la derecha para replicar el turno
              </span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportGridExcel}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm select-none">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-zinc-950/90 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 sticky left-0 z-20 bg-zinc-950 min-w-[220px]">Colaborador</th>
                <th className="px-3 py-3 min-w-[130px]">Sector / Cargo</th>
                {weekDays.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`px-3 py-3 text-center min-w-[125px] ${
                      d.isWeekend ? 'bg-zinc-900/40 text-amber-400/80 font-bold' : ''
                    }`}
                  >
                    <div className="font-semibold text-zinc-200">{d.dayName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{d.dayNum}</div>
                  </th>
                ))}
                {canEdit && <th className="px-3 py-3 text-center min-w-[100px]">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {visibleEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-zinc-800/30 transition-colors">
                  {/* Employee identity */}
                  <td className="px-4 py-3 sticky left-0 z-10 bg-zinc-900/90 border-r border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">
                          {emp.name} {emp.lastName}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">{emp.legajo}</div>
                      </div>
                    </div>
                  </td>

                  {/* Sector & Cargo */}
                  <td className="px-3 py-3 border-r border-zinc-800 text-zinc-400">
                    <div className="truncate text-zinc-300 font-medium">{emp.area}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{emp.cargo}</div>
                  </td>

                  {/* 7 Days of the week */}
                  {weekDays.map((d, dayIdx) => {
                    const shift = getShiftFor(emp.legajo, d.dateStr);
                    const shiftType = shift?.shiftType || 'Sin Asignar';
                    const isNight = shiftType.includes('Noche');

                    // Check if cell is in active drag highlight range
                    let isInDragRange = false;
                    if (isDragging && dragOrigin && dragTarget && dragOrigin.legajo === emp.legajo) {
                      const minI = Math.min(dragOrigin.dayIndex, dragTarget.dayIndex);
                      const maxI = Math.max(dragOrigin.dayIndex, dragTarget.dayIndex);
                      isInDragRange = dayIdx >= minI && dayIdx <= maxI;
                    }

                    return (
                      <td
                        key={d.dateStr}
                        onMouseEnter={() => handleCellMouseEnter(emp.legajo, dayIdx)}
                        onClick={(e) => handleCellClick(emp.legajo, d.dateStr, e)}
                        className={`px-2 py-2 text-center border-r border-zinc-800 relative transition-all ${
                          canEdit ? 'cursor-pointer hover:bg-zinc-800/70' : ''
                        } ${isInDragRange ? 'bg-indigo-600/20 ring-2 ring-indigo-500 ring-inset' : ''} ${
                          d.isWeekend ? 'bg-zinc-950/30' : ''
                        }`}
                      >
                        <div
                          className={`px-2 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 ${getBadgeStyle(
                            shiftType
                          )}`}
                        >
                          {isNight && <Moon className="w-3 h-3 text-indigo-400 shrink-0" />}
                          <span className="truncate">{getShortName(shiftType)}</span>
                        </div>

                        {/* Excel-style Drag Handle on bottom-right of cell */}
                        {canEdit && (
                          <div
                            onMouseDown={(e) => handleDragHandleMouseDown(emp.legajo, dayIdx, shiftType, e)}
                            title="Arrastrar para replicar turno"
                            className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-indigo-500 hover:bg-indigo-400 border border-white rounded-none cursor-crosshair z-10 transition-transform hover:scale-125"
                          />
                        )}
                      </td>
                    );
                  })}

                  {/* Actions: Replicate full week across month */}
                  {canEdit && (
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleReplicatePatternMonth(emp.legajo)}
                        title="Replicar este esquema semanal a las próximas 3 semanas"
                        className="px-2 py-1 bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white rounded text-[10px] font-medium transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Replicar Mes</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Shift Selector Popover */}
      {activeCell && (
        <div
          className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl space-y-2 text-xs w-64 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${Math.min(activeCell.y, window.innerHeight - 300)}px`,
            left: `${Math.min(activeCell.x, window.innerWidth - 270)}px`,
          }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
            <span className="font-semibold text-white">Asignar Turno ({activeCell.date})</span>
            <button onClick={() => setActiveCell(null)} className="text-zinc-400 hover:text-white">
              &times;
            </button>
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => applyShiftToCell(activeCell.legajo, activeCell.date, p.name)}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-cyan-600/30 text-zinc-200 hover:text-white text-[11px] font-medium transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{p.name}</span>
                {p.spansMidnight && <Moon className="w-3 h-3 text-indigo-400" />}
              </button>
            ))}

            <button
              onClick={() => applyShiftToCell(activeCell.legajo, activeCell.date, 'Franco Compensatorio')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Franco Compensatorio
            </button>
            <button
              onClick={() =>
                applyShiftToCell(activeCell.legajo, activeCell.date, 'Licencia Médica con Goce')
              }
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-pink-900/30 text-pink-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Licencia Médica
            </button>
            <button
              onClick={() => applyShiftToCell(activeCell.legajo, activeCell.date, 'Licencia Vacaciones')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-pink-900/30 text-pink-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Vacaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
