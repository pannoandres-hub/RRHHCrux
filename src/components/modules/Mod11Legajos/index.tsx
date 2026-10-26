import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { LegajoDocumentChecklist, EmployeeProfile } from '../../../types';
import {
  FolderGit2,
  FolderCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Plus,
  Trash2,
  Search,
  Download,
  Eye,
  ShieldCheck,
  Award,
  Sparkles,
  Paperclip,
  X,
  FileCheck,
} from 'lucide-react';

export const Mod11Legajos: React.FC = () => {
  const { activeTenant, tenantData, updateTenantData } = useTenant();
  const { role, currentJefe } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Completos' | 'Incompletos'>('Todos');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    tenantData.employees[0]?.id || ''
  );

  // Modal: Add Custom Document Requirement
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocRequired, setNewDocRequired] = useState(true);

  // File preview modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; fileName: string; date?: string } | null>(null);

  // Active checklists in tenantData
  const checklists = tenantData.legajoChecklists || [];
  const employees = tenantData.employees.filter((e) => e.status === 'Activo');

  // Selected employee profile & checklist
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  
  // Find or create virtual checklist for selected employee
  const currentChecklist: LegajoDocumentChecklist = checklists.find(
    (c) => c.employeeId === selectedEmployee?.id
  ) || {
    id: `chk-${selectedEmployee?.id}`,
    employeeId: selectedEmployee?.id || '',
    employeeName: selectedEmployee ? `${selectedEmployee.name} ${selectedEmployee.lastName}` : '',
    employeeLegajo: selectedEmployee?.legajo || '',
    documents: [
      { key: 'dni', title: 'Documento Nacional de Identidad (Frente y Dorso)', required: true, submitted: true, submittedDate: '2026-10-01' },
      { key: 'afip', title: 'Alta Temprana AFIP / Mi Simplificación', required: true, submitted: true, submittedDate: '2026-10-01' },
      { key: 'apto', title: 'Examen Médico Preocupacional (Apto de Ley)', required: true, submitted: true, submittedDate: '2026-09-28' },
      { key: 'penales', title: 'Certificado de Antecedentes Penales (RNR)', required: true, submitted: false },
      { key: 'titulo', title: 'Título Técnico / Universitario Homologado', required: true, submitted: false },
      { key: 'cuil', title: 'Constancia Oficial de CUIL ANSES', required: true, submitted: true, submittedDate: '2026-10-01' },
      { key: 'domicilio', title: 'Declaración Jurada de Domicilio Real', required: false, submitted: true, submittedDate: '2026-10-02' },
      { key: 'cbu', title: 'Constancia Bancaria de CBU / Cuenta Sueldo', required: true, submitted: true, submittedDate: '2026-10-01' },
    ],
  };

  // Helper calculation for completion percentage
  const calculateProgress = (checklist: LegajoDocumentChecklist) => {
    if (!checklist.documents || checklist.documents.length === 0) return 100;
    const requiredDocs = checklist.documents.filter((d) => d.required);
    if (requiredDocs.length === 0) return 100;
    const submittedRequired = requiredDocs.filter((d) => d.submitted).length;
    return Math.round((submittedRequired / requiredDocs.length) * 100);
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${emp.name} ${emp.lastName}`.toLowerCase().includes(q);
      const matchLegajo = emp.legajo.toLowerCase().includes(q);
      if (!matchName && !matchLegajo) return false;
    }

    const chk = checklists.find((c) => c.employeeId === emp.id);
    const progress = chk ? calculateProgress(chk) : 75;

    if (statusFilter === 'Completos' && progress < 100) return false;
    if (statusFilter === 'Incompletos' && progress === 100) return false;

    return true;
  });

  // Checklist updates handler
  const handleUpdateCurrentChecklist = (updatedDocs: LegajoDocumentChecklist['documents']) => {
    const existingIndex = checklists.findIndex((c) => c.employeeId === selectedEmployee.id);
    let updatedChecklists: LegajoDocumentChecklist[];

    const newObj: LegajoDocumentChecklist = {
      ...currentChecklist,
      documents: updatedDocs,
    };

    if (existingIndex >= 0) {
      updatedChecklists = checklists.map((c, idx) => (idx === existingIndex ? newObj : c));
    } else {
      updatedChecklists = [...checklists, newObj];
    }

    updateTenantData({ legajoChecklists: updatedChecklists });
  };

  // Document actions
  const handleToggleSubmitted = (key: string) => {
    const updated = currentChecklist.documents.map((doc) => {
      if (doc.key === key) {
        const nextSubmitted = !doc.submitted;
        return {
          ...doc,
          submitted: nextSubmitted,
          submittedDate: nextSubmitted ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return doc;
    });
    handleUpdateCurrentChecklist(updated);
  };

  const handleToggleRequired = (key: string) => {
    const updated = currentChecklist.documents.map((doc) => {
      if (doc.key === key) {
        return { ...doc, required: !doc.required };
      }
      return doc;
    });
    handleUpdateCurrentChecklist(updated);
  };

  const handleDeleteDocument = (key: string) => {
    const updated = currentChecklist.documents.filter((doc) => doc.key !== key);
    handleUpdateCurrentChecklist(updated);
  };

  const handleAddCustomDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc = {
      key: `custom-${Date.now()}`,
      title: newDocTitle.trim(),
      required: newDocRequired,
      submitted: false,
    };

    handleUpdateCurrentChecklist([...currentChecklist.documents, newDoc]);
    setNewDocTitle('');
    setIsAddDocModalOpen(false);
  };

  const handleSimulateUpload = (key: string) => {
    const fileName = `Doc_${key.toUpperCase()}_${selectedEmployee?.legajo}.pdf`;
    const updated = currentChecklist.documents.map((doc) => {
      if (doc.key === key) {
        return {
          ...doc,
          submitted: true,
          submittedDate: new Date().toISOString().split('T')[0],
          fileUrl: fileName,
        };
      }
      return doc;
    });
    handleUpdateCurrentChecklist(updated);
    alert(`Archivo "${fileName}" cargado y adjuntado al legajo correctamente.`);
  };

  // System generated attachments (diplomas, onboarding, solicitudes)
  const systemAttachments = [
    {
      id: 'att-1',
      title: 'Certificado de Aprobación: Buenas Prácticas de Manufactura (BPM)',
      type: 'Diploma de Capacitación',
      date: '2026-09-20',
      source: 'Módulo Capacitaciones',
      fileName: `Diploma_BPM_${selectedEmployee?.legajo}.pdf`,
    },
    {
      id: 'att-2',
      title: 'Acta de Conformidad de Inducción & Políticas Corporativas',
      type: 'Onboarding Digital',
      date: '2026-08-15',
      source: 'Módulo Onboarding',
      fileName: `Acta_Induccion_${selectedEmployee?.legajo}.pdf`,
    },
    {
      id: 'att-3',
      title: 'Constancia Oficial de Asignación de Ropa de Trabajo y EPP',
      type: 'Constancia de Entrega',
      date: '2026-10-05',
      source: 'Módulo Uniformes & Documentos',
      fileName: `Entrega_EPP_${selectedEmployee?.legajo}.pdf`,
    },
  ];

  const currentProgress = calculateProgress(currentChecklist);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.legajos || 'Legajos Digitales'}
            </h2>
            <p className="text-xs text-zinc-400">
              Checklist documental editable, antecedentes penales, diplomas y constancias generadas por el sistema
            </p>
          </div>
        </div>

        {/* Action Button */}
        {isAdmin && (
          <button
            onClick={() => setIsAddDocModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Requisito al Legajo</span>
          </button>
        )}
      </div>

      {/* Main Grid: Employee Selector (Left) & Document Checklist (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Collaborators Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o legajo..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setStatusFilter('Todos')}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-medium transition-colors text-center ${
                  statusFilter === 'Todos'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({employees.length})
              </button>
              <button
                onClick={() => setStatusFilter('Completos')}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-medium transition-colors text-center ${
                  statusFilter === 'Completos'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                }`}
              >
                Completos
              </button>
              <button
                onClick={() => setStatusFilter('Incompletos')}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-medium transition-colors text-center ${
                  statusFilter === 'Incompletos'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                }`}
              >
                Pendientes
              </button>
            </div>
          </div>

          {/* List of employees */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-2 max-h-[580px] overflow-y-auto space-y-1.5 divide-y divide-zinc-800/60">
            {filteredEmployees.map((emp) => {
              const isSelected = emp.id === selectedEmployee?.id;
              const chk = checklists.find((c) => c.employeeId === emp.id) || currentChecklist;
              const progress = calculateProgress(chk);

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/60 border border-indigo-500/50 text-white'
                      : 'hover:bg-zinc-800/50 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {emp.photoUrl ? (
                        <img
                          src={emp.photoUrl}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-xs truncate">
                          {emp.name} {emp.lastName}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {emp.legajo} · {emp.cargo}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        progress === 100
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {progress}%
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {filteredEmployees.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-500">
                No se encontraron colaboradores para el filtro.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Legajo File & Checklist (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedEmployee ? (
            <>
              {/* Profile Bar */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectedEmployee.photoUrl ? (
                    <img
                      src={selectedEmployee.photoUrl}
                      alt={selectedEmployee.name}
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm">
                      {selectedEmployee.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedEmployee.name} {selectedEmployee.lastName}
                    </h3>
                    <div className="text-xs text-zinc-400">
                      Legajo: <strong className="text-emerald-400 font-mono">{selectedEmployee.legajo}</strong> · {selectedEmployee.cargo} · {selectedEmployee.area}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      DNI: {selectedEmployee.dni} · CUIL: {selectedEmployee.cuil} · {selectedEmployee.lugarTrabajo}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Estado del Legajo:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        currentProgress === 100
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {currentProgress}% Completo
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {currentChecklist.documents.filter((d) => d.submitted).length} de {currentChecklist.documents.length} documentos presentados
                  </span>
                </div>
              </div>

              {/* Compliance Notice: Recibos are strictly in Module 13 */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong>Regla de Arquitectura de Legajo Digital:</strong> Por normativa legal y requerimiento de plataforma, los <strong>Recibos de Sueldo</strong> no se archivan manualmente aquí; se procesan de forma masiva en el <strong>Módulo 13 (Recibos de Sueldo)</strong> con doble firma digital (empleador y empleado).
                </div>
              </div>

              {/* Section 1: Checklist Documental */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">
                      Requisitos Documentales Obligatorios y Optativos
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setIsAddDocModalOpen(true)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Documento</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-zinc-800">
                  {currentChecklist.documents.map((doc) => (
                    <div
                      key={doc.key}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-xs ${
                              doc.submitted ? 'text-zinc-200' : 'text-zinc-400'
                            }`}
                          >
                            {doc.title}
                          </span>
                          {doc.required ? (
                            <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold rounded uppercase">
                              Obligatorio
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-400 text-[9px] rounded uppercase">
                              Opcional
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                          {doc.submitted ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Presentado el {doc.submittedDate || '2026-10-01'}</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Pendiente de entrega</span>
                            </span>
                          )}
                          {doc.fileUrl && (
                            <span className="text-zinc-400 font-mono text-[10px]">
                              ({doc.fileUrl})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Document Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleSubmitted(doc.key)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                            doc.submitted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {doc.submitted ? 'Entregado ✓' : 'Marcar entregado'}
                        </button>

                        <button
                          onClick={() => handleSimulateUpload(doc.key)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                          title="Cargar / Adjuntar archivo digital"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>

                        {doc.submitted && (
                          <button
                            onClick={() =>
                              setPreviewDoc({
                                title: doc.title,
                                fileName: doc.fileUrl || `Legajo_${doc.key}.pdf`,
                                date: doc.submittedDate,
                              })
                            }
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded text-xs transition-colors"
                            title="Previsualizar documento"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleToggleRequired(doc.key)}
                              className="px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 underline"
                              title="Cambiar obligatoriedad"
                            >
                              {doc.required ? 'Hacer opcional' : 'Hacer obligatorio'}
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.key)}
                              className="p-1.5 text-zinc-600 hover:text-red-400"
                              title="Quitar requisito de este legajo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Adjuntos Generados por el Sistema */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">
                      Constancias, Diplomas y Documentos del Sistema
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Auto-sincronizados</span>
                </div>

                <div className="divide-y divide-zinc-800">
                  {systemAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-200 text-xs">{att.title}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {att.type} · Emitido el {att.date} · {att.source}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setPreviewDoc({
                            title: att.title,
                            fileName: att.fileName,
                            date: att.date,
                          })
                        }
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-indigo-400" />
                        <span>Ver constancia</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
              Selecciona un colaborador del panel izquierdo para consultar su legajo.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD CUSTOM DOCUMENT REQUIREMENT */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-sm text-white">Nuevo Requisito Documental</h3>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nombre o Título del Documento</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ej. Libreta Sanitaria Vigente / Licencia de Conducir B2"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newDocRequired}
                    onChange={(e) => setNewDocRequired(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Requisito Obligatorio de Ley o Política de Empresa</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  Agregar al Legajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT PREVIEW */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-white">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm font-mono">{previewDoc.fileName}</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Documento digitalizado y validado en el legajo del colaborador
                </p>
                {previewDoc.date && (
                  <span className="text-[11px] text-zinc-400 font-mono mt-1 block">
                    Fecha de Registro: {previewDoc.date}
                  </span>
                )}
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => alert(`Descargando copia oficial: ${previewDoc.fileName}`)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
