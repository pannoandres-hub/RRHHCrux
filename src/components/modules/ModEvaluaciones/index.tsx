import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { PerformanceEvaluation, ProgressPlan, EvaluationQuestionDef, EmployeeProfile } from '../../../types';
import {
  Award,
  Star,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  Calendar,
  Plus,
  BookOpen,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  PenTool,
  RotateCcw,
  Check,
  Building2,
  Shield,
  Trash2,
  Edit3,
  Printer,
  Download,
  Eye,
  X,
} from 'lucide-react';

const DEFAULT_QUESTIONS: EvaluationQuestionDef[] = [
  { id: 'q-1', question: 'Orientación a Resultados y Productividad', category: 'Operativa', weight: 20, active: true },
  { id: 'q-2', question: 'Trabajo en Equipo y Comunicación', category: 'Interpersonal', weight: 20, active: true },
  { id: 'q-3', question: 'Autonomía y Resolución de Problemas', category: 'Liderazgo', weight: 20, active: true },
  { id: 'q-4', question: 'Calidad Técnica y Atención al Detalle', category: 'Técnica', weight: 20, active: true },
  { id: 'q-5', question: 'Compromiso con Normas de Seguridad & Calidad', category: 'Seguridad', weight: 20, active: true },
];

export const ModEvaluaciones: React.FC = () => {
  const { role, currentEmployee, currentJefe } = useAuth();
  const {
    activeTenant,
    tenantData,
    updateTenantData,
    addPerformanceEvaluation,
    updateProgressPlan,
  } = useTenant();

  const isAdmin = role === 'admin' || role === 'superadmin';
  const isJefe = role === 'jefe';

  const [activeTab, setActiveTab] = useState<'evaluaciones' | 'nuevo' | 'planes' | 'preguntas_admin'>('evaluaciones');

  // Evaluation Questions list (stored in tenantData or defaulted)
  const currentQuestions: EvaluationQuestionDef[] =
    tenantData.evaluationQuestions && tenantData.evaluationQuestions.length > 0
      ? tenantData.evaluationQuestions
      : DEFAULT_QUESTIONS;

  // Eligible employees for evaluation (Jefe can ONLY evaluate team members in their sector)
  const eligibleEmployees = tenantData.employees.filter((emp) => {
    if (emp.status !== 'Activo') return false;
    if (isJefe && currentJefe) {
      return emp.area === currentJefe.sector;
    }
    return true;
  });

  // Form State for creating a new evaluation
  const [selectedLegajo, setSelectedLegajo] = useState<string>(
    eligibleEmployees[0]?.legajo || tenantData.employees[0]?.legajo || 'LEG-1001'
  );
  const [evalType, setEvalType] = useState<'periodo_prueba' | 'anual' | 'extraordinaria'>('periodo_prueba');
  const [evalPeriod, setEvalPeriod] = useState<string>('Evaluación Mes 3 (Período de Prueba)');
  const [evalDate, setEvalDate] = useState<string>('2026-10-14');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string>('');

  // Qualitative fields requested by user (not questions)
  const [highlightPoints, setHighlightPoints] = useState<string>('');
  const [goalsToReach, setGoalsToReach] = useState<string>('');
  const [concreteTools, setConcreteTools] = useState<string>('');
  const [actionPlanSteps, setActionPlanSteps] = useState<string>('');

  const [createAutoPlan, setCreateAutoPlan] = useState<boolean>(true);

  // Jefe Signature Canvas state during evaluation creation
  const jefeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isJefeDrawing, setIsJefeDrawing] = useState(false);
  const [hasJefeSigned, setHasJefeSigned] = useState(false);

  // Selected evaluation document modal view
  const [selectedEvaluation, setSelectedEvaluation] = useState<PerformanceEvaluation | null>(null);
  const employeeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEmpDrawing, setIsEmpDrawing] = useState(false);
  const [hasEmpSigned, setHasEmpSigned] = useState(false);

  // Selected Plan modal
  const [viewingPlan, setViewingPlan] = useState<ProgressPlan | null>(null);

  // Admin Questions Manager state
  const [adminQuestionFilterSector, setAdminQuestionFilterSector] = useState<string>('Todos');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('Operativa');
  const [newQuestionSector, setNewQuestionSector] = useState('Todos');
  const [newQuestionWeight, setNewQuestionWeight] = useState(20);
  const [editingQuestion, setEditingQuestion] = useState<EvaluationQuestionDef | null>(null);

  // Probation Milestones (Editable by Admin: 30, 90, 150 days)
  const [probationMilestones, setProbationMilestones] = useState(
    tenantData.probationMilestones || activeTenant.probationMilestones || [
      { id: 'm-30', daysFromHire: 30, title: '1ra Evaluación Período de Prueba (30 Días)', description: 'Adaptación, seguridad e inducción', active: true },
      { id: 'm-90', daysFromHire: 90, title: '2da Evaluación Período de Prueba (90 Días)', description: 'Rendimiento, autonomía técnica y calidad', active: true },
      { id: 'm-150', daysFromHire: 150, title: '3ra Evaluación Cierre de Prueba (150 Días)', description: 'Decisión de efectivización previa a 180 días', active: true },
    ]
  );
  const [newMilestoneDays, setNewMilestoneDays] = useState(60);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [probationAlertSentMsg, setProbationAlertSentMsg] = useState('');

  // Selected Employee Details
  const selectedEmployee = tenantData.employees.find((e) => e.legajo === selectedLegajo);

  // Resolve manager for employee based on area or active tenant jefes
  const getJefeForEmployee = (emp?: EmployeeProfile): { name: string; cargo: string; sector: string } => {
    if (!emp) return { name: 'Jefatura General', cargo: 'Jefe de Planta', sector: 'Planta' };
    const matchingJefe = activeTenant.jefes.find((j) => j.sector === emp.area);
    if (matchingJefe) {
      return {
        name: matchingJefe.name,
        cargo: `Jefe de ${matchingJefe.sector}`,
        sector: matchingJefe.sector,
      };
    }
    return {
      name: currentJefe ? currentJefe.name : 'Carlos Varela',
      cargo: 'Jefe de Producción & Mantenimiento',
      sector: emp.area || 'Producción',
    };
  };

  // Initialize scores when employee or questions change
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    const relevantQuestions = currentQuestions.filter((q) => {
      if (!selectedEmployee) return true;
      if (q.applicableSectors && q.applicableSectors.length > 0 && !q.applicableSectors.includes(selectedEmployee.area)) {
        return false;
      }
      return true;
    });

    relevantQuestions.forEach((q) => {
      initialScores[q.question] = scores[q.question] || 4;
    });
    setScores(initialScores);
  }, [selectedLegajo, tenantData.evaluationQuestions]);

  // Canvas drawing helpers for Jefe Signature
  const startJefeDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsJefeDrawing(true);
    const canvas = jefeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7';
  };

  const drawJefe = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isJefeDrawing) return;
    const canvas = jefeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasJefeSigned(true);
  };

  const clearJefeSignature = () => {
    const canvas = jefeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasJefeSigned(false);
  };

  // Canvas drawing helpers for Employee Signature
  const startEmpDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsEmpDrawing(true);
    const canvas = employeeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#10b981';
  };

  const drawEmp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isEmpDrawing) return;
    const canvas = employeeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasEmpSigned(true);
  };

  const clearEmpSignature = () => {
    const canvas = employeeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasEmpSigned(false);
  };

  const handleScoreChange = (competency: string, score: number) => {
    setScores((prev) => ({ ...prev, [competency]: score }));
  };

  const handleCreateEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const competencyScores = Object.entries(scores).map(([competency, score]) => ({
      competency,
      score,
    }));

    const sum = competencyScores.reduce((acc, curr) => acc + curr.score, 0);
    const overallScore = competencyScores.length > 0 ? Number((sum / competencyScores.length).toFixed(1)) : 5;

    let jefeSigData = '';
    if (jefeCanvasRef.current && hasJefeSigned) {
      jefeSigData = jefeCanvasRef.current.toDataURL('image/png');
    }

    const assignedJefe = getJefeForEmployee(selectedEmployee);

    addPerformanceEvaluation(
      {
        employeeId: selectedEmployee.id,
        employeeLegajo: selectedEmployee.legajo,
        employeeName: `${selectedEmployee.name} ${selectedEmployee.lastName}`,
        evaluatorName: isJefe && currentJefe ? currentJefe.name : assignedJefe.name,
        evaluatorRole: role,
        evaluationType: evalType,
        date: evalDate,
        evaluationDate: evalDate,
        period: evalPeriod,
        scores: competencyScores,
        overallScore,
        feedback: feedback.trim() || 'Evaluación registrada con éxito en legajo digital del colaborador.',
        highlightPoints: highlightPoints.trim()
          ? highlightPoints.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined,
        goalsToReach: goalsToReach.trim() || undefined,
        concreteTools: concreteTools.trim()
          ? concreteTools.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined,
        concreteActions: actionPlanSteps.trim() || undefined,
        actionPlanSteps: actionPlanSteps.trim()
          ? actionPlanSteps.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined,
        approvedByJefe: true,
        approvedAt: new Date().toISOString(),
        jefeSignatureUrl: jefeSigData || undefined,
        jefeSignedAt: new Date().toISOString(),
        isEmployeeSigned: false,
      },
      createAutoPlan
    );

    alert(`¡Evaluación de Desempeño registrada con fecha ${evalDate} para ${selectedEmployee.name}! Firmada digitalmente por Jefatura.`);
    setActiveTab('evaluaciones');
    setFeedback('');
    setHighlightPoints('');
    setGoalsToReach('');
    setConcreteTools('');
    setActionPlanSteps('');
    clearJefeSignature();
  };

  // Sign evaluation document as Employee (STRICT: Employee account ONLY)
  const handleEmployeeSignDocument = () => {
    if (role !== 'employee') {
      alert('Restricción de Seguridad: La firma digital del empleado solo puede realizarse ingresando con la cuenta del colaborador.');
      return;
    }

    if (!selectedEvaluation || !employeeCanvasRef.current || !hasEmpSigned) {
      alert('Por favor dibuja tu firma en el recuadro antes de confirmar.');
      return;
    }

    const empSigData = employeeCanvasRef.current.toDataURL('image/png');
    const nowIso = new Date().toISOString();

    const updatedEvaluations = (tenantData.evaluations || []).map((ev) => {
      if (ev.id === selectedEvaluation.id) {
        return {
          ...ev,
          employeeSignatureUrl: empSigData,
          employeeSignedAt: nowIso,
          isEmployeeSigned: true,
        };
      }
      return ev;
    });

    // Auto-archive signed evaluation into employee's digital legajo
    const currentLegajoDocs = tenantData.legajoChecklists || [];
    const empExistingChecklist = currentLegajoDocs.find(
      (c) => c.employeeLegajo === selectedEvaluation.employeeLegajo
    );

    const evalDocItem = {
      key: `eval-${Date.now()}`,
      title: `Evaluación de Desempeño (${selectedEvaluation.period}) - ${selectedEvaluation.date}`,
      required: false,
      submitted: true,
      submittedDate: nowIso.split('T')[0],
      fileUrl: empSigData,
    };

    let updatedChecklists;
    if (empExistingChecklist) {
      updatedChecklists = currentLegajoDocs.map((c) =>
        c.employeeLegajo === selectedEvaluation.employeeLegajo
          ? {
              ...c,
              documents: [...c.documents, evalDocItem],
            }
          : c
      );
    } else {
      updatedChecklists = [
        ...currentLegajoDocs,
        {
          id: `leg-chk-${Date.now()}`,
          employeeId: selectedEvaluation.employeeId,
          employeeName: selectedEvaluation.employeeName,
          employeeLegajo: selectedEvaluation.employeeLegajo,
          documents: [evalDocItem],
        },
      ];
    }

    updateTenantData({
      evaluations: updatedEvaluations,
      legajoChecklists: updatedChecklists,
    });

    setSelectedEvaluation({
      ...selectedEvaluation,
      employeeSignatureUrl: empSigData,
      employeeSignedAt: nowIso,
      isEmployeeSigned: true,
    });

    alert('¡Evaluación firmada en conformidad y archivada automáticamente en tu Legajo Digital!');
  };

  // Admin Questions Manager handlers
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQ: EvaluationQuestionDef = {
      id: `q-${Date.now()}`,
      question: newQuestionText.trim(),
      category: newQuestionCategory,
      weight: newQuestionWeight,
      applicableSectors: newQuestionSector === 'Todos' ? [] : [newQuestionSector],
      active: true,
    };

    const updated = [...currentQuestions, newQ];
    updateTenantData({ evaluationQuestions: updated });
    setNewQuestionText('');
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = currentQuestions.filter((q) => q.id !== id);
    updateTenantData({ evaluationQuestions: updated });
  };

  const handleToggleGoal = (planId: string, goalId: string) => {
    const plan = tenantData.progressPlans?.find((p) => p.id === planId);
    if (!plan) return;

    const updatedGoals = plan.goals.map((g) => {
      if (g.id === goalId) {
        const nextCompleted = !g.completed;
        return {
          ...g,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return g;
    });

    const allCompleted = updatedGoals.every((g) => g.completed);
    updateProgressPlan(planId, {
      goals: updatedGoals,
      status: allCompleted ? 'cumplido' : 'en_progreso',
    });

    if (viewingPlan && viewingPlan.id === planId) {
      setViewingPlan({
        ...viewingPlan,
        goals: updatedGoals,
        status: allCompleted ? 'cumplido' : 'en_progreso',
      });
    }
  };

  // Filter evaluations and plans based on user role and sector
  const allEvaluations = tenantData.evaluations || [];
  const allPlans = tenantData.progressPlans || [];

  const visibleEvaluations = allEvaluations.filter((ev) => {
    if (role === 'employee') {
      return (
        (currentEmployee.legajo && ev.employeeLegajo.toLowerCase() === currentEmployee.legajo.toLowerCase()) ||
        (currentEmployee.name && ev.employeeName.toLowerCase() === currentEmployee.name.toLowerCase())
      );
    }
    if (isJefe && currentJefe) {
      const emp = tenantData.employees.find((e) => e.legajo === ev.employeeLegajo);
      if (emp && emp.area !== currentJefe.sector) return false;
    }
    return true;
  });

  const visiblePlans = allPlans.filter((p) => {
    if (role === 'employee') {
      return (
        (currentEmployee.legajo && p.employeeLegajo.toLowerCase() === currentEmployee.legajo.toLowerCase()) ||
        (currentEmployee.name && p.employeeName.toLowerCase() === currentEmployee.name.toLowerCase())
      );
    }
    if (isJefe && currentJefe) {
      const emp = tenantData.employees.find((e) => e.legajo === p.employeeLegajo);
      if (emp && emp.area !== currentJefe.sector) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-400" />
            <span>Evaluaciones de Desempeño & Planes de Progreso</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Fecha de evaluación, doble firma digital (Jefe y Empleado), preguntas configurables por sector y planes de progreso.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('evaluaciones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'evaluaciones' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Evaluaciones ({visibleEvaluations.length})
          </button>
          <button
            onClick={() => setActiveTab('planes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'planes' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Planes de Progreso ({visiblePlans.length})
          </button>
          {role !== 'employee' && (
            <button
              onClick={() => setActiveTab('nuevo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'nuevo' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Evaluar Colaborador</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('preguntas_admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preguntas_admin' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Banco de Preguntas ({currentQuestions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: LISTA DE EVALUACIONES */}
      {activeTab === 'evaluaciones' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleEvaluations.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500">
                <Award className="w-10 h-10 mx-auto text-zinc-600 mb-2 opacity-50" />
                <p className="text-sm font-medium">No hay evaluaciones registradas para tu perfil o sector.</p>
                {role !== 'employee' && (
                  <button
                    onClick={() => setActiveTab('nuevo')}
                    className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Crear primera evaluación
                  </button>
                )}
              </div>
            ) : (
              visibleEvaluations.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvaluation(ev)}
                  className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-all rounded-2xl p-5 space-y-4 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                          {ev.period}
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5">
                          {ev.employeeName}
                        </h3>
                        <span className="text-[11px] font-mono text-zinc-400">{ev.employeeLegajo}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-xl text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{ev.overallScore} / 5</span>
                      </div>
                    </div>

                    {/* Competency scores breakdown preview */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                      {ev.scores.slice(0, 3).map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 truncate max-w-[170px]">{s.competency}</span>
                          <span className="font-bold text-zinc-200">{s.score}/5</span>
                        </div>
                      ))}
                      {ev.scores.length > 3 && (
                        <div className="text-[10px] text-zinc-500 italic">
                          +{ev.scores.length - 3} competencias adicionales...
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 line-clamp-2">
                      "{ev.feedback}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-zinc-400 font-mono">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>{ev.evaluationDate || ev.date}</span>
                    </span>

                    {/* Dual signature status badges */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        Jefe ✓
                      </span>
                      {ev.isEmployeeSigned ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Colab. ✓
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          Colab. Pend.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NUEVA EVALUACIÓN (JEFES / ADMIN) */}
      {activeTab === 'nuevo' && role !== 'employee' && (
        <form onSubmit={handleCreateEvaluation} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Cargar Nueva Evaluación de Desempeño</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Asigna fecha explícita, califica competencias según el banco de preguntas y firma digitalmente como evaluador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Colaborador a Evaluar</label>
              <select
                value={selectedLegajo}
                onChange={(e) => setSelectedLegajo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {tenantData.employees
                  .filter((emp) => {
                    if (isJefe && currentJefe && emp.area !== currentJefe.sector) return false;
                    return true;
                  })
                  .map((emp) => (
                    <option key={emp.id} value={emp.legajo}>
                      {emp.name} {emp.lastName} ({emp.legajo} · {emp.cargo} · {emp.area})
                    </option>
                  ))}
              </select>
            </div>

            {/* Evaluation Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Fecha de Evaluación</label>
              <input
                type="date"
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Evaluation Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Tipo de Evaluación</label>
              <select
                value={evalType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setEvalType(val);
                  if (val === 'periodo_prueba') {
                    setEvalPeriod('Evaluación Mes 3 (Período de Prueba)');
                  } else if (val === 'anual') {
                    setEvalPeriod('Evaluación Anual General 2026');
                  } else {
                    setEvalPeriod('Evaluación Extraordinaria de Desempeño');
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="periodo_prueba">Período de Prueba (Mes 1, 3 o 6)</option>
                <option value="anual">Evaluación Anual General</option>
                <option value="extraordinaria">Evaluación Extraordinaria / Cambio de Puesto</option>
              </select>
            </div>

            {/* Period Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Período / Instancia</label>
              <input
                type="text"
                value={evalPeriod}
                onChange={(e) => setEvalPeriod(e.target.value)}
                placeholder="Ej. Mes 3 (Fin de Período de Prueba)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Manager / Supervisor Assigned info */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-zinc-300">
                Jefe Evaluador Asignado:{' '}
                <strong className="text-white">
                  {isJefe && currentJefe ? currentJefe.name : getJefeForEmployee(selectedEmployee).name}
                </strong>{' '}
                ({selectedEmployee?.area || 'Sector General'})
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">Jerarquía según nómina & organigrama</span>
          </div>

          {/* Competency Scoring Cards (Loaded dynamically from question bank) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Calificación por Competencias (Escala 1 a 5)
              </label>
              <span className="text-[11px] text-zinc-400">
                Preguntas activas para {selectedEmployee?.area || 'sector'}: {Object.keys(scores).length}
              </span>
            </div>

            <div className="space-y-3">
              {Object.keys(scores).map((comp) => {
                const currentScore = scores[comp] || 3;
                return (
                  <div
                    key={comp}
                    className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{comp}</div>
                      <div className="text-[10px] text-zinc-500">
                        {currentScore < 3
                          ? '⚠️ Brecha detectada: Requiere plan de capacitación técnica'
                          : 'Cumplimiento adecuado del estándar'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          type="button"
                          key={starVal}
                          onClick={() => handleScoreChange(comp, starVal)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            starVal <= currentScore
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {starVal}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Devolución y Feedback Cualitativo</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Escribe la devolución acordada con el colaborador, fortalezas destacadas y compromisos de mejora..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-zinc-500"
            />
          </div>

          {/* Campos Cualitativos Adicionales (No Preguntas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                <span>1. Tres (3) Puntos Destacados</span>
              </label>
              <textarea
                rows={2}
                value={highlightPoints}
                onChange={(e) => setHighlightPoints(e.target.value)}
                placeholder="Ej: Puntualidad impecable, predisposición ante emergencias, gran compañerismo..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>2. Objetivos a Alcanzar</span>
              </label>
              <textarea
                rows={2}
                value={goalsToReach}
                onChange={(e) => setGoalsToReach(e.target.value)}
                placeholder="Ej: Operar la línea de producción sin supervisión y reducir mermas en 10%..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>3. Herramientas Concretas para el Colaborador</span>
              </label>
              <textarea
                rows={2}
                value={concreteTools}
                onChange={(e) => setConcreteTools(e.target.value)}
                placeholder="Ej: Curso de neumática avanzada, manuales de procedimiento actualizados, mentor..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4. Acciones de Mejora Concretas</span>
              </label>
              <textarea
                rows={2}
                value={actionPlanSteps}
                onChange={(e) => setActionPlanSteps(e.target.value)}
                placeholder="Ej: Reunión quincenal de seguimiento con supervisor, práctica en banco de pruebas..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Firma Digital del Jefe / Evaluador */}
          <div className="space-y-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-cyan-400" />
                <span>Firma del Jefe / Evaluador Responsable</span>
              </label>
              {hasJefeSigned && (
                <button
                  type="button"
                  onClick={clearJefeSignature}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Borrar firma</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Dibuja tu firma digital en el recuadro para validar el documento como evaluador:
            </p>

            <div className="border border-dashed border-zinc-700 rounded-xl overflow-hidden bg-zinc-900/60 touch-none">
              <canvas
                ref={jefeCanvasRef}
                width={500}
                height={120}
                onMouseDown={startJefeDrawing}
                onMouseMove={drawJefe}
                onMouseUp={() => setIsJefeDrawing(false)}
                onTouchStart={startJefeDrawing}
                onTouchMove={drawJefe}
                onTouchEnd={() => setIsJefeDrawing(false)}
                className="w-full h-28 cursor-crosshair"
              />
            </div>
          </div>

          {/* Auto Plan Generation Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <input
              type="checkbox"
              id="autoPlanCheck"
              checked={createAutoPlan}
              onChange={(e) => setCreateAutoPlan(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="autoPlanCheck" className="text-xs text-indigo-200 cursor-pointer">
              <strong>Diseñar Plan de Progreso y Capacitación a Medida:</strong> Cruzar automáticamente las brechas con los cursos de E-Learning disponibles y asignar metas de desarrollo al colaborador.
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('evaluaciones')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Evaluación con Firma de Jefatura</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PLANES DE PROGRESO Y CAPACITACIÓN */}
      {activeTab === 'planes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visiblePlans.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500">
                <TrendingUp className="w-10 h-10 mx-auto text-zinc-600 mb-2 opacity-50" />
                <p className="text-sm font-medium">No hay planes de progreso activos en este momento.</p>
              </div>
            ) : (
              visiblePlans.map((plan) => {
                const completedCount = plan.goals.filter((g) => g.completed).length;
                const progressPct = plan.goals.length > 0 ? Math.round((completedCount / plan.goals.length) * 100) : 0;

                return (
                  <div
                    key={plan.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              plan.status === 'cumplido'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {plan.status === 'cumplido' ? 'Completado' : 'En Progreso'}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1.5">{plan.employeeName}</h3>
                          <div className="text-[11px] font-mono text-zinc-400">{plan.employeeLegajo}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-indigo-400">{progressPct}%</div>
                          <div className="text-[10px] text-zinc-500">
                            {completedCount} de {plan.goals.length} metas
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Goals Checklist Preview */}
                      <div className="space-y-2 pt-1">
                        {plan.goals.map((g) => (
                          <div
                            key={g.id}
                            className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-start gap-2.5"
                          >
                            <input
                              type="checkbox"
                              checked={g.completed}
                              onChange={() => handleToggleGoal(plan.id, g.id)}
                              className="mt-0.5 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-xs font-semibold ${
                                  g.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                                }`}
                              >
                                {g.competency} (Meta: {g.targetScore}/5)
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{g.description}</p>
                              {g.recommendedCourseTitle && (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium">
                                  <BookOpen className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Curso sugerido: {g.recommendedCourseTitle}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
                      <span>Iniciado: {new Date(plan.createdAt).toLocaleDateString()}</span>
                      <span className="text-zinc-400">Supervisado por Jefatura</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BANCO DE PREGUNTAS Y COMPETENCIAS (ADMIN CONFIGURABLE) */}
      {activeTab === 'preguntas_admin' && isAdmin && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <span>Configuración del Banco de Competencias & Preguntas</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Agrega, modifica o elimina competencias de evaluación. Puedes segmentarlas por sector o cargo.
                </p>
              </div>

              {/* Sector Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={adminQuestionFilterSector}
                  onChange={(e) => setAdminQuestionFilterSector(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Filtrar por Sector: Todos</option>
                  {activeTenant.masterDropdowns.areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add New Question Form */}
            <form onSubmit={handleAddQuestion} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Agregar Nueva Pregunta / Competencia
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-zinc-400 mb-1">Nombre de la Competencia / Pregunta</label>
                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Ej. Cumplimiento de Procedimientos Operativos Estándar (SOP)..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Categoría</label>
                  <select
                    value={newQuestionCategory}
                    onChange={(e) => setNewQuestionCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="Operativa">Operativa</option>
                    <option value="Interpersonal">Interpersonal</option>
                    <option value="Liderazgo">Liderazgo</option>
                    <option value="Técnica">Técnica</option>
                    <option value="Seguridad">Seguridad & Calidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Sector Aplicable</label>
                  <select
                    value={newQuestionSector}
                    onChange={(e) => setNewQuestionSector(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="Todos">General (Todos los Sectores)</option>
                    {activeTenant.masterDropdowns.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Ponderación (%)</label>
                  <input
                    type="number"
                    value={newQuestionWeight}
                    onChange={(e) => setNewQuestionWeight(Number(e.target.value))}
                    min={5}
                    max={100}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar al Banco</span>
                  </button>
                </div>
              </div>
            </form>

            {/* List of active questions */}
            <div className="space-y-2 pt-2">
              {currentQuestions
                .filter((q) => {
                  if (adminQuestionFilterSector === 'Todos') return true;
                  return q.applicableSectors && q.applicableSectors.includes(adminQuestionFilterSector);
                })
                .map((q) => (
                  <div
                    key={q.id}
                    className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">{q.question}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{q.category}</span>
                          <span>Sector: {q.applicableSectors && q.applicableSectors.length > 0 ? q.applicableSectors.join(', ') : 'Todos'}</span>
                          <span>Ponderación: {q.weight}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(q)}
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Editar pregunta"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* HITOS DE PERÍODO DE PRUEBA Y AVISOS AUTOMÁTICOS (CONFIGURABLE POR ADMIN) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Hitos de Evaluación de Período de Prueba (6 Meses) & Notificaciones</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Configura los días desde el inicio laboral (ej. 30, 90, 150 días) para disparar avisos y alertas automáticas a los jefes de equipo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  // Dispatch alerts to chiefs of probation employees
                  const probationEmployees = tenantData.employees.filter((emp) => {
                    if (emp.status !== 'Activo') return false;
                    const hire = new Date(emp.hireDate);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays < 180;
                  });

                  probationEmployees.forEach((emp) => {
                    const jefe = getJefeForEmployee(emp);
                    const hire = new Date(emp.hireDate);
                    const diffDays = Math.floor((new Date().getTime() - hire.getTime()) / (1000 * 60 * 60 * 24));
                    const nextMilestone = probationMilestones.find((m) => m.daysFromHire >= diffDays) || probationMilestones[0];

                    const alertTitle = `Evaluación Período de Prueba: ${emp.name} ${emp.lastName}`;
                    const alertMsg = `Aviso para Jefe ${jefe.name} (${jefe.sector}): El colaborador ${emp.name} (${emp.legajo}) cumplió ${diffDays} días de contratación. Próximo hito: ${nextMilestone.title}.`;

                    // Add alert via context
                    if (tenantData.alerts) {
                      tenantData.alerts.unshift({
                        id: `alt-prob-${Date.now()}-${emp.id}`,
                        title: alertTitle,
                        message: alertMsg,
                        type: 'evaluacion',
                        recipientRole: 'jefe',
                        date: new Date().toISOString().split('T')[0],
                        read: false,
                        targetSector: emp.area,
                      });
                    }
                  });

                  setProbationAlertSentMsg(
                    `¡Se han enviado notificaciones y avisos automáticos a los Jefes para ${probationEmployees.length} colaboradores en período de prueba!`
                  );
                  setTimeout(() => setProbationAlertSentMsg(''), 6000);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Disparar Avisos a Jefes</span>
              </button>
            </div>

            {probationAlertSentMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{probationAlertSentMsg}</span>
              </div>
            )}

            {/* Milestones List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {probationMilestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Día {m.daysFromHire}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProbationMilestones(probationMilestones.filter((x) => x.id !== m.id))}
                      className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer"
                      title="Eliminar este hito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-semibold text-white text-xs">{m.title}</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>

            {/* Add Custom Milestone Form */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-end gap-3 text-xs">
              <div className="w-full sm:w-32">
                <label className="block text-zinc-400 mb-1">Días desde inicio</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={newMilestoneDays}
                  onChange={(e) => setNewMilestoneDays(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-zinc-400 mb-1">Título del Hito de Evaluación</label>
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="Ej: Evaluación Intermedia Mes 2 (60 Días)..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newMilestoneTitle.trim()) return;
                  const newM = {
                    id: `m-${Date.now()}`,
                    daysFromHire: newMilestoneDays,
                    title: newMilestoneTitle.trim(),
                    description: `Evaluación de período de prueba a los ${newMilestoneDays} días de inicio`,
                    active: true,
                  };
                  const updated = [...probationMilestones, newM].sort((a, b) => a.daysFromHire - b.daysFromHire);
                  setProbationMilestones(updated);
                  updateTenantData({ probationMilestones: updated });
                  setNewMilestoneTitle('');
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-sm shrink-0"
              >
                + Agregar Hito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENTO DE EVALUACIÓN CON DOBLE FIRMA DIGITAL */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-100 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Header Documento */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                  Documento Oficial de Recursos Humanos
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Acta de Evaluación de Desempeño</h2>
                <p className="text-xs text-zinc-400">
                  {selectedEvaluation.period} · Fecha:{' '}
                  <strong className="text-white">{selectedEvaluation.evaluationDate || selectedEvaluation.date}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedEvaluation(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Demographic Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Colaborador</div>
                <div className="font-semibold text-white mt-0.5">{selectedEvaluation.employeeName}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Legajo</div>
                <div className="font-mono text-zinc-300 mt-0.5">{selectedEvaluation.employeeLegajo}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Evaluador</div>
                <div className="font-medium text-cyan-400 mt-0.5">{selectedEvaluation.evaluatorName}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase">Puntaje Global</div>
                <div className="font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{selectedEvaluation.overallScore} / 5</span>
                </div>
              </div>
            </div>

            {/* Competency Scores Detailed breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Competencias Calificadas
              </h4>
              <div className="space-y-2 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                {selectedEvaluation.scores.map((sc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-zinc-900 last:border-b-0">
                    <span className="text-zinc-300">{sc.competency}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= sc.score ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                          }`}
                        />
                      ))}
                      <span className="font-mono font-bold text-zinc-200 ml-1.5">{sc.score}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Devolución Cualitativa y Compromisos
              </h4>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 italic">
                "{selectedEvaluation.feedback}"
              </div>
            </div>

            {/* Campos Cualitativos: 3 Puntos, Objetivos, Herramientas, Acciones */}
            {(selectedEvaluation.highlightPoints ||
              selectedEvaluation.goalsToReach ||
              selectedEvaluation.concreteTools ||
              selectedEvaluation.actionPlanSteps) && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Plan de Desarrollo & Puntos Clave
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedEvaluation.highlightPoints && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-emerald-900/40 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">
                        ★ 3 Puntos Destacados
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {Array.isArray(selectedEvaluation.highlightPoints)
                          ? selectedEvaluation.highlightPoints.join(' • ')
                          : selectedEvaluation.highlightPoints}
                      </p>
                    </div>
                  )}
                  {selectedEvaluation.goalsToReach && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-cyan-900/40 space-y-1">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase block">
                        🎯 Objetivos a Alcanzar
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">{selectedEvaluation.goalsToReach}</p>
                    </div>
                  )}
                  {selectedEvaluation.concreteTools && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-violet-900/40 space-y-1">
                      <span className="text-[10px] font-bold text-violet-400 uppercase block">
                        🛠 Herramientas Concretas
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {Array.isArray(selectedEvaluation.concreteTools)
                          ? selectedEvaluation.concreteTools.join(' • ')
                          : selectedEvaluation.concreteTools}
                      </p>
                    </div>
                  )}
                  {selectedEvaluation.actionPlanSteps && (
                    <div className="p-3 bg-zinc-950 rounded-xl border border-amber-900/40 space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block">
                        ✓ Acciones de Mejora
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {Array.isArray(selectedEvaluation.actionPlanSteps)
                          ? selectedEvaluation.actionPlanSteps.join(' • ')
                          : selectedEvaluation.actionPlanSteps}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DUAL SIGNATURES: JEFE AND EMPLOYEE WITHIN THE SAME DOCUMENT */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Firmas en Conformidad del Documento</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Jefe Signature Box */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-cyan-400">Firma del Jefe Evaluador</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Registrado ✓</span>
                  </div>

                  {selectedEvaluation.jefeSignatureUrl ? (
                    <div className="bg-white/5 border border-zinc-800 rounded-lg p-2 h-20 flex items-center justify-center">
                      <img
                        src={selectedEvaluation.jefeSignatureUrl}
                        alt="Firma Jefe"
                        className="max-h-full max-w-full object-contain filter invert"
                      />
                    </div>
                  ) : (
                    <div className="h-20 bg-zinc-900 border border-dashed border-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 font-mono text-[11px]">
                      Firma validada con clave jerárquica
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500">
                    Firmado por: <strong>{selectedEvaluation.evaluatorName}</strong>
                    <br />
                    Fecha: {selectedEvaluation.evaluationDate || selectedEvaluation.date}
                  </div>
                </div>

                {/* Employee Signature Box */}
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-400">Firma del Colaborador</span>
                    {selectedEvaluation.isEmployeeSigned ? (
                      <span className="text-[10px] text-emerald-400 font-mono">Conforme ✓</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono">Pendiente de Firma</span>
                    )}
                  </div>

                  {selectedEvaluation.employeeSignatureUrl ? (
                    <div className="bg-white/5 border border-zinc-800 rounded-lg p-2 h-20 flex items-center justify-center">
                      <img
                        src={selectedEvaluation.employeeSignatureUrl}
                        alt="Firma Colaborador"
                        className="max-h-full max-w-full object-contain filter invert"
                      />
                    </div>
                  ) : role === 'employee' ? (
                    /* Only the actual collaborator can draw signature from their session */
                    <div className="space-y-2">
                      <div className="border border-dashed border-zinc-700 rounded-lg bg-zinc-900 touch-none">
                        <canvas
                          ref={employeeCanvasRef}
                          width={260}
                          height={75}
                          onMouseDown={startEmpDrawing}
                          onMouseMove={drawEmp}
                          onMouseUp={() => setIsEmpDrawing(false)}
                          onTouchStart={startEmpDrawing}
                          onTouchMove={drawEmp}
                          onTouchEnd={() => setIsEmpDrawing(false)}
                          className="w-full h-16 cursor-crosshair"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={clearEmpSignature}
                          className="text-[10px] text-zinc-500 hover:text-white cursor-pointer"
                        >
                          Limpiar
                        </button>
                        <button
                          type="button"
                          onClick={handleEmployeeSignDocument}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] cursor-pointer"
                        >
                          Firmar en Conformidad
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Locked notice for Admin and Jefe */
                    <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg text-center space-y-1">
                      <Shield className="w-4 h-4 text-amber-400 mx-auto" />
                      <p className="text-[11px] text-zinc-300 font-medium">Firma exclusiva del colaborador</p>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        Por seguridad jurídica, la firma solo puede ser realizada ingresando con el usuario del colaborador ({selectedEvaluation.employeeName}).
                      </p>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500">
                    Firmado por: <strong>{selectedEvaluation.employeeName}</strong>
                    <br />
                    Estado: {selectedEvaluation.isEmployeeSigned ? 'Firmado y Asentado' : 'A la espera de firma del colaborador'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer modal controls */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Exportar Acta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PREGUNTA EXISTENTE (ADMIN) */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Editar Pregunta / Competencia</span>
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updated = currentQuestions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q));
                updateTenantData({ evaluationQuestions: updated });
                setEditingQuestion(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-zinc-400 mb-1">Texto de la Pregunta / Competencia</label>
                <input
                  type="text"
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Categoría</label>
                  <select
                    value={editingQuestion.category}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="Operativa">Operativa</option>
                    <option value="Interpersonal">Interpersonal</option>
                    <option value="Liderazgo">Liderazgo</option>
                    <option value="Técnica">Técnica</option>
                    <option value="Seguridad">Seguridad & Calidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Ponderación (%)</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={editingQuestion.weight}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, weight: Number(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
