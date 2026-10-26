import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { ATSCandidate, ATSJobOffer } from '../../../types';
import {
  Briefcase,
  Users,
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Building2,
  Trash2,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  XCircle,
  FileText,
  Star,
  Sparkles,
  Calendar,
  Tag,
  ArrowUpDown,
  Filter,
  Check,
  Eye,
  EyeOff,
  Plus,
  X,
  Lock,
} from 'lucide-react';

export const Mod9ATS: React.FC = () => {
  const {
    tenantData,
    activeTenant,
    addCandidate,
    updateCandidateStage,
    toggleCandidateFeatured,
    updateTenantData,
  } = useTenant();
  const { role, currentEmployee, setIsEmployeeModalOpen } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'portal' | 'kanban' | 'busquedas_admin' | 'rechazados' | 'destacados' | 'kpis'>(
    isAdmin ? 'kanban' : 'portal'
  );

  // Job status filter in Admin searches: Activas, Cerradas, Completadas
  const [jobStatusFilter, setJobStatusFilter] = useState<'Activa' | 'Cerrada' | 'Completada'>('Activa');

  // Search in portal
  const [jobSearch, setJobSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');

  // Metrics search selector: 'all' or specific jobId
  const [selectedKpiJobId, setSelectedKpiJobId] = useState<string>('all');

  // Stage order in Rechazados
  const [rechazadosStageSort, setRechazadosStageSort] = useState<'all' | 'cv_recibido' | 'entrevista' | 'psicotecnico'>('all');

  // Application Modal state
  const [selectedJobForApply, setSelectedJobForApply] = useState<ATSJobOffer | null>(null);
  const [candName, setCandName] = useState(role === 'employee' ? currentEmployee.name : '');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candNotes, setCandNotes] = useState('');
  const [isInternalCandidate, setIsInternalCandidate] = useState(role === 'employee');
  const [internalPasswordInput, setInternalPasswordInput] = useState('');
  const [candLegajo, setCandLegajo] = useState(role === 'employee' ? currentEmployee.legajo : '');
  const [cvFileName, setCvFileName] = useState('CV_Curriculum_2026.pdf');
  const [cvFileData, setCvFileData] = useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);

  const handleCvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCvFileName(file.name);
      setCvFileData({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  // Kanban Pipeline Filters
  const [kanbanJobFilter, setKanbanJobFilter] = useState<string>('all');
  const [kanbanQuery, setKanbanQuery] = useState<string>('');

  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  // Modal: Decision on candidate (Advance or Reject with Reason Tags)
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    candidate: ATSCandidate | null;
    action: 'advance' | 'reject' | 'hire';
    targetStage: ATSCandidate['stage'];
  }>({
    isOpen: false,
    candidate: null,
    action: 'advance',
    targetStage: 'entrevista',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');

  // Modal: Create Job Search
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('Producción & Mantenimiento');
  const [newJobSede, setNewJobSede] = useState('Planta Industrial Pilar');
  const [newJobVacancies, setNewJobVacancies] = useState(1);
  const [newJobWorkType, setNewJobWorkType] = useState<'Presencial' | 'Híbrido' | 'Remoto'>('Presencial');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobPublicReqs, setNewJobPublicReqs] = useState('Experiencia previa comprobable\nDisponibilidad horaria rotativa\nTítulo secundario técnico');
  const [newJobInternalReqs, setNewJobInternalReqs] = useState('Pretensión salarial acorde a convenio\nFit cultural y actitud de trabajo en equipo\nBuena presencia y dicción');
  const [newJobCoverImageUrl, setNewJobCoverImageUrl] = useState('');

  // Modal: View Candidate CV
  const [viewingCvCandidate, setViewingCvCandidate] = useState<ATSCandidate | null>(null);

  // Modal: Edit Candidate Applied Job Search
  const [editingCandidateJob, setEditingCandidateJob] = useState<ATSCandidate | null>(null);
  const [selectedNewJobIdForCand, setSelectedNewJobIdForCand] = useState<string>('');

  // Modal: Edit Job Search (Admin)
  const [editingJob, setEditingJob] = useState<ATSJobOffer | null>(null);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobDept, setEditJobDept] = useState('');
  const [editJobSede, setEditJobSede] = useState('');
  const [editJobVacancies, setEditJobVacancies] = useState(1);
  const [editJobWorkType, setEditJobWorkType] = useState<'Presencial' | 'Híbrido' | 'Remoto'>('Presencial');
  const [editJobDesc, setEditJobDesc] = useState('');
  const [editJobPublicReqs, setEditJobPublicReqs] = useState('');
  const [editJobInternalReqs, setEditJobInternalReqs] = useState('');
  const [editJobStatus, setEditJobStatus] = useState<'Activa' | 'Cerrada' | 'Completada'>('Activa');
  const [editJobSelectedCandidateName, setEditJobSelectedCandidateName] = useState('');

  const handleStartEditJob = (job: ATSJobOffer) => {
    setEditingJob(job);
    setEditJobTitle(job.title);
    setEditJobDept(job.department);
    setEditJobSede(job.sede);
    setEditJobVacancies(job.vacanciesTotal);
    setEditJobWorkType(job.workType);
    setEditJobDesc(job.description);
    setEditJobPublicReqs(job.publicRequirements.join('\n'));
    setEditJobInternalReqs(job.internalRequirements.join('\n'));
    setEditJobStatus(job.status);
    setEditJobSelectedCandidateName(job.selectedCandidateName || '');
  };

  const handleSaveEditJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    const pubReqs = editJobPublicReqs.split('\n').map((s) => s.trim()).filter(Boolean);
    const intReqs = editJobInternalReqs.split('\n').map((s) => s.trim()).filter(Boolean);
    const updatedJobs = tenantData.jobOffers.map((j) => {
      if (j.id === editingJob.id) {
        return {
          ...j,
          title: editJobTitle.trim(),
          department: editJobDept,
          sede: editJobSede,
          vacanciesTotal: Number(editJobVacancies) || 1,
          workType: editJobWorkType,
          description: editJobDesc.trim(),
          publicRequirements: pubReqs,
          internalRequirements: intReqs,
          status: editJobStatus,
          selectedCandidateName: editJobSelectedCandidateName.trim() || j.selectedCandidateName,
          completedDate: editJobStatus === 'Completada' ? (j.completedDate || new Date().toISOString().split('T')[0]) : undefined,
          active: editJobStatus === 'Activa',
        };
      }
      return j;
    });
    updateTenantData({ jobOffers: updatedJobs });
    setEditingJob(null);
  };

  const handleSaveCandidateJobChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidateJob || !selectedNewJobIdForCand) return;
    const targetJob = tenantData.jobOffers.find((j) => j.id === selectedNewJobIdForCand);
    if (!targetJob) return;
    const updatedCandidates = tenantData.candidates.map((c) => {
      if (c.id === editingCandidateJob.id) {
        return {
          ...c,
          jobId: targetJob.id,
          jobTitle: targetJob.title,
        };
      }
      return c;
    });
    updateTenantData({ candidates: updatedCandidates });
    setEditingCandidateJob(null);
  };

  // Filter public jobs: only active and not completed
  const publicJobs = tenantData.jobOffers.filter((job) => {
    if (job.status === 'Cerrada' || job.status === 'Completada' || !job.active) return false;
    if (selectedDept !== 'Todos' && job.department !== selectedDept) return false;
    if (jobSearch.trim()) {
      return (
        job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        job.sede.toLowerCase().includes(jobSearch.toLowerCase())
      );
    }
    return true;
  });

  // Admin filtered jobs by status
  const adminJobsByStatus = tenantData.jobOffers.filter((job) => job.status === jobStatusFilter);

  // Candidates filtered for Kanban Pipeline (by job offer and keyword search)
  const kanbanFilteredCandidates = tenantData.candidates.filter((c) => {
    if (kanbanJobFilter !== 'all' && c.jobId !== kanbanJobFilter) return false;
    if (kanbanQuery.trim()) {
      const q = kanbanQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchJob = c.jobTitle.toLowerCase().includes(q);
      const matchNotes = c.notes?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchTags = c.advanceReasonTags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchJob && !matchNotes && !matchEmail && !matchTags) return false;
    }
    return true;
  });

  // Candidates categorized by stage
  const cvRecibidos = kanbanFilteredCandidates.filter((c) => c.stage === 'cv_recibido');
  const entrevista = kanbanFilteredCandidates.filter((c) => c.stage === 'entrevista');
  const psicotecnico = kanbanFilteredCandidates.filter((c) => c.stage === 'psicotecnico');
  const ingreso = kanbanFilteredCandidates.filter((c) => c.stage === 'ingreso');
  const rechazados = tenantData.candidates.filter((c) => c.stage === 'rechazado');
  const destacados = tenantData.candidates.filter((c) => c.isFeatured);

  // Filtered Rechazados by stage
  const filteredRechazados = rechazados.filter((c) => {
    if (rechazadosStageSort === 'all') return true;
    return c.eliminatedStage === rechazadosStageSort;
  });

  // Handle job status toggles
  const handleCloseJobManually = (jobId: string) => {
    const updated = tenantData.jobOffers.map((j) =>
      j.id === jobId ? { ...j, status: 'Cerrada' as const, active: false } : j
    );
    updateTenantData({ jobOffers: updated });
  };

  const handleReopenJob = (jobId: string) => {
    const updated = tenantData.jobOffers.map((j) =>
      j.id === jobId ? { ...j, status: 'Activa' as const, active: true } : j
    );
    updateTenantData({ jobOffers: updated });
  };

  // Open Decision Modal
  const openDecisionModal = (
    candidate: ATSCandidate,
    action: 'advance' | 'reject' | 'hire',
    targetStage: ATSCandidate['stage']
  ) => {
    setSelectedTags([]);
    setCustomTagInput('');
    setDecisionNotes(candidate.notes || '');
    setDecisionModal({
      isOpen: true,
      candidate,
      action,
      targetStage,
    });
  };

  // Execute Decision
  const handleConfirmDecision = () => {
    if (!decisionModal.candidate) return;
    const { candidate, action, targetStage } = decisionModal;
    const job = tenantData.jobOffers.find((j) => j.id === candidate.jobId);
    const today = new Date().toISOString().split('T')[0];

    const tags = [...selectedTags];
    if (customTagInput.trim()) tags.push(customTagInput.trim());

    if (action === 'reject') {
      updateCandidateStage(candidate.id, 'rechazado', {
        notes: decisionNotes,
        rejectionReasonTags: tags,
      });
    } else if (action === 'hire') {
      // Candidate hired: update candidate stage to ingreso
      updateCandidateStage(candidate.id, 'ingreso', {
        notes: decisionNotes,
        advanceReasonTags: tags,
      });

      // Check if job vacancies are completed
      if (job) {
        const newHired = (job.vacanciesHired || 0) + 1;
        const isComplete = newHired >= job.vacanciesTotal;
        const updatedJobs = tenantData.jobOffers.map((j) => {
          if (j.id === job.id) {
            return {
              ...j,
              vacanciesHired: newHired,
              status: isComplete ? ('Completada' as const) : j.status,
              completedDate: isComplete ? today : undefined,
              active: !isComplete,
            };
          }
          return j;
        });
        updateTenantData({ jobOffers: updatedJobs });
      }
    } else {
      // Advance to next stage
      updateCandidateStage(candidate.id, targetStage, {
        notes: decisionNotes,
        advanceReasonTags: tags,
      });
    }

    setDecisionModal({ isOpen: false, candidate: null, action: 'advance', targetStage: 'entrevista' });
  };

  // Submit Application
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');

    if (!selectedJobForApply) return;
    if (!candName.trim() || !candEmail.trim() || !candPhone.trim()) {
      setApplyError('Por favor completa todos los campos de contacto requeridos.');
      return;
    }

    if (isInternalCandidate && internalPasswordInput !== activeTenant.employeePassword && internalPasswordInput !== 'empleado2026') {
      setApplyError('La contraseña de empleado no es válida para concurso interno.');
      return;
    }

    addCandidate({
      jobId: selectedJobForApply.id,
      jobTitle: selectedJobForApply.title,
      name: candName.trim(),
      email: candEmail.trim(),
      phone: candPhone.trim(),
      isInternal: isInternalCandidate,
      legajo: isInternalCandidate ? candLegajo.trim() : undefined,
      notes: candNotes.trim() || 'Postulación ingresada vía portal web.',
      rating: 5,
      isFeatured: false,
      cvFileName: cvFileName,
    });

    setApplySuccess('¡Tu postulación ha sido enviada con éxito! El equipo de selección revisará tu CV.');
    setTimeout(() => {
      setSelectedJobForApply(null);
      setApplySuccess('');
      setCandNotes('');
      setInternalPasswordInput('');
    }, 2000);
  };

  // Create Job Submit
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;

    const pubReqs = newJobPublicReqs.split('\n').map((s) => s.trim()).filter(Boolean);
    const intReqs = newJobInternalReqs.split('\n').map((s) => s.trim()).filter(Boolean);

    const newOffer: ATSJobOffer = {
      id: `job-${Date.now()}`,
      title: newJobTitle.trim(),
      department: newJobDept,
      sede: newJobSede,
      workType: newJobWorkType,
      description: newJobDesc.trim() || 'Búsqueda laboral activa para incorporación inmediata.',
      vacanciesTotal: Number(newJobVacancies) || 1,
      vacanciesHired: 0,
      publicRequirements: pubReqs,
      internalRequirements: intReqs,
      isInternalOnly: false,
      active: true,
      status: 'Activa',
      publishedAt: new Date().toISOString().split('T')[0],
      coverImageUrl: newJobCoverImageUrl.trim() || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
    };

    updateTenantData({ jobOffers: [newOffer, ...tenantData.jobOffers] });
    setIsNewJobModalOpen(false);
    setNewJobTitle('');
    setNewJobDesc('');
    setNewJobCoverImageUrl('');
  };

  // Calculate Metrics for selected search or overall average
  const getMetrics = () => {
    const isAll = selectedKpiJobId === 'all';
    const relevantCandidates = isAll
      ? tenantData.candidates
      : tenantData.candidates.filter((c) => c.jobId === selectedKpiJobId);

    const relevantJobs = isAll
      ? tenantData.jobOffers
      : tenantData.jobOffers.filter((j) => j.id === selectedKpiJobId);

    const totalPostulantes = relevantCandidates.length;
    const totalEntrevistas = relevantCandidates.filter(
      (c) => c.stage === 'entrevista' || c.stage === 'psicotecnico' || c.stage === 'ingreso' || c.eliminatedStage === 'entrevista' || c.eliminatedStage === 'psicotecnico'
    ).length;
    const totalPsicotecnicos = relevantCandidates.filter(
      (c) => c.stage === 'psicotecnico' || c.stage === 'ingreso' || c.eliminatedStage === 'psicotecnico'
    ).length;
    const totalIngresados = relevantCandidates.filter((c) => c.stage === 'ingreso').length;
    const totalDescartados = relevantCandidates.filter((c) => c.stage === 'rechazado').length;

    const conversionRate = totalPostulantes > 0 ? Math.round((totalIngresados / totalPostulantes) * 100) : 0;
    const rejectionRate = totalPostulantes > 0 ? Math.round((totalDescartados / totalPostulantes) * 100) : 0;
    const totalVacantes = relevantJobs.reduce((acc, j) => acc + j.vacanciesTotal, 0);
    const totalCubiertas = relevantJobs.reduce((acc, j) => acc + (j.vacanciesHired || 0), 0);

    return {
      totalPostulantes,
      totalEntrevistas,
      totalPsicotecnicos,
      totalIngresados,
      totalDescartados,
      conversionRate,
      rejectionRate,
      totalVacantes,
      totalCubiertas,
      avgTimeToHire: (() => {
        if (relevantJobs.length === 0) return 0;
        let sumDays = 0;
        const now = new Date();
        relevantJobs.forEach((j) => {
          const start = new Date(j.publishedAt || '2026-09-01');
          const end = j.completedDate ? new Date(j.completedDate) : now;
          const diffDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          sumDays += diffDays;
        });
        return Math.round(sumDays / relevantJobs.length);
      })(),
    };
  };

  const metrics = getMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.ats || 'ATS · Portal de Empleos & Reclutamiento'}
            </h2>
            <p className="text-xs text-zinc-400">
              Búsquedas activas, pipeline por etapas con motivos, métricas por vacante y talent pool de destacados.
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('portal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'portal'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Portal de Vacantes
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'kanban'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Pipeline Kanban ({cvRecibidos.length + entrevista.length + psicotecnico.length})
              </button>

              <button
                onClick={() => setActiveTab('busquedas_admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'busquedas_admin'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Gestión Búsquedas ({tenantData.jobOffers.length})
              </button>

              <button
                onClick={() => setActiveTab('destacados')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'destacados'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-zinc-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Destacados ({destacados.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('rechazados')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'rechazados'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Descartados ({rechazados.length})
              </button>

              <button
                onClick={() => setActiveTab('kpis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'kpis'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Métricas & KPIs
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: PORTAL DE VACANTES (PÚBLICO Y EXTERNO) */}
      {activeTab === 'portal' && (
        <div className="space-y-6">
          {/* Banner Hero */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-900 p-6 md:p-8">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Trabajá con nosotros · {activeTenant.name}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Sumate a nuestro equipo y desarrollá tu carrera
              </h1>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Revisá las búsquedas abiertas para nuestras sedes y plantas industriales. Concursos transparentes para colaboradores y postulantes externos.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Buscar por puesto o sede..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-400 shrink-0">Área:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todas las Áreas</option>
                {activeTenant.masterDropdowns.areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicJobs.map((job) => (
              <div
                key={job.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-violet-500/40 transition-all space-y-4"
              >
                {job.coverImageUrl && (
                  <div className="w-full h-36 overflow-hidden relative border-b border-zinc-800">
                    <img
                      src={job.coverImageUrl}
                      alt={job.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-950/80 text-violet-300 border border-violet-500/40 backdrop-blur-sm">
                      {job.workType}
                    </span>
                  </div>
                )}

                <div className={`space-y-2 ${job.coverImageUrl ? 'p-5 pt-0' : 'p-5'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm">{job.title}</h3>
                    {!job.coverImageUrl && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/30">
                        {job.workType}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {job.sede}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                      <Users className="w-3.5 h-3.5" />
                      {job.vacanciesTotal - (job.vacanciesHired || 0)} vacante(s) disponible(s)
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                    {job.description}
                  </p>

                  {/* Public Requirements list */}
                  {job.publicRequirements && job.publicRequirements.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">Requisitos del Puesto:</span>
                      <ul className="mt-1 space-y-1">
                        {job.publicRequirements.map((req, idx) => (
                          <li key={idx} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Publicado: {job.publishedAt}
                  </span>
                  <button
                    onClick={() => setSelectedJobForApply(job)}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Postularme Ahora</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {publicJobs.length === 0 && (
              <div className="col-span-2 p-10 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                No hay búsquedas laborales abiertas en esta categoría en este momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PIPELINE KANBAN (ADMIN) */}
      {activeTab === 'kanban' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-white">Pipeline de Postulantes</h3>
              <p className="text-xs text-zinc-400">
                Avanza o rechaza candidatos asignando etiquetas de fortalezas o motivos de descarte.
              </p>
            </div>
            <button
              onClick={() => setIsNewJobModalOpen(true)}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Búsqueda</span>
            </button>
          </div>

          {/* Kanban Search & Job Filter Toolbar */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2 text-zinc-500" />
              <input
                type="text"
                value={kanbanQuery}
                onChange={(e) => setKanbanQuery(e.target.value)}
                placeholder="Filtrar candidatos por nombre, perfil, notas o etiquetas en pipeline..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <select
                value={kanbanJobFilter}
                onChange={(e) => setKanbanJobFilter(e.target.value)}
                className="w-full sm:w-64 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">Todas las Búsquedas ({tenantData.jobOffers.length})</option>
                {tenantData.jobOffers.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {/* ETAPA 1: CV Recibido */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-bold text-zinc-300">
                <span>1. CV Recibido</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                  {cvRecibidos.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {cvRecibidos.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-zinc-800/70 rounded-lg border border-zinc-700/80 text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{cand.name}</span>
                          <button
                            onClick={() => toggleCandidateFeatured(cand.id)}
                            title="Destacar candidato para futuras búsquedas"
                            className="text-zinc-500 hover:text-amber-400 cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                cand.isFeatured ? 'text-amber-400 fill-amber-400' : ''
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-violet-400 font-medium truncate">
                            {cand.jobTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCandidateJob(cand);
                              setSelectedNewJobIdForCand(cand.jobId);
                            }}
                            className="text-[9px] text-zinc-500 hover:text-violet-300 underline cursor-pointer shrink-0"
                            title="Editar búsqueda para la cual aplicó"
                          >
                            (Cambiar)
                          </button>
                        </div>
                      </div>
                      {cand.isInternal && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          INTERNO
                        </span>
                      )}
                    </div>

                    {/* Word tags: strengths or reasons */}
                    {cand.advanceReasonTags && cand.advanceReasonTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cand.advanceReasonTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-700/50">
                      <span>Postulado: {cand.stageDates?.postulacion || cand.appliedDate}</span>
                      <button
                        type="button"
                        onClick={() => setViewingCvCandidate(cand)}
                        className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer"
                        title="Ver y descargar CV"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Ver CV</span>
                      </button>
                    </div>

                    <div className="pt-2 flex justify-between gap-1 border-t border-zinc-700/60">
                      <button
                        onClick={() => openDecisionModal(cand, 'reject', 'rechazado')}
                        className="px-2 py-1 text-red-400 hover:text-red-300 text-[10px] font-medium"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => openDecisionModal(cand, 'advance', 'entrevista')}
                        className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-semibold"
                      >
                        A Entrevista
                      </button>
                    </div>
                  </div>
                ))}

                {cvRecibidos.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-[11px]">Sin candidatos</div>
                )}
              </div>
            </div>

            {/* ETAPA 2: Entrevista */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-bold text-violet-300">
                <span>2. Entrevista</span>
                <span className="px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 font-mono text-[10px]">
                  {entrevista.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {entrevista.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-zinc-800/70 rounded-lg border border-zinc-700/80 text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{cand.name}</span>
                          <button
                            onClick={() => toggleCandidateFeatured(cand.id)}
                            className="text-zinc-500 hover:text-amber-400 cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                cand.isFeatured ? 'text-amber-400 fill-amber-400' : ''
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-violet-400 font-medium truncate">
                            {cand.jobTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCandidateJob(cand);
                              setSelectedNewJobIdForCand(cand.jobId);
                            }}
                            className="text-[9px] text-zinc-500 hover:text-violet-300 underline cursor-pointer shrink-0"
                            title="Editar búsqueda para la cual aplicó"
                          >
                            (Cambiar)
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingCvCandidate(cand)}
                          className="text-violet-400 hover:text-violet-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>CV</span>
                        </button>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {cand.stageDates?.entrevista || 'Agendada'}
                        </span>
                      </div>
                    </div>

                    {/* Word tags */}
                    {cand.advanceReasonTags && cand.advanceReasonTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cand.advanceReasonTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-zinc-400 italic line-clamp-2">{cand.notes}</p>

                    <div className="pt-2 flex justify-between gap-1 border-t border-zinc-700/60">
                      <button
                        onClick={() => openDecisionModal(cand, 'reject', 'rechazado')}
                        className="px-2 py-1 text-red-400 hover:text-red-300 text-[10px]"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => openDecisionModal(cand, 'advance', 'psicotecnico')}
                        className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-semibold"
                      >
                        A Psicotécnico
                      </button>
                    </div>
                  </div>
                ))}

                {entrevista.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-[11px]">Sin candidatos</div>
                )}
              </div>
            </div>

            {/* ETAPA 3: Psicotécnico */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-bold text-amber-300">
                <span>3. Psicotécnico</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[10px]">
                  {psicotecnico.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {psicotecnico.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-zinc-800/70 rounded-lg border border-zinc-700/80 text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{cand.name}</span>
                          <button
                            onClick={() => toggleCandidateFeatured(cand.id)}
                            className="text-zinc-500 hover:text-amber-400 cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                cand.isFeatured ? 'text-amber-400 fill-amber-400' : ''
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-violet-400 font-medium truncate">
                            {cand.jobTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCandidateJob(cand);
                              setSelectedNewJobIdForCand(cand.jobId);
                            }}
                            className="text-[9px] text-zinc-500 hover:text-violet-300 underline cursor-pointer shrink-0"
                            title="Editar búsqueda para la cual aplicó"
                          >
                            (Cambiar)
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingCvCandidate(cand)}
                          className="text-violet-400 hover:text-violet-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>CV</span>
                        </button>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {cand.stageDates?.psicotecnico || 'En curso'}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {cand.advanceReasonTags && cand.advanceReasonTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cand.advanceReasonTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex justify-between gap-1 border-t border-zinc-700/60">
                      <button
                        onClick={() => openDecisionModal(cand, 'reject', 'rechazado')}
                        className="px-2 py-1 text-red-400 hover:text-red-300 text-[10px]"
                      >
                        No Apto
                      </button>
                      <button
                        onClick={() => openDecisionModal(cand, 'hire', 'ingreso')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold"
                      >
                        Confirmar Ingreso
                      </button>
                    </div>
                  </div>
                ))}

                {psicotecnico.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-[11px]">Sin candidatos</div>
                )}
              </div>
            </div>

            {/* ETAPA 4: Ingresados (Desaparecen del pipeline público y quedan aquí solo para Admin) */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-bold text-emerald-400">
                <span>4. Ingresados (Admin)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono text-[10px]">
                  {ingreso.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {ingreso.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-500/30 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-white">{cand.name}</span>
                        <span className="text-[10px] text-emerald-300 block truncate">
                          {cand.jobTitle}
                        </span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>

                    <div className="text-[10px] font-mono text-zinc-400">
                      Fecha Ingreso: {cand.stageDates?.ingresoConfirmado || 'Reciente'}
                    </div>

                    {cand.advanceReasonTags && cand.advanceReasonTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cand.advanceReasonTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {ingreso.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-[11px]">No hay ingresos aún</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GESTIÓN DE BÚSQUEDAS (ADMIN: ACTIVAS, CERRADAS, COMPLETADAS) */}
      {activeTab === 'busquedas_admin' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-white">Administración de Búsquedas Laborales</h3>
              <p className="text-xs text-zinc-400">
                Supervisa el estado de cada búsqueda: Activas, Cerradas o Completadas al ingresar el último postulante.
              </p>
            </div>
            <button
              onClick={() => setIsNewJobModalOpen(true)}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Búsqueda</span>
            </button>
          </div>

          {/* 3 Status Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            {(['Activa', 'Cerrada', 'Completada'] as const).map((status) => {
              const count = tenantData.jobOffers.filter((j) => j.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setJobStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    jobStatusFilter === status
                      ? status === 'Completada'
                        ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : status === 'Cerrada'
                        ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        : 'bg-violet-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {status === 'Completada' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{status === 'Activa' ? 'Activas' : status === 'Cerrada' ? 'Cerradas' : 'Completadas'}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-950 font-mono">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminJobsByStatus.map((job) => {
              const isCompleted = job.status === 'Completada';
              return (
                <div
                  key={job.id}
                  className={`rounded-xl p-5 border transition-all space-y-3 ${
                    isCompleted
                      ? 'bg-zinc-900/40 border-emerald-900/40 opacity-90'
                      : 'bg-zinc-900/70 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-sm">{job.title}</h4>
                        {isCompleted && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            Completada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {job.department} · {job.sede}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white">
                        {job.vacanciesHired || 0} / {job.vacanciesTotal} vacantes
                      </span>
                      <p className="text-[10px] text-zinc-500">
                        {isCompleted
                          ? `Cerrada por ingreso: ${job.completedDate || 'Hoy'}`
                          : `Publicado: ${job.publishedAt}`}
                      </p>
                    </div>
                  </div>

                  {/* Requirements breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800/60">
                    <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 uppercase">
                        <Eye className="w-3 h-3" />
                        <span>Requisitos Públicos</span>
                      </div>
                      <p className="text-[11px] text-zinc-300">
                        {job.publicRequirements.join(', ') || 'Sin requisitos específicos'}
                      </p>
                    </div>

                    <div className="p-2 bg-zinc-950/60 rounded border border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 uppercase">
                        <Lock className="w-3 h-3" />
                        <span>Requisitos Internos (Admin)</span>
                      </div>
                      <p className="text-[11px] text-zinc-300">
                        {job.internalRequirements.join(', ') || 'Sin requisitos privados'}
                      </p>
                    </div>
                  </div>

                  {/* Selected Candidate Display for Completed Searches */}
                  {isCompleted && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">Colaborador/a Seleccionado/a:</span>
                      <span className="font-bold text-emerald-400">
                        {job.selectedCandidateName ||
                          tenantData.candidates.find((c) => c.jobId === job.id && c.stage === 'ingreso')?.name ||
                          'Federico Álvarez (Ingresado)'}
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                    <span className="text-[10px] text-zinc-500">
                      Postulantes en proceso: {tenantData.candidates.filter((c) => c.jobId === job.id).length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEditJob(job)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Modificar requisitos, vacantes y datos de la búsqueda"
                      >
                        <span>Editar Búsqueda</span>
                      </button>

                      {job.status === 'Activa' && (
                        <button
                          onClick={() => handleCloseJobManually(job.id)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors cursor-pointer"
                        >
                          Cerrar
                        </button>
                      )}
                      {job.status !== 'Activa' && (
                        <button
                          onClick={() => handleReopenJob(job.id)}
                          className="px-2.5 py-1 bg-violet-600/30 hover:bg-violet-600/40 text-violet-300 rounded text-xs transition-colors border border-violet-500/30 cursor-pointer"
                        >
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {adminJobsByStatus.length === 0 && (
              <div className="col-span-2 p-10 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                No hay búsquedas con estado "{jobStatusFilter}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CANDIDATOS DESTACADOS (TALENT POOL) */}
      {activeTab === 'destacados' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Base de Talentos · Candidatos Destacados ({destacados.length})</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Perfiles guardados para futuras convocatorias y nuevas búsquedas laborales.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Candidato</th>
                  <th className="px-4 py-3">Puesto Postulado</th>
                  <th className="px-4 py-3">Fortalezas Destacadas</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {destacados.map((cand) => (
                  <tr key={cand.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{cand.name}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{cand.jobTitle}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cand.advanceReasonTags && cand.advanceReasonTags.length > 0 ? (
                          cand.advanceReasonTags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-[10px]">Sin etiquetas</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                      {cand.email} · {cand.phone}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">{cand.appliedDate}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleCandidateFeatured(cand.id)}
                        className="px-2 py-1 text-zinc-400 hover:text-red-400 text-[10px]"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}

                {destacados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-xs">
                      No hay candidatos destacados guardados. Haz clic en la estrella de cualquier postulante para guardarlo aquí.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DESCARTADOS / HISTORIAL DE RECHAZO CON ETAPA Y MOTIVOS */}
      {activeTab === 'rechazados' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden space-y-3">
          <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-xs text-zinc-200">
                Historial de Postulantes Descartados ({rechazados.length})
              </h3>
              <p className="text-[11px] text-zinc-400">
                Registra la fecha de rechazo, etapa exacta de descarte y motivos explicitados.
              </p>
            </div>

            {/* Stage filter dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 text-[11px]">Filtrar por etapa:</span>
              <select
                value={rechazadosStageSort}
                onChange={(e) => setRechazadosStageSort(e.target.value as any)}
                className="px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white"
              >
                <option value="all">Todas las etapas</option>
                <option value="cv_recibido">Filtro de CV inicial</option>
                <option value="entrevista">Entrevista laboral</option>
                <option value="psicotecnico">Examen psicotécnico</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Candidato</th>
                  <th className="px-4 py-3">Puesto Postulado</th>
                  <th className="px-4 py-3">Etapa de Descarte</th>
                  <th className="px-4 py-3">Motivos de Rechazo</th>
                  <th className="px-4 py-3">Fecha Decisión</th>
                  <th className="px-4 py-3">Anotaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredRechazados.map((cand) => (
                  <tr key={cand.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-semibold text-white">{cand.name}</td>
                    <td className="px-4 py-3 text-zinc-300">{cand.jobTitle}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        {cand.eliminatedStage === 'entrevista'
                          ? 'Entrevista'
                          : cand.eliminatedStage === 'psicotecnico'
                          ? 'Psicotécnico'
                          : 'Revisión de CV'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cand.rejectionReasonTags && cand.rejectionReasonTags.length > 0 ? (
                          cand.rejectionReasonTags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/10 text-red-300 border border-red-500/20"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-[10px]">Sin etiqueta</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {cand.stageDates?.rechazo || cand.appliedDate}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">{cand.notes}</td>
                  </tr>
                ))}

                {filteredRechazados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-xs">
                      No hay postulantes descartados en este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: MÉTRICAS Y KPIS CON SELECTOR POR BÚSQUEDA */}
      {activeTab === 'kpis' && isAdmin && (
        <div className="space-y-6">
          {/* Search Selector Bar */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Selección de Búsqueda para Métricas
              </span>
              <p className="text-xs text-zinc-300">
                Elige una búsqueda puntual o el resumen general promedio de toda la plataforma.
              </p>
            </div>

            <select
              value={selectedKpiJobId}
              onChange={(e) => setSelectedKpiJobId(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-xs cursor-pointer font-medium"
            >
              <option value="all">📊 Todas las Búsquedas (Resumen Promedio)</option>
              {tenantData.jobOffers.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.status})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Total Postulantes
              </span>
              <div className="text-3xl font-bold font-mono text-violet-400">
                {metrics.totalPostulantes}
              </div>
              <p className="text-[10px] text-zinc-500">CVs recibidos para la selección</p>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Tiempo de Cobertura
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {metrics.avgTimeToHire} días
              </div>
              <p className="text-[10px] text-zinc-500">Desde publicación hasta contratación</p>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Vacantes Cubiertas
              </span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {metrics.totalCubiertas} / {metrics.totalVacantes}
              </div>
              <p className="text-[10px] text-zinc-500">Posiciones efectivamente ingresadas</p>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Tasa de Conversión
              </span>
              <div className="text-3xl font-bold font-mono text-amber-400">
                {metrics.conversionRate}%
              </div>
              <p className="text-[10px] text-zinc-500">Ingresos vs Total postulaciones</p>
            </div>
          </div>

          {/* Funnel breakdown */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="font-semibold text-xs text-white">Embudo de Selección (Funnel)</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">1. Postulados</span>
                <span className="text-lg font-bold font-mono text-white">{metrics.totalPostulantes}</span>
              </div>
              <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">2. Entrevistados</span>
                <span className="text-lg font-bold font-mono text-violet-400">{metrics.totalEntrevistas}</span>
              </div>
              <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">3. Psicotécnicos</span>
                <span className="text-lg font-bold font-mono text-amber-400">{metrics.totalPsicotecnicos}</span>
              </div>
              <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">4. Ingresados</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{metrics.totalIngresados}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DECISIÓN SOBRE CANDIDATO (MOTIVOS Y ETIQUETAS) */}
      {decisionModal.isOpen && decisionModal.candidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {decisionModal.action === 'reject'
                    ? 'Motivo de Rechazo de Candidato'
                    : decisionModal.action === 'hire'
                    ? 'Confirmar Ingreso a la Empresa'
                    : 'Avanzar a la Siguiente Etapa'}
                </h3>
                <p className="text-xs text-violet-400">
                  {decisionModal.candidate.name} · {decisionModal.candidate.jobTitle}
                </p>
              </div>
              <button
                onClick={() => setDecisionModal({ isOpen: false, candidate: null, action: 'advance', targetStage: 'entrevista' })}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  {decisionModal.action === 'reject'
                    ? 'Selecciona las razones del rechazo (aparecerán como etiquetas):'
                    : 'Selecciona las fortalezas y motivos de avance:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(decisionModal.action === 'reject'
                    ? [
                        'Pretensión salarial fuera de escala',
                        'Sin disponibilidad horaria',
                        'No superó psicotécnico',
                        'Falta de experiencia técnica',
                        'No asistió a entrevista',
                        'Incompatibilidad de turno',
                      ]
                    : [
                        'Excelente perfil técnico',
                        'Disponibilidad inmediata',
                        'Fit cultural sobresaliente',
                        'Salario pretendido acorde',
                        'Muy buena presencia y trato',
                        'Referencias comprobables',
                      ]
                  ).map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter((t) => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          isSelected
                            ? decisionModal.action === 'reject'
                              ? 'bg-red-600 text-white'
                              : 'bg-emerald-600 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Agregar etiqueta personalizada:</label>
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Ej. Reside cerca de planta"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Anotaciones del evaluador:</label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Comentarios adicionales para el legajo de selección..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDecisionModal({ isOpen: false, candidate: null, action: 'advance', targetStage: 'entrevista' })}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                  decisionModal.action === 'reject'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                Confirmar Decisión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POSTULACIÓN A VACANTE */}
      {selectedJobForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-bold text-white mb-1">Postulación a Vacante</h3>
            <p className="text-xs text-violet-400 font-semibold mb-4">{selectedJobForApply.title}</p>

            {applySuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{applySuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                {applyError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                {/* Internal Candidate Checkbox */}
                <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800 space-y-2">
                  <label className="flex items-center gap-2 text-zinc-200 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={isInternalCandidate}
                      onChange={(e) => setIsInternalCandidate(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-violet-600 focus:ring-0"
                    />
                    <span>Soy Colaborador Actual de la Empresa (Concurso Interno)</span>
                  </label>
                  {isInternalCandidate && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                      <div>
                        <label className="block text-zinc-400 mb-1">N° de Legajo</label>
                        <input
                          type="text"
                          value={candLegajo}
                          onChange={(e) => setCandLegajo(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">Clave de Empleado</label>
                        <input
                          type="password"
                          value={internalPasswordInput}
                          onChange={(e) => setInternalPasswordInput(e.target.value)}
                          placeholder="empleado2026"
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-white"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Email de Contacto</label>
                    <input
                      type="email"
                      value={candEmail}
                      onChange={(e) => setCandEmail(e.target.value)}
                      placeholder="juan@email.com"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Teléfono Móvil / WhatsApp</label>
                  <input
                    type="tel"
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Curriculum Vitae (PDF / Word / Imagen) *</label>
                  <div className="p-3 bg-zinc-950 border border-dashed border-zinc-700 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-zinc-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-violet-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold block truncate text-xs text-white">
                          {cvFileData?.name || cvFileName}
                        </span>
                        {cvFileData?.size ? (
                          <span className="text-[10px] text-emerald-400">{cvFileData.size} · Archivo adjuntado ✓</span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">Formato aceptado: .pdf, .docx, .png</span>
                        )}
                      </div>
                    </div>
                    <label className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-xs text-center">
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      <span>{cvFileData ? 'Cambiar Archivo' : 'Subir CV desde tu dispositivo'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleCvFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Carta de Presentación o Nota</label>
                  <textarea
                    rows={2}
                    value={candNotes}
                    onChange={(e) => setCandNotes(e.target.value)}
                    placeholder="Contanos brevemente tu experiencia..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForApply(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold"
                  >
                    Enviar Postulación
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVA BÚSQUEDA LABORAL */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Publicar Nueva Búsqueda Laboral</h3>
              <button onClick={() => setIsNewJobModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5 text-xs pt-3">
              <div>
                <label className="block text-zinc-400 mb-1">Título del Puesto</label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="Ej. Técnico Mecánico de Mantenimiento"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Área / Sector</label>
                  <select
                    value={newJobDept}
                    onChange={(e) => setNewJobDept(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {activeTenant.masterDropdowns.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Lugar de Trabajo / Sede</label>
                  <select
                    value={newJobSede}
                    onChange={(e) => setNewJobSede(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {activeTenant.masterDropdowns.lugaresTrabajo.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Modalidad de Trabajo</label>
                  <select
                    value={newJobWorkType}
                    onChange={(e) => setNewJobWorkType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Cantidad de Vacantes</label>
                  <input
                    type="number"
                    min={1}
                    value={newJobVacancies}
                    onChange={(e) => setNewJobVacancies(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Descripción del Cargo</label>
                <textarea
                  rows={2}
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  placeholder="Responsabilidades y tareas asignadas..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              {/* Cover Image for Job Offer */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1 flex items-center justify-between">
                  <span>Imagen de Portada de la Búsqueda</span>
                  <span className="text-[10px] text-violet-400">URL o Seleccionar portada</span>
                </label>
                <input
                  type="url"
                  value={newJobCoverImageUrl}
                  onChange={(e) => setNewJobCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (URL de imagen)"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white mb-2"
                />
                <div className="flex gap-2 overflow-x-auto pb-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNewJobCoverImageUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop')}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 whitespace-nowrap border border-zinc-700"
                  >
                    Industrial / Planta
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewJobCoverImageUrl('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop')}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 whitespace-nowrap border border-zinc-700"
                  >
                    Oficinas / Equipo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewJobCoverImageUrl('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop')}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 whitespace-nowrap border border-zinc-700"
                  >
                    Gastronomía / Cocina
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewJobCoverImageUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop')}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 whitespace-nowrap border border-zinc-700"
                  >
                    Logística / Depósito
                  </button>
                </div>
              </div>

              {/* Public Requirements */}
              <div>
                <label className="block text-violet-400 font-semibold mb-1">
                  Requisitos Públicos (visibles en el portal de empleo)
                </label>
                <textarea
                  rows={2}
                  value={newJobPublicReqs}
                  onChange={(e) => setNewJobPublicReqs(e.target.value)}
                  placeholder="Un requisito por línea..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-[11px]"
                />
              </div>

              {/* Private / Internal Requirements */}
              <div>
                <label className="block text-amber-400 font-semibold mb-1">
                  Requisitos Internos de Evaluación (solo visibles para Admin / Jefes)
                </label>
                <textarea
                  rows={2}
                  value={newJobInternalReqs}
                  onChange={(e) => setNewJobInternalReqs(e.target.value)}
                  placeholder="Un criterio por línea (ej: salario pretendido, personalidad)..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold"
                >
                  Publicar Búsqueda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER CV DE CANDIDATO */}
      {viewingCvCandidate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-sm text-white">Curriculum Vitae · {viewingCvCandidate.name}</h3>
              </div>
              <button
                onClick={() => setViewingCvCandidate(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Postulante</span>
                  <span className="font-bold text-white text-sm">{viewingCvCandidate.name}</span>
                  {viewingCvCandidate.isInternal && (
                    <span className="text-indigo-400 text-[10px] font-semibold block">Colaborador Interno</span>
                  )}
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Búsqueda Actual</span>
                  <span className="font-semibold text-violet-300">{viewingCvCandidate.jobTitle}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Contacto</span>
                  <span className="text-zinc-300 block">{viewingCvCandidate.email}</span>
                  <span className="text-zinc-400 font-mono block">{viewingCvCandidate.phone || 'Sin teléfono'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Fecha de Postulación</span>
                  <span className="text-zinc-300 font-mono">{viewingCvCandidate.appliedDate}</span>
                </div>
              </div>

              {/* CV Document Preview Box */}
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-white">{viewingCvCandidate.cvFileName || 'CV_Adjunto_Postulante.pdf'}</div>
                      <div className="text-[10px] text-zinc-400">Documento PDF / Archivo Curriculum Vitae</div>
                    </div>
                  </div>
                  <a
                    href={viewingCvCandidate.cvFileUrl || '#'}
                    download={viewingCvCandidate.cvFileName || 'CV_Postulante.pdf'}
                    onClick={(e) => {
                      if (!viewingCvCandidate.cvFileUrl) {
                        e.preventDefault();
                        alert(`Descargando copia digital de ${viewingCvCandidate.cvFileName || 'CV'}`);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>Descargar CV</span>
                  </a>
                </div>
                {viewingCvCandidate.notes && (
                  <div className="pt-2 border-t border-zinc-800 text-zinc-300 text-[11px] leading-relaxed">
                    <strong className="text-zinc-400">Notas / Carta de Presentación:</strong> {viewingCvCandidate.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  const cand = viewingCvCandidate;
                  setViewingCvCandidate(null);
                  setEditingCandidateJob(cand);
                  setSelectedNewJobIdForCand(cand.jobId);
                }}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium underline cursor-pointer"
              >
                Reasignar a otra búsqueda laboral
              </button>
              <button
                type="button"
                onClick={() => setViewingCvCandidate(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR BÚSQUEDA A LA QUE POSTULÓ EL CANDIDATO */}
      {editingCandidateJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-sm text-white">Cambiar Búsqueda de {editingCandidateJob.name}</h3>
              <button onClick={() => setEditingCandidateJob(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidateJobChange} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Búsqueda Actual</label>
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 font-semibold text-zinc-300">
                  {editingCandidateJob.jobTitle}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Nueva Búsqueda Destino</label>
                <select
                  value={selectedNewJobIdForCand}
                  onChange={(e) => setSelectedNewJobIdForCand(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                >
                  <option value="">Selecciona la nueva búsqueda...</option>
                  {tenantData.jobOffers.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department} - {j.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCandidateJob(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold"
                >
                  Guardar Reasignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR BÚSQUEDA LABORAL COMPLETA (ADMIN) */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-sm text-white">Editar Búsqueda Laboral</h3>
              <button onClick={() => setEditingJob(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nombre / Título del Puesto</label>
                <input
                  type="text"
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Sector</label>
                  <select
                    value={editJobDept}
                    onChange={(e) => setEditJobDept(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {activeTenant.masterDropdowns.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Sede / Ubicación</label>
                  <select
                    value={editJobSede}
                    onChange={(e) => setEditJobSede(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {activeTenant.masterDropdowns.lugaresTrabajo.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Modalidad</label>
                  <select
                    value={editJobWorkType}
                    onChange={(e) => setEditJobWorkType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Vacantes Totales</label>
                  <input
                    type="number"
                    min={1}
                    value={editJobVacancies}
                    onChange={(e) => setEditJobVacancies(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Estado de Búsqueda</label>
                  <select
                    value={editJobStatus}
                    onChange={(e) => setEditJobStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-semibold"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Cerrada">Cerrada</option>
                    <option value="Completada">Completada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Colaborador/a Seleccionado/a (para Búsquedas Completadas)</label>
                <input
                  type="text"
                  value={editJobSelectedCandidateName}
                  onChange={(e) => setEditJobSelectedCandidateName(e.target.value)}
                  placeholder="Nombre de la persona seleccionada / contratada..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Descripción del Puesto</label>
                <textarea
                  rows={2}
                  value={editJobDesc}
                  onChange={(e) => setEditJobDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Requisitos Públicos (uno por línea)</label>
                <textarea
                  rows={2}
                  value={editJobPublicReqs}
                  onChange={(e) => setEditJobPublicReqs(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-1">Requisitos Internos (Admin / Jefes)</label>
                <textarea
                  rows={2}
                  value={editJobInternalReqs}
                  onChange={(e) => setEditJobInternalReqs(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold"
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
