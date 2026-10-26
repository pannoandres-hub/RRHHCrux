import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Calendar,
  UtensilsCrossed,
  Cake,
  Award,
  Bell,
  Plus,
  Trash2,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Layers,
  Filter,
  Paperclip,
  CheckSquare,
  Lock,
  Edit,
  Building,
} from 'lucide-react';
import { UsefulProcedure } from '../../../types';

export const Mod1Cartelera: React.FC = () => {
  const { activeTenant, tenantData, addAnnouncement, deleteAnnouncement, addUsefulProcedure, updateUsefulProcedure, deleteUsefulProcedure } = useTenant();
  const { role, currentJefe, currentEmployee } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isJefe = role === 'jefe';
  const canPublish = isAdmin || isJefe;
  const userSector = currentJefe?.sector || 'Producción & Mantenimiento';
  const user = {
    name: isJefe && currentJefe ? currentJefe.name : (currentEmployee?.name || 'Usuario'),
    assignedDepartment: userSector,
  };

  // Active top tab
  const [activeTab, setActiveTab] = useState<'cartelera' | 'sops'>('cartelera');

  // Announcement modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Institucional' | 'Operativo' | 'Beneficios' | 'Seguridad'>('Institucional');
  const [newPriority, setNewPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [announcementSector, setAnnouncementSector] = useState(isJefe ? (user?.assignedDepartment || 'Producción & Mantenimiento') : 'Todos');

  // SOP Filter & Modals
  const [sopCategoryFilter, setSopCategoryFilter] = useState('Todos');
  const [sopSectorFilter, setSopSectorFilter] = useState('Todos');
  const [showSopModal, setShowSopModal] = useState(false);
  const [viewingSop, setViewingSop] = useState<UsefulProcedure | null>(null);
  const [editingSop, setEditingSop] = useState<UsefulProcedure | null>(null);

  // SOP Form State
  const [sopTitle, setSopTitle] = useState('');
  const [sopCategory, setSopCategory] = useState('Operativo & Seguridad');
  const [sopSector, setSopSector] = useState(isJefe ? (user?.assignedDepartment || 'Producción & Mantenimiento') : 'Todos');
  const [sopDescription, setSopDescription] = useState('');
  const [sopFormat, setSopFormat] = useState<'steps' | 'pdf'>('steps');
  const [sopSteps, setSopSteps] = useState<string[]>(['Paso 1: Notificar al responsable de turno', 'Paso 2: Completar planilla física o digital']);
  const [sopPdfName, setSopPdfName] = useState('Procedimiento_Operativo_Estandar.pdf');

  // Interactive step toggle state in viewer
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Today's date info
  const todayStr = '2026-10-12';
  const todayMenu = tenantData.mealMenus.find((m) => m.date === todayStr) || tenantData.mealMenus[0];

  const handleAddAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addAnnouncement({
      title: `${newTitle.trim()} ${announcementSector !== 'Todos' ? `[Sector: ${announcementSector}]` : ''}`,
      content: newContent.trim(),
      category: newCategory,
      priority: newPriority,
    });
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const handleOpenNewSop = () => {
    setEditingSop(null);
    setSopTitle('');
    setSopCategory('Operativo & Seguridad');
    setSopSector(isJefe ? (user?.assignedDepartment || 'Producción & Mantenimiento') : 'Todos');
    setSopDescription('');
    setSopFormat('steps');
    setSopSteps(['Paso 1: Notificar al supervisor del turno', 'Paso 2: Registrar en el sistema interno']);
    setSopPdfName('Procedimiento_SOP.pdf');
    setShowSopModal(true);
  };

  const handleOpenEditSop = (sop: UsefulProcedure) => {
    setEditingSop(sop);
    setSopTitle(sop.title);
    setSopCategory(sop.category);
    setSopSector(sop.sector || 'Todos');
    setSopDescription(sop.description || sop.content || '');
    if (sop.steps && sop.steps.length > 0) {
      setSopFormat('steps');
      setSopSteps([...sop.steps]);
    } else {
      setSopFormat('pdf');
      setSopPdfName(sop.pdfFileName || 'Documento_Adjunto.pdf');
    }
    setShowSopModal(true);
  };

  const handleSaveSop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sopTitle.trim()) return;

    const procedurePayload: Omit<UsefulProcedure, 'id' | 'updatedAt'> = {
      title: sopTitle.trim(),
      category: sopCategory,
      sector: isJefe ? (user?.assignedDepartment || 'Producción & Mantenimiento') : sopSector,
      description: sopDescription.trim(),
      content: sopDescription.trim(),
      publishedInBulletin: true,
      steps: sopFormat === 'steps' ? sopSteps.filter((s) => s.trim() !== '') : undefined,
      pdfFileName: sopFormat === 'pdf' ? sopPdfName : undefined,
      pdfUrl: sopFormat === 'pdf' ? '#' : undefined,
    };

    if (editingSop) {
      updateUsefulProcedure(editingSop.id, procedurePayload);
    } else {
      addUsefulProcedure(procedurePayload);
    }

    setShowSopModal(false);
  };

  // SOP filter logic
  const filteredProcedures = (tenantData.usefulProcedures || []).filter((proc) => {
    const matchesCategory = sopCategoryFilter === 'Todos' || proc.category === sopCategoryFilter;
    const matchesSector =
      sopSectorFilter === 'Todos' ||
      !proc.sector ||
      proc.sector === 'Todos' ||
      proc.sector === sopSectorFilter;

    // Jefes only see "Todos" or their sector
    if (isJefe) {
      const jefeSector = user?.assignedDepartment || 'Producción & Mantenimiento';
      if (proc.sector && proc.sector !== 'Todos' && proc.sector !== jefeSector) {
        return false;
      }
    }

    return matchesCategory && matchesSector;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60 p-6 md:p-8">
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${activeTenant.branding.bannerUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop'})`,
          }}
        />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{activeTenant.name}</span>
            <span>·</span>
            <span>Cartelera Oficial & SOPs</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Portal Digital de {activeTenant.branding.name || activeTenant.name}
          </h1>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            Menús de comedor, cumpleaños del equipo, aniversarios, comunicados y biblioteca de procedimientos operativos útiles (SOPs).
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/60">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Semana operativa en curso</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/60">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeTenant.sedes.length} Sedes conectadas</span>
            </div>
            {isJefe && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Sector asignado: {user?.assignedDepartment || 'Producción & Mantenimiento'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('cartelera')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'cartelera'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Cartelera Oficial & Novedades</span>
        </button>

        <button
          onClick={() => setActiveTab('sops')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'sops'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Procedimientos Útiles & SOPs</span>
          <span className="px-1.5 py-0.2 bg-zinc-800 rounded-full text-[10px] text-zinc-300">
            {tenantData.usefulProcedures?.length || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: CARTELERA OFICIAL */}
      {activeTab === 'cartelera' && (
        <div className="space-y-6">
          {/* Grid: Menu of Today + Birthdays & Anniversaries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Today's Menu */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Menú del Día en Comedor</h3>
                    <p className="text-[11px] text-zinc-400">Opciones para hoy {todayMenu?.date || '12/10/2026'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 flex-1">
                {todayMenu ? (
                  activeTenant.mealOptions.map((opt) => {
                    const dish = todayMenu.options[opt.id] || 'Plato del chef asignado';
                    return (
                      <div key={opt.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-zinc-200">{opt.name}</span>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{opt.badgeColor}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px]">{dish}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500">No se ha cargado el menú de la fecha.</p>
                )}
              </div>
            </div>

            {/* Card 2: Birthdays of the Week */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Cumpleaños de la Semana</h3>
                    <p className="text-[11px] text-zinc-400">Saluda a tus compañeros en su día</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 flex-1">
                {tenantData.birthdays.length > 0 ? (
                  tenantData.birthdays.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-2.5 bg-zinc-800/40 rounded-lg border border-zinc-800/60 text-xs">
                      <div className="flex items-center gap-3">
                        {b.photoUrl ? (
                          <img
                            src={b.photoUrl}
                            alt={b.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${b.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center font-bold text-white text-xs shrink-0`}>
                            {b.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-zinc-200">{b.name}</div>
                          <div className="text-[11px] text-zinc-400">{b.role} · {b.department}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] font-mono text-zinc-300">
                          {b.date}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No hay cumpleaños registrados este mes.</p>
                )}
              </div>
            </div>

            {/* Card 3: Work Anniversaries */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Aniversarios Laborales</h3>
                    <p className="text-[11px] text-zinc-400">Reconocimiento a la permanencia</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 flex-1">
                {tenantData.anniversaries.length > 0 ? (
                  tenantData.anniversaries.map((aniv) => (
                    <div key={aniv.id} className="flex items-center justify-between p-2.5 bg-zinc-800/40 rounded-lg border border-zinc-800/60 text-xs">
                      <div className="flex items-center gap-3">
                        {aniv.photoUrl ? (
                          <img
                            src={aniv.photoUrl}
                            alt={aniv.name}
                            className="w-8 h-8 rounded-full object-cover border border-amber-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {aniv.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-zinc-200">{aniv.name}</div>
                          <div className="text-[11px] text-zinc-400">{aniv.role} · {aniv.department}</div>
                          <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>
                              Fecha de Aniversario: <strong>{aniv.startDate ? `${parseInt(aniv.startDate.split('-')[2], 10)} de Octubre` : '12 de Octubre'}</strong> (Ingreso: {aniv.startDate || '2016-10-14'})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-semibold text-xs font-mono shrink-0">
                        <Award className="w-3.5 h-3.5" />
                        <span>{aniv.years} años</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">No hay aniversarios para este periodo.</p>
                )}
              </div>
            </div>
          </div>

          {/* Announcements / Novedades Section */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Comunicados y Novedades de Empresa</h2>
                  <p className="text-xs text-zinc-400">Publicaciones y avisos oficiales para el personal</p>
                </div>
              </div>

              {canPublish && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publicar Comunicado {isAdmin ? '(Admin)' : '(Jefe)'}</span>
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {tenantData.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-800 rounded-xl transition-colors text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20 text-[10px]">
                        {ann.category}
                      </span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-400 text-[11px]">{ann.date}</span>
                      {ann.priority === 'Alta' && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-semibold">
                          Prioridad Alta
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => deleteAnnouncement(ann.id)}
                        title="Eliminar comunicado"
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-100">{ann.title}</h4>
                  <p className="text-zinc-300 leading-relaxed text-xs">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROCEDIMIENTOS ÚTILES & SOPS */}
      {activeTab === 'sops' && (
        <div className="space-y-6">
          {/* SOP Controls & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>Categoría:</span>
              </div>
              <select
                value={sopCategoryFilter}
                onChange={(e) => setSopCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Todos">Todas las categorías</option>
                <option value="Operativo & Seguridad">Operativo & Seguridad</option>
                <option value="Calidad & Procesos">Calidad & Procesos</option>
                <option value="Salud & Cobertura">Salud & Cobertura</option>
                <option value="Administración & Finanzas">Administración & Finanzas</option>
                <option value="Beneficios & Personas">Beneficios & Personas</option>
                <option value="Sistemas & Accesos">Sistemas & Accesos</option>
              </select>

              {isAdmin && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Building className="w-3.5 h-3.5 text-cyan-400 ml-2" />
                  <span>Sector:</span>
                  <select
                    value={sopSectorFilter}
                    onChange={(e) => setSopSectorFilter(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Todos">Todos los sectores</option>
                    {(activeTenant.masterDropdowns.departments || activeTenant.masterDropdowns.areas || []).map((dep: string) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {canPublish && (
              <button
                onClick={handleOpenNewSop}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Procedimiento Útil</span>
              </button>
            )}
          </div>

          {/* SOP Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProcedures.map((proc) => {
              const hasSteps = proc.steps && proc.steps.length > 0;
              const hasPdf = !!proc.pdfFileName;
              const canEditThis = isAdmin || (isJefe && proc.sector === (user?.assignedDepartment || 'Producción & Mantenimiento'));

              return (
                <div
                  key={proc.id}
                  className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20 text-[10px]">
                        {proc.category}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700/60 font-mono">
                        {proc.sector || 'Todos los sectores'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{proc.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {proc.description || proc.content || 'Sin descripción detallada.'}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
                      {hasSteps ? (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckSquare className="w-3 h-3" />
                          <span>{proc.steps?.length} pasos interactivos</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Paperclip className="w-3 h-3" />
                          <span>Adjunto PDF oficial</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setViewingSop(proc);
                        setCompletedSteps({});
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Instructivo</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {canEditThis && (
                        <>
                          <button
                            onClick={() => handleOpenEditSop(proc)}
                            title="Editar procedimiento"
                            className="p-1.5 text-zinc-400 hover:text-indigo-300 transition-colors rounded hover:bg-zinc-800"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteUsefulProcedure(proc.id)}
                            title="Eliminar procedimiento"
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProcedures.length === 0 && (
              <div className="col-span-full p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                No se encontraron procedimientos útiles para los filtros seleccionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SOP VIEWER (INTERACTIVE STEPS OR PDF) */}
      {viewingSop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20 text-[10px]">
                    {viewingSop.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                    Sector: {viewingSop.sector || 'Todos'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{viewingSop.title}</h3>
              </div>
              <button
                onClick={() => setViewingSop(null)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {viewingSop.description && (
                <div className="p-3 bg-zinc-800/40 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                  {viewingSop.description}
                </div>
              )}

              {/* Steps View */}
              {viewingSop.steps && viewingSop.steps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guía Paso a Paso Interactiva</span>
                  </h4>

                  <div className="space-y-2">
                    {viewingSop.steps.map((step, idx) => {
                      const isDone = !!completedSteps[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                              : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="pt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <div className="w-4 h-4 rounded border border-zinc-500 flex items-center justify-center text-[10px] text-zinc-400 font-mono">
                                {idx + 1}
                              </div>
                            )}
                          </div>
                          <div className={`flex-1 ${isDone ? 'line-through text-zinc-400' : ''}`}>{step}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PDF Document View / Download */}
              {viewingSop.pdfFileName && (
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">{viewingSop.pdfFileName}</div>
                        <div className="text-[11px] text-zinc-400">Documento Normativo Oficial PDF (Listo para descarga)</div>
                      </div>
                    </div>

                    <a
                      href="#download-pdf"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Descargando copia autorizada: ${viewingSop.pdfFileName}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PDF</span>
                    </a>
                  </div>

                  <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                    <p className="font-medium text-zinc-300">Resumen y validez:</p>
                    <p>
                      Este procedimiento fue emitido por la Gerencia de Operaciones y RRHH de {activeTenant.name}. Todos los colaboradores deben cumplir con los lineamientos aquí estipulados.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingSop(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SOP */}
      {showSopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold mb-1">
              {editingSop ? 'Modificar Procedimiento Útil' : 'Nuevo Procedimiento Útil (SOP)'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {isAdmin
                ? 'Publica directivas operativas o normas para toda la empresa o un sector específico.'
                : `Publica instructivos para tu equipo asignado (${user?.assignedDepartment || 'Producción & Mantenimiento'}).`}
            </p>

            <form onSubmit={handleSaveSop} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Título del Procedimiento</label>
                <input
                  type="text"
                  value={sopTitle}
                  onChange={(e) => setSopTitle(e.target.value)}
                  placeholder="Ej. Protocolo de Apertura y Cierre de Cámara de Frío"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Categoría</label>
                  <select
                    value={sopCategory}
                    onChange={(e) => setSopCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Operativo & Seguridad">Operativo & Seguridad</option>
                    <option value="Calidad & Procesos">Calidad & Procesos</option>
                    <option value="Salud & Cobertura">Salud & Cobertura</option>
                    <option value="Administración & Finanzas">Administración & Finanzas</option>
                    <option value="Beneficios & Personas">Beneficios & Personas</option>
                    <option value="Sistemas & Accesos">Sistemas & Accesos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Sector Asignado</label>
                  {isAdmin ? (
                    <select
                      value={sopSector}
                      onChange={(e) => setSopSector(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Todos">Todos los sectores (General)</option>
                      {(activeTenant.masterDropdowns.departments || activeTenant.masterDropdowns.areas || []).map((dep: string) => (
                        <option key={dep} value={dep}>
                          {dep}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-xs text-amber-300 font-medium">
                      {userSector} (Fijo)
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Descripción Breve / Alcance</label>
                <textarea
                  rows={2}
                  value={sopDescription}
                  onChange={(e) => setSopDescription(e.target.value)}
                  placeholder="Explica brevemente cuándo y quiénes deben aplicar este procedimiento..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Formato del Contenido</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSopFormat('steps')}
                    className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                      sopFormat === 'steps'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-zinc-200">Paso a Paso</div>
                    <div className="text-[10px]">Lista numerada interactiva</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSopFormat('pdf')}
                    className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                      sopFormat === 'pdf'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-zinc-200">Adjunto PDF</div>
                    <div className="text-[10px]">Subir documento oficial</div>
                  </button>
                </div>
              </div>

              {sopFormat === 'steps' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">Pasos del Procedimiento</label>
                  {sopSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-mono text-zinc-500">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => {
                          const updated = [...sopSteps];
                          updated[idx] = e.target.value;
                          setSopSteps(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {sopSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSopSteps(sopSteps.filter((_, i) => i !== idx))}
                          className="p-1.5 text-zinc-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSopSteps([...sopSteps, `Paso ${sopSteps.length + 1}: `])}
                    className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Agregar otro paso
                  </button>
                </div>
              )}

              {sopFormat === 'pdf' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">Nombre de Archivo PDF Adjunto</label>
                  <input
                    type="text"
                    value={sopPdfName}
                    onChange={(e) => setSopPdfName(e.target.value)}
                    placeholder="SOP_Seguridad_Planta.pdf"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Los colaboradores podrán consultar o descargar este instructivo en formato PDF desde cualquier terminal o móvil.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSopModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm"
                >
                  {editingSop ? 'Guardar Cambios' : 'Publicar Procedimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin / Jefe Add Announcement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-semibold mb-1">Nueva Publicación en Cartelera</h3>
            <p className="text-xs text-zinc-400 mb-4">
              {isAdmin ? 'Será visible para todos los colaboradores de la empresa.' : `Será visible para tu sector (${user?.assignedDepartment || 'Equipo'}).`}
            </p>

            <form onSubmit={handleAddAnnouncementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Título del Comunicado</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Jornada de Capacitación Obligatoria"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Institucional">Institucional</option>
                    <option value="Operativo">Operativo</option>
                    <option value="Beneficios">Beneficios</option>
                    <option value="Seguridad">Seguridad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Prioridad</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              {isAdmin ? (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Destinatarios / Sector</label>
                  <select
                    value={announcementSector}
                    onChange={(e) => setAnnouncementSector(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Todos">Toda la empresa (General)</option>
                    {(activeTenant.masterDropdowns.departments || activeTenant.masterDropdowns.areas || []).map((dep: string) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Publicación restringida a tu sector: <strong>{userSector}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Cuerpo del Comunicado</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Detalles del aviso o novedad..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm"
                >
                  Publicar Comunicado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
