import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTranslation } from '../../i18n/useTranslation';
import { ModuleKey } from '../../types';
import {
  Newspaper,
  UtensilsCrossed,
  Clock,
  HeartHandshake,
  FileSignature,
  GraduationCap,
  Compass,
  FileSpreadsheet,
  Briefcase,
  Users,
  FolderGit2,
  FileCheck2,
  Palette,
  ShieldAlert,
  Lock,
  Layers,
  Calculator,
  Sparkles,
  DollarSign,
  CheckSquare,
  Award,
  Camera,
  Coins,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onSelectModule: (moduleKey: string) => void;
}

interface MenuItem {
  key: string;
  defaultTitle: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const { role, setIsEmployeeModalOpen, setIsAdminModalOpen, setIsJefeModalOpen, setIsCocinaModalOpen } = useAuth();
  const { activeTenant } = useTenant();
  const { t } = useTranslation();

  const getModuleTitle = (key: string, fallback: string) => {
    // 1. If admin customized the title in branding, that takes precedence
    const customTitle = activeTenant.branding.moduleTitles?.[key as ModuleKey];
    if (customTitle && customTitle !== fallback && customTitle.trim() !== '') {
      return customTitle;
    }
    // 2. Otherwise use translated string if available
    const translated = t.modules?.[key as ModuleKey];
    if (translated) return translated;
    return customTitle || fallback;
  };

