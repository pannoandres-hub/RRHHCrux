import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import {
  ModuleKey,
  Tenant,
  CargoPowerDefinition,
  CargoHierarchyDefinition,
} from '../../../types';
import {
  DEFAULT_CARGO_POWERS,
  DEFAULT_CARGO_HIERARCHIES,
} from '../../../services/storage';
import {
  Sparkles,
  Building2,
  Plus,
  Shield,
  KeyRound,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  ExternalLink,
  MapPin,
  UtensilsCrossed,
  Network,
  GitFork,
  Check,
  X,
  Trash2,
  Edit3,
  RotateCcw,
  Search,
  Users,
  ChevronRight,
  ShieldCheck,
  Crown,
  Briefcase,
} from 'lucide-react';

export const Mod10SuperAdmin: React.FC = () => {
  const {
    tenants,
    activeTenant,
    switchTenant,
    createTenant,
    updateActiveTenant,
    toggleModuleForActiveTenant,
    updateCargoPowers,
    updateCargoHierarchies,
  } = useTenant();
  const { role, loginAsSuperAdmin } = useAuth();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<'tenants' | 'powers' | 'hierarchy'>('tenants');

  // Tenants State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgEmpPass, setNewOrgEmpPass] = useState('empleado2026');
  const [newOrgAdminPass, setNewOrgAdminPass] = useState('admin123');
  const [newOrgBrandColor, setNewOrgBrandColor] = useState<any>('indigo');
  const [newOrgModules, setNewOrgModules] = useState<ModuleKey[]>([
    'cartelera',
    'viandas',
    'horarios',
    'documentos',
    'capacitaciones',
    'ats',
    'nomina',
    'legajos',
    'vacaciones',
    'recibos',
  ]);

  // Cargo Powers State
  const cargoPowers: CargoPowerDefinition[] =
    activeTenant.cargoPowers && activeTenant.cargoPowers.length > 0
      ? activeTenant.cargoPowers
      : DEFAULT_CARGO_POWERS;
  const [powerSearch, setPowerSearch] = useState('');
  const [showAddCargoModal, setShowAddCargoModal] = useState(false);
  const [newCargoName, setNewCargoName] = useState('');

  // Cargo Hierarchies State
  const cargoHierarchies: CargoHierarchyDefinition[] =
    activeTenant.cargoHierarchies && activeTenant.cargoHierarchies.length > 0
      ? activeTenant.cargoHierarchies
      : DEFAULT_CARGO_HIERARCHIES;
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const [editingHierarchy, setEditingHierarchy] = useState<CargoHierarchyDefinition | null>(null);
  const [hierCargoName, setHierCargoName] = useState('');
  const [hierLevel, setHierLevel] = useState<number>(3);
  const [hierDepartment, setHierDepartment] = useState('');
  const [hierReportsTo, setHierReportsTo] = useState<string[]>([]);
  const [hierFilterDept, setHierFilterDept] = useState<string>('todos');

  const allModules: { key: ModuleKey; label: string; desc: string }[] = [
    { key: 'cartelera', label: 'Módulo 1: Inicio / Cartelera', desc: 'Menú del día, efemérides y comunicados' },
    { key: 'viandas', label: 'Módulo 2: Viandas / Comedor', desc: 'Menús editables por sede y reporte cocina' },
    { key: 'horarios', label: 'Módulo 3: Horarios & Asistencia', desc: 'Turnos por sede, cruce medianoche y fichadas' },
    { key: 'clima', label: 'Módulo 4: Clima Laboral', desc: 'Encuesta activa, eNPS y planes de acción' },
    { key: 'documentos', label: 'Módulo 5: Documentos & Uniformes', desc: 'Dropdowns, firma jefes y stock vestimenta' },
    { key: 'capacitaciones', label: 'Módulo 6: Capacitaciones & Cursos', desc: 'Inscripción abierta, matriz y diplomas PDF' },
    { key: 'onboarding', label: 'Módulo 7: Onboarding & SOP', desc: 'Journey de bienvenida y manuales' },
    { key: 'sac', label: 'Módulo 8: SAC Novedades (Admin)', desc: 'Matriz anual de novedades para liquidación' },
    { key: 'ats', label: 'Módulo 9: ATS / Portal de Empleos', desc: 'Kanban pipeline y reclutamiento' },
    { key: 'nomina', label: 'Módulo 10: Nómina de Personal', desc: 'Altas, bajas con vacantes, kits escolares al 30/06 y alertas DNI' },
    { key: 'legajos', label: 'Módulo 11: Legajos Digitales', desc: 'Checklist editable, antecedentes penales y constancias' },
    { key: 'vacaciones', label: 'Módulo 12: Vacaciones & Licencias', desc: 'Cálculo de antigüedad al 31/12 e informe preventivo' },
    { key: 'recibos', label: 'Módulo 13: Recibos de Sueldo', desc: 'Sábana masiva, firma en páginas impares y registro en vivo' },
    { key: 'fichadas', label: 'Módulo 14: Fichadas Digitales', desc: 'Kiosco tablet, captura biométrica y umbrales de alerta' },
    { key: 'evaluaciones', label: 'Módulo 15: Evaluaciones & Progreso', desc: 'Hitos 30/90/150 días, firma exclusiva empleado' },
    { key: 'contabilidad', label: 'Módulo 16: Facturas & Cajas Chicas', desc: 'Rol tesorero y reposición multi-sector' },
    { key: 'liquidacion', label: 'Módulo 17: Motor Liquidación Sueldos', desc: 'Convenios, básicos y cálculo de haberes' },
    { key: 'agente_ia', label: 'Módulo 18: Agente IA Convenios & Leyes', desc: 'Auditoría automática LCT y CCT' },
    { key: 'tareas', label: 'Módulo 19: Gestión de Tareas', desc: 'Asignaciones de sector y seguimiento' },
  ];

  const handleToggleModuleInCreate = (key: ModuleKey) => {
    if (newOrgModules.includes(key)) {
      setNewOrgModules(newOrgModules.filter((m) => m !== key));
    } else {
      setNewOrgModules([...newOrgModules, key]);
    }
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    createTenant({
      name: newOrgName.trim(),
      slug: newOrgSlug.trim() || newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      employeePassword: newOrgEmpPass.trim(),
      adminPassword: newOrgAdminPass.trim(),
      cocinaPassword: 'cocina2026',
      enabledModules: newOrgModules,
      branding: {
        name: newOrgName.trim(),
        subtitle: `RRHHCrux OS · Portal Corporativo ${newOrgName}`,
        logoUrl: '',
        brandColor: newOrgBrandColor,
        fontFamily: 'Plus Jakarta Sans',
        fontSizeScale: 'normal',
        bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop',
        adminNotificationEmails: 'rrhh@empresa.com, administracion@empresa.com',
        moduleTitles: {
          cartelera: 'Cartelera Digital',
          viandas: 'Viandas & Comedor',
          horarios: 'Horarios & Asistencia',
          clima: 'Clima Laboral',
          documentos: 'Licencias & Documentos',
          capacitaciones: 'Capacitaciones & Cursos',
          onboarding: 'Onboarding & Procesos SOP',
          sac: 'SAC · Novedades Liquidación',
          ats: 'Portal de Empleos',
          nomina: 'Nómina de Personal',
          legajos: 'Legajos Digitales',
          vacaciones: 'Vacaciones & Licencias',
          recibos: 'Recibos de Sueldo',
          fichadas: 'Fichadas Digitales',
          evaluaciones: 'Evaluaciones de Desempeño',
          contabilidad: 'Caja Chica & Tesorería',
          liquidacion: 'Motor Liquidación Sueldos',
          agente_ia: 'Agente IA Convenios & Leyes',
          tareas: 'Gestión de Tareas',
          alertas: 'Avisos & Procedimientos',
        },
      },
      vacationConfig: {
        cycleStartDayMonth: '10-01',
        cycleExpiryDayMonth: '09-30',
        lessThanSixMonthsRatioDays: 20,
        scales: [
          { minYears: 0.5, maxYears: 5, daysGranted: 14 },
          { minYears: 5, maxYears: 10, daysGranted: 21 },
          { minYears: 10, maxYears: 20, daysGranted: 28 },
          { minYears: 20, maxYears: 99, daysGranted: 35 },
        ],
      },
      uniformDefinitions: [
        {
          id: 'uni-1',
          prenda: 'Chomba Polo Corporativa',
          category: 'Camisa',
          sizeType: 'alfanumerico',
          availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
          defaultColor: 'Azul Marino',
          provider: 'Textil Industrial S.A.',
          providerItemName: 'Polo Piqué Algodón',
          price: 18500,
          stock: 120,
          minStock: 30,
          grade: 'A',
        },
      ],
      sedes: [
        {
          id: `sede-${Date.now()}-1`,
          name: 'Sede Central Operativa',
          password: 'central2026',
          address: 'Av. Libertador 2200',
          city: 'Capital',
        },
      ],
      mealOptions: [
        {
          id: 'opt-std-1',
          name: 'Menú Estándar',
          description: 'Plato principal del día y guarnición',
          badgeColor: 'blue',
          isAvailable: true,
        },
        {
          id: 'opt-std-2',
          name: 'Opción Saludable / Vegetariana',
          description: 'Platos ligeros y ensaladas proteicas',
          badgeColor: 'emerald',
          isAvailable: true,
        },
      ],
      jefes: [
        {
          id: `jefe-${Date.now()}-1`,
          name: 'Coordinador General',
          email: 'jefe@empresa.com',
          sector: 'Operaciones',
          lugarTrabajo: 'Sede Central Operativa',
          pin: '1234',
        },
      ],
      masterDropdowns: {
        areas: ['Operaciones', 'Administración', 'Ventas', 'Logística'],
        lugaresTrabajo: ['Sede Central Operativa'],
        razonesSociales: [`${newOrgName.trim()} S.A.`],
        cargos: ['Analista', 'Supervisor', 'Operario', 'Jefe de Sector'],
        tiposSolicitud: ['Indumentaria', 'Licencia', 'Certificado', 'Adelanto'],
      },
    });

    setShowCreateModal(false);
    setNewOrgName('');
    setNewOrgSlug('');
  };

  // Toggle Cargo Power
  const handleTogglePower = (cargoName: string, field: keyof CargoPowerDefinition) => {
    const updated = cargoPowers.map((cp) => {
      if (cp.cargo === cargoName) {
        return {
          ...cp,
          [field]: !cp[field],
        };
      }
      return cp;
    });
    updateCargoPowers(updated);
  };

  // Add New Cargo to Powers Matrix
  const handleAddCargoPower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCargoName.trim()) return;
    if (cargoPowers.some((cp) => cp.cargo.toLowerCase() === newCargoName.trim().toLowerCase())) {
      alert('Este cargo ya existe en la matriz de poderes.');
      return;
    }
    const newEntry: CargoPowerDefinition = {
      cargo: newCargoName.trim(),
      canApproveVacations: false,
      canApproveOvertime: false,
      canApproveShifts: false,
      canSignEvaluations: false,
      canManagePettyCash: false,
      canOrderTeamMeals: false,
      canViewTeamSalaries: false,
      canPublishProcedures: false,
      canRequestUniforms: false,
    };
    updateCargoPowers([...cargoPowers, newEntry]);
    setNewCargoName('');
    setShowAddCargoModal(false);
  };

  // Delete Cargo Power
  const handleDeleteCargoPower = (cargoName: string) => {
    if (confirm(`¿Eliminar el cargo "${cargoName}" de la matriz de poderes?`)) {
      updateCargoPowers(cargoPowers.filter((cp) => cp.cargo !== cargoName));
    }
  };

  // Reset Cargo Powers
  const handleResetPowers = () => {
    if (confirm('¿Restaurar la matriz de poderes a la configuración predeterminada?')) {
      updateCargoPowers(DEFAULT_CARGO_POWERS);
    }
  };

  // Open Hierarchy Modal (Add / Edit)
  const handleOpenHierarchyModal = (item?: CargoHierarchyDefinition) => {
    if (item) {
      setEditingHierarchy(item);
      setHierCargoName(item.cargo);
      setHierLevel(item.level);
      setHierDepartment(item.department || '');
      setHierReportsTo(item.reportsToCargos || []);
    } else {
      setEditingHierarchy(null);
      setHierCargoName('');
      setHierLevel(3);
      setHierDepartment('');
      setHierReportsTo([]);
    }
    setShowHierarchyModal(true);
  };

  // Save Hierarchy Node
  const handleSaveHierarchyNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hierCargoName.trim()) return;

    let updated: CargoHierarchyDefinition[];
    if (editingHierarchy) {
      updated = cargoHierarchies.map((h) =>
        h.cargo === editingHierarchy.cargo
          ? {
              cargo: hierCargoName.trim(),
              level: hierLevel,
              department: hierDepartment.trim() || undefined,
              reportsToCargos: hierReportsTo,
            }
          : h
      );
    } else {
      if (cargoHierarchies.some((h) => h.cargo.toLowerCase() === hierCargoName.trim().toLowerCase())) {
        alert('Este cargo ya existe en el árbol de jerarquías.');
        return;
      }
      updated = [
        ...cargoHierarchies,
        {
          cargo: hierCargoName.trim(),
          level: hierLevel,
          department: hierDepartment.trim() || undefined,
          reportsToCargos: hierReportsTo,
        },
      ];
    }

    updateCargoHierarchies(updated);
    setShowHierarchyModal(false);
  };

  // Delete Hierarchy Node
  const handleDeleteHierarchyNode = (cargoName: string) => {
    if (confirm(`¿Eliminar "${cargoName}" de la jerarquía organizacional?`)) {
      updateCargoHierarchies(cargoHierarchies.filter((h) => h.cargo !== cargoName));
    }
  };

  // Reset Hierarchy
  const handleResetHierarchy = () => {
    if (confirm('¿Restaurar el árbol de jerarquías a la configuración predeterminada?')) {
      updateCargoHierarchies(DEFAULT_CARGO_HIERARCHIES);
    }
  };

  // Level labels and colors
  const levelMeta: Record<number, { title: string; badgeBg: string; badgeText: string; borderColor: string }> = {
    1: { title: 'Nivel 1: Alta Dirección / Directorio', badgeBg: 'bg-purple-500/20', badgeText: 'text-purple-300', borderColor: 'border-purple-500/40' },
    2: { title: 'Nivel 2: Gerencias de Área', badgeBg: 'bg-indigo-500/20', badgeText: 'text-indigo-300', borderColor: 'border-indigo-500/40' },
    3: { title: 'Nivel 3: Jefaturas de Sector & Coordinación', badgeBg: 'bg-blue-500/20', badgeText: 'text-blue-300', borderColor: 'border-blue-500/40' },
    4: { title: 'Nivel 4: Mandos Medios & Supervisión', badgeBg: 'bg-amber-500/20', badgeText: 'text-amber-300', borderColor: 'border-amber-500/40' },
    5: { title: 'Nivel 5: Personal Operativo & Especialistas', badgeBg: 'bg-emerald-500/20', badgeText: 'text-emerald-300', borderColor: 'border-emerald-500/40' },
  };

  const filteredPowers = cargoPowers.filter((cp) =>
    cp.cargo.toLowerCase().includes(powerSearch.toLowerCase())
  );

  const departmentsList = Array.from(
    new Set(cargoHierarchies.map((h) => h.department).filter(Boolean) as string[])
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-zinc-900/80 border border-purple-900/40 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Consola de Gobierno Corporativo & Multi-Tenant</h2>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold">
                Nivel Máximo · SuperAdmin
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Aprovisionamiento de clientes, matriz de poderes decisorios por cargo y estructura jerárquica de la organización
            </p>
          </div>
        </div>

        {activeTab === 'tenants' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Empresa Cliente</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'tenants'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresas & Multi-Tenant ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('powers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'powers'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Matriz de Poderes por Cargo ({cargoPowers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'hierarchy'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Árbol de Jerarquías de Cargos ({cargoHierarchies.length})</span>
        </button>
      </div>

      {/* TAB 1: TENANTS LIST */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tenants.map((tenant) => {
              const isActive = tenant.id === activeTenant.id;
              return (
                <div
                  key={tenant.id}
                  className={`p-6 rounded-xl border flex flex-col justify-between transition-all space-y-4 ${
                    isActive
                      ? 'bg-zinc-900/90 border-purple-500/60 shadow-lg shadow-purple-950/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{tenant.name}</h3>
                          <p className="text-[11px] text-zinc-400 font-mono">ID: {tenant.slug}</p>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="px-2.5 py-1 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Empresa Activa</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => switchTenant(tenant.id)}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Montar Plataforma
                        </button>
                      )}
                    </div>

                    {/* Credentials overview */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
                      <div>
                        <span className="text-zinc-500 block">Clave Empleado:</span>
                        <strong className="text-zinc-300 font-mono">{tenant.employeePassword}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Clave Admin RRHH:</span>
                        <strong className="text-amber-400 font-mono">{tenant.adminPassword}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Clave Cocina:</span>
                        <strong className="text-cyan-400 font-mono">{tenant.cocinaPassword || 'cocina2026'}</strong>
                      </div>
                    </div>

                    {/* Enabled modules preview */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-zinc-400">
                        Módulos Habilitados ({tenant.enabledModules.length}/{allModules.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tenant.enabledModules.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] capitalize"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Toggles for active tenant */}
                  {isActive && (
                    <div className="pt-4 border-t border-zinc-800 space-y-3">
                      <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Control Granular de Módulos (Licenciamiento de Cliente)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-60 overflow-y-auto pr-1">
                        {allModules.map((mod) => {
                          const isEnabled = tenant.enabledModules.includes(mod.key);
                          return (
                            <label
                              key={mod.key}
                              className="flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-950 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => toggleModuleForActiveTenant(mod.key, e.target.checked)}
                                className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0"
                              />
                              <span className={`text-[11px] ${isEnabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                {mod.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ DE PODERES POR CARGO */}
      {activeTab === 'powers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Matriz de Poderes y Facultades Decisorias por Puesto</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Define con precisión qué cargos tienen autorización para aprobar vacaciones, horas extras, turnos, firmar evaluaciones, operar caja chica o solicitar viandas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPowers}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Restaurar valores estándar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Matriz</span>
              </button>

              <button
                onClick={() => setShowAddCargoModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Cargo a la Matriz</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs max-w-sm">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nombre de cargo..."
              value={powerSearch}
              onChange={(e) => setPowerSearch(e.target.value)}
              className="bg-transparent border-none text-zinc-200 focus:outline-none w-full placeholder:text-zinc-500 text-xs"
            />
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-md">
            <table className="w-full text-xs text-left text-zinc-300">
              <thead className="bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Puesto / Cargo</th>
                  <th className="py-3 px-2 text-center font-semibold" title="Aprobar solicitudes de vacaciones ordinarias">
                    Vacaciones
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Aprobar horas extras y suplementarias">
                    Hs. Extras
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Aprobar asignación de turnos y francos">
                    Turnos
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Emitir y firmar evaluaciones de desempeño">
                    Evaluaciones
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Rendir o solicitar fondos de Caja Chica">
                    Caja Chica
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Gestionar pedidos de comedor/viandas para equipo">
                    Viandas Eq.
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Acceso a nómina salarial del sector">
                    Ver Salarios
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Publicar procedimientos y SOPs para la empresa">
                    Publicar SOP
                  </th>
                  <th className="py-3 px-2 text-center font-semibold" title="Solicitar dotación de indumentaria de trabajo">
                    Uniformes
                  </th>
                  <th className="py-3 px-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredPowers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-zinc-500">
                      No se encontraron cargos en la matriz con ese filtro.
                    </td>
                  </tr>
                ) : (
                  filteredPowers.map((cp) => (
                    <tr key={cp.cargo} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span>{cp.cargo}</span>
                        </div>
                      </td>

                      {/* Power toggles */}
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canApproveVacations}
                          onChange={() => handleTogglePower(cp.cargo, 'canApproveVacations')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canApproveOvertime}
                          onChange={() => handleTogglePower(cp.cargo, 'canApproveOvertime')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canApproveShifts}
                          onChange={() => handleTogglePower(cp.cargo, 'canApproveShifts')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canSignEvaluations}
                          onChange={() => handleTogglePower(cp.cargo, 'canSignEvaluations')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canManagePettyCash}
                          onChange={() => handleTogglePower(cp.cargo, 'canManagePettyCash')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canOrderTeamMeals}
                          onChange={() => handleTogglePower(cp.cargo, 'canOrderTeamMeals')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canViewTeamSalaries}
                          onChange={() => handleTogglePower(cp.cargo, 'canViewTeamSalaries')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canPublishProcedures}
                          onChange={() => handleTogglePower(cp.cargo, 'canPublishProcedures')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={cp.canRequestUniforms}
                          onChange={() => handleTogglePower(cp.cargo, 'canRequestUniforms')}
                          className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteCargoPower(cp.cargo)}
                          className="p-1 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded transition-colors"
                          title="Eliminar de la matriz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ÁRBOL DE JERARQUÍAS DE CARGOS */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-400" />
                <span>Estructura Jerárquica & Árbol de Dependencias de Cargos</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Organización de niveles 1 al 5 (Dirección, Gerencias, Jefaturas, Supervisión, Operativos) con líneas formales de reporte.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetHierarchy}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Restaurar árbol predeterminado"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Jerarquía</span>
              </button>

              <button
                onClick={() => handleOpenHierarchyModal()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Puesto al Árbol</span>
              </button>
            </div>
          </div>

          {/* Department Filter */}
          {departmentsList.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">Filtrar por Departamento:</span>
              <button
                onClick={() => setHierFilterDept('todos')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  hierFilterDept === 'todos'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({cargoHierarchies.length})
              </button>
              {departmentsList.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setHierFilterDept(dept)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    hierFilterDept === dept
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}

          {/* Visual Tiers (Levels 1 to 5) */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((levelNum) => {
              const meta = levelMeta[levelNum];
              const itemsAtLevel = cargoHierarchies.filter(
                (h) =>
                  h.level === levelNum &&
                  (hierFilterDept === 'todos' || h.department === hierFilterDept)
              );

              if (itemsAtLevel.length === 0 && hierFilterDept !== 'todos') return null;

              return (
                <div
                  key={levelNum}
                  className={`p-4 rounded-xl border bg-zinc-900/50 ${meta.borderColor} space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-4 h-4 ${meta.badgeText}`} />
                      <h4 className="font-bold text-xs text-white">{meta.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}>
                        {itemsAtLevel.length} puesto(s)
                      </span>
                    </div>
                  </div>

                  {itemsAtLevel.length === 0 ? (
                    <div className="text-[11px] text-zinc-500 italic py-2">
                      No hay cargos configurados en este nivel para el filtro seleccionado.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {itemsAtLevel.map((item) => {
                        // Find who reports to this item
                        const subordinates = cargoHierarchies.filter((h) =>
                          h.reportsToCargos?.includes(item.cargo)
                        );

                        return (
                          <div
                            key={item.cargo}
                            className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3.5 space-y-2.5 relative group hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                                  <span>{item.cargo}</span>
                                </div>
                                {item.department && (
                                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                                    Área: {item.department}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenHierarchyModal(item)}
                                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                  title="Editar puesto"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteHierarchyNode(item.cargo)}
                                  className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                                  title="Eliminar puesto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Reports to parent cargos */}
                            <div className="space-y-1 text-[11px] pt-1.5 border-t border-zinc-800/80">
                              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                                Reporta Jerárquicamente a:
                              </span>
                              {item.reportsToCargos && item.reportsToCargos.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {item.reportsToCargos.map((parent) => (
                                    <span
                                      key={parent}
                                      className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1"
                                    >
                                      <ChevronRight className="w-2.5 h-2.5 text-zinc-500" />
                                      <span>{parent}</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-zinc-500 text-[10px] italic">
                                  Cúspide de la estructura (No reporta a nadie)
                                </span>
                              )}
                            </div>

                            {/* Subordinates */}
                            {subordinates.length > 0 && (
                              <div className="space-y-1 text-[11px] pt-1">
                                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                                  Supervisa Directamente ({subordinates.length}):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {subordinates.map((sub) => (
                                    <span
                                      key={sub.cargo}
                                      className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px]"
                                    >
                                      {sub.cargo}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Organización Tenant */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-1">Aprovisionar Nueva Empresa Cliente</h3>
            <p className="text-xs text-zinc-400 mb-5">
              Crea un nuevo tenant independiente con su propio branding, contraseñas y módulos contratados.
            </p>

            <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Ej. Logística Global Federal"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Identificador Slug</label>
                  <input
                    type="text"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    placeholder="logistica-federal"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Contraseña Genérica de Empleado</label>
                  <input
                    type="text"
                    value={newOrgEmpPass}
                    onChange={(e) => setNewOrgEmpPass(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Contraseña de Administrador RRHH</label>
                  <input
                    type="text"
                    value={newOrgAdminPass}
                    onChange={(e) => setNewOrgAdminPass(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Color de Marca Inicial</label>
                <select
                  value={newOrgBrandColor}
                  onChange={(e) => setNewOrgBrandColor(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                >
                  <option value="indigo">Índigo</option>
                  <option value="emerald">Esmeralda</option>
                  <option value="cyan">Cian</option>
                  <option value="blue">Azul</option>
                  <option value="amber">Ámbar</option>
                </select>
              </div>

              {/* Selection of modules */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="block font-semibold text-zinc-200">
                  Selección de Módulos Habilitados para la Empresa:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allModules.map((mod) => (
                    <label
                      key={mod.key}
                      className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/70 flex items-center gap-2.5 cursor-pointer hover:bg-zinc-950"
                    >
                      <input
                        type="checkbox"
                        checked={newOrgModules.includes(mod.key)}
                        onChange={() => handleToggleModuleInCreate(mod.key)}
                        className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-zinc-200">{mod.label}</div>
                        <div className="text-[10px] text-zinc-500">{mod.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow-sm"
                >
                  Aprovisionar Plataforma de Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Añadir Cargo a Matriz de Poderes */}
      {showAddCargoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl text-zinc-100">
            <h3 className="text-base font-bold text-white mb-1">Añadir Puesto a la Matriz de Poderes</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Ingresa el nombre del cargo para habilitar y configurar sus facultades de aprobación.
            </p>

            <form onSubmit={handleAddCargoPower} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Nombre del Cargo</label>
                <input
                  type="text"
                  value={newCargoName}
                  onChange={(e) => setNewCargoName(e.target.value)}
                  placeholder="Ej. Líder de Mantenimiento Predictivo"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddCargoModal(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
                >
                  Agregar Puesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Añadir / Editar Nodo de Jerarquía */}
      {showHierarchyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-1">
              {editingHierarchy ? 'Editar Puesto en la Jerarquía' : 'Nuevo Puesto en el Árbol Jerárquico'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Configura el nivel orgánico, departamento y los cargos a los cuales reporta formalmente.
            </p>

            <form onSubmit={handleSaveHierarchyNode} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Nombre del Cargo</label>
                <input
                  type="text"
                  value={hierCargoName}
                  onChange={(e) => setHierCargoName(e.target.value)}
                  placeholder="Ej. Supervisor de Mantenimiento Mecánico"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Nivel Jerárquico</label>
                  <select
                    value={hierLevel}
                    onChange={(e) => setHierLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value={1}>Nivel 1: Alta Dirección / Directorio</option>
                    <option value={2}>Nivel 2: Gerencia de Área</option>
                    <option value={3}>Nivel 3: Jefatura de Sector</option>
                    <option value={4}>Nivel 4: Mandos Medios / Supervisión</option>
                    <option value={5}>Nivel 5: Personal Operativo / Especialistas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Área o Departamento</label>
                  <input
                    type="text"
                    value={hierDepartment}
                    onChange={(e) => setHierDepartment(e.target.value)}
                    placeholder="Ej. Producción & Mantenimiento"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Parents selection */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Reporta a los siguientes cargos superiores:
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">
                  Selecciona uno o más cargos existentes a los que este puesto rinde cuenta.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-950/70 border border-zinc-800 rounded-lg">
                  {cargoHierarchies
                    .filter((h) => h.cargo !== hierCargoName)
                    .map((h) => {
                      const isSelected = hierReportsTo.includes(h.cargo);
                      return (
                        <label
                          key={h.cargo}
                          className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setHierReportsTo([...hierReportsTo, h.cargo]);
                              } else {
                                setHierReportsTo(hierReportsTo.filter((c) => c !== h.cargo));
                              }
                            }}
                            className="rounded bg-zinc-800 border-zinc-700 text-purple-600 focus:ring-0"
                          />
                          <span>
                            {h.cargo} <span className="text-zinc-500">(Niv. {h.level})</span>
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowHierarchyModal(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
                >
                  Guardar en Jerarquía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
