import {
  Tenant,
  TenantData,
  ModuleKey,
  ProbationMilestoneDef,
  CargoPowerDefinition,
  CargoHierarchyDefinition,
} from '../types';
import { INITIAL_TENANTS, INITIAL_DATA } from '../data/mockData';

const TENANTS_STORAGE_KEY = 'nexushr_tenants_v8';
const ACTIVE_TENANT_KEY = 'nexushr_active_tenant_id_v8';
const DATA_PREFIX = 'nexushr_data_v8_';

export const DEFAULT_PROBATION_MILESTONES: ProbationMilestoneDef[] = [
  {
    id: 'milestone-1',
    daysFromHire: 30,
    title: 'Evaluación Mes 1 · Inducción y Adaptación Temprana',
    description: 'Revisión a 30 días de ingreso: adecuación al puesto, normas de convivencia y seguridad.',
    active: true,
  },
  {
    id: 'milestone-2',
    daysFromHire: 90,
    title: 'Evaluación Mes 3 · Hito Intermedio de Desempeño',
    description: 'Revisión a 90 días: productividad, trabajo en equipo y cumplimiento de metas técnicas.',
    active: true,
  },
  {
    id: 'milestone-3',
    daysFromHire: 150,
    title: 'Evaluación Mes 5 · Evaluación Previa a Efectivización',
    description: 'Revisión a 150 días (límite 180 días): decisión fundada de confirmación o pase a planta permanente.',
    active: true,
  },
];

export const DEFAULT_CARGO_POWERS: CargoPowerDefinition[] = [
  {
    cargo: 'Gerente de Planta Industrial',
    canApproveVacations: true,
    canApproveOvertime: true,
    canApproveShifts: true,
    canSignEvaluations: true,
    canManagePettyCash: true,
    canOrderTeamMeals: true,
    canViewTeamSalaries: true,
    canPublishProcedures: true,
    canRequestUniforms: true,
  },
  {
    cargo: 'Jefe de Producción & Mantenimiento',
    canApproveVacations: true,
    canApproveOvertime: true,
    canApproveShifts: true,
    canSignEvaluations: true,
    canManagePettyCash: true,
    canOrderTeamMeals: true,
    canViewTeamSalaries: false,
    canPublishProcedures: true,
    canRequestUniforms: true,
  },
  {
    cargo: 'Jefe de Logística & Expedición',
    canApproveVacations: true,
    canApproveOvertime: true,
    canApproveShifts: true,
    canSignEvaluations: true,
    canManagePettyCash: true,
    canOrderTeamMeals: true,
    canViewTeamSalaries: false,
    canPublishProcedures: true,
    canRequestUniforms: true,
  },
  {
    cargo: 'Supervisora de Calidad',
    canApproveVacations: false,
    canApproveOvertime: true,
    canApproveShifts: true,
    canSignEvaluations: true,
    canManagePettyCash: false,
    canOrderTeamMeals: true,
    canViewTeamSalaries: false,
    canPublishProcedures: true,
    canRequestUniforms: true,
  },
  {
    cargo: 'Supervisor de Turno',
    canApproveVacations: false,
    canApproveOvertime: true,
    canApproveShifts: true,
    canSignEvaluations: true,
    canManagePettyCash: false,
    canOrderTeamMeals: true,
    canViewTeamSalaries: false,
    canPublishProcedures: true,
    canRequestUniforms: true,
  },
  {
    cargo: 'Analista de RRHH & Liquidación',
    canApproveVacations: true,
    canApproveOvertime: true,
    canApproveShifts: true,
    canSignEvaluations: true,
    canManagePettyCash: true,
    canOrderTeamMeals: true,
    canViewTeamSalaries: true,
    canPublishProcedures: true,
    canRequestUniforms: true,
  },
  {
    cargo: 'Operario de Línea',
    canApproveVacations: false,
    canApproveOvertime: false,
    canApproveShifts: false,
    canSignEvaluations: false,
    canManagePettyCash: false,
    canOrderTeamMeals: false,
    canViewTeamSalaries: false,
    canPublishProcedures: false,
    canRequestUniforms: false,
  },
  {
    cargo: 'Técnico Electromecánico',
    canApproveVacations: false,
    canApproveOvertime: false,
    canApproveShifts: false,
    canSignEvaluations: false,
    canManagePettyCash: false,
    canOrderTeamMeals: false,
    canViewTeamSalaries: false,
    canPublishProcedures: false,
    canRequestUniforms: false,
  },
];

