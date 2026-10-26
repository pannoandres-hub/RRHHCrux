import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Tenant,
  TenantData,
  ModuleKey,
  MealReservation,
  MealMenuDay,
  CourseEnrollment,
  Course,
  DocumentRequest,
  ATSCandidate,
  BiometricLog,
  AnnouncementItem,
  BrandingConfig,
  EmployeeProfile,
  NotificationAlert,
  PayStubItem,
  PayStubBatch,
  VacationRequest,
  UniformOrder,
  UniformVoucher,
  UniformDefinition,
  SACNoveltyColumn,
  SACNoveltyRow,
  SACAdjustmentItem,
  SACNoteToConsiderItem,
  HolidayItem,
  NominaFieldDef,
  JefeUser,
  SedeItem,
  DigitalClockPunch,
  PerformanceEvaluation,
  ProgressPlan,
  SectorInvoice,
  PettyCashBox,
  PettyCashMovement,
  TaskItem,
  UsefulProcedure,
  ScheduledCompanyAlert,
  PayrollScale,
  AIAgentReport,
  AIAgentConfig,
  VacationAdvanceRequest,
  CargoPowerDefinition,
  CargoHierarchyDefinition,
  ProbationMilestoneDef,
  EvaluationQuestionDef,
} from '../types';
import { storageService } from '../services/storage';

interface TenantContextType {
  tenants: Tenant[];
  activeTenant: Tenant;
  tenantData: TenantData;
  switchTenant: (tenantId: string) => void;
  createTenant: (tenantData: Omit<Tenant, 'id'>) => string;
  updateActiveTenant: (updates: Partial<Tenant>) => void;
  updateBranding: (brandingUpdates: Partial<BrandingConfig>) => void;
  updateTenantData: (updates: Partial<TenantData>) => void;
  resetDemoData: () => void;

  // Specific domain helpers
  addNotificationAlert: (alert: Omit<NotificationAlert, 'id' | 'date' | 'resolved' | 'autoEmailDispatchedTo' | 'dispatchedAt'>) => void;
  hireEmployee: (profile: Omit<EmployeeProfile, 'id' | 'probationEndDate' | 'status'>) => void;
  terminateEmployee: (
    employeeId: string,
    terminationDate: string,
    reason: string,
    vacancyOption: 'Vacante Activa' | 'Vacante Suspendida'
  ) => void;
  updateEmployee: (employeeId: string, updates: Partial<EmployeeProfile>) => void;
  addMealReservation: (reservation: Omit<MealReservation, 'id' | 'createdAt'>) => void;
  saveMealMenuDay: (day: MealMenuDay) => void;
  saveMealOptions: (options: Tenant['mealOptions']) => void;
  enrollInCourse: (enrollment: Omit<CourseEnrollment, 'id' | 'enrolledAt' | 'confirmationSent'>) => { success: boolean; message: string };
  markEnrollmentConfirmationSent: (enrollmentId: string) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  updateCourseMatrix: (employeeId: string, courseId: string, completionDate: string) => void;
  addDocumentRequest: (request: Omit<DocumentRequest, 'id' | 'trackingCode' | 'createdAt' | 'status'>) => string;
  approveDocumentRequest: (
    requestId: string,
    signedBy: string,
    signatureDataUrl?: string,
    overrides?: {
      medicalDays?: number;
      medicalLeaveStartDate?: string;
      medicalLeaveEndDate?: string;
      returnToWorkDate?: string;
      advanceAmount?: number;
    }
  ) => void;
  rejectDocumentRequest: (requestId: string, reason?: string) => void;
  addCandidate: (candidate: Omit<ATSCandidate, 'id' | 'appliedDate' | 'stage' | 'stageDates'>) => void;
  updateCandidateStage: (
    candidateId: string,
    stage: ATSCandidate['stage'],
    extra?: {
      interviewStatus?: ATSCandidate['interviewStatus'];
      psychometricStatus?: ATSCandidate['psychometricStatus'];
      notes?: string;
      advanceReasonTags?: string[];
      rejectionReasonTags?: string[];
    }
  ) => void;
  toggleCandidateFeatured: (candidateId: string) => void;
  purgeGdprCandidates: () => number;
  importBiometricLogs: (logs: Omit<BiometricLog, 'id'>[]) => void;
  addAnnouncement: (announcement: Omit<AnnouncementItem, 'id' | 'date'>) => void;
  deleteAnnouncement: (id: string) => void;
  updateMasterDropdowns: (dropdowns: Tenant['masterDropdowns']) => void;
  toggleModuleForActiveTenant: (moduleKey: ModuleKey, enabled: boolean) => void;

  // New modules: Recibos, Vacaciones, Uniformes & SAC
  signEmployeePayStub: (
    payStubId: string,
    conformityStatus: 'Conforme' | 'Disconforme',
    signatureDataUrl: string,
    disconformityReason?: string
  ) => void;
  signEmployerPayStubsBatch: (batchId: string, employerSignatureDataUrl: string) => void;
  addPayStubBatch: (batch: Omit<PayStubBatch, 'id' | 'uploadedAt' | 'status'>, payStubs: Omit<PayStubItem, 'id' | 'batchId'>[]) => void;
  requestVacation: (req: Omit<VacationRequest, 'id' | 'createdAt' | 'status'>) => void;
  approveVacation: (reqId: string, approvedBy: string) => void;
  createUniformOrder: (order: Omit<UniformOrder, 'id' | 'createdAt'>) => void;
  createUniformVoucher: (voucher: Omit<UniformVoucher, 'id' | 'isRedeemed'>) => void;
  redeemUniformVoucher: (voucherId: string) => void;
  updateUniformDefinition: (id: string, updates: Partial<UniformDefinition>) => void;
  saveSACNoveltyRow: (row: SACNoveltyRow) => void;
  updateSACNoveltyColumns: (columns: SACNoveltyColumn[]) => void;
  closeSACMonth: (period: string) => void;
  reopenSACMonth: (period: string) => void;
  updateSACAdjustments: (period: string, adjustments: SACAdjustmentItem[], notes: SACNoteToConsiderItem[]) => void;
  updateHolidays: (holidays: HolidayItem[]) => void;
  updateNominaCustomFields: (fields: NominaFieldDef[]) => void;
  updateJefeUsers: (jefes: JefeUser[]) => void;
  updateCompanyCredentials: (creds: {
    employeePassword?: string;
    adminPassword?: string;
    cocinaPassword?: string;
    jefes?: JefeUser[];
    sedes?: SedeItem[];
  }) => void;

