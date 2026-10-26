import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { Course, CourseEnrollment } from '../../../types';
import {
  GraduationCap,
  Award,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MapPin,
  Mail,
  Send,
  Plus,
  Printer,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Video,
  FileText,
  Play,
  Trash2,
  Edit3,
  Download,
} from 'lucide-react';

export const Mod6Capacitaciones: React.FC = () => {
  const {
    activeTenant,
    tenantData,
    enrollInCourse,
    markEnrollmentConfirmationSent,
    addCourse,
    updateCourse,
    deleteCourse,
    updateCourseMatrix,
  } = useTenant();
  const { role, currentEmployee } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [activeTab, setActiveTab] = useState<'catalogo' | 'diplomas' | 'admin_matriz' | 'admin_inscriptos'>(
    isAdmin ? 'admin_matriz' : 'catalogo'
  );

  // Diplomas Search (General: Buscador DNI/Legajo)
  const [certQuery, setCertQuery] = useState(currentEmployee.legajo || 'LEG-1045');
  const [selectedCertificate, setSelectedCertificate] = useState<{
    courseTitle: string;
    employeeName: string;
    legajo: string;
    dni: string;
    completionDate: string;
    hours: number;
    instructor?: string;
  } | null>(null);

  // Course Enrollment Modal (General - Inscribirse)
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  const [enrName, setEnrName] = useState(currentEmployee.name || '');
  const [enrLegajo, setEnrLegajo] = useState(currentEmployee.legajo || 'LEG-1045');
  const [enrDni, setEnrDni] = useState('34567890');
  const [enrEmail, setEnrEmail] = useState('jdominguez@nexusindustrial.com');
  const [enrollmentStatus, setEnrollmentStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Admin: Confirmation Email Modal
  const [emailModalData, setEmailModalData] = useState<CourseEnrollment | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Admin: Add new course
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCat, setNewCourseCat] = useState('Operaciones');
  const [newCourseHours, setNewCourseHours] = useState(16);
  const [newCourseInst, setNewCourseInst] = useState('');
  const [newCourseDate, setNewCourseDate] = useState('2026-11-01');
  const [newCourseMod, setNewCourseMod] = useState<Course['modality']>('Presencial en Sede');
  const [newCourseLoc, setNewCourseLoc] = useState('Aula Magna');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseVideoUrl, setNewCourseVideoUrl] = useState('');
  const [newCoursePdfUrl, setNewCoursePdfUrl] = useState('');
  const [newCoursePdfName, setNewCoursePdfName] = useState('');

  // Course editing and interactive viewing
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeVideoModalCourse, setActiveVideoModalCourse] = useState<Course | null>(null);

  // Find employee records for diploma query
  const searchedEmployee = tenantData.employeeMatrix.find(
    (e) =>
      e.legajo.toLowerCase() === certQuery.trim().toLowerCase() ||
      e.dni.toLowerCase() === certQuery.trim().toLowerCase() ||
      e.employeeName.toLowerCase().includes(certQuery.trim().toLowerCase())
  );

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnroll) return;
    const res = enrollInCourse({
      courseId: selectedCourseForEnroll.id,
      courseTitle: selectedCourseForEnroll.title,
      employeeName: enrName.trim(),
      employeeLegajo: enrLegajo.trim(),
      employeeDni: enrDni.trim(),
      email: enrEmail.trim(),
    });
    setEnrollmentStatus(res);
    if (res.success) {
      setTimeout(() => {
        setSelectedCourseForEnroll(null);
        setEnrollmentStatus(null);
      }, 2500);
    }
  };

  const handleOpenEmailModal = (enrollment: CourseEnrollment) => {
    const course = tenantData.courses.find((c) => c.id === enrollment.courseId);
    setEmailModalData(enrollment);
    setEmailSubject(`Confirmación de Inscripción: ${enrollment.courseTitle} - ${activeTenant.name}`);
    setEmailBody(
      `Estimado/a ${enrollment.employeeName},\n\n` +
      `Nos complace confirmarte tu vacante para la capacitación "${enrollment.courseTitle}".\n\n` +
      `Detalles del curso:\n` +
      `· Fecha de Inicio: ${course?.startDate || 'A coordinar'}\n` +
      `· Carga Horaria: ${course?.hours || 16} horas\n` +
      `· Modalidad: ${course?.modality || 'Presencial'}\n` +
      `· Ubicación / Acceso: ${course?.location || 'Sede'}\n` +
      `· Instructor: ${course?.instructor || 'Equipo de Capacitación'}\n\n` +
      `Por favor confirma recepción. Saludos cordiales,\n` +
      `Área de Capacitación y Desarrollo · ${activeTenant.name}`
    );
  };

  const handleSendEmailConfirm = () => {
    if (!emailModalData) return;
    markEnrollmentConfirmationSent(emailModalData.id);
    const mailtoUrl = `mailto:${encodeURIComponent(emailModalData.email)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    setEmailModalData(null);
  };

  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    addCourse({
      title: newCourseTitle.trim(),
      category: newCourseCat,
      hours: Number(newCourseHours) || 8,
      instructor: newCourseInst.trim() || undefined,
      startDate: newCourseDate,
      modality: newCourseMod,
      location: newCourseLoc.trim(),
      description: newCourseDesc.trim() || 'Programa oficial de capacitación interna.',
      maxCapacity: 30,
      active: true,
      videoUrl: newCourseVideoUrl.trim() || undefined,
      pdfUrl: newCoursePdfUrl.trim() || undefined,
      pdfName: newCoursePdfName.trim() || (newCoursePdfUrl ? 'Manual y Herramientas del Curso (PDF)' : undefined),
    });
    setShowAddCourseModal(false);
    setNewCourseTitle('');
    setNewCourseInst('');
    setNewCourseVideoUrl('');
    setNewCoursePdfUrl('');
    setNewCoursePdfName('');
  };

  const handleUpdateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    updateCourse(editingCourse.id, {
      title: editingCourse.title,
      category: editingCourse.category,
      hours: editingCourse.hours,
      instructor: editingCourse.instructor,
      startDate: editingCourse.startDate,
      modality: editingCourse.modality,
      location: editingCourse.location,
      description: editingCourse.description,
      videoUrl: editingCourse.videoUrl,
      pdfUrl: editingCourse.pdfUrl,
      pdfName: editingCourse.pdfName,
    });
    setEditingCourse(null);
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la capacitación "${courseTitle}"?`)) {
      deleteCourse(courseId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.capacitaciones || 'Capacitaciones & Diplomas'}
            </h2>
            <p className="text-xs text-zinc-400">
              Catálogo de cursos con inscripción abierta, matriz de competencias y diplomas PDF
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'catalogo'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Cursos Disponibles (Inscripción)
          </button>
          <button
            onClick={() => setActiveTab('diplomas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'diplomas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Descarga de Diplomas
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('admin_matriz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'admin_matriz'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-900/40'
                }`}
              >
                Matriz de Cursos (Admin)
              </button>
              <button
                onClick={() => setActiveTab('admin_inscriptos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'admin_inscriptos'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/40'
                }`}
              >
                Tabla de Inscriptos & Mails
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: CATÁLOGO DE CURSOS DISPONIBLES & INSCRIPCIÓN */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Convocatorias Abiertas para Colaboradores</h3>
              <p className="text-xs text-zinc-400">
                Inscríbete en los programas vigentes para potenciar tus habilidades y certificar competencias.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddCourseModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nuevo Curso</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenantData.courses.map((course) => {
              const enrollmentsCount = tenantData.courseEnrollments.filter((e) => e.courseId === course.id).length;
              return (
                <div
                  key={course.id}
                  className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold">
                        {course.category}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {course.hours} horas
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">{course.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{course.description}</p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-800/80 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Inicio: <strong className="text-zinc-200 font-mono">{course.startDate}</strong></span>
                    </div>

                    {course.instructor && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Instructor: <strong className="text-zinc-200">{course.instructor}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Modalidad: <strong className="text-zinc-200">{course.modality}</strong> ({course.location})</span>
                    </div>

                    {/* Video and PDF Tools Section */}
                    <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveVideoModalCourse(course)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-medium transition-colors"
                      >
                        <Play className="w-3 h-3 text-rose-400 fill-rose-400" />
                        <span>{course.videoUrl ? 'Ver Video del Curso' : 'Ver Video Demostrativo'}</span>
                      </button>

                      <a
                        href={course.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[11px] font-medium transition-colors"
                      >
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span>{course.pdfName || 'Herramienta / Manual PDF'}</span>
                        <Download className="w-2.5 h-2.5 text-blue-400 ml-0.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {enrollmentsCount} inscriptos registrados
                      </span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setEditingCourse(course)}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
                              title="Editar capacitación"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id, course.title)}
                              className="p-1.5 bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 rounded-lg text-xs transition-colors"
                              title="Eliminar curso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedCourseForEnroll(course)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          Inscribirme
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DESCARGA DE DIPLOMAS (Buscador DNI / Legajo) */}
      {activeTab === 'diplomas' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={certQuery}
                onChange={(e) => setCertQuery(e.target.value)}
                placeholder="Ingresa tu DNI o Legajo (ej. 34567890 o LEG-1045)..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {searchedEmployee ? (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="font-semibold text-sm text-white">{searchedEmployee.employeeName}</h3>
                  <p className="text-xs text-zinc-400">
                    Legajo: {searchedEmployee.legajo} · DNI: {searchedEmployee.dni} · Sector: {searchedEmployee.department}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <Award className="w-4 h-4" />
                  <span>
                    {Object.values(searchedEmployee.completions).filter(Boolean).length} Certificaciones Oficiales
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenantData.courses.map((course) => {
                  const completionDate = searchedEmployee.completions[course.id];
                  const hasPassed = Boolean(completionDate);

                  return (
                    <div
                      key={course.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        hasPassed
                          ? 'bg-zinc-800/40 border-emerald-500/30'
                          : 'bg-zinc-900/40 border-zinc-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                            {course.category}
                          </span>
                          {hasPassed ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobado {completionDate}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500">Pendiente / Sin Fecha</span>
                          )}
                        </div>
                        <h4 className="font-semibold text-xs text-white">{course.title}</h4>
                        <p className="text-[11px] text-zinc-400">{course.hours} horas lectivas</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800 mt-3 flex justify-end">
                        {hasPassed ? (
                          <button
                            onClick={() =>
                              setSelectedCertificate({
                                courseTitle: course.title,
                                employeeName: searchedEmployee.employeeName,
                                legajo: searchedEmployee.legajo,
                                dni: searchedEmployee.dni,
                                completionDate: completionDate,
                                hours: course.hours,
                                instructor: course.instructor,
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Ver y Descargar Diploma (PDF)</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">Diploma inhabilitado</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
              <Search className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">
                No se encontró ningún colaborador con el documento o legajo ingresado. Prueba con <strong>LEG-1045</strong> o <strong>34567890</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN MATRIZ DOBLE ENTRADA */}
      {activeTab === 'admin_matriz' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-sm text-white">Matriz de Competencias y Capacitaciones</h3>
              <p className="text-xs text-zinc-400">
                Tabla de doble entrada (Colaboradores vs Cursos). Al registrar la Fecha de Finalización, el diploma se habilita instantáneamente.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-zinc-950/80 text-zinc-300 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-zinc-950/90 z-10">Colaborador / Legajo</th>
                  {tenantData.courses.map((c) => (
                    <th key={c.id} className="px-4 py-3 min-w-[150px]">
                      <div className="truncate font-semibold text-white">{c.title}</div>
                      <div className="text-[10px] text-zinc-500">{c.hours}h · {c.category}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {tenantData.employeeMatrix.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 sticky left-0 bg-zinc-900/90 z-10 border-r border-zinc-800">
                      <div className="font-semibold text-white">{emp.employeeName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{emp.legajo} · {emp.department}</div>
                    </td>
                    {tenantData.courses.map((c) => {
                      const date = emp.completions[c.id];
                      return (
                        <td key={c.id} className="px-4 py-3">
                          <input
                            type="date"
                            value={date || ''}
                            onChange={(e) => updateCourseMatrix(emp.employeeId, c.id, e.target.value)}
                            className={`px-2 py-1 rounded text-[11px] font-mono border focus:outline-none ${
                              date
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN TABLA DE INSCRIPTOS & MAILS */}
      {activeTab === 'admin_inscriptos' && isAdmin && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-white">Tabla de Colaboradores Inscriptos</h3>
              <p className="text-xs text-zinc-400">
                Revisa los aspirantes por curso y envíales el correo de confirmación de asistencia.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-mono">
              Total Inscriptos: {tenantData.courseEnrollments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Curso Postulado</th>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Legajo / DNI</th>
                  <th className="px-4 py-3">Correo Electrónico</th>
                  <th className="px-4 py-3">Fecha Inscripción</th>
                  <th className="px-4 py-3">Estado Mail</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {tenantData.courseEnrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate">
                      {enr.courseTitle}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-200">{enr.employeeName}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {enr.employeeLegajo} · {enr.employeeDni}
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-300">{enr.email}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                      {enr.enrolledAt.substring(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      {enr.confirmationSent ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enviado</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 font-medium">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEmailModal(enr)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded text-[11px] font-medium transition-colors ml-auto"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Enviar Mail de Confirmación</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Formulario de Inscripción al Curso */}
      {selectedCourseForEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-bold text-white mb-1">Inscripción a Capacitación</h3>
            <p className="text-xs text-indigo-400 font-medium mb-4">{selectedCourseForEnroll.title}</p>

            {enrollmentStatus && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  enrollmentStatus.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}
              >
                {enrollmentStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{enrollmentStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={enrName}
                  onChange={(e) => setEnrName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Legajo</label>
                  <input
                    type="text"
                    value={enrLegajo}
                    onChange={(e) => setEnrLegajo(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">DNI</label>
                  <input
                    type="text"
                    value={enrDni}
                    onChange={(e) => setEnrDni(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Correo Electrónico (para confirmación de vacante y enlaces)
                </label>
                <input
                  type="email"
                  value={enrEmail}
                  onChange={(e) => setEnrEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForEnroll(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-sm"
                >
                  Confirmar Postulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enviar Mail de Confirmación (Admin) */}
      {emailModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-semibold text-white mb-1">Enviar Correo de Confirmación</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Revisa la plantilla prearmada para notificar a <strong>{emailModalData.employeeName}</strong>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Destinatario</label>
                <input
                  type="text"
                  value={emailModalData.email}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Asunto</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Cuerpo del Mensaje</label>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalData(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendEmailConfirm}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar y Marcar Notificado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Diploma Oficial en PDF */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white text-zinc-950 rounded-2xl p-8 shadow-2xl border-8 border-amber-600/30 text-center space-y-6 relative">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="font-bold text-xs uppercase tracking-widest text-amber-800">
                {activeTenant.branding.name || activeTenant.name} · Academia Corporativa
              </span>
              <span className="text-xs font-mono text-zinc-500">Folio: CERT-{Date.now().toString().slice(-6)}</span>
            </div>

            <div className="space-y-2 pt-2">
              <Award className="w-16 h-16 text-amber-600 mx-auto" />
              <h2 className="text-2xl font-serif font-bold tracking-tight text-zinc-900">
                Certificado de Aprobación
              </h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">
                Se deja constancia de que el colaborador
              </p>
            </div>

            <div className="py-2">
              <h3 className="text-2xl font-bold text-indigo-950 underline decoration-amber-500 underline-offset-8">
                {selectedCertificate.employeeName}
              </h3>
              <p className="text-xs text-zinc-600 mt-2 font-mono">
                DNI N° {selectedCertificate.dni} · Legajo {selectedCertificate.legajo}
              </p>
            </div>

            <p className="text-xs text-zinc-700 max-w-lg mx-auto leading-relaxed">
              Ha completado y aprobado satisfactoriamente todos los módulos teóricos y prácticos correspondientes al programa de formación profesional:
            </p>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <h4 className="text-base font-bold text-zinc-900">{selectedCertificate.courseTitle}</h4>
              <p className="text-xs text-zinc-600 font-mono mt-0.5">
                Carga horaria: {selectedCertificate.hours} horas reloj · Fecha de Finalización: {selectedCertificate.completionDate}
              </p>
            </div>

            <div className="pt-6 border-t grid grid-cols-2 gap-8 text-xs text-zinc-600">
              <div className="border-t border-zinc-400 pt-2">
                <p className="font-bold text-zinc-900">{selectedCertificate.instructor || 'Facilitador del Programa'}</p>
                <p className="text-[11px] text-zinc-500">Instructor a Cargo</p>
              </div>
              <div className="border-t border-zinc-400 pt-2">
                <p className="font-bold text-zinc-900">Dirección de Recursos Humanos</p>
                <p className="text-[11px] text-zinc-500">{activeTenant.branding.name || activeTenant.name}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 border rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-900 text-white rounded-lg text-xs font-medium hover:bg-indigo-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Descargar Diploma</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Nuevo Curso (Admin) */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-semibold text-white mb-4">Crear Nueva Capacitación</h3>

            <form onSubmit={handleAddCourseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Título del Curso</label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Ej. Operación Segura de Autoelevadores"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Categoría</label>
                  <input
                    type="text"
                    value={newCourseCat}
                    onChange={(e) => setNewCourseCat(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Carga Horaria (Horas)</label>
                  <input
                    type="number"
                    value={newCourseHours}
                    onChange={(e) => setNewCourseHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Instructor (Opcional)</label>
                  <input
                    type="text"
                    value={newCourseInst}
                    onChange={(e) => setNewCourseInst(e.target.value)}
                    placeholder="Ej. Ing. Juan Pérez"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={newCourseDate}
                    onChange={(e) => setNewCourseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Modalidad</label>
                  <select
                    value={newCourseMod}
                    onChange={(e) => setNewCourseMod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="Presencial en Sede">Presencial en Sede</option>
                    <option value="Virtual Sincrónico">Virtual Sincrónico</option>
                    <option value="E-Learning Asincrónico">E-Learning Asincrónico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Ubicación / Sala</label>
                  <input
                    type="text"
                    value={newCourseLoc}
                    onChange={(e) => setNewCourseLoc(e.target.value)}
                    placeholder="Aula 2 / Zoom"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Descripción del Programa</label>
                <textarea
                  rows={2}
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              {/* Video URL & PDF Tool Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1 flex items-center gap-1 text-rose-400">
                    <Video className="w-3.5 h-3.5" />
                    <span>URL Video Capacitación (E-Learning)</span>
                  </label>
                  <input
                    type="url"
                    value={newCourseVideoUrl}
                    onChange={(e) => setNewCourseVideoUrl(e.target.value)}
                    placeholder="https://... o enlace de video"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1 flex items-center gap-1 text-blue-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Enlace Herramienta PDF / Manual</span>
                  </label>
                  <input
                    type="text"
                    value={newCoursePdfUrl}
                    onChange={(e) => setNewCoursePdfUrl(e.target.value)}
                    placeholder="https://... o nombre de archivo"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Título de la Herramienta PDF</label>
                <input
                  type="text"
                  value={newCoursePdfName}
                  onChange={(e) => setNewCoursePdfName(e.target.value)}
                  placeholder="Ej: Manual Técnico de Procedimientos Operativos"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-sm"
                >
                  Crear y Publicar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Curso (Admin) */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Editar Capacitación / Contenido E-Learning</span>
              </h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCourseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Título del Curso</label>
                <input
                  type="text"
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Categoría</label>
                  <input
                    type="text"
                    value={editingCourse.category}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Horas</label>
                  <input
                    type="number"
                    value={editingCourse.hours}
                    onChange={(e) => setEditingCourse({ ...editingCourse, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Instructor</label>
                  <input
                    type="text"
                    value={editingCourse.instructor || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Fecha</label>
                  <input
                    type="date"
                    value={editingCourse.startDate}
                    onChange={(e) => setEditingCourse({ ...editingCourse, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              {/* Video & PDF Resource fields */}
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1 flex items-center gap-1 text-rose-400">
                    <Video className="w-3.5 h-3.5" />
                    <span>URL Video del Curso (YouTube / MP4 / Vimeo)</span>
                  </label>
                  <input
                    type="text"
                    value={editingCourse.videoUrl || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/... o enlace"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1 flex items-center gap-1 text-blue-400">
                      <FileText className="w-3.5 h-3.5" />
                      <span>URL Documento / PDF</span>
                    </label>
                    <input
                      type="text"
                      value={editingCourse.pdfUrl || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, pdfUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Nombre Herramienta</label>
                    <input
                      type="text"
                      value={editingCourse.pdfName || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, pdfName: e.target.value })}
                      placeholder="Manual Operativo"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-sm"
                >
                  Guardar Cambios del Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reproductor de Video E-Learning */}
      {activeVideoModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <Play className="w-4 h-4 fill-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeVideoModalCourse.title}</h3>
                  <p className="text-xs text-zinc-400">
                    Módulo audiovisual · {activeVideoModalCourse.category} ({activeVideoModalCourse.hours}hs)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveVideoModalCourse(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-zinc-950">
              <div className="aspect-video w-full rounded-xl bg-zinc-900 overflow-hidden border border-zinc-800 flex flex-col items-center justify-center relative">
                {activeVideoModalCourse.videoUrl && activeVideoModalCourse.videoUrl.includes('embed') ? (
                  <iframe
                    src={activeVideoModalCourse.videoUrl}
                    title={activeVideoModalCourse.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                      <Play className="w-8 h-8 fill-rose-400 ml-1" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white">Video de Capacitación Técnica</h4>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                        {activeVideoModalCourse.videoUrl
                          ? `Reproduciendo contenido desde enlace configurado.`
                          : 'Material audiovisual demostrativo interactivo para formación de personal en planta y normas de seguridad.'}
                      </p>
                    </div>
                    {activeVideoModalCourse.videoUrl && (
                      <a
                        href={activeVideoModalCourse.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir Video en Pestaña Externa
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Tools attached */}
              <div className="mt-4 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-zinc-300 font-medium">
                    {activeVideoModalCourse.pdfName || 'Manual de Estudio y Herramientas del Curso (PDF)'}
                  </span>
                </div>
                <a
                  href={activeVideoModalCourse.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Material PDF
                </a>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setActiveVideoModalCourse(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
              >
                Cerrar Reproductor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
