import { LanguageCode } from '../types';

export interface TranslationDictionary {
  // Navigation & Modules
  modules: {
    cartelera: string;
    viandas: string;
    horarios: string;
    clima: string;
    documentos: string;
    capacitaciones: string;
    onboarding: string;
    sac: string;
    ats: string;
    nomina: string;
    legajos: string;
    vacaciones: string;
    recibos: string;
    fichadas: string;
    evaluaciones: string;
    contabilidad: string;
    liquidacion: string;
    agente_ia: string;
    tareas: string;
    alertas: string;
  };
  common: {
    search: string;
    filter: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    download: string;
    print: string;
    exportExcel: string;
    actions: string;
    status: string;
    date: string;
    employee: string;
    legajo: string;
    role: string;
    sector: string;
    close: string;
    confirm: string;
    active: string;
    pending: string;
    approved: string;
    rejected: string;
    details: string;
    success: string;
    error: string;
    all: string;
    yes: string;
    no: string;
    period: string;
  };
  roles: {
    collaborator: string;
    jefe: string;
    admin: string;
    cocina: string;
    public: string;
  };
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  es: {
    modules: {
      cartelera: 'Cartelera Digital',
      viandas: 'Viandas & Comedor',
      horarios: 'Horarios & Asistencia',
      clima: 'Clima Laboral & eNPS',
      documentos: 'Licencias y Solicitudes',
      capacitaciones: 'Capacitaciones & E-Learning',
      onboarding: 'Onboarding & Procesos',
      sac: 'SAC & Novedades Liquidación',
      ats: 'Portal de Empleos & ATS',
      nomina: 'Nómina de Personal',
      legajos: 'Legajos Digitales',
      vacaciones: 'Vacaciones & Licencias',
      recibos: 'Recibos de Sueldo',
      fichadas: 'Fichadas Digitales (Kiosco)',
      evaluaciones: 'Evaluaciones de Desempeño',
      contabilidad: 'Presupuestos & Cajas Chicas',
      liquidacion: 'Motor Contable de Liquidación',
      agente_ia: 'Agente IA Convenios & Leyes',
      tareas: 'Tablero de Tareas',
      alertas: 'Alertas & Recordatorios',
    },
    common: {
      search: 'Buscar...',
      filter: 'Filtrar',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      download: 'Descargar',
      print: 'Imprimir',
      exportExcel: 'Exportar Excel',
      actions: 'Acciones',
      status: 'Estado',
      date: 'Fecha',
      employee: 'Colaborador',
      legajo: 'Legajo',
      role: 'Cargo',
      sector: 'Sector / Área',
      close: 'Cerrar',
      confirm: 'Confirmar',
      active: 'Activo',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      details: 'Detalles',
      success: 'Operación exitosa',
      error: 'Error',
      all: 'Todos',
      yes: 'Sí',
      no: 'No',
      period: 'Periodo',
    },
    roles: {
      collaborator: 'Colaborador',
      jefe: 'Jefatura',
      admin: 'Administrador',
      cocina: 'Cocina',
      public: 'Acceso Público',
    },
  },
  en: {
    modules: {
      cartelera: 'Company Bulletin Board',
      viandas: 'Meals & Cafeteria',
      horarios: 'Schedules & Attendance',
      clima: 'Workplace Climate & eNPS',
      documentos: 'Leaves & Requests',
      capacitaciones: 'Training & E-Learning',
      onboarding: 'Onboarding & SOPs',
      sac: 'Payroll Novelties & Advances',
      ats: 'Job Portal & ATS',
      nomina: 'Staff Directory & Payroll',
      legajos: 'Digital Personnel Files',
      vacaciones: 'Vacations & Leaves',
      recibos: 'Pay Slips & Stubs',
      fichadas: 'Digital Clock Punch (Kiosk)',
      evaluaciones: 'Performance Reviews',
      contabilidad: 'Budgets & Petty Cash',
      liquidacion: 'Payroll Calculation Engine',
      agente_ia: 'AI Collective Agreement Agent',
      tareas: 'Team Task Board',
      alertas: 'Alerts & Reminders',
    },
    common: {
      search: 'Search...',
      filter: 'Filter',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      download: 'Download',
      print: 'Print',
      exportExcel: 'Export to Excel',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      employee: 'Employee',
      legajo: 'ID / Code',
      role: 'Position',
      sector: 'Department',
      close: 'Close',
      confirm: 'Confirm',
      active: 'Active',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      details: 'Details',
      success: 'Operation successful',
      error: 'Error',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      period: 'Period',
    },
    roles: {
      collaborator: 'Employee',
      jefe: 'Supervisor / Manager',
      admin: 'Administrator',
      cocina: 'Cafeteria / Kitchen',
      public: 'Public Portal',
    },
  },
  it: {
    modules: {
      cartelera: 'Bacheca Digitale',
      viandas: 'Mensa & Pasti',
      horarios: 'Orari & Presenze',
      clima: 'Clima Aziendale & eNPS',
      documentos: 'Documenti & Richieste',
      capacitaciones: 'Formazione & E-Learning',
      onboarding: 'Onboarding & Processi',
      sac: 'Buste Paga & Novità',
      ats: 'Portale Lavoro & ATS',
      nomina: 'Libro Matricola',
      legajos: 'Fascicoli Digitali',
      vacaciones: 'Ferie & Permessi',
      recibos: 'Cedolini Paga',
      fichadas: 'Timbratrice Digitale',
      evaluaciones: 'Valutazioni di Performance',
      contabilidad: 'Budget & Piccola Cassa',
      liquidacion: 'Motore di Calcolo Stipendi',
      agente_ia: 'Agente IA Contratti Collettivi',
      tareas: 'Bacheca Attività',
      alertas: 'Avvisi & Promemoria',
    },
    common: {
      search: 'Cerca...',
      filter: 'Filtra',
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      create: 'Crea',
      download: 'Scarica',
      print: 'Stampa',
      exportExcel: 'Esporta in Excel',
      actions: 'Azioni',
      status: 'Stato',
      date: 'Data',
      employee: 'Dipendente',
      legajo: 'Matricola',
      role: 'Ruolo',
      sector: 'Dipartimento',
      close: 'Chiudi',
      confirm: 'Conferma',
      active: 'Attivo',
      pending: 'In attesa',
      approved: 'Approvato',
      rejected: 'Respinto',
      details: 'Dettagli',
      success: 'Operazione riuscita',
      error: 'Errore',
      all: 'Tutti',
      yes: 'Sì',
      no: 'No',
      period: 'Periodo',
    },
    roles: {
      collaborator: 'Dipendente',
      jefe: 'Responsabile',
      admin: 'Amministratore',
      cocina: 'Cucina',
      public: 'Accesso Pubblico',
    },
  },
  fr: {
    modules: {
      cartelera: 'Tableau d Affichage',
      viandas: 'Restauration & Cantine',
      horarios: 'Horaires & Présences',
      clima: 'Climat Social & eNPS',
      documentos: 'Documents & Demandes',
      capacitaciones: 'Formation & E-Learning',
      onboarding: 'Intégration & Processus',
      sac: 'Éléments Variables de Paie',
      ats: 'Offres d Emploi & ATS',
      nomina: 'Registre du Personnel',
      legajos: 'Dossiers Individuels',
      vacaciones: 'Congés & Absences',
      recibos: 'Bulletins de Paie',
      fichadas: 'Pointage Numérique',
      evaluaciones: 'Évaluations de Performance',
      contabilidad: 'Budgets & Petite Caisse',
      liquidacion: 'Moteur de Calcul de Paie',
      agente_ia: 'Agent IA Conventions Collectives',
      tareas: 'Tableau des Tâches',
      alertas: 'Alertes & Rappels',
    },
    common: {
      search: 'Rechercher...',
      filter: 'Filtrer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      download: 'Télécharger',
      print: 'Imprimer',
      exportExcel: 'Exporter vers Excel',
      actions: 'Actions',
      status: 'Statut',
      date: 'Date',
      employee: 'Collaborateur',
      legajo: 'Matricule',
      role: 'Poste',
      sector: 'Service',
      close: 'Fermer',
      confirm: 'Confirmer',
      active: 'Actif',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Refusé',
      details: 'Détails',
      success: 'Opération réussie',
      error: 'Erreur',
      all: 'Tous',
      yes: 'Oui',
      no: 'Non',
      period: 'Période',
    },
    roles: {
      collaborator: 'Collaborateur',
      jefe: 'Responsable',
      admin: 'Administrateur',
      cocina: 'Cuisine',
      public: 'Accès Public',
    },
  },
  de: {
    modules: {
      cartelera: 'Schwarzes Brett',
      viandas: 'Kantine & Verpflegung',
      horarios: 'Arbeitszeiten & Anwesenheit',
      clima: 'Betriebsklima & eNPS',
      documentos: 'Dokumente & Anträge',
      capacitaciones: 'Schulung & E-Learning',
      onboarding: 'Onboarding & Richtlinien',
      sac: 'Entgeltabrechnung & Meldungen',
      ats: 'Karriereportal & ATS',
      nomina: 'Personalstammblatt',
      legajos: 'Digitale Personalakten',
      vacaciones: 'Urlaub & Fehlzeiten',
      recibos: 'Gehaltsabrechnungen',
      fichadas: 'Digitale Stechuhr (Kiosk)',
      evaluaciones: 'Leistungsbeurteilungen',
      contabilidad: 'Budget & Portokasse',
      liquidacion: 'Lohnabrechnungs-Engine',
      agente_ia: 'KI-Tarifvertrags-Agent',
      tareas: 'Aufgabenübersicht',
      alertas: 'Benachrichtigungen & Fristen',
    },
    common: {
      search: 'Suchen...',
      filter: 'Filtern',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      create: 'Erstellen',
      download: 'Herunterladen',
      print: 'Drucken',
      exportExcel: 'Excel-Export',
      actions: 'Aktionen',
      status: 'Status',
      date: 'Datum',
      employee: 'Mitarbeiter',
      legajo: 'Personalnr.',
      role: 'Position',
      sector: 'Abteilung',
      close: 'Schließen',
      confirm: 'Bestätigen',
      active: 'Aktiv',
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      details: 'Details',
      success: 'Erfolgreich',
      error: 'Fehler',
      all: 'Alle',
      yes: 'Ja',
      no: 'Nein',
      period: 'Zeitraum',
    },
    roles: {
      collaborator: 'Mitarbeiter',
      jefe: 'Vorgesetzter',
      admin: 'Administrator',
      cocina: 'Küche',
      public: 'Öffentlicher Bereich',
    },
  },
  zh: {
    modules: {
      cartelera: '企业公告栏',
      viandas: '员工餐厅与订餐',
      horarios: '排班与考勤管理',
      clima: '员工满意度与氛围',
      documentos: '文书申请与假单',
      capacitaciones: '培训与在线学习',
      onboarding: '新员工入职与指引',
      sac: '薪酬变动与津贴',
      ats: '招聘求职与人才库',
      nomina: '员工花名册',
      legajos: '数字人事档案',
      vacaciones: '年假与公休假',
      recibos: '电子工资单',
      fichadas: '拍照智能打卡机',
      evaluaciones: '绩效考核与成长计划',
      contabilidad: '部门预算与备用金',
      liquidacion: '自动薪资核算引擎',
      agente_ia: 'AI劳动法规与集体合同助手',
      tareas: '班组任务清单',
      alertas: '日程预警与通知',
    },
    common: {
      search: '搜索...',
      filter: '筛选',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      create: '新建',
      download: '下载',
      print: '打印',
      exportExcel: '导出Excel',
      actions: '操作',
      status: '状态',
      date: '日期',
      employee: '员工',
      legajo: '工号',
      role: '职务',
      sector: '部门',
      close: '关闭',
      confirm: '确认',
      active: '在职/生效',
      pending: '待处理',
      approved: '已批准',
      rejected: '已拒绝',
      details: '详情',
      success: '操作成功',
      error: '出错了',
      all: '全部',
      yes: '是',
      no: '否',
      period: '周期/月份',
    },
    roles: {
      collaborator: '普通员工',
      jefe: '部门主管',
      admin: '人事管理员',
      cocina: '餐饮后勤',
      public: '对外入口',
    },
  },
};
