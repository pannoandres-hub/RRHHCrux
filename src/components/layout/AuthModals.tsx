import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Lock, Shield, KeyRound, MapPin, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthModals: React.FC = () => {
  const {
    isEmployeeModalOpen,
    setIsEmployeeModalOpen,
    isAdminModalOpen,
    setIsAdminModalOpen,
    isJefeModalOpen,
    setIsJefeModalOpen,
    isCocinaModalOpen,
    setIsCocinaModalOpen,
    sedeModalConfig,
    closeSedeModal,
    loginAsEmployee,
    loginAsAdmin,
    loginAsJefe,
    loginAsCocina,
    unlockSede,
    setCurrentEmployee,
  } = useAuth();

  const { activeTenant } = useTenant();

  // Cocina modal state
  const [cocinaPassword, setCocinaPassword] = useState('');
  const [cocinaError, setCocinaError] = useState('');

  // Employee modal local state
  const [empPassword, setEmpPassword] = useState('');
  const [empName, setEmpName] = useState('Javier Domínguez');
  const [empLegajo, setEmpLegajo] = useState('LEG-1045');
  const [empError, setEmpError] = useState('');

  // Admin modal local state
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Jefe modal local state
  const [jefeSector, setJefeSector] = useState(activeTenant.masterDropdowns.areas[0] || '');
  const [jefeLugar, setJefeLugar] = useState(activeTenant.sedes[0]?.name || '');
  const [jefePin, setJefePin] = useState('');
  const [jefeError, setJefeError] = useState('');

  // Sede modal local state
  const [sedePassword, setSedePassword] = useState('');
  const [sedeError, setSedeError] = useState('');

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');
    const success = loginAsEmployee(empPassword, activeTenant.employeePassword, {
      name: empName.trim() || 'Colaborador',
      legajo: empLegajo.trim() || 'LEG-0001',
    });
    if (!success) {
      setEmpError(`Contraseña de empleado incorrecta. (Prueba con: "${activeTenant.employeePassword}")`);
    } else {
      setEmpPassword('');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const success = loginAsAdmin(adminPassword, activeTenant.adminPassword);
    if (!success) {
      setAdminError(`Contraseña de administrador incorrecta. (Prueba con: "${activeTenant.adminPassword}")`);
    } else {
      setAdminPassword('');
    }
  };

  const handleJefeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJefeError('');
    const res = loginAsJefe(jefeSector, jefeLugar, jefePin, activeTenant.jefes);
    if (!res.success) {
      setJefeError(res.message || 'Error de autenticación. Verifica sector, sede o PIN (Prueba: PIN 1122 o 1234)');
    } else {
      setJefePin('');
    }
  };

  const handleCocinaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCocinaError('');
    const success = loginAsCocina(cocinaPassword, activeTenant.cocinaPassword || 'cocina2026');
    if (!success) {
      setCocinaError('Contraseña de Cocina incorrecta. (Prueba: "cocina2026" o "1234")');
    } else {
      setCocinaPassword('');
    }
  };

  const handleSedeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sedeModalConfig.sede) return;
    setSedeError('');
    const success = unlockSede(sedeModalConfig.sede.id, sedePassword, sedeModalConfig.sede.password);
    if (!success) {
      setSedeError(`Clave de sede incorrecta. (Prueba con: "${sedeModalConfig.sede.password}")`);
    } else {
      setSedePassword('');
    }
  };

  return (
    <>
      {/* 1. Modal Empleado */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Portal del Colaborador</h3>
                  <p className="text-xs text-zinc-400">Ingreso general con clave corporativa</p>
                </div>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tu Nombre Completo</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Ej. Javier Domínguez"
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">N° de Legajo</label>
                <input
                  type="text"
                  value={empLegajo}
                  onChange={(e) => setEmpLegajo(e.target.value)}
                  placeholder="Ej. LEG-1045"
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Contraseña Genérica de Empresa</label>
                  <span className="text-[11px] text-zinc-500 font-mono">Demo: {activeTenant.employeePassword}</span>
                </div>
                <input
                  type="password"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  placeholder="Introduce la clave de colaborador"
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  required
                />
              </div>

              {empError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{empError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  Ingresar a la Plataforma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Admin RRHH */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Consola de Administración RRHH</h3>
                  <p className="text-xs text-zinc-400">Acceso restringido para gestión y configuración</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminSubmit} className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Contraseña de Administrador</label>
                  <span className="text-[11px] text-amber-400/90 font-mono">Clave demo: {activeTenant.adminPassword}</span>
                </div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Introduce contraseña admin"
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                  required
                />
              </div>

              {adminError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  Acceder como Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Login Jefatura (Secundario) */}
      {isJefeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Portal de Jefatura & Firmas</h3>
                  <p className="text-xs text-zinc-400">Validación por Sector y Lugar de Trabajo</p>
                </div>
              </div>
              <button
                onClick={() => setIsJefeModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJefeSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Sector / Área</label>
                <select
                  value={jefeSector}
                  onChange={(e) => setJefeSector(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {activeTenant.masterDropdowns.areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Lugar de Trabajo / Sede</label>
                <select
                  value={jefeLugar}
                  onChange={(e) => setJefeLugar(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {activeTenant.masterDropdowns.lugaresTrabajo.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">PIN de Autorización de Jefe</label>
                  <span className="text-[11px] text-zinc-500 font-mono">PIN Demo: 1122 o 1234</span>
                </div>
                <input
                  type="password"
                  value={jefePin}
                  onChange={(e) => setJefePin(e.target.value)}
                  placeholder="Introduce PIN de 4 dígitos"
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              {jefeError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jefeError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsJefeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  Ingresar a Panel de Firma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Clave de Sede (Viandas y Horarios) */}
      {sedeModalConfig.isOpen && sedeModalConfig.sede && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{sedeModalConfig.sede.name}</h3>
                  <p className="text-xs text-zinc-400">Introduce la contraseña genérica de esta sede</p>
                </div>
              </div>
              <button
                onClick={closeSedeModal}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSedeSubmit} className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Contraseña de Ubicación</label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Clave demo: {sedeModalConfig.sede.password}
                  </span>
                </div>
                <input
                  type="password"
                  value={sedePassword}
                  onChange={(e) => setSedePassword(e.target.value)}
                  placeholder="Introduce clave de la sede"
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  required
                />
              </div>

              {sedeError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sedeError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeSedeModal}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  Desbloquear Sede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Cocina / Comedor */}
      {isCocinaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Acceso Cocina / Viandas</h3>
                  <p className="text-xs text-zinc-400">Panel operativo para personal de comedor y cocina</p>
                </div>
              </div>
              <button
                onClick={() => setIsCocinaModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCocinaSubmit} className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Contraseña de Cocina</label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Clave demo: cocina2026
                  </span>
                </div>
                <input
                  type="password"
                  value={cocinaPassword}
                  onChange={(e) => setCocinaPassword(e.target.value)}
                  placeholder="Introduce clave de cocina"
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                  required
                />
              </div>

              {cocinaError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cocinaError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCocinaModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  Ingresar a Cocina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
