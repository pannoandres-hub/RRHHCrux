import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Shield, Sparkles, RefreshCw, Check, FileText, Lock, X } from 'lucide-react';

interface FooterProps {
  onOpenSuperAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSuperAdmin }) => {
  const { setIsAdminModalOpen, role, loginAsSuperAdmin } = useAuth();
  const { activeTenant, resetDemoData } = useTenant();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [legalModal, setLegalModal] = useState<'terminos' | 'privacidad' | null>(null);

  const handleReset = () => {
    resetDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  const handleSuperAdminClick = () => {
    loginAsSuperAdmin();
    onOpenSuperAdmin();
  };

  return (
    <>
      <footer className="w-full bg-zinc-950 border-t border-zinc-900 px-4 py-3.5 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Organization and legal platform branding */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-center sm:text-left">
            {activeTenant.branding.footerLogoUrl && (
              <img
                src={activeTenant.branding.footerLogoUrl}
                alt="Footer Logo"
                className="h-6 w-auto object-contain rounded inline-block"
              />
            )}
            <span className="text-zinc-400 font-medium">
              <strong className="text-white font-bold tracking-tight">RRHHCrux</strong> © Todos los derechos reservados · Sistema integral de Recursos Humanos.
            </span>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <button
              onClick={() => setLegalModal('terminos')}
              className="text-zinc-500 hover:text-indigo-400 transition-colors cursor-pointer underline underline-offset-2"
            >
              Términos y Condiciones
            </button>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <button
              onClick={() => setLegalModal('privacidad')}
              className="text-zinc-500 hover:text-indigo-400 transition-colors cursor-pointer underline underline-offset-2"
            >
              Política de Privacidad
            </button>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Restaurar base de datos demo inicial"
            >
              {resetSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Datos demo restaurados</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Demo</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Persistent Admin and SuperAdmin Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Persistent Admin Button requested in all screens */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 hover:bg-amber-600 text-zinc-300 hover:text-zinc-950 border border-zinc-700 hover:border-amber-500'
              }`}
              title="Acceso Administración RRHH (disponible en todas las pantallas)"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Ingresar como Admin RRHH</span>
            </button>

            {/* SuperAdmin button */}
            <button
              onClick={handleSuperAdminClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                role === 'superadmin'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50'
                  : 'text-purple-400/80 hover:text-purple-200 hover:bg-purple-950/40 border border-purple-900/40'
              }`}
              title="Consola central multi-empresa y jerarquías"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>SuperAdmin</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                {legalModal === 'terminos' ? <FileText className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>
                  {legalModal === 'terminos'
                    ? 'Términos y Condiciones de Uso · RRHHCrux'
                    : 'Política de Privacidad y Seguridad de Datos · RRHHCrux'}
                </span>
              </div>
              <button
                onClick={() => setLegalModal(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
              {legalModal === 'terminos' ? (
                <>
                  <p>
                    <strong>1. Objeto y Alcance:</strong> RRHHCrux es un sistema integral de Recursos Humanos, asistencia biométrica, liquidación de haberes, gestión de nómina, viandas y autogestión de colaboradores, diseñado conforme a las normativas laborales vigentes de la República Argentina y convenios colectivos de trabajo aplicables.
                  </p>
                  <p>
                    <strong>2. Claves Individuales y Firma Digital:</strong> Cada colaborador, jefe y administrador es responsable de la confidencialidad de su contraseña individual. Las firmas ológrafas digitales estampadas en el sistema para solicitudes, recibos de sueldo y evaluaciones de desempeño poseen plena validez probatoria conforme a las facultades conferidas por las leyes aplicables.
                  </p>
                  <p>
                    <strong>3. Registro Biométrico en Kiosco:</strong> El fichaje de entrada y salida debe efectuarse exclusivamente desde el terminal habilitado en las instalaciones de la empresa mediante verificación de contraseña individual y captura fotográfica en vivo.
                  </p>
                  <p>
                    <strong>4. Disponibilidad y Responsabilidad:</strong> La plataforma garantiza alta disponibilidad y almacenamiento seguro de recibos firmados y legajos digitales con respaldo periódico.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Protección de Datos Personales (Ley 25.326):</strong> RRHHCrux resguarda los datos personales, biométricos, laborales y médicos de los colaboradores bajo estrictas medidas de seguridad técnica y organizativa.
                  </p>
                  <p>
                    <strong>2. Uso Exclusivo Laboral:</strong> La información almacenada se utiliza exclusivamente para fines de gestión laboral, liquidación de haberes, control de presentismo, asignación de uniformes y servicios de comedor.
                  </p>
                  <p>
                    <strong>3. Confidencialidad Médica:</strong> Los certificados médicos y números de siniestro de ART únicamente son accesibles por el área de Medicina Laboral y Recursos Humanos, preservando el secreto profesional.
                  </p>
                  <p>
                    <strong>4. Ejercicio de Derechos:</strong> Los colaboradores pueden consultar su legajo, historial de recibos y evaluaciones en cualquier momento desde su perfil individual.
                  </p>
                </>
              )}
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setLegalModal(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Entendido y Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