  // Role: Fichador (Tablet Kiosco)
  if (role === 'fichador') {
    return (
      <aside className="w-full md:w-64 bg-zinc-950/90 border-r border-zinc-800/80 p-4 flex flex-col shrink-0 space-y-4">
        <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/50 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Camera className="w-4 h-4" />
            <span>Kiosco Fichador Sede</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Terminal biométrico exclusivo para captura fotográfica con validación de clave individual del colaborador.
          </p>
        </div>
        <button
          onClick={() => onSelectModule('fichadas')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>Terminal Kiosco Fichadas</span>
        </button>
      </aside>
    );
  }

  // If public role: Only Portal de Empleos is visible in the sidebar, with quick login options
  if (role === 'public') {
    return (
      <aside className="w-full md:w-64 bg-zinc-950/90 border-r border-zinc-800/80 p-4 flex flex-col shrink-0 space-y-5">
        <div className="space-y-2">
          <div className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
            Acceso Público & Empleo
          </div>
          <button
            onClick={() => onSelectModule('ats')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              activeModule === 'ats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Portal de Empleos (ATS)</span>
          </button>
        </div>

        <div className="p-3.5 bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl space-y-3">
          <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Identificarse en el Portal</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Ingresa con tu cuenta individual para acceder a tus módulos autorizados:
          </p>
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => setIsEmployeeModalOpen(true)}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ingresar como Colaborador</span>
            </button>
            <button
              onClick={() => setIsJefeModalOpen(true)}
              className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Acceso Jefatura</span>
            </button>
            <button
              onClick={() => setIsCocinaModalOpen(true)}
              className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-900/40 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Acceso Cocina / Viandas</span>
            </button>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Ingresar como Administrador</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Exact 10 Modules for Employee in specified order
  const employeeNavItems: MenuItem[] = [
    { key: 'cartelera', defaultTitle: 'Cartelera Digital', icon: Newspaper },
    { key: 'viandas', defaultTitle: 'Viandas & Comedor', icon: UtensilsCrossed },
    { key: 'horarios', defaultTitle: 'Horarios & Asistencia', icon: Clock },
    { key: 'documentos', defaultTitle: 'Licencias y Solicitudes', icon: FileSignature },
    { key: 'clima', defaultTitle: 'Clima Laboral & eNPS', icon: HeartHandshake },
    { key: 'capacitaciones', defaultTitle: 'Capacitaciones & Cursos', icon: GraduationCap },
    { key: 'onboarding', defaultTitle: 'Onboarding & Procesos', icon: Compass },
    { key: 'legajos', defaultTitle: 'Mi Legajo Digital', icon: FolderGit2 },
    { key: 'recibos', defaultTitle: 'Recibos de Sueldo', icon: FileCheck2 },
    { key: 'evaluaciones', defaultTitle: 'Evaluaciones & Progreso', icon: Award },
  ];

  // Exact 11 Modules for Jefe: IDENTICAL ORDER AS COLLABORATOR + 11. contabilidad (Caja Chica)
  const jefeNavItems: MenuItem[] = [
    { key: 'cartelera', defaultTitle: 'Cartelera Digital', icon: Newspaper },
    { key: 'viandas', defaultTitle: 'Viandas & Comedor Equipo', icon: UtensilsCrossed },
    { key: 'horarios', defaultTitle: 'Horarios & Asistencia Equipo', icon: Clock },
    { key: 'documentos', defaultTitle: 'Licencias y Solicitudes', icon: FileSignature },
    { key: 'clima', defaultTitle: 'Clima Laboral & eNPS', icon: HeartHandshake },
    { key: 'capacitaciones', defaultTitle: 'Capacitaciones & Cursos', icon: GraduationCap },
    { key: 'onboarding', defaultTitle: 'Onboarding & Procesos', icon: Compass },
    { key: 'legajos', defaultTitle: 'Legajos de Equipo', icon: FolderGit2 },
    { key: 'recibos', defaultTitle: 'Mis Recibos de Sueldo', icon: FileCheck2 },
    { key: 'evaluaciones', defaultTitle: 'Evaluaciones de Desempeño', icon: Award },
    { key: 'contabilidad', defaultTitle: 'Facturas & Cajas Chicas', icon: DollarSign },
  ];

  // Role: Tesorero
  const tesoreroNavItems: MenuItem[] = [
    { key: 'contabilidad', defaultTitle: 'Tesorería & Cajas Chicas', icon: Coins },
    { key: 'cartelera', defaultTitle: 'Cartelera Digital', icon: Newspaper },
  ];

  // Role: Cocina (Default: Viandas; plus any admin-enabled modules)
  const cocinaEnabled = activeTenant.cocinaEnabledModules || ['viandas'];
  const allPossibleKitchenItems: MenuItem[] = [
    { key: 'viandas', defaultTitle: 'Consolidado de Cocina & Menús', icon: UtensilsCrossed },
    { key: 'cartelera', defaultTitle: 'Cartelera Digital', icon: Newspaper },
    { key: 'horarios', defaultTitle: 'Horarios Cocina', icon: Clock },
    { key: 'documentos', defaultTitle: 'Licencias y Solicitudes', icon: FileSignature },
  ];
  const cocinaNavItems: MenuItem[] = allPossibleKitchenItems.filter((item) =>
    item.key === 'viandas' || cocinaEnabled.includes(item.key as ModuleKey)
  );

  // Role: Admin / SuperAdmin
  const adminHrItems: MenuItem[] = [
    { key: 'nomina', defaultTitle: 'Nómina & Bajas de Personal', icon: Users },
    { key: 'legajos', defaultTitle: 'Legajos Digitales', icon: FolderGit2 },
    { key: 'liquidacion', defaultTitle: 'Motor Liquidación Sueldos', icon: Calculator },
    { key: 'agente_ia', defaultTitle: 'Agente IA Convenios & Leyes', icon: Sparkles },
    { key: 'recibos', defaultTitle: 'Recibos de Sueldo & Auditoría', icon: FileCheck2 },
    { key: 'sac', defaultTitle: 'SAC · Novedades Liquidación', icon: FileSpreadsheet },
    { key: 'evaluaciones', defaultTitle: 'Evaluaciones & Hitos Prueba', icon: Award },
    { key: 'ats', defaultTitle: 'ATS · Búsquedas & Pipeline', icon: Briefcase },
  ];

  const adminOperationItems: MenuItem[] = [
    { key: 'horarios', defaultTitle: 'Horarios & Asistencia (Fichadas)', icon: Clock },
    { key: 'fichadas', defaultTitle: 'Configuración Alertas Fichador', icon: Camera },
    { key: 'contabilidad', defaultTitle: 'Tesorería & Cajas Chicas', icon: DollarSign },
    { key: 'tareas', defaultTitle: 'Tablero de Tareas Operativas', icon: CheckSquare },
    { key: 'documentos', defaultTitle: 'Licencias & Stock Uniformes', icon: FileSignature },
    { key: 'viandas', defaultTitle: 'Viandas & Control Menús', icon: UtensilsCrossed },
    { key: 'capacitaciones', defaultTitle: 'Capacitaciones & E-Learning', icon: GraduationCap },
    { key: 'cartelera', defaultTitle: 'Cartelera Digital & SOPs', icon: Newspaper },
    { key: 'clima', defaultTitle: 'Clima Laboral & Encuestas', icon: HeartHandshake },
    { key: 'onboarding', defaultTitle: 'Onboarding & Procesos', icon: Compass },
  ];

  const renderNavButton = (item: MenuItem) => {
    const Icon = item.icon;
    const isSelected = activeModule === item.key;
    const title = getModuleTitle(item.key, item.defaultTitle);

    return (
      <button
        key={item.key}
        onClick={() => onSelectModule(item.key)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
          isSelected
            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/90'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
            }`}
          />
          <span className="truncate">{title}</span>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-full md:w-64 bg-zinc-950/80 border-r border-zinc-800/80 p-3 flex flex-col shrink-0">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Role: Employee (Exactly 10 modules) */}
        {role === 'employee' && (
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center justify-between">
              <span>Portal del Colaborador</span>
              <span className="text-[9px] font-mono text-zinc-500">10 MÓDULOS</span>
            </div>
            {employeeNavItems.map(renderNavButton)}
          </div>
        )}

        {/* Role: Jefe (Exactly 11 modules in identical order + contabilidad) */}
        {role === 'jefe' && (
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-cyan-400 uppercase flex items-center justify-between">
              <span>Gestión de Jefatura</span>
              <span className="text-[9px] font-mono text-zinc-500">11 MÓDULOS</span>
            </div>
            {jefeNavItems.map(renderNavButton)}
          </div>
        )}

        {/* Role: Tesorero */}
        {role === 'tesorero' && (
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase flex items-center justify-between">
              <span>Panel de Tesorería</span>
              <span className="text-[9px] font-mono text-zinc-500">{tesoreroNavItems.length} MÓDULOS</span>
            </div>
            {tesoreroNavItems.map(renderNavButton)}
          </div>
        )}

        {/* Role: Cocina */}
        {role === 'cocina' && (
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase flex items-center justify-between">
              <span>Panel de Cocina & Comedor</span>
              <span className="text-[9px] font-mono text-zinc-500">{cocinaNavItems.length} MÓDULOS</span>
            </div>
            {cocinaNavItems.map(renderNavButton)}
          </div>
        )}

        {/* Role: Admin or SuperAdmin */}
        {(role === 'admin' || role === 'superadmin') && (
          <>
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-indigo-400 uppercase flex items-center justify-between">
                <span>Gestión RRHH & Talento</span>
                <span className="text-[9px] font-mono text-zinc-500">8 MÓDULOS</span>
              </div>
              {adminHrItems.map(renderNavButton)}
            </div>

            <div className="space-y-1 pt-2 border-t border-zinc-800/60">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center justify-between">
                <span>Operaciones & Asistencia</span>
                <span className="text-[9px] font-mono text-zinc-500">10 MÓDULOS</span>
              </div>
              {adminOperationItems.map(renderNavButton)}
            </div>

            <div className="space-y-1 pt-2 border-t border-zinc-800/60">
              <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                Configuración & Plataforma
              </div>
              <button
                onClick={() => onSelectModule('branding')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                  activeModule === 'branding'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/90'
                }`}
              >
                <Palette className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">White-Label & Branding</span>
              </button>
              {role === 'superadmin' && (
                <button
                  onClick={() => onSelectModule('superadmin')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                    activeModule === 'superadmin'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-300 hover:text-purple-100 hover:bg-purple-950/40 border border-purple-900/30'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">SuperAdmin & Jerarquías</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