  // New modules: Fichadas, Evaluaciones, Contabilidad, Liquidacion, Agente IA, Tareas, Alertas
  addClockPunch: (punch: Omit<DigitalClockPunch, 'id'>) => void;
  addPerformanceEvaluation: (evalItem: Omit<PerformanceEvaluation, 'id'>, createPlan?: boolean) => void;
  updateProgressPlan: (planId: string, updates: Partial<ProgressPlan>) => void;
  addSectorInvoice: (invoice: Omit<SectorInvoice, 'id' | 'createdAt'>) => void;
  deleteSectorInvoice: (invoiceId: string) => void;
  addPettyCashMovement: (movement: Omit<PettyCashMovement, 'id' | 'createdAt'>) => void;
  createPettyCashBox: (box: Omit<PettyCashBox, 'id' | 'createdAt'>) => void;
  updatePettyCashBox: (boxId: string, updates: Partial<PettyCashBox>) => void;
  deletePettyCashBox: (boxId: string) => void;
  addTaskItem: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  toggleTaskItem: (taskId: string, legajo?: string) => void;
  deleteTaskItem: (taskId: string) => void;
  addUsefulProcedure: (proc: Omit<UsefulProcedure, 'id' | 'updatedAt'>) => void;
  updateUsefulProcedure: (procId: string, updates: Partial<UsefulProcedure>) => void;
  deleteUsefulProcedure: (procId: string) => void;
  addScheduledAlert: (alert: Omit<ScheduledCompanyAlert, 'id' | 'createdAt'>) => void;
  deleteScheduledAlert: (alertId: string) => void;
  acknowledgeScheduledAlert: (alertId: string, userIdOrLegajo: string) => void;
  updatePayrollScales: (scales: PayrollScale[]) => void;
  updateAIAgentConfig: (configUpdates: Partial<AIAgentConfig>) => void;
  runAIAgentAudit: () => AIAgentReport;
  applyAIAgentReportScales: (reportId: string) => void;
  requestVacationAdvance: (req: Omit<VacationAdvanceRequest, 'id' | 'createdAt' | 'status'>) => void;
  approveVacationAdvance: (advId: string, jefeName: string, signatureDataUrl?: string) => void;
  updateCargoPowers: (powers: CargoPowerDefinition[]) => void;
  updateCargoHierarchies: (hierarchies: CargoHierarchyDefinition[]) => void;
  updateProbationMilestones: (milestones: ProbationMilestoneDef[]) => void;
  updateEvaluationQuestions: (questions: EvaluationQuestionDef[]) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => storageService.getTenants());
  const [activeTenantId, setActiveTenantIdState] = useState<string>(() => storageService.getActiveTenantId());
  const [tenantData, setTenantDataState] = useState<TenantData>(() =>
    storageService.getTenantData(storageService.getActiveTenantId())
  );

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  useEffect(() => {
    const data = storageService.getTenantData(activeTenantId);
    setTenantDataState(data);
  }, [activeTenantId]);

  const switchTenant = (tenantId: string) => {
    const found = tenants.find((t) => t.id === tenantId);
    if (found) {
      setActiveTenantIdState(tenantId);
      storageService.setActiveTenantId(tenantId);
      const data = storageService.getTenantData(tenantId);
      setTenantDataState(data);
    }
  };

  const createTenant = (newTenantData: Omit<Tenant, 'id'>) => {
    const newId = `tenant-${Date.now()}`;
    const newTenant: Tenant = { ...newTenantData, id: newId };
    const updatedTenants = [...tenants, newTenant];
    setTenants(updatedTenants);
    storageService.saveTenants(updatedTenants);

    const blankData: TenantData = {
      announcements: [],
      birthdays: [],
      anniversaries: [],
      mealMenus: [],
      mealReservations: [],
      shifts: [],
      biometricLogs: [],
      climateSurveys: [],
      documentRequests: [],
      uniformOrders: [],
      uniformVouchers: [],
      courses: [],
      courseEnrollments: [],
      employeeMatrix: [],
      onboardingStages: [],
      sopDocuments: [],
      employees: [],
      legajoChecklists: [],
      vacationRequests: [],
      payStubBatches: [],
      payStubs: [],
      alerts: [],
      sacColumns: [
        { key: 'legajo', label: 'Legajo', type: 'text' },
        { key: 'name', label: 'Nombre Completo', type: 'text' },
        { key: 'cargo', label: 'Cargo', type: 'text' },
        { key: 'horasJMG', label: 'Horas JMG', type: 'number' },
        { key: 'horasNocturnas', label: 'Horas Noct.', type: 'number' },
      ],
      sacRows: [],
      sacReport: { period: 'Periodo Inicial', altas: [], bajas: [], observacionesDetalladas: [] },
      jobOffers: [],
      candidates: [],
      clockPunches: [],
      evaluations: [],
      progressPlans: [],
      sectorInvoices: [],
      pettyCashBoxes: [],
      pettyCashMovements: [],
      tasks: [],
      taskItems: [],
      usefulProcedures: [],
      scheduledAlerts: [],
      payrollScales: [],
      aiAgentConfig: {
        enabled: true,
        prompt: 'Monitorear Boletín Oficial y acuerdos de paritarias vigentes (UOCRA, Comercio, Gastronómicos, Sanidad).',
        scheduledTime: '08:00',
        frequency: 'daily',
        portableApiKey: '',
        lastRunAt: new Date().toISOString(),
        status: 'idle',
      },
      aiAgentReports: [],
    };
    storageService.saveTenantData(newId, blankData);
    switchTenant(newId);
    return newId;
  };

  const updateActiveTenant = (updates: Partial<Tenant>) => {
    const updatedTenants = tenants.map((t) => (t.id === activeTenant.id ? { ...t, ...updates } : t));
    setTenants(updatedTenants);
    storageService.saveTenants(updatedTenants);
  };

  const updateBranding = (brandingUpdates: Partial<BrandingConfig>) => {
    const updatedBranding = { ...activeTenant.branding, ...brandingUpdates };
    updateActiveTenant({ branding: updatedBranding });
  };

  const updateTenantData = (updates: Partial<TenantData>) => {
    const updated = { ...tenantData, ...updates };
    setTenantDataState(updated);
    storageService.saveTenantData(activeTenant.id, updated);
  };

  const resetDemoData = () => {
    storageService.resetToDemo();
    const freshTenants = storageService.getTenants();
    const freshActiveId = storageService.getActiveTenantId();
    setTenants(freshTenants);
    setActiveTenantIdState(freshActiveId);
    setTenantDataState(storageService.getTenantData(freshActiveId));
  };

  const addNotificationAlert = (alert: Omit<NotificationAlert, 'id' | 'date' | 'resolved' | 'autoEmailDispatchedTo' | 'dispatchedAt'>) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const emails = activeTenant.branding.adminNotificationEmails || 'rrhh@empresa.com';

    const newAlert: NotificationAlert = {
      ...alert,
      id: `alt-${Date.now()}`,
      date: dateStr,
      resolved: false,
      autoEmailDispatchedTo: emails,
      dispatchedAt: `${dateStr} ${timeStr}`,
    };
    updateTenantData({ alerts: [newAlert, ...tenantData.alerts] });
  };

  const hireEmployee = (profile: Omit<EmployeeProfile, 'id' | 'probationEndDate' | 'status'>) => {
    const newId = `emp-${Date.now()}`;
    const hireDateObj = new Date(profile.hireDate || new Date().toISOString().split('T')[0]);
    const probationObj = new Date(hireDateObj);
    probationObj.setDate(probationObj.getDate() + 180);

    const newEmp: EmployeeProfile = {
      ...profile,
      id: newId,
      probationEndDate: probationObj.toISOString().split('T')[0],
      status: 'Activo',
      receiptPasscode: `REC-${profile.legajo.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
    };

    // 1. Add to employees
    const updatedEmployees = [newEmp, ...tenantData.employees];

    // 2. Add to SAC novelties report (Altas) & sacRows
    const updatedSacReport = {
      ...tenantData.sacReport,
      altas: [
        {
          name: `${newEmp.name} ${newEmp.lastName}`.trim(),
          legajo: newEmp.legajo,
          cargo: newEmp.cargo,
          razonSocial: newEmp.razonSocial,
          fechaIngreso: newEmp.hireDate,
        },
        ...tenantData.sacReport.altas,
      ],
    };

    const newSacRow: SACNoveltyRow = {
      employeeId: newId,
      legajo: newEmp.legajo,
      name: `${newEmp.name} ${newEmp.lastName}`.trim(),
      cargo: newEmp.cargo,
      sector: newEmp.area,
      razonSocial: newEmp.razonSocial,
      horasJMG: 160,
      feriadosTrabajados: 0,
      horasNocturnas: 0,
      coeficienteNocturno: 0,
      asistencia: true,
      licMedicaDias: 0,
      licARTDias: 0,
      licVacacionesDias: 0,
      licExamenDias: 0,
      licMaternidadDias: 0,
      licDueloDias: 0,
      totalDiasNoTrabajados: 0,
      anticipos: 0,
      descuentoPrepaga: 0,
      fechaIngreso: newEmp.hireDate,
    };
    const updatedSacRows = [newSacRow, ...tenantData.sacRows];

    // 3. Add to legajo checklist
    const newChecklist = {
      id: `chk-${Date.now()}`,
      employeeId: newId,
      employeeName: `${newEmp.name} ${newEmp.lastName}`.trim(),
      employeeLegajo: newEmp.legajo,
      documents: [
        { key: 'dni', title: 'Documento Nacional de Identidad (Frente y Dorso)', required: true, submitted: true, submittedDate: newEmp.hireDate },
        { key: 'afip', title: 'Alta Temprana AFIP / Mi Simplificación', required: true, submitted: true, submittedDate: newEmp.hireDate },
        { key: 'apto', title: 'Examen Médico Preocupacional (Apto de Ley)', required: true, submitted: false },
        { key: 'penales', title: 'Certificado de Antecedentes Penales (RNR)', required: true, submitted: false },
        { key: 'titulo', title: 'Título Técnico / Universitario Homologado', required: true, submitted: false },
        { key: 'cuil', title: 'Constancia Oficial de CUIL ANSES', required: true, submitted: true, submittedDate: newEmp.hireDate },
      ],
    };

    updateTenantData({
      employees: updatedEmployees,
      sacReport: updatedSacReport,
      sacRows: updatedSacRows,
      legajoChecklists: [newChecklist, ...tenantData.legajoChecklists],
    });
  };

  const terminateEmployee = (
    employeeId: string,
    terminationDate: string,
    reason: string,
    vacancyOption: 'Vacante Activa' | 'Vacante Suspendida'
  ) => {
    const emp = tenantData.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const retainedDate = new Date(terminationDate);
    retainedDate.setMonth(retainedDate.getMonth() + 3);

    // 1. Update employee in payroll to vacancy
    const updatedEmployees = tenantData.employees.map((e) => {
      if (e.id === employeeId) {
        return {
          ...e,
          name: vacancyOption === 'Vacante Activa' ? '[Vacante Activa]' : '[Vacante Suspendida]',
          lastName: '',
          cuil: '',
          dni: '',
          email: '',
          phone: '',
          status: vacancyOption,
          terminationDate,
          terminationReason: reason,
          retainedUntil: retainedDate.toISOString().split('T')[0],
        };
      }
      return e;
    });

    // 2. Cascade purge: remove from birthdays & anniversaries
    const updatedBdays = tenantData.birthdays.filter((b) => !b.name.includes(emp.name));
    const updatedAnivs = tenantData.anniversaries.filter((a) => !a.name.includes(emp.name));

    // 3. Remove future shifts in Horarios from terminationDate onwards
    const updatedShifts = tenantData.shifts.filter((s) => {
      if (s.employeeLegajo === emp.legajo && s.date >= terminationDate) {
        return false;
      }
      return true;
    });

    // 4. Update SAC: remove from main matrix rows and append to Bajas section
    const updatedSacRows = tenantData.sacRows.filter((r) => r.legajo !== emp.legajo);
    const updatedSacReport = {
      ...tenantData.sacReport,
      bajas: [
        {
          name: `${emp.name} ${emp.lastName}`.trim(),
          legajo: emp.legajo,
          cargo: emp.cargo,
          fechaBaja: terminationDate,
          motivo: reason,
        },
        ...tenantData.sacReport.bajas,
      ],
    };

    updateTenantData({
      employees: updatedEmployees,
      birthdays: updatedBdays,
      anniversaries: updatedAnivs,
      shifts: updatedShifts,
      sacRows: updatedSacRows,
      sacReport: updatedSacReport,
    });
  };

  const updateEmployee = (employeeId: string, updates: Partial<EmployeeProfile>) => {
    const oldEmp = tenantData.employees.find((e) => e.id === employeeId);
    if (!oldEmp) return;

    const newEmp = { ...oldEmp, ...updates };
    const updatedEmployees = tenantData.employees.map((e) => (e.id === employeeId ? newEmp : e));

    // Propagate legajo/name/cargo/area/razonSocial changes across all planillas
    const oldLegajo = oldEmp.legajo;
    const newLegajo = newEmp.legajo;
    const fullName = `${newEmp.name} ${newEmp.lastName}`.trim();

    // 1. SAC Rows
    const updatedSacRows = (tenantData.sacRows || []).map((r) => {
      if (r.employeeId === employeeId || r.legajo === oldLegajo) {
        return {
          ...r,
          legajo: newLegajo,
          name: fullName,
          cargo: newEmp.cargo,
          sector: newEmp.area,
          razonSocial: newEmp.razonSocial,
        };
      }
      return r;
    });

    // 2. Legajo checklists
    const updatedChecklists = (tenantData.legajoChecklists || []).map((chk) => {
      if (chk.employeeId === employeeId || chk.employeeLegajo === oldLegajo) {
        return {
          ...chk,
          employeeLegajo: newLegajo,
          employeeName: fullName,
        };
      }
      return chk;
    });

    // 3. Shifts
    const updatedShifts = (tenantData.shifts || []).map((s) => {
      if (s.employeeLegajo === oldLegajo) {
        return {
          ...s,
          employeeLegajo: newLegajo,
          employeeName: fullName,
          role: newEmp.cargo,
          department: newEmp.area,
          razonSocial: newEmp.razonSocial,
        };
      }
      return s;
    });

    // 4. Pay stubs
    const updatedPayStubs = (tenantData.payStubs || []).map((ps) => {
      if (ps.employeeId === employeeId || ps.employeeLegajo === oldLegajo) {
        return {
          ...ps,
          employeeLegajo: newLegajo,
          employeeName: fullName,
          cargo: newEmp.cargo,
          area: newEmp.area,
        };
      }
      return ps;
    });

    // 5. Meal reservations
    const updatedReservations = (tenantData.mealReservations || []).map((res) => {
      if (res.employeeLegajo === oldLegajo) {
        return {
          ...res,
          employeeLegajo: newLegajo,
          employeeName: fullName,
        };
      }
      return res;
    });

    updateTenantData({
      employees: updatedEmployees,
      sacRows: updatedSacRows,
      legajoChecklists: updatedChecklists,
      shifts: updatedShifts,
      payStubs: updatedPayStubs,
      mealReservations: updatedReservations,
    });
  };

  const addMealReservation = (reservation: Omit<MealReservation, 'id' | 'createdAt'>) => {
    const newRes: MealReservation = {
      ...reservation,
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    updateTenantData({ mealReservations: [newRes, ...tenantData.mealReservations] });
  };

  const saveMealMenuDay = (day: MealMenuDay) => {
    const existingIndex = tenantData.mealMenus.findIndex((m) => m.date === day.date);
    let updatedMenus: MealMenuDay[];
    if (existingIndex >= 0) {
      updatedMenus = [...tenantData.mealMenus];
      updatedMenus[existingIndex] = day;
    } else {
      updatedMenus = [...tenantData.mealMenus, day];
    }
    updateTenantData({ mealMenus: updatedMenus });
  };

  const saveMealOptions = (options: Tenant['mealOptions']) => {
    updateActiveTenant({ mealOptions: options });
  };

  const enrollInCourse = (enrollment: Omit<CourseEnrollment, 'id' | 'enrolledAt' | 'confirmationSent'>) => {
    const alreadyEnrolled = tenantData.courseEnrollments.some(
      (e) => e.courseId === enrollment.courseId && (e.employeeLegajo === enrollment.employeeLegajo || e.email.toLowerCase() === enrollment.email.toLowerCase())
    );
    if (alreadyEnrolled) {
      return { success: false, message: 'El colaborador ya se encuentra inscripto en este curso.' };
    }

    const newEnrollment: CourseEnrollment = {
      ...enrollment,
      id: `enr-${Date.now()}`,
      enrolledAt: new Date().toISOString(),
      confirmationSent: false,
    };

    updateTenantData({ courseEnrollments: [newEnrollment, ...tenantData.courseEnrollments] });
    return { success: true, message: 'Inscripción registrada con éxito.' };
  };

  const markEnrollmentConfirmationSent = (enrollmentId: string) => {
    const updated = tenantData.courseEnrollments.map((e) =>
      e.id === enrollmentId ? { ...e, confirmationSent: true, confirmedAt: new Date().toISOString() } : e
    );
    updateTenantData({ courseEnrollments: updated });
  };

  const addCourse = (course: Omit<Course, 'id'>) => {
    const newCourse: Course = { ...course, id: `course-${Date.now()}` };
    updateTenantData({ courses: [...tenantData.courses, newCourse] });
  };

  const updateCourse = (courseId: string, updates: Partial<Course>) => {
    const updated = tenantData.courses.map((c) => (c.id === courseId ? { ...c, ...updates } : c));
    updateTenantData({ courses: updated });
  };

  const deleteCourse = (courseId: string) => {
    const updated = tenantData.courses.filter((c) => c.id !== courseId);
    updateTenantData({ courses: updated });
  };

  const updateCourseMatrix = (employeeId: string, courseId: string, completionDate: string) => {
    const updatedMatrix = tenantData.employeeMatrix.map((emp) => {
      if (emp.employeeId === employeeId) {
        return {
          ...emp,
          completions: {
            ...emp.completions,
            [courseId]: completionDate,
          },
        };
      }
      return emp;
    });
    updateTenantData({ employeeMatrix: updatedMatrix });
  };

  const addDocumentRequest = (request: Omit<DocumentRequest, 'id' | 'trackingCode' | 'createdAt' | 'status'>) => {
    const trackingCode = `SOL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq: DocumentRequest = {
      ...request,
      id: `doc-${Date.now()}`,
      trackingCode,
      createdAt: new Date().toISOString(),
      status: 'Pendiente Jefatura',
    };
    updateTenantData({ documentRequests: [newReq, ...tenantData.documentRequests] });
    return trackingCode;
  };

  const approveDocumentRequest = (
    requestId: string,
    signedBy: string,
    signatureDataUrl?: string,
    overrides?: {
      medicalDays?: number;
      medicalLeaveStartDate?: string;
      medicalLeaveEndDate?: string;
      returnToWorkDate?: string;
      advanceAmount?: number;
    }
  ) => {
    const targetReq = tenantData.documentRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const finalReq: DocumentRequest = {
      ...targetReq,
      ...overrides,
      status: 'Aprobado y Firmado',
      signedBy,
      signedAt: new Date().toISOString(),
      signatureDataUrl: signatureDataUrl || 'digital-signature-recorded',
    };

    const updatedRequests = tenantData.documentRequests.map((r) => (r.id === requestId ? finalReq : r));

    // Impact SAC Novelty Row
    const currentSacRows = tenantData.sacRows || [];
    const sacRowExists = currentSacRows.some((r) => r.legajo === finalReq.legajo);
    let updatedSacRows = currentSacRows;

    if (finalReq.type === 'Anticipo de Sueldo' && finalReq.advanceAmount) {
      if (sacRowExists) {
        updatedSacRows = currentSacRows.map((r) =>
          r.legajo === finalReq.legajo
            ? { ...r, anticipos: (r.anticipos || 0) + (finalReq.advanceAmount || 0) }
            : r
        );
      }
    } else if (finalReq.type === 'Licencia Médica' && (finalReq.medicalDays || overrides?.medicalDays)) {
      const days = overrides?.medicalDays || finalReq.medicalDays || 0;
      if (sacRowExists) {
        updatedSacRows = currentSacRows.map((r) =>
          r.legajo === finalReq.legajo
            ? { ...r, licMedicaDias: (r.licMedicaDias || 0) + days, totalDiasNoTrabajados: (r.totalDiasNoTrabajados || 0) + days }
            : r
        );
      }
    } else if (finalReq.type === 'Licencia por ART' && (finalReq.medicalDays || overrides?.medicalDays)) {
      const days = overrides?.medicalDays || finalReq.medicalDays || 0;
      if (sacRowExists) {
        updatedSacRows = currentSacRows.map((r) =>
          r.legajo === finalReq.legajo
            ? { ...r, licARTDias: (r.licARTDias || 0) + days, totalDiasNoTrabajados: (r.totalDiasNoTrabajados || 0) + days }
            : r
        );
      }
    }

    updateTenantData({
      documentRequests: updatedRequests,
      sacRows: updatedSacRows,
    });

    // Send formal notice for Medical / ART leaves with coverage end date and mandatory return date
    if (finalReq.type === 'Licencia Médica' || finalReq.type === 'Licencia por ART') {
      const returnDate = finalReq.returnToWorkDate || 'el día hábil posterior al reposo';
      const coverageEnd = finalReq.medicalLeaveEndDate || 'fin del período';
      addNotificationAlert({
        type: 'receipt_dispatch',
        title: `Solicitud de Licencia Aprobada: ${finalReq.employeeName}`,
        description: `Se validó certificado médico por ${finalReq.medicalDays || overrides?.medicalDays} días de reposo. Cobertura médica hasta: ${coverageEnd}. Deberás presentarte a tus tareas el día ${returnDate}.`,
        targetId: finalReq.legajo,
        targetName: finalReq.employeeName,
        urgency: 'informativa',
      });
    } else if (finalReq.type === 'Anticipo de Sueldo') {
      addNotificationAlert({
        type: 'receipt_dispatch',
        title: `Anticipo de Sueldo Aprobado: $${finalReq.advanceAmount?.toLocaleString('es-AR')}`,
        description: `Aprobado por ${signedBy}. Se computó en la planilla de Novedades (SAC) para deducción en recibo.`,
        targetId: finalReq.legajo,
        targetName: finalReq.employeeName,
        urgency: 'informativa',
      });
    }
  };

  const rejectDocumentRequest = (requestId: string, _reason?: string) => {
    const updated = tenantData.documentRequests.map((req) =>
      req.id === requestId ? { ...req, status: 'Rechazado' as const } : req
    );
    updateTenantData({ documentRequests: updated });
  };

  const addCandidate = (candidate: Omit<ATSCandidate, 'id' | 'appliedDate' | 'stage' | 'stageDates'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newCand: ATSCandidate = {
      ...candidate,
      id: `cand-${Date.now()}`,
      appliedDate: today,
      stage: 'cv_recibido',
      stageDates: { postulacion: today },
    };
    updateTenantData({ candidates: [newCand, ...tenantData.candidates] });
  };

  const updateCandidateStage = (
    candidateId: string,
    stage: ATSCandidate['stage'],
    extra?: {
      interviewStatus?: ATSCandidate['interviewStatus'];
      psychometricStatus?: ATSCandidate['psychometricStatus'];
      notes?: string;
      advanceReasonTags?: string[];
      rejectionReasonTags?: string[];
    }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = tenantData.candidates.map((c) => {
      if (c.id === candidateId) {
        const stageDates = { ...c.stageDates };
        let eliminatedStage = c.eliminatedStage;
        if (stage === 'entrevista') stageDates.entrevista = today;
        if (stage === 'psicotecnico') stageDates.psicotecnico = today;
        if (stage === 'ingreso') stageDates.ingresoConfirmado = today;
        if (stage === 'rechazado') {
          stageDates.rechazo = today;
          eliminatedStage = c.stage as any;
        }

        return {
          ...c,
          stage,
          stageDates,
          eliminatedStage,
          ...(extra?.interviewStatus !== undefined && { interviewStatus: extra.interviewStatus }),
          ...(extra?.psychometricStatus !== undefined && { psychometricStatus: extra.psychometricStatus }),
          ...(extra?.notes !== undefined && { notes: extra.notes }),
          ...(extra?.advanceReasonTags && { advanceReasonTags: extra.advanceReasonTags }),
          ...(extra?.rejectionReasonTags && { rejectionReasonTags: extra.rejectionReasonTags }),
        };
      }
      return c;
    });

    // Check if job completed
    const cand = tenantData.candidates.find((c) => c.id === candidateId);
    let updatedJobs = tenantData.jobOffers;
    if (cand && stage === 'ingreso') {
      updatedJobs = tenantData.jobOffers.map((j) => {
        if (j.id === cand.jobId) {
          const nextHired = j.vacanciesHired + 1;
          const isCompleted = nextHired >= j.vacanciesTotal;
          return {
            ...j,
            vacanciesHired: nextHired,
            status: isCompleted ? ('Completada' as const) : j.status,
            active: isCompleted ? false : j.active,
            completedDate: isCompleted ? today : j.completedDate,
          };
        }
        return j;
      });
    }

    updateTenantData({ candidates: updated, jobOffers: updatedJobs });
  };

  const toggleCandidateFeatured = (candidateId: string) => {
    const updated = tenantData.candidates.map((c) => (c.id === candidateId ? { ...c, isFeatured: !c.isFeatured } : c));
    updateTenantData({ candidates: updated });
  };

  const purgeGdprCandidates = () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const initialCount = tenantData.candidates.length;
    const filtered = tenantData.candidates.filter((c) => {
      const appDate = new Date(c.appliedDate);
      return appDate >= ninetyDaysAgo;
    });
    const purged = initialCount - filtered.length;
    updateTenantData({ candidates: filtered });
    return purged;
  };

  const importBiometricLogs = (logs: Omit<BiometricLog, 'id'>[]) => {
    const formatted: BiometricLog[] = logs.map((l, i) => ({
      ...l,
      id: `bio-imp-${Date.now()}-${i}`,
    }));
    updateTenantData({ biometricLogs: [...formatted, ...tenantData.biometricLogs] });
  };

  const addAnnouncement = (announcement: Omit<AnnouncementItem, 'id' | 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newAnn: AnnouncementItem = { ...announcement, id: `ann-${Date.now()}`, date: today };
    updateTenantData({ announcements: [newAnn, ...tenantData.announcements] });
  };

  const deleteAnnouncement = (id: string) => {
    updateTenantData({ announcements: tenantData.announcements.filter((a) => a.id !== id) });
  };

  const updateMasterDropdowns = (dropdowns: Tenant['masterDropdowns']) => {
    updateActiveTenant({ masterDropdowns: dropdowns });
  };

  const toggleModuleForActiveTenant = (moduleKey: ModuleKey, enabled: boolean) => {
    let modules = [...activeTenant.enabledModules];
    if (enabled && !modules.includes(moduleKey)) {
      modules.push(moduleKey);
    } else if (!enabled) {
      modules = modules.filter((m) => m !== moduleKey);
    }
    updateActiveTenant({ enabledModules: modules });
  };

  // PayStubs (Recibos de Sueldo)
  const signEmployeePayStub = (
    payStubId: string,
    conformityStatus: 'Conforme' | 'Disconforme',
    signatureDataUrl: string,
    disconformityReason?: string
  ) => {
    const now = new Date();
    const updated = tenantData.payStubs.map((ps) => {
      if (ps.id === payStubId) {
        return {
          ...ps,
          employeeSigned: true,
          employeeSignatureDataUrl: signatureDataUrl,
          employeeSignedAt: now.toISOString(),
          conformityStatus,
          disconformityReason,
        };
      }
      return ps;
    });

    const targetPs = tenantData.payStubs.find((ps) => ps.id === payStubId);

    // If disconformity, automatically dispatch critical alert to admin
    if (conformityStatus === 'Disconforme' && targetPs) {
      addNotificationAlert({
        type: 'receipt_disconformity',
        title: `Firma en Disconformidad - ${targetPs.employeeName} (${targetPs.employeeLegajo})`,
        description: `${targetPs.employeeName} firmó el recibo de ${targetPs.period} en disconformidad: "${disconformityReason || 'Sin motivo especificado'}"`,
        targetId: targetPs.employeeId,
        targetName: targetPs.employeeName,
        urgency: 'critica',
      });
    }

    updateTenantData({ payStubs: updated });
  };

  const signEmployerPayStubsBatch = (batchId: string, employerSignatureDataUrl: string) => {
    const now = new Date().toISOString();
    const updatedBatches = tenantData.payStubBatches.map((b) =>
      b.id === batchId ? { ...b, employerSignatureImage: employerSignatureDataUrl, status: 'En Proceso Firmas' as const } : b
    );
    const updatedStubs = tenantData.payStubs.map((ps) =>
      ps.batchId === batchId
        ? {
            ...ps,
            employerSigned: true,
            employerSignatureDataUrl: employerSignatureDataUrl,
            employerSignedAt: now,
          }
        : ps
    );
    updateTenantData({ payStubBatches: updatedBatches, payStubs: updatedStubs });
  };

  const addPayStubBatch = (batch: Omit<PayStubBatch, 'id' | 'uploadedAt' | 'status'>, payStubs: Omit<PayStubItem, 'id' | 'batchId'>[]) => {
    const batchId = `batch-${Date.now()}`;
    const newBatch: PayStubBatch = {
      ...batch,
      id: batchId,
      uploadedAt: new Date().toISOString(),
      status: 'Verificación Pendiente',
    };
    const formattedStubs: PayStubItem[] = payStubs.map((ps, idx) => ({
      ...ps,
      id: `ps-${Date.now()}-${idx}`,
      batchId,
    }));

    updateTenantData({
      payStubBatches: [newBatch, ...tenantData.payStubBatches],
      payStubs: [...formattedStubs, ...tenantData.payStubs],
    });
  };

  const requestVacation = (req: Omit<VacationRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: VacationRequest = {
      ...req,
      id: `vac-${Date.now()}`,
      status: 'Pendiente',
      createdAt: new Date().toISOString(),
    };
    updateTenantData({ vacationRequests: [newReq, ...tenantData.vacationRequests] });
  };

  const approveVacation = (reqId: string, approvedBy: string) => {
    const updated = tenantData.vacationRequests.map((r) => (r.id === reqId ? { ...r, status: 'Aprobado' as const, approvedBy } : r));
    updateTenantData({ vacationRequests: updated });
  };

  const requestVacationAdvance = (req: Omit<VacationAdvanceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newAdv: VacationAdvanceRequest = {
      ...req,
      id: `vadv-${Date.now()}`,
      status: 'Pendiente Jefatura',
      createdAt: new Date().toISOString(),
    };
    const currentAdvances = tenantData.vacationAdvances || [];
    updateTenantData({ vacationAdvances: [newAdv, ...currentAdvances] });
    addNotificationAlert({
      type: 'voucher_expiry',
      title: `Solicitud de Adelanto de Vacaciones - ${req.employeeName}`,
      description: `${req.employeeName} (${req.employeeLegajo}) solicitó adelanto de ${req.daysRequested} días de vacaciones del período ${req.targetPeriodYear}. Requiere autorización de jefatura.`,
      urgency: 'media',
    });
  };

  const approveVacationAdvance = (advId: string, jefeName: string, signatureDataUrl?: string) => {
    const now = new Date().toISOString();
    const currentAdvances = tenantData.vacationAdvances || [];
    const targetAdv = currentAdvances.find((a) => a.id === advId);
    if (!targetAdv) return;

    const updatedAdvances = currentAdvances.map((a) =>
      a.id === advId
        ? {
            ...a,
            status: 'Autorizado' as const,
            approvedByJefe: jefeName,
            jefeSignatureDataUrl: signatureDataUrl,
            authorizedAt: now,
          }
        : a
    );

    // Auto-reflect in SAC Notes for that period
    const currentNotes = tenantData.sacReport?.notesToConsider || [];
    const newNote: SACNoteToConsiderItem = {
      id: `note-vadv-${Date.now()}`,
      legajo: targetAdv.employeeLegajo,
      name: targetAdv.employeeName,
      cargo: targetAdv.cargo,
      detalleActualizacion: `Adelanto de Vacaciones autorizado: ${targetAdv.daysRequested} días adelantados del período ${targetAdv.targetPeriodYear} para gozar en ${targetAdv.requestedTakeDate}. Descontar del cómputo vacacional siguiente.`,
    };

    updateTenantData({
      vacationAdvances: updatedAdvances,
      sacReport: {
        ...tenantData.sacReport,
        notesToConsider: [newNote, ...currentNotes],
      },
    });

    addNotificationAlert({
      type: 'voucher_expiry',
      title: `Adelanto de Vacaciones Aprobado - ${targetAdv.employeeName}`,
      description: `El jefe ${jefeName} aprobó ${targetAdv.daysRequested} días de adelanto de vacaciones para ${targetAdv.employeeName}. Se asentó en Novedades de Liquidación.`,
      urgency: 'informativa',
    });
  };

  const updateCargoPowers = (powers: CargoPowerDefinition[]) => {
    updateActiveTenant({ cargoPowers: powers });
    updateTenantData({ cargoPowers: powers });
  };

  const updateCargoHierarchies = (hierarchies: CargoHierarchyDefinition[]) => {
    updateActiveTenant({ cargoHierarchies: hierarchies });
    updateTenantData({ cargoHierarchies: hierarchies });
  };

  const updateProbationMilestones = (milestones: ProbationMilestoneDef[]) => {
    updateActiveTenant({ probationMilestones: milestones });
    updateTenantData({ probationMilestones: milestones });
  };

  const updateEvaluationQuestions = (questions: EvaluationQuestionDef[]) => {
    updateTenantData({ evaluationQuestions: questions });
  };

  const createUniformOrder = (order: Omit<UniformOrder, 'id' | 'createdAt'>) => {
    const newOrder: UniformOrder = {
      ...order,
      id: `order-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateTenantData({ uniformOrders: [newOrder, ...tenantData.uniformOrders] });
  };

  const createUniformVoucher = (voucher: Omit<UniformVoucher, 'id' | 'isRedeemed'>) => {
    const newVouch: UniformVoucher = {
      ...voucher,
      id: `vouch-${Date.now()}`,
      isRedeemed: false,
    };
    updateTenantData({ uniformVouchers: [newVouch, ...tenantData.uniformVouchers] });
  };

  const redeemUniformVoucher = (voucherId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = tenantData.uniformVouchers.map((v) =>
      v.id === voucherId ? { ...v, isRedeemed: true, redeemedDate: today } : v
    );
    updateTenantData({ uniformVouchers: updated });
  };

  const updateUniformDefinition = (id: string, updates: Partial<UniformDefinition>) => {
    const updated = activeTenant.uniformDefinitions.map((u) => (u.id === id ? { ...u, ...updates } : u));
    updateActiveTenant({ uniformDefinitions: updated });
  };

  const saveSACNoveltyRow = (row: SACNoveltyRow) => {
    const exists = tenantData.sacRows.some((r) => r.legajo === row.legajo);
    let updatedRows: SACNoveltyRow[];
    if (exists) {
      updatedRows = tenantData.sacRows.map((r) => (r.legajo === row.legajo ? row : r));
    } else {
      updatedRows = [row, ...tenantData.sacRows];
    }
    updateTenantData({ sacRows: updatedRows });
  };

  const updateSACNoveltyColumns = (columns: SACNoveltyColumn[]) => {
    updateTenantData({ sacColumns: columns });
  };

  const closeSACMonth = (period: string) => {
    const updatedSacReport = {
      ...tenantData.sacReport,
      period,
      isClosed: true,
      closedAt: new Date().toISOString(),
    };
    updateTenantData({ sacReport: updatedSacReport });
  };

  const reopenSACMonth = (period: string) => {
    const updatedSacReport = {
      ...tenantData.sacReport,
      period,
      isClosed: false,
      closedAt: undefined,
    };
    updateTenantData({ sacReport: updatedSacReport });
  };

  const updateSACAdjustments = (period: string, adjustments: SACAdjustmentItem[], notes: SACNoteToConsiderItem[]) => {
    const updatedSacReport = {
      ...tenantData.sacReport,
      period,
      adjustments,
      notesToConsider: notes,
    };
    updateTenantData({ sacReport: updatedSacReport });
  };

  const updateHolidays = (holidays: HolidayItem[]) => {
    updateActiveTenant({ holidays });
  };

  const updateNominaCustomFields = (fields: NominaFieldDef[]) => {
    updateActiveTenant({ nominaCustomFields: fields });
  };

  const updateJefeUsers = (jefes: JefeUser[]) => {
    updateActiveTenant({ jefes });
  };

  const updateCompanyCredentials = (creds: {
    employeePassword?: string;
    adminPassword?: string;
    cocinaPassword?: string;
    jefes?: JefeUser[];
    sedes?: SedeItem[];
  }) => {
    updateActiveTenant(creds);
  };

  // Fichadas Digitales
  const addClockPunch = (punch: Omit<DigitalClockPunch, 'id'>) => {
    const newPunch: DigitalClockPunch = {
      ...punch,
      id: `punch-${Date.now()}`,
    };
    const currentPunches = tenantData.clockPunches || [];
    updateTenantData({ clockPunches: [newPunch, ...currentPunches] });

    if (punch.isLateArrival) {
      addNotificationAlert({
        type: 'receipt_pending',
        title: `Llegada Tarde Instantánea: ${punch.employeeName} (${punch.employeeLegajo})`,
        description: `Fichada a las ${punch.time} con ${punch.lateMinutes} min de retraso en ${punch.locationName}.`,
        targetId: punch.employeeLegajo,
        targetName: punch.employeeName,
        urgency: 'alta',
      });
    }
  };

  // Evaluaciones de desempeño y planes de progreso
  const addPerformanceEvaluation = (evalItem: Omit<PerformanceEvaluation, 'id'>, createPlan: boolean = true) => {
    const evalId = `eval-${Date.now()}`;
    let planId: string | undefined = undefined;

    const hasGaps = evalItem.scores.some((s) => s.score < 3);
    const progressPlans = tenantData.progressPlans || [];
    let updatedPlans = progressPlans;

    if (createPlan || hasGaps) {
      planId = `plan-${Date.now()}`;
      const availableCourses = tenantData.courses || [];
      const goals = evalItem.scores.map((s, idx) => {
        const matchingCourse = availableCourses.find(
          (c) =>
            c.title.toLowerCase().includes(s.competency.toLowerCase()) ||
            c.category.toLowerCase().includes('liderazgo') ||
            c.category.toLowerCase().includes('operaciones')
        ) || availableCourses[idx % (availableCourses.length || 1)];

        return {
          id: `goal-${Date.now()}-${idx}`,
          competency: s.competency,
          targetScore: Math.max(4, s.score + 1),
          description: s.score < 3 
            ? `Capacitación prioritaria para cerrar brecha detectada en ${s.competency}`
            : `Fortalecimiento y consolidación en ${s.competency}`,
          recommendedCourseId: matchingCourse?.id,
          recommendedCourseTitle: matchingCourse?.title,
          completed: false,
        };
      });

      const newPlan: ProgressPlan = {
        id: planId,
        employeeId: evalItem.employeeId,
        employeeLegajo: evalItem.employeeLegajo,
        employeeName: evalItem.employeeName,
        evaluationId: evalId,
        createdAt: new Date().toISOString(),
        status: 'en_progreso',
        goals,
        notes: `Plan de capacitación y progreso generado automáticamente según evaluación ${evalItem.period}.`,
      };
      updatedPlans = [newPlan, ...progressPlans];
    }

    const newEval: PerformanceEvaluation = {
      ...evalItem,
      id: evalId,
      progressPlanId: planId,
    };

    updateTenantData({
      evaluations: [newEval, ...(tenantData.evaluations || [])],
      progressPlans: updatedPlans,
    });
  };

  const updateProgressPlan = (planId: string, updates: Partial<ProgressPlan>) => {
    const updated = (tenantData.progressPlans || []).map((p) => (p.id === planId ? { ...p, ...updates } : p));
    updateTenantData({ progressPlans: updated });
  };

  // Contabilidad y Presupuestos
  const addSectorInvoice = (invoice: Omit<SectorInvoice, 'id' | 'createdAt'>) => {
    const newInvoice: SectorInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateTenantData({ sectorInvoices: [newInvoice, ...(tenantData.sectorInvoices || [])] });
  };

  const deleteSectorInvoice = (invoiceId: string) => {
    updateTenantData({ sectorInvoices: (tenantData.sectorInvoices || []).filter((i) => i.id !== invoiceId) });
  };

  // Cajas Chicas
  const addPettyCashMovement = (movement: Omit<PettyCashMovement, 'id' | 'createdAt'>) => {
    const newMov: PettyCashMovement = {
      ...movement,
      id: `pcmov-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const boxes = (tenantData.pettyCashBoxes || []).map((box) => {
      if (box.id === movement.boxId) {
        const delta = movement.type === 'reposicion' ? movement.amount : -movement.amount;
        return {
          ...box,
          currentBalance: Math.max(0, box.currentBalance + delta),
        };
      }
      return box;
    });

    updateTenantData({
      pettyCashMovements: [newMov, ...(tenantData.pettyCashMovements || [])],
      pettyCashBoxes: boxes,
    });
  };

  const createPettyCashBox = (box: Omit<PettyCashBox, 'id' | 'createdAt'>) => {
    const newBox: PettyCashBox = {
      ...box,
      id: `box-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateTenantData({ pettyCashBoxes: [...(tenantData.pettyCashBoxes || []), newBox] });
  };

  const updatePettyCashBox = (boxId: string, updates: Partial<PettyCashBox>) => {
    const updated = (tenantData.pettyCashBoxes || []).map((b) => (b.id === boxId ? { ...b, ...updates } : b));
    updateTenantData({ pettyCashBoxes: updated });
  };

  const deletePettyCashBox = (boxId: string) => {
    updateTenantData({
      pettyCashBoxes: (tenantData.pettyCashBoxes || []).filter((b) => b.id !== boxId),
      pettyCashMovements: (tenantData.pettyCashMovements || []).filter((m) => m.boxId !== boxId),
    });
  };

  // Tareas
  const addTaskItem = (task: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateTenantData({ tasks: [newTask, ...(tenantData.tasks || [])] });
  };

  const toggleTaskItem = (taskId: string, legajo?: string) => {
    const list = tenantData.tasks || tenantData.taskItems || [];
    const updated = list.map((t) => {
      if (t.id === taskId) {
        const isCompleted = !(t.status === 'completed' || t.isCompleted);
        return {
          ...t,
          isCompleted,
          status: isCompleted ? ('completed' as const) : ('pending' as const),
          completedAt: isCompleted ? new Date().toISOString() : undefined,
          completedByLegajo: isCompleted ? (legajo || 'colaborador') : undefined,
        };
      }
      return t;
    });
    updateTenantData({ tasks: updated, taskItems: updated });
  };

  const deleteTaskItem = (taskId: string) => {
    const list = tenantData.tasks || tenantData.taskItems || [];
    const updated = list.filter((t) => t.id !== taskId);
    updateTenantData({ tasks: updated, taskItems: updated });
  };

  // SOPs y Procedimientos útiles
  const addUsefulProcedure = (proc: Omit<UsefulProcedure, 'id' | 'updatedAt'>) => {
    const newProc: UsefulProcedure = {
      ...proc,
      id: `proc-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    updateTenantData({ usefulProcedures: [newProc, ...(tenantData.usefulProcedures || [])] });
  };

  const updateUsefulProcedure = (procId: string, updates: Partial<UsefulProcedure>) => {
    const updated = (tenantData.usefulProcedures || []).map((p) =>
      p.id === procId ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : p
    );
    updateTenantData({ usefulProcedures: updated });
  };

  const deleteUsefulProcedure = (procId: string) => {
    updateTenantData({ usefulProcedures: (tenantData.usefulProcedures || []).filter((p) => p.id !== procId) });
  };

  // Alertas Programadas
  const addScheduledAlert = (alert: Omit<ScheduledCompanyAlert, 'id' | 'createdAt'>) => {
    const newAlert: ScheduledCompanyAlert = {
      ...alert,
      id: `sch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateTenantData({ scheduledAlerts: [newAlert, ...(tenantData.scheduledAlerts || [])] });
  };

  const deleteScheduledAlert = (alertId: string) => {
    updateTenantData({ scheduledAlerts: (tenantData.scheduledAlerts || []).filter((a) => a.id !== alertId) });
  };

  const acknowledgeScheduledAlert = (alertId: string, userIdOrLegajo: string) => {
    const updated = (tenantData.scheduledAlerts || []).map((a) => {
      if (a.id === alertId) {
        const existingAcks = a.acknowledgedBy || [];
        if (!existingAcks.includes(userIdOrLegajo)) {
          return { ...a, acknowledgedBy: [...existingAcks, userIdOrLegajo] };
        }
      }
      return a;
    });
    updateTenantData({ scheduledAlerts: updated });
  };

  // Escalas de Sueldo
  const updatePayrollScales = (scales: PayrollScale[]) => {
    updateTenantData({ payrollScales: scales });
  };

  // Agente IA
  const updateAIAgentConfig = (configUpdates: Partial<AIAgentConfig>) => {
    const currentConfig = tenantData.aiAgentConfig || {
      isEnabled: true,
      prompt: '',
      targetAgreements: [],
      checkFrequency: 'daily',
      scheduledTime: '08:00',
      isDemoMode: true,
    };
    updateTenantData({ aiAgentConfig: { ...currentConfig, ...configUpdates } });
  };

  const runAIAgentAudit = (): AIAgentReport => {
    const config = tenantData.aiAgentConfig;
    const currentScales = tenantData.payrollScales || [];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const proposedAdjustments = currentScales
      .filter((s) => !s.isOutOfAgreement)
      .map((s) => {
        const percentageIncrease = 8.5;
        const suggestedSalary = Math.round(s.basicSalary * (1 + percentageIncrease / 100));
        return {
          category: s.category,
          currentSalary: s.basicSalary,
          suggestedSalary,
          percentageIncrease,
          reason: `Acuerdo Paritario Homologado ST N° 2026/88 (${s.agreementName}). Cláusula gatillo + tramo no remunerativo.`,
        };
      });

    const report: AIAgentReport = {
      id: `rep-${Date.now()}`,
      date: dateStr,
      summary: `Auditoría Paritaria Completada: Se detectó homologación oficial con ajuste general del 8.5% en ${config?.targetAgreements?.join(', ') || 'CCT 130/75'}.`,
      findings: [
        `Resolución Secretaría de Trabajo homologa el acta paritaria con vigencia inmediata.`,
        `Se sugiere actualizar las ${proposedAdjustments.length} escalas salariales de convenio activas en la empresa.`,
        `Impacto estimado en masa salarial mensual: +8.5% sobre remunerativos básicos.`,
        `Se mantienen alícuotas de presentismo (8.33%) y antigüedad según CCT.`,
      ],
      proposedScaleAdjustments: proposedAdjustments,
      status: 'pending',
    };

    const updatedReports = [report, ...(tenantData.aiAgentReports || [])];
    updateTenantData({
      aiAgentReports: updatedReports,
      aiAgentConfig: {
        ...(tenantData.aiAgentConfig || config),
        lastRun: now.toISOString(),
        lastReport: report,
      },
    });

    addNotificationAlert({
      type: 'receipt_pending',
      title: 'Dictamen Agente IA: Nueva Homologación de Paritaria Detectada',
      description: `Ajuste del 8.5% propuesto para ${proposedAdjustments.length} categorías. Revisa y aplica con un clic en el módulo de Agente IA.`,
      urgency: 'alta',
    });

    return report;
  };

  const applyAIAgentReportScales = (reportId: string) => {
    const report = (tenantData.aiAgentReports || []).find((r) => r.id === reportId);
    if (!report) return;

    const currentScales = tenantData.payrollScales || [];
    const updatedScales = currentScales.map((scale) => {
      const adjMatch = report.proposedScaleAdjustments?.find((adj) => adj.category === scale.category);
      if (adjMatch) {
        return {
          ...scale,
          basicSalary: adjMatch.suggestedSalary,
        };
      }
      const chMatch = report.proposedChanges?.find((ch) => ch.category === scale.category);
      if (chMatch) {
        return {
          ...scale,
          basicSalary: chMatch.proposedBase,
        };
      }
      return scale;
    });

    const updatedReports = (tenantData.aiAgentReports || []).map((r) =>
      r.id === reportId ? { ...r, status: 'applied' as const, appliedAt: new Date().toISOString() } : r
    );

    updateTenantData({
      payrollScales: updatedScales,
      aiAgentReports: updatedReports,
    });

    addNotificationAlert({
      type: 'receipt_dispatch',
      title: 'Escalas Salariales Actualizadas por Agente IA',
      description: `Se actualizaron exitosamente los básicos de convenio en el Motor Contable de Liquidación.`,
      urgency: 'informativa',
    });
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenant,
        tenantData,
        switchTenant,
        createTenant,
        updateActiveTenant,
        updateBranding,
        updateTenantData,
        resetDemoData,
        addNotificationAlert,
        hireEmployee,
        terminateEmployee,
        updateEmployee,
        addMealReservation,
        saveMealMenuDay,
        saveMealOptions,
        enrollInCourse,
        markEnrollmentConfirmationSent,
        addCourse,
        updateCourse,
        deleteCourse,
        updateCourseMatrix,
        addDocumentRequest,
        approveDocumentRequest,
        rejectDocumentRequest,
        addCandidate,
        updateCandidateStage,
        toggleCandidateFeatured,
        purgeGdprCandidates,
        importBiometricLogs,
        addAnnouncement,
        deleteAnnouncement,
        updateMasterDropdowns,
        toggleModuleForActiveTenant,
        signEmployeePayStub,
        signEmployerPayStubsBatch,
        addPayStubBatch,
        requestVacation,
        approveVacation,
        createUniformOrder,
        createUniformVoucher,
        redeemUniformVoucher,
        updateUniformDefinition,
        saveSACNoveltyRow,
        updateSACNoveltyColumns,
        closeSACMonth,
        reopenSACMonth,
        updateSACAdjustments,
        updateHolidays,
        updateNominaCustomFields,
        updateJefeUsers,
        updateCompanyCredentials,
        addClockPunch,
        addPerformanceEvaluation,
        updateProgressPlan,
        addSectorInvoice,
        deleteSectorInvoice,
        addPettyCashMovement,
        createPettyCashBox,
        updatePettyCashBox,
        deletePettyCashBox,
        addTaskItem,
        toggleTaskItem,
        deleteTaskItem,
        addUsefulProcedure,
        updateUsefulProcedure,
        deleteUsefulProcedure,
        addScheduledAlert,
        deleteScheduledAlert,
        acknowledgeScheduledAlert,
        updatePayrollScales,
        updateAIAgentConfig,
        runAIAgentAudit,
        applyAIAgentReportScales,
        requestVacationAdvance,
        approveVacationAdvance,
        updateCargoPowers,
        updateCargoHierarchies,
        updateProbationMilestones,
        updateEvaluationQuestions,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within a TenantProvider');
  return context;
};
