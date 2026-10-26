export type AccessRole = 'public' | 'employee' | 'jefe' | 'cocina' | 'admin' | 'superadmin' | 'fichador' | 'tesorero';

export type ModuleKey =
  | 'cartelera'
  | 'viandas'
  | 'horarios'
  | 'clima'
  | 'documentos'
  | 'capacitaciones'
  | 'onboarding'
  | 'sac'
  | 'ats'
  | 'nomina'
  | 'legajos'
  | 'vacaciones'
  | 'recibos'
  | 'fichadas'
  | 'evaluaciones'
  | 'contabilidad'
  | 'liquidacion'
  | 'agente_ia'
  | 'tareas'
  | 'alertas';

export type LanguageCode = 'es' | 'en' | 'it' | 'fr' | 'de' | 'zh';

export interface BrandingConfig {
  name: string;
  subtitle: string;
  logoUrl: string;
  headerLogoUrl?: string;
  footerLogoUrl?: string;
  brandColor: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue';
  fontFamily: 'Plus Jakarta Sans' | 'Outfit' | 'Manrope' | 'DM Sans';
  fontSizeScale: 'compact' | 'normal' | 'comfortable';
  bannerUrl: string;
  adminNotificationEmails: string; // Comma-separated emails for automated alert dispatch
  moduleTitles: Record<ModuleKey, string>;
  moduleCoverImages?: Partial<Record<ModuleKey, string>>;
  language?: LanguageCode;
  dateFormat?: 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'YYYY-MM-DD';
  allowOvertimeCalculation?: boolean;
}

export interface HolidayItem {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  isMandatory: boolean;
}

export interface NominaFieldDef {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'date' | 'number';
  visible: boolean;
  isStandard?: boolean;
}

export interface SedeItem {
  id: string;
  name: string;
  password: string;
  address: string;
  city: string;
}

export interface MealOptionType {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  isAvailable: boolean;
}

export interface MealMenuDay {
  id: string;
  date: string; // YYYY-MM-DD
  options: Record<string, string>; // mealOptionId -> dish name description
}

export interface MealReservation {
  id: string;
  employeeName: string;
  employeeLegajo: string;
  sedeId: string;
  date: string; // YYYY-MM-DD
  optionId: string;
  optionName: string;
  notes?: string;
  createdAt: string;
}

export interface ScheduleShift {
  id: string;
  employeeName: string;
  employeeLegajo: string;
  sedeId: string;
  role: string;
  date: string;
  startTime?: string; // e.g. "22:00"
  endTime?: string; // e.g. "06:00" (crosses midnight)
  shiftType: string;
  department: string;
  razonSocial?: string;
  isHoliday?: boolean;
  workedHoliday?: boolean;
  notes?: string;
}

export interface BiometricLog {
  id: string;
  legajo: string;
  name: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  device: string;
  status: 'Puntual' | 'Tardanza' | 'Ausente Justificado' | 'Inconsistencia';
}

export interface NotificationAlert {
  id: string;
  type:
    | 'dni_expiry'
    | 'receipt_pending'
    | 'receipt_disconformity'
    | 'voucher_expiry'
    | 'legajo_missing'
    | 'receipt_dispatch'
    | 'evaluacion'
    | 'adelanto_vacaciones'
    | 'sop_publicado'
    | 'fichada_alerta';
  title: string;
  description?: string;
  message?: string;
  targetId?: string;
  targetName?: string;
  urgency?: 'critica' | 'alta' | 'media' | 'informativa';
  date: string;
  resolved?: boolean;
  read?: boolean;
  recipientRole?: string;
  targetSector?: string;
  autoEmailDispatchedTo?: string;
  dispatchedAt?: string;
}

