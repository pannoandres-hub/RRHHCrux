import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Compass,
  BookOpen,
  CheckSquare,
  Square,
  FileText,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Sparkles,
} from 'lucide-react';

interface LocalStage {
  id: string;
  title: string;
  daySpan: string;
  description: string;
  checklist: { id: string; label: string; completed: boolean }[];
}

interface LocalSOP {
  id: string;
  code: string;
  title: string;
  department: string;
  version: string;
  lastReview: string;
  fileSize: string;
  summary: string;
}

export const Mod7Onboarding: React.FC = () => {
  const { activeTenant } = useTenant();
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [activeTab, setActiveTab] = useState<'journey' | 'manuales'>('journey');
  const [selectedDept, setSelectedDept] = useState<string>('Todos');

  // Preview SOP Modal
  const [previewSOP, setPreviewSOP] = useState<LocalSOP | null>(null);

  const [stages, setStages] = useState<LocalStage[]>([
    {
      id: 'stg-1',
      title: 'Día 1: Bienvenida Institucional & Alta',
      daySpan: 'Día 1',
      description: 'Entrega de credenciales, uniforme de trabajo y recorrido por las instalaciones de planta.',
      checklist: [
        { id: 'chk-1', label: 'Firma de contrato laboral y alta AFIP', completed: true },
        { id: 'chk-2', label: 'Entrega de ropa de trabajo y botines con puntera', completed: true },
        { id: 'chk-3', label: 'Recorrido de seguridad y puntos de evacuación', completed: false },
      ],
    },
    {
      id: 'stg-2',
      title: 'Semana 1: Capacitación Inicial & Tutor Asignado',
      daySpan: 'Semana 1',
      description: 'Presentación del equipo de turno, asignación de mentor y lectura de procedimientos SOP.',
      checklist: [
        { id: 'chk-4', label: 'Charla de Buenas Prácticas de Manufactura (BPM)', completed: false },
        { id: 'chk-5', label: 'Habilitación de usuario en reloj biométrico', completed: true },
      ],
    },
  ]);

  const [sops] = useState<LocalSOP[]>([
    {
      id: 'sop-1',
      code: 'SOP-PROD-01',
      title: 'Protocolo de Seguridad en Línea Continua de Envasado',
      department: 'Producción & Mantenimiento',
      version: 'v3.2',
      lastReview: '2026-08-15',
      fileSize: '2.4 MB',
      summary: 'Normas de bloqueo de energía (LOTO), parada de emergencia y uso obligatorio de protección auditiva.',
    },
    {
      id: 'sop-2',
      code: 'SOP-CAL-04',
      title: 'Manual de Control de Calidad e Inocuidad Alimentaria',
      department: 'Calidad & Procesos',
      version: 'v2.0',
      lastReview: '2026-09-01',
      fileSize: '3.1 MB',
      summary: 'Muestreo por lotes, control de temperatura en cámaras y calibración de instrumentos.',
    },
  ]);

  const handleToggleChecklist = (stageId: string, checkId: string) => {
    setStages(
      stages.map((stg) => {
        if (stg.id === stageId) {
          return {
            ...stg,
            checklist: stg.checklist.map((c) => (c.id === checkId ? { ...c, completed: !c.completed } : c)),
          };
        }
        return stg;
      })
    );
  };

  const filteredSOPs = sops.filter((sop) => {
    if (selectedDept === 'Todos') return true;
    return sop.department === selectedDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.onboarding || 'Onboarding & Procesos SOP'}
            </h2>
            <p className="text-xs text-zinc-400">
              Módulo en modo contenedor reservado para la integración del roadmap de inducción y biblioteca de manuales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            <span>Modo Contenedor / Borrador</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('journey')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'journey'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Roadmap de Bienvenida</span>
        </button>

        <button
          onClick={() => setActiveTab('manuales')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'manuales'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Manuales y Procedimientos SOP</span>
        </button>
      </div>

      {/* TAB 1: JOURNEY */}
      {activeTab === 'journey' && (
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-1">
            <div className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Etapas de Inducción para Nuevos Ingresos</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Estructura modular lista para recibir tus flujos interactivos de bienvenida y capacitaciones de inducción.
            </p>
          </div>

          <div className="space-y-4">
            {stages.map((stg) => (
              <div key={stg.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h4 className="font-bold text-white text-sm">{stg.title}</h4>
                  <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono text-xs border border-teal-500/20">
                    {stg.daySpan}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{stg.description}</p>

                <div className="space-y-2 pt-1">
                  {stg.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(stg.id, item.id)}
                      className="flex items-center gap-2.5 p-2 bg-zinc-950 rounded-lg border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 text-xs"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                      <span className={item.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MANUALES SOP */}
      {activeTab === 'manuales' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Título del Procedimiento</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Versión</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredSOPs.map((sop) => (
                  <tr key={sop.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-teal-400">{sop.code}</td>
                    <td className="px-4 py-3 font-medium text-white">{sop.title}</td>
                    <td className="px-4 py-3 text-zinc-400">{sop.department}</td>
                    <td className="px-4 py-3 font-mono text-zinc-300">{sop.version}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setPreviewSOP(sop)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px]"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visor SOP Modal */}
      {previewSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="font-mono text-xs font-bold text-teal-400">{previewSOP.code}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{previewSOP.title}</h3>
              </div>
              <button onClick={() => setPreviewSOP(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <p className="text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800 leading-relaxed">
              {previewSOP.summary}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setPreviewSOP(null)} className="px-4 py-2 bg-zinc-800 text-white rounded">
                Cerrar
              </button>
              <button
                onClick={() => alert(`Descargando ${previewSOP.code}.pdf (${previewSOP.fileSize})`)}
                className="px-4 py-2 bg-teal-600 text-white rounded font-medium"
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