export const DEFAULT_CARGO_HIERARCHIES: CargoHierarchyDefinition[] = [
  { cargo: 'Director General', reportsToCargos: [], level: 1, department: 'Dirección' },
  { cargo: 'Gerente de Planta Industrial', reportsToCargos: ['Director General'], level: 2, department: 'Operaciones' },
  { cargo: 'Jefe de Producción & Mantenimiento', reportsToCargos: ['Gerente de Planta Industrial'], level: 3, department: 'Producción & Mantenimiento' },
  { cargo: 'Jefe de Logística & Expedición', reportsToCargos: ['Gerente de Planta Industrial'], level: 3, department: 'Logística & Expedición' },
  { cargo: 'Supervisor de Turno', reportsToCargos: ['Jefe de Producción & Mantenimiento'], level: 4, department: 'Producción & Mantenimiento' },
  { cargo: 'Supervisora de Calidad', reportsToCargos: ['Gerente de Planta Industrial'], level: 4, department: 'Calidad & Procesos' },
  { cargo: 'Operario de Línea', reportsToCargos: ['Supervisor de Turno', 'Jefe de Producción & Mantenimiento'], level: 5, department: 'Producción & Mantenimiento' },
  { cargo: 'Técnico Electromecánico', reportsToCargos: ['Supervisor de Turno', 'Jefe de Producción & Mantenimiento'], level: 5, department: 'Producción & Mantenimiento' },
];

const ALL_MODULES: ModuleKey[] = [
  'cartelera',
  'viandas',
  'horarios',
  'clima',
  'documentos',
  'capacitaciones',
  'onboarding',
  'sac',
  'ats',
  'nomina',
  'legajos',
  'vacaciones',
  'recibos',
  'fichadas',
  'evaluaciones',
  'contabilidad',
  'liquidacion',
  'agente_ia',
  'tareas',
  'alertas',
];