export interface DocumentRequest {
  id: string;
  trackingCode: string;
  area: string;
  lugarTrabajo: string;
  razonSocial: string;
  employeeName: string;
  cargo: string;
  legajo: string;
  type: string;
  details: string;
  uniformItem?: string;
  uniformSize?: string;
  uniformColor?: string;
  status: 'Pendiente Jefatura' | 'Aprobado y Firmado' | 'Rechazado';
  signedBy?: string;
  signedAt?: string;
  signatureDataUrl?: string;
  createdAt: string;
  // Specific extensions for unified documents
  vacationStartDate?: string;
  vacationEndDate?: string;
  vacationDaysRequested?: number;
  medicalDays?: number;
  medicalHours?: number;
  medicalCertificateUrl?: string;
  medicalLeaveStartDate?: string;
  medicalLeaveEndDate?: string;
  returnToWorkDate?: string;
  isART?: boolean;
  artClaimNumber?: string;
  advanceAmount?: number;
  advanceReason?: string;
  advanceDeductedInSAC?: boolean;
  sanctionType?: 'Apercibimiento' | 'Amonestación' | 'Suspensión';
  sanctionFacts?: string;
  sanctionIssuedBy?: string;
  sanctionSecondSigner?: string;
  sanctionSecondSignerSigned?: boolean;
  sanctionEmployeeSignatureUrl?: string;
  sanctionSignedAt?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface UniformDefinition {
  id: string;
  prenda: string;
  category: 'Calzado' | 'Pantalón' | 'Camisa' | 'Blusa' | 'Campera' | 'EPI Protección';
  sizeType: 'numerico_calzado' | 'numerico_camisa' | 'alfanumerico' | 'sin_talle';
  availableSizes: string[];
  defaultColor: string;
  provider: string;
  providerItemName: string;
  price: number;
  stock: number;
  minStock: number;
  grade: 'A' | 'B' | 'C';
  sizeChartImageUrl?: string;
}

export interface UniformOrder {
  id: string;
  orderNumber: string;
  provider: string;
  razonSocial: string;
  items: { prenda: string; size: string; color: string; quantity: number; employeeName: string; price: number }[];
  totalCost: number;
  status: 'Solicitud' | 'Factura' | 'Entrega Factura' | 'Pago' | 'Voucher / Retiro' | 'Entregado al Personal';
  trackingDates: {
    solicitud?: string;
    factura?: string;
    entregaFactura?: string;
    pago?: string;
    retiro?: string;
    entregado?: string;
  };
  createdAt: string;
}

export interface UniformVoucher {
  id: string;
  voucherNumber: string;
  employeeName: string;
  employeeLegajo: string;
  prenda: string;
  size: string;
  provider: string;
  issuedDate: string;
  expiryDate: string;
  isRedeemed: boolean;
  redeemedDate?: string;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'document';
  url: string;
  fileName?: string;
  durationMinutes?: number;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  hours: number;
  instructor?: string;
  startDate: string;
  modality: 'Virtual Sincrónico' | 'Presencial en Sede' | 'E-Learning Asincrónico';
  location: string;
  description: string;
  maxCapacity: number;
  active: boolean;
  videoUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
  coverImageUrl?: string;
  resources?: CourseResource[];
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  employeeName: string;
  employeeLegajo: string;
  employeeDni: string;
  email: string;
  enrolledAt: string;
  confirmationSent: boolean;
  confirmedAt?: string;
}

export interface EmployeeCourseMatrix {
  employeeId: string;
  employeeName: string;
  legajo: string;
  dni: string;
  department: string;
  completions: Record<string, string>; // courseId -> completionDate (YYYY-MM-DD)
}

export interface ChildInfo {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
}

export interface EmployeeProfile {
  id: string;
  legajo: string;
  name: string;
  lastName: string;
  cargo: string;
  area: string;
  department?: string; // Alias for area
  razonSocial: string;
  lugarTrabajo: string;
  cuil: string;
  dni: string;
  dniExpiryDate: string; // YYYY-MM-DD
  hireDate: string; // YYYY-MM-DD
  fechaIngreso?: string; // Alias for hireDate
  probationEndDate: string; // calculated +180 days
  contractType: 'Tiempo Indeterminado' | 'Plazo Fijo' | 'Eventual' | 'Pasantía';
  birthDate: string;
  nationality: string;
  gender: 'Femenino' | 'Masculino' | 'Otro';
  address: {
    street: string;
    city: string;
    district: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  receiptPasscode: string; // Unique code to view and sign pay stubs
  children: ChildInfo[];
  photoUrl?: string;
  status: 'Activo' | 'Baja' | 'Vacante Activa' | 'Vacante Suspendida';
  terminationDate?: string;
  terminationReason?: string;
  retainedUntil?: string; // 3 months access for terminated employees
  customFields?: Record<string, string | number | boolean>;
  payrollFrequency?: 'Mensual' | 'Quincenal' | 'Semanal' | 'Jornal';
  username?: string;
  password?: string;
}

export interface LegajoDocumentChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeLegajo: string;
  documents: {
    key: string;
    title: string;
    required: boolean;
    submitted: boolean;
    submittedDate?: string;
    fileUrl?: string;
  }[];
}

export interface VacationScaleRule {
  minYears: number;
  maxYears: number;
  daysGranted: number;
}

export interface VacationExceptionDef {
  id: string;
  targetType: 'cargo' | 'employee';
  targetValue: string; // cargo name or legajo
  targetIdentifier?: string; // alias for targetValue
  extraDays: number;
  customRatio?: number;
  reason?: string;
}

export interface VacationConfig {
  cycleStartDayMonth: string; // default "10-01" (1 de Octubre)
  cycleExpiryDayMonth: string; // default "09-30" (30 de Septiembre)
  lessThanSixMonthsRatioDays: number; // e.g. 20 (1 day per 20 days worked)
  statutoryMinRatioDays?: number; // Statutory law minimum (e.g. 20 days worked in Argentina)
  countryLaw?: 'Argentina' | 'Uruguay' | 'Chile' | 'México' | 'España' | 'General';
  scales: VacationScaleRule[];
  exceptions?: VacationExceptionDef[];
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeLegajo: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  approvedBy?: string;
  cycleYear: number;
  createdAt: string;
}

export interface VacationAdvanceRequest {
  id: string;
  employeeLegajo: string;
  employeeName: string;
  cargo: string;
  area: string;
  daysRequested: number;
  targetPeriodYear: number;
  requestedTakeDate: string; // date employee plans to take the vacation advance
  reason: string;
  status: 'Pendiente Jefatura' | 'Autorizado' | 'Rechazado';
  approvedByJefe?: string;
  jefeSignatureDataUrl?: string;
  authorizedAt?: string;
  deductedInPeriod?: string; // Month/Year when vacation is taken to record in SAC
  createdAt: string;
}

export interface PayStubItem {
  id: string;
  batchId: string;
  period: string; // e.g. "Septiembre 2026"
  employeeId: string;
  employeeName: string;
  employeeLegajo: string;
  cuil: string;
  cargo: string;
  area: string;
  grossAmount: number;
  deductionsAmount: number;
  netAmount: number;
  employerSigned: boolean;
  employerSignatureDataUrl?: string;
  employerSignedAt?: string;
  employeeSigned: boolean;
  employeeSignatureDataUrl?: string;
  employeeSignedAt?: string;
  conformityStatus: 'Pendiente' | 'Conforme' | 'Disconforme';
  disconformityReason?: string;
  assignedSheetPage: number;
  issueDate: string; // YYYY-MM-DD
}

export interface PayStubBatch {
  id: string;
  period: string;
  totalReceipts: number;
  employerSignatureImage?: string;
  uploadedAt: string;
  status: 'Verificación Pendiente' | 'Firmado Empleador' | 'En Proceso Firmas' | 'Completado';
}

export interface ATSJobOffer {
  id: string;
  title: string;
  department: string;
  sede: string;
  workType: 'Presencial' | 'Híbrido' | 'Remoto';
  description: string;
  vacanciesTotal: number;
  vacanciesHired: number;
  publicRequirements: string[];
  internalRequirements: string[]; // Private evaluation requirements (e.g. salary expectation, personality)
  isInternalOnly: boolean;
  active: boolean;
  status: 'Activa' | 'Cerrada' | 'Completada';
  completedDate?: string;
  selectedCandidateName?: string;
  publishedAt: string;
  coverImageUrl?: string;
  jobDescriptionId?: string;
  sopId?: string;
}

export interface ATSCandidate {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  isInternal: boolean;
  legajo?: string;
  appliedDate: string;
  stage: 'cv_recibido' | 'entrevista' | 'psicotecnico' | 'ingreso' | 'rechazado';
  stageDates: {
    postulacion: string;
    entrevista?: string;
    psicotecnico?: string;
    ingresoConfirmado?: string;
    rechazo?: string;
  };
  eliminatedStage?: 'cv_recibido' | 'entrevista' | 'psicotecnico';
  rejectionReasonTags?: string[];
  advanceReasonTags?: string[];
  interviewStatus?: 'Pendiente' | 'Ausente' | 'Rechazado' | 'Aprobado';
  psychometricStatus?: 'Pendiente' | 'Apto' | 'No Apto';
  notes: string;
  rating: number;
  isFeatured: boolean;
  cvFileName: string;
  cvFileUrl?: string;
}

export interface JefeUser {
  id: string;
  name: string;
  email: string;
  sector: string;
  lugarTrabajo: string;
  pin: string;
}

export interface MasterDropdowns {
  areas: string[];
  sectores?: string[];
  departments?: string[];
  lugaresTrabajo: string[];
  razonesSociales: string[];
  cargos: string[];
  tiposSolicitud: string[];
}

export interface SACNoveltyColumn {
  key: string;
  label: string;
  type: 'number' | 'text' | 'date' | 'currency' | 'boolean' | 'formula';
  formula?: string; // e.g. "horasJMG * 1.5" or "anticipos + descuentoPrepaga"
}

export interface SACAdjustmentItem {
  id: string;
  legajo: string;
  nombre?: string;
  name?: string;
  categoria?: string;
  cargo?: string;
  categoriaCargo?: string;
  novedadActualizacionCorreccion?: string;
  novedadAjuste?: string;
  monto?: number;
}

export interface SACNoteToConsiderItem {
  id: string;
  legajo: string;
  nombre?: string;
  name?: string;
  categoria?: string;
  cargo?: string;
  categoriaCargo?: string;
  detalle?: string;
  detalleActualizacion?: string;
}

export interface SACNoveltyRow {
  employeeId: string;
  legajo: string;
  name: string;
  cargo: string;
  sector: string;
  razonSocial: string;
  horasJMG: number;
  feriadosTrabajados: number;
  horasNocturnas: number;
  coeficienteNocturno: number;
  asistencia: boolean;
  licMedicaDias: number;
  licARTDias: number;
  licVacacionesDias: number;
  licExamenDias: number;
  licMaternidadDias: number;
  licDueloDias: number;
  totalDiasNoTrabajados: number;
  anticipos: number;
  descuentoPrepaga: number;
  fechaIngreso: string;
  customFields?: Record<string, any>;
}

export interface SACNoveltyReport {
  period: string; // e.g. "Octubre 2026"
  isClosed?: boolean;
  closedAt?: string;
  altas: { name: string; legajo: string; cargo: string; razonSocial: string; fechaIngreso: string }[];
  bajas: { name: string; legajo: string; cargo: string; fechaBaja: string; motivo: string }[];
  observacionesDetalladas: { legajo: string; name: string; detalle: string }[];
  adjustments?: SACAdjustmentItem[];
  notesToConsider?: SACNoteToConsiderItem[];
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: 'Institucional' | 'Operativo' | 'Beneficios' | 'Seguridad';
  date: string;
  scheduledPublishDate?: string; // Publish on this date
  priority: 'Alta' | 'Media' | 'Baja';
  imageUrl?: string;
}

export interface BirthdayItem {
  id: string;
  name: string;
  role: string;
  date: string; // MM-DD
  department: string;
  avatarColor: string;
  photoUrl?: string;
}

export interface AnniversaryItem {
  id: string;
  name: string;
  role: string;
  years: number;
  startDate: string;
  department: string;
  photoUrl?: string;
}

export interface CargoPowerDefinition {
  cargo: string;
  canApproveVacations: boolean;
  canApproveOvertime: boolean;
  canApproveShifts: boolean;
  canSignEvaluations: boolean;
  canManagePettyCash: boolean;
  canOrderTeamMeals: boolean;
  canViewTeamSalaries: boolean;
  canPublishProcedures: boolean;
  canRequestUniforms: boolean;
}

export interface CargoHierarchyDefinition {
  cargo: string;
  reportsToCargos: string[]; // parent cargo(s) in hierarchy
  level: number; // 1 = Director, 2 = Gerente, 3 = Jefe, 4 = Supervisor, 5 = Operativo
  department?: string;
}

export interface ProbationMilestoneDef {
  id: string;
  daysFromHire: number; // e.g. 30, 90, 150
  title: string;
  description: string;
  active: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  employeePassword: string;
  adminPassword: string;
  cocinaPassword: string; // Password dedicated for kitchen access
  enabledModules: ModuleKey[];
  branding: BrandingConfig;
  sedes: SedeItem[];
  mealOptions: MealOptionType[];
  jefes: JefeUser[];
  masterDropdowns: MasterDropdowns;
  vacationConfig: VacationConfig;
  uniformDefinitions: UniformDefinition[];
  holidays?: HolidayItem[];
  nominaCustomFields?: NominaFieldDef[];
  aiAgentConfig?: AIAgentConfig;
  aiAgentReports?: AIAgentReport[];
  probationMilestones?: ProbationMilestoneDef[];
  cargoPowers?: CargoPowerDefinition[];
  cargoHierarchies?: CargoHierarchyDefinition[];
  punchAlertThresholdMinutes?: number; // default 15
  missingPunchThresholdMinutes?: number; // default 30
  cocinaEnabledModules?: ModuleKey[]; // default ['viandas']
  cocinaCutoffDaysBefore?: number; // default 1
  cocinaOrdersClosedDates?: string[]; // dates where kitchen is closed
}

export type OnboardingStage = any;
export type SOPDocument = any;

export interface TenantData {
  announcements: AnnouncementItem[];
  birthdays: BirthdayItem[];
  anniversaries: AnniversaryItem[];
  mealMenus: MealMenuDay[];
  mealReservations: MealReservation[];
  shifts: ScheduleShift[];
  biometricLogs: BiometricLog[];
  climateSurveys: any[]; // Container ready for user's code
  documentRequests: DocumentRequest[];
  uniformOrders: UniformOrder[];
  uniformVouchers: UniformVoucher[];
  courses: Course[];
  courseEnrollments: CourseEnrollment[];
  employeeMatrix: EmployeeCourseMatrix[];
  onboardingStages: any[]; // Container ready for user's code
  sopDocuments: any[];
  employees: EmployeeProfile[];
  legajoChecklists: LegajoDocumentChecklist[];
  vacationRequests: VacationRequest[];
  vacationAdvances?: VacationAdvanceRequest[];
  payStubBatches: PayStubBatch[];
  payStubs: PayStubItem[];
  alerts: NotificationAlert[];
  sacColumns: SACNoveltyColumn[];
  sacRows: SACNoveltyRow[];
  sacReport: SACNoveltyReport;
  jobOffers: ATSJobOffer[];
  candidates: ATSCandidate[];
  clockPunches: DigitalClockPunch[];
  evaluations: PerformanceEvaluation[];
  progressPlans: ProgressPlan[];
  sectorInvoices: SectorInvoice[];
  pettyCashBoxes: PettyCashBox[];
  pettyCashMovements: PettyCashMovement[];
  tasks: TaskItem[];
  taskItems?: TaskItem[];
  usefulProcedures: UsefulProcedure[];
  scheduledAlerts: ScheduledCompanyAlert[];
  payrollScales: PayrollScale[];
  aiAgentConfig: AIAgentConfig;
  aiAgentReports: AIAgentReport[];
  evaluationQuestions?: EvaluationQuestionDef[];
  probationMilestones?: ProbationMilestoneDef[];
  cargoPowers?: CargoPowerDefinition[];
  cargoHierarchies?: CargoHierarchyDefinition[];
}

export interface DigitalClockPunch {
  id: string;
  employeeId: string;
  employeeLegajo: string;
  employeeName: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'IN' | 'OUT';
  photoUrl: string; // selfie image data / url
  locationName: string;
  scheduledTime?: string;
  isLateArrival: boolean;
  lateMinutes: number;
  isOvertime: boolean;
  overtimeMinutes: number;
  isEarlyDeparture?: boolean;
  earlyDepartureMinutes?: number;
  terminalSedeId?: string;
  note?: string;
}

export interface EvaluationQuestionDef {
  id: string;
  category: string;
  question: string;
  description?: string;
  weight: number; // percentage or points
  applicableSectors?: string[]; // empty means all
  applicableCargos?: string[]; // empty means all
  active: boolean;
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeLegajo: string;
  employeeName: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluationType: 'periodo_prueba' | 'anual' | 'extraordinaria';
  date: string; // YYYY-MM-DD
  evaluationDate?: string; // Explicit date of evaluation document
  period: string; // e.g. "Mes 3 (Período Prueba)" o "Anual 2026"
  scores: { competency: string; score: number; comment?: string }[];
  overallScore: number; // 1 to 5 average
  feedback: string;
  // Non-question qualitative fields requested
  highlightPoints?: string[]; // 3 puntos destacados
  goalsToReach?: string; // Objetivos a alcanzar
  toolsProvided?: string; // Herramientas concretas para el colaborador
  concreteTools?: string[]; // Array of concrete tools provided
  concreteActions?: string; // Acciones concretas de mejora
  actionPlanSteps?: string[]; // Array of action steps for employee
  approvedByJefe: boolean;
  approvedAt?: string;
  jefeSignatureUrl?: string;
  jefeSignedAt?: string;
  employeeSignatureUrl?: string;
  employeeSignedAt?: string;
  isEmployeeSigned?: boolean;
  progressPlanId?: string;
  archivedToLegajo?: boolean;
  archivedAt?: string;
}

export interface ProgressPlan {
  id: string;
  employeeId: string;
  employeeLegajo: string;
  employeeName: string;
  evaluationId: string;
  createdAt: string;
  status: 'en_progreso' | 'cumplido' | 'en_revision';
  goals: {
    id: string;
    competency: string;
    targetScore: number;
    description: string;
    recommendedCourseId?: string;
    recommendedCourseTitle?: string;
    completed: boolean;
    completedAt?: string;
  }[];
  notes: string;
}

export interface SectorInvoice {
  id: string;
  sector: string;
  date: string; // YYYY-MM-DD
  companyName: string;
  invoiceNumber: string;
  amount: number;
  description: string;
  fileUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface PettyCashBox {
  id: string;
  name: string;
  sector: string;
  assignedJefeIds: string[];
  assignedUserIds: string[];
  authorizedReplenishers: string[]; // Role or names authorized to replenish
  currentBalance: number;
  maxLimit: number;
  createdAt: string;
}

export interface PettyCashMovement {
  id: string;
  boxId: string;
  type: 'gasto' | 'reposicion';
  date: string; // YYYY-MM-DD
  companyName: string;
  invoiceNumber: string;
  amount: number;
  description: string;
  ticketUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  sector: string;
  assignedToLegajos?: string[];
  assignedToId?: string;
  assignedToName?: string;
  assignedById?: string;
  assignedByName?: string;
  dueDate?: string; // Optional due date
  priority?: 'alta' | 'media' | 'baja';
  status?: 'pending' | 'completed';
  isCompleted?: boolean;
  completedAt?: string;
  completedByLegajo?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface UsefulProcedure {
  id: string;
  title: string;
  category: string;
  sector?: string; // 'Todos' or specific sector
  description?: string;
  content?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  steps?: string[];
  publishedInBulletin?: boolean;
  publicationFrequency?: string;
  rolesAllowed?: string[];
  createdBy?: string;
  creatorRole?: string;
  updatedAt?: string;
}

export interface ScheduledCompanyAlert {
  id: string;
  title: string;
  message: string;
  frequency?: 'puntual' | 'semanal' | 'mensual';
  scheduledDate?: string;
  scheduledTime?: string;
  targetDate?: string;
  targetAudience?: 'all' | 'sector' | 'specific_users';
  targetSector?: string;
  requiresAck?: boolean;
  acknowledgedBy?: string[];
  priority?: 'normal' | 'alta' | 'urgente';
  targetRecipients?: { role?: string; legajo?: string; email?: string }[];
  attachmentUrl?: string;
  attachmentName?: string;
  createdBy?: string;
  createdAt?: string;
  lastDispatchedAt?: string;
}

export interface PayrollScale {
  id: string;
  agreementName: string; // e.g. "CCT 130/75 Empleados de Comercio"
  category: string; // e.g. "Administrativo A"
  cargo: string;
  basicSalary: number;
  seniorityPercentage: number; // e.g. 1% per year
  attendancePercentage: number; // e.g. 8.33% presentismo
  nightHourPercentage: number; // e.g. 13.33%
  overtime50Percentage: number; // e.g. 50%
  overtime100Percentage: number; // e.g. 100%
  isOutOfAgreement?: boolean;
  specificEmployeeId?: string;
}

export interface AIAgentReport {
  id: string;
  date?: string;
  summary: string;
  findings?: string[];
  agreementName?: string;
  bulletinNumber?: string;
  publishDate?: string;
  effectiveMonth?: string;
  increasePercent?: number;
  proposedChanges?: {
    category: string;
    currentBase: number;
    proposedBase: number;
    difference: number;
  }[];
  proposedScaleAdjustments?: {
    category: string;
    currentSalary: number;
    suggestedSalary: number;
    percentageIncrease: number;
    reason: string;
  }[];
  status: 'pending' | 'applied' | 'pending_review';
  appliedAt?: string;
}

export interface AIAgentConfig {
  enabled?: boolean;
  isEnabled?: boolean;
  prompt: string;
  targetAgreements?: string[];
  checkFrequency?: 'daily' | 'manual';
  frequency?: string;
  scheduledTime: string; // e.g. "08:00"
  apiKey?: string;
  portableApiKey?: string;
  isDemoMode?: boolean;
  lastRun?: string;
  lastRunAt?: string;
  status?: string;
  lastReport?: AIAgentReport;
}
