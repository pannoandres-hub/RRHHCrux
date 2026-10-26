import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import {
  HeartHandshake,
  BarChart2,
  CheckCircle,
  Plus,
  Clock,
  TrendingUp,
  UserCheck,
  Send,
  Sparkles,
  Code2,
  Layers,
  FileText,
} from 'lucide-react';

export const Mod4Clima: React.FC = () => {
  const { activeTenant } = useTenant();
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [activeTab, setActiveTab] = useState<'borrador' | 'vista_previa'>('borrador');

  // Local draft state for user's future code insertion
  const [plans, setPlans] = useState([
    {
      id: 'plan-1',
      title: 'Taller de Liderazgo y Feedback Continuo para Mandos Medios',
      responsible: 'RRHH & Capacitación',
      deadline: '2026-11-30',
      status: 'En Progreso',
    },
    {
      id: 'plan-2',
      title: 'Adecuación Ergonómica de Puestos de Envasado en Planta',
      responsible: 'Seguridad & Higiene',
      deadline: '2026-12-15',
      status: 'Planificado',
    },
  ]);

  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanResp, setNewPlanResp] = useState('');
  const [newPlanDate, setNewPlanDate] = useState('2026-12-20');

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;
    setPlans([
      ...plans,
      {
        id: `plan-${Date.now()}`,
        title: newPlanTitle.trim(),
        responsible: newPlanResp.trim() || 'RRHH',
        deadline: newPlanDate,
        status: 'Planificado',
      },
    ]);
    setNewPlanTitle('');
    setNewPlanResp('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.clima || 'Clima Laboral & eNPS'}
            </h2>
            <p className="text-xs text-zinc-400">
              Módulo en modo contenedor reservado para la integración directa del código propio de encuestas y medición
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
          onClick={() => setActiveTab('borrador')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'borrador'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Especificación & Contenedor</span>
        </button>

        <button
          onClick={() => setActiveTab('vista_previa')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'vista_previa'
              ? 'bg-zinc-700 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Vista Previa de Métricas eNPS</span>
        </button>
      </div>

      {/* TAB 1: ESPECIFICACIÓN & CONTENEDOR */}
      {activeTab === 'borrador' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Contenedor Listo para Código Externo</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Tal como se acordó en los requerimientos iniciales, este módulo se mantiene en <strong>modo borrador estructurado</strong> a la espera de tu código propio de encuestas de clima, eNPS y análisis de sentimiento.
            </p>

            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 font-mono text-xs text-zinc-400 space-y-2">
              <div className="text-zinc-200 font-semibold">// Puntos de anclaje para tu componente:</div>
              <div className="text-emerald-400">{'<div id="nexushr-clima-mount-point" className="w-full">'}</div>
              <div className="pl-4 text-zinc-500">{'/* Inyecta aquí tu biblioteca de encuestas o iframe de medición */'}</div>
              <div className="text-emerald-400">{'</div>'}</div>
            </div>
          </div>

          {/* Action Plans Demo */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white">Planes de Acción Derivados de Clima</h3>
              <span className="text-xs text-zinc-500">{plans.length} iniciativas activas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plans.map((p) => (
                <div key={p.id} className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs space-y-1.5">
                  <div className="font-semibold text-white">{p.title}</div>
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>Responsable: <strong className="text-zinc-300">{p.responsible}</strong></span>
                    <span className="font-mono text-zinc-500">Límite: {p.deadline}</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] font-semibold">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>

            {isAdmin && (
              <form onSubmit={handleCreatePlan} className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="Nueva iniciativa de clima..."
                  className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={newPlanResp}
                  onChange={(e) => setNewPlanResp(e.target.value)}
                  placeholder="Responsable..."
                  className="w-36 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium shrink-0"
                >
                  + Agregar Iniciativa
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VISTA PREVIA */}
      {activeTab === 'vista_previa' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-400 font-medium uppercase">eNPS Global</div>
              <div className="mt-2 text-3xl font-bold text-rose-400 font-mono">+52</div>
              <div className="mt-1 text-[11px] text-emerald-400">Excelente fidelidad de colaboradores</div>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-400 font-medium uppercase">Tasa de Participación</div>
              <div className="mt-2 text-3xl font-bold text-white font-mono">87.4%</div>
              <div className="mt-1 text-[11px] text-zinc-500">142 de 162 colaboradores</div>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-400 font-medium uppercase">Dimensión Mejor Calificada</div>
              <div className="mt-2 text-lg font-bold text-emerald-400">Seguridad & Higiene</div>
              <div className="mt-1 text-[11px] text-zinc-500">4.8 / 5.0 puntos promedio</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