export const storageService = {
  getTenants(): Tenant[] {
    try {
      // Clear legacy storage versions to prevent stale state hiding new features
      ['nexushr_tenants_v1', 'nexushr_tenants_v2', 'nexushr_tenants_v3', 'nexushr_tenants_v4', 'nexushr_tenants_v5'].forEach((k) =>
        localStorage.removeItem(k)
      );

      const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
      if (stored) {
        const parsed: Tenant[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all modules, holidays, and fields are enabled
          const migrated = parsed.map((t) => {
            const enabledSet = new Set(t.enabledModules || []);
            ALL_MODULES.forEach((m) => enabledSet.add(m));
            const defaultTenant = INITIAL_TENANTS.find((it) => it.id === t.id) || INITIAL_TENANTS[0];
            return {
              ...t,
              enabledModules: Array.from(enabledSet),
              holidays: t.holidays && t.holidays.length > 0 ? t.holidays : defaultTenant.holidays || [],
              nominaCustomFields: t.nominaCustomFields && t.nominaCustomFields.length > 0 ? t.nominaCustomFields : defaultTenant.nominaCustomFields || [],
            };
          });
          return migrated;
        }
      }
    } catch (e) {
      console.error('Error reading tenants from localStorage', e);
    }
    // Fallback to initial
    this.saveTenants(INITIAL_TENANTS);
    return INITIAL_TENANTS;
  },

  saveTenants(tenants: Tenant[]): void {
    try {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
    } catch (e) {
      console.error('Error saving tenants to localStorage', e);
    }
  },

  getActiveTenantId(): string {
    try {
      const active = localStorage.getItem(ACTIVE_TENANT_KEY);
      if (active) return active;
    } catch (e) {
      console.error('Error reading active tenant id', e);
    }
    return INITIAL_TENANTS[0].id;
  },

  setActiveTenantId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_TENANT_KEY, id);
    } catch (e) {
      console.error('Error setting active tenant id', e);
    }
  },

  getTenantData(tenantId: string): TenantData {
    const initial = INITIAL_DATA[tenantId] || INITIAL_DATA['tenant-arcor-group'] || {
      announcements: [],
      birthdays: [],
      anniversaries: [],
      mealMenus: [],
      mealReservations: [],
      shifts: [],
      shiftPresets: [],
      shiftObservations: [],
      biometricLogs: [],
      climateSurveys: [],
      documentRequests: [],
      uniforms: [],
      courses: [],
      courseEnrollments: [],
      employeeMatrix: [],
      onboardingStages: [],
      sopDocuments: [],
      sacLicenses: [],
      jobOffers: [],
      candidates: [],
      starredCandidates: [],
      atsRequirements: [],
      employees: [],
      legajoChecklists: [],
      vacationRequests: [],
      payStubBatches: [],
      payStubs: [],
      alerts: [],
      sacColumns: [],
      sacRows: [],
      sacReport: { period: 'Octubre 2026', altas: [], bajas: [], observacionesDetalladas: [] },
    };

    try {
      const key = `${DATA_PREFIX}${tenantId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with initial data so new fields (employees, payStubs, etc.) are always present
        return {
          ...initial,
          ...parsed,
          employees: parsed.employees && parsed.employees.length > 0 ? parsed.employees : initial.employees,
          legajoChecklists: parsed.legajoChecklists && parsed.legajoChecklists.length > 0 ? parsed.legajoChecklists : initial.legajoChecklists,
          payStubs: parsed.payStubs && parsed.payStubs.length > 0 ? parsed.payStubs : initial.payStubs,
          payStubBatches: parsed.payStubBatches && parsed.payStubBatches.length > 0 ? parsed.payStubBatches : initial.payStubBatches,
          vacationRequests: parsed.vacationRequests && parsed.vacationRequests.length > 0 ? parsed.vacationRequests : initial.vacationRequests,
          vacationAdvances: parsed.vacationAdvances || initial.vacationAdvances || [],
          alerts: parsed.alerts && parsed.alerts.length > 0 ? parsed.alerts : initial.alerts,
          sacColumns: parsed.sacColumns && parsed.sacColumns.length > 0 ? parsed.sacColumns : initial.sacColumns,
          sacRows: parsed.sacRows && parsed.sacRows.length > 0 ? parsed.sacRows : initial.sacRows,
          sacReport: parsed.sacReport || initial.sacReport,
          clockPunches: parsed.clockPunches || initial.clockPunches || [],
          evaluations: parsed.evaluations || initial.evaluations || [],
          progressPlans: parsed.progressPlans || initial.progressPlans || [],
          sectorInvoices: parsed.sectorInvoices || initial.sectorInvoices || [],
          pettyCashBoxes: parsed.pettyCashBoxes || initial.pettyCashBoxes || [],
          pettyCashMovements: parsed.pettyCashMovements || initial.pettyCashMovements || [],
          tasks: parsed.tasks || initial.tasks || [],
          usefulProcedures: parsed.usefulProcedures || initial.usefulProcedures || [],
          scheduledAlerts: parsed.scheduledAlerts || initial.scheduledAlerts || [],
          payrollScales: parsed.payrollScales || initial.payrollScales || [],
          aiAgentConfig: parsed.aiAgentConfig || initial.aiAgentConfig,
          aiAgentReports: parsed.aiAgentReports || initial.aiAgentReports || [],
          probationMilestones: parsed.probationMilestones || initial.probationMilestones || DEFAULT_PROBATION_MILESTONES,
          cargoPowers: parsed.cargoPowers || initial.cargoPowers || DEFAULT_CARGO_POWERS,
          cargoHierarchies: parsed.cargoHierarchies || initial.cargoHierarchies || DEFAULT_CARGO_HIERARCHIES,
        };
      }
    } catch (e) {
      console.error('Error reading tenant data', e);
    }

    this.saveTenantData(tenantId, initial);
    return initial;
  },

  saveTenantData(tenantId: string, data: TenantData): void {
    try {
      const key = `${DATA_PREFIX}${tenantId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving tenant data', e);
    }
  },

  resetToDemo(): void {
    try {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(INITIAL_TENANTS));
      localStorage.setItem(ACTIVE_TENANT_KEY, INITIAL_TENANTS[0].id);
      Object.keys(INITIAL_DATA).forEach((tenantId) => {
        localStorage.setItem(`${DATA_PREFIX}${tenantId}`, JSON.stringify(INITIAL_DATA[tenantId]));
      });
    } catch (e) {
      console.error('Error resetting to demo', e);
    }
  },
};
