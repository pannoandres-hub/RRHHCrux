import React, { useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { BrandingConfig, ModuleKey, JefeUser } from '../../../types';
import {
  Palette,
  Image,
  Type,
  Sliders,
  CheckCircle2,
  Sparkles,
  Save,
  Mail,
  Building,
  BellRing,
  Users,
  Edit2,
  Trash2,
  Plus,
  X,
  KeyRound,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

export const ModBranding: React.FC = () => {
  const { activeTenant, updateBranding, updateJefeUsers } = useTenant();
  const [successNotice, setSuccessNotice] = useState(false);

  // Tabs: Branding vs Jefes
  const [activeSection, setActiveSection] = useState<'branding' | 'jefes'>('branding');

  const defaultTitles: Record<ModuleKey, string> = {
    cartelera: 'Cartelera Digital',
    viandas: 'Viandas & Comedor',
    horarios: 'Horarios & Asistencia',
    clima: 'Clima Laboral & eNPS',
    documentos: 'Documentos & Uniformes',
    capacitaciones: 'Capacitaciones & Cursos',
    onboarding: 'Onboarding & Procesos SOP',
    sac: 'SAC · Novedades Liquidación',
    ats: 'ATS · Portal de Empleos',
    nomina: 'Nómina de Personal',
    legajos: 'Legajos Digitales',
    vacaciones: 'Vacaciones & Licencias',
    recibos: 'Recibos de Sueldo',
    fichadas: 'Fichadas Digitales',
    evaluaciones: 'Evaluaciones & Progreso',
    contabilidad: 'Facturas & Cajas Chicas',
    liquidacion: 'Motor Liquidación Sueldos',
    agente_ia: 'Agente IA Convenios & Leyes',
    tareas: 'Gestión de Tareas',
    alertas: 'Avisos & Procedimientos',
  };

  const [brandingForm, setBrandingForm] = useState<BrandingConfig>({
    ...activeTenant.branding,
    headerLogoUrl: activeTenant.branding.headerLogoUrl || activeTenant.branding.logoUrl || '',
    footerLogoUrl: activeTenant.branding.footerLogoUrl || '',
    bannerUrl: activeTenant.branding.bannerUrl || '',
    adminNotificationEmails:
      activeTenant.branding.adminNotificationEmails || 'rrhh@empresa.com, administracion@empresa.com',
    moduleTitles: {
      ...defaultTitles,
      ...activeTenant.branding.moduleTitles,
    },
    moduleCoverImages: activeTenant.branding.moduleCoverImages || {},
  });

  const handleModuleCoverImageChange = (key: ModuleKey, value: string) => {
    setBrandingForm((prev) => ({
      ...prev,
      moduleCoverImages: {
        ...(prev.moduleCoverImages || {}),
        [key]: value,
      },
    }));
  };

  // Jefes Management State (Req 8)
  const currentJefes: JefeUser[] = activeTenant.jefes || [
    {
      id: 'jefe-1',
      name: 'Carlos Varela',
      email: 'carlos.varela@arcor.com',
      lugarTrabajo: 'Planta Pilar',
      sector: 'Producción & Mantenimiento',
      pin: '1122',
    },
    {
      id: 'jefe-2',
      name: 'Silvia Morales',
      email: 'silvia.morales@arcor.com',
      lugarTrabajo: 'Molino San Luis',
      sector: 'Calidad & Procesos',
      pin: '1234',
    },
    {
      id: 'jefe-3',
      name: 'Gustavo Benítez',
      email: 'gustavo.benitez@arcor.com',
      lugarTrabajo: 'Centro Logístico Benavídez',
      sector: 'Logística & Distribución',
      pin: '4321',
    },
  ];

  const [jefesList, setJefesList] = useState<JefeUser[]>(currentJefes);
  const [isJefeModalOpen, setIsJefeModalOpen] = useState(false);
  const [editingJefeId, setEditingJefeId] = useState<string | null>(null);
  const [jefeName, setJefeName] = useState('');
  const [jefeEmail, setJefeEmail] = useState('');
  const [jefeSede, setJefeSede] = useState(activeTenant.sedes[0]?.name || 'Planta Pilar');
  const [jefeSector, setJefeSector] = useState(activeTenant.masterDropdowns.areas[0] || 'Producción');
  const [jefePin, setJefePin] = useState('1122');
  const [jefeNotice, setJefeNotice] = useState('');

  const handleModuleTitleChange = (key: ModuleKey, value: string) => {
    setBrandingForm((prev) => ({
      ...prev,
      moduleTitles: {
        ...prev.moduleTitles,
        [key]: value,
      },
    }));
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding(brandingForm);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 4000);
  };

  // Open Jefe Modal (Add or Edit)
  const handleOpenNewJefeModal = () => {
    setEditingJefeId(null);
    setJefeName('');
    setJefeEmail('');
    setJefeSede(activeTenant.sedes[0]?.name || 'Planta Pilar');
    setJefeSector(activeTenant.masterDropdowns.areas[0] || 'Producción');
    setJefePin('1122');
    setIsJefeModalOpen(true);
  };

  const handleOpenEditJefeModal = (jefe: JefeUser) => {
    setEditingJefeId(jefe.id);
    setJefeName(jefe.name);
    setJefeEmail(jefe.email);
    setJefeSede(jefe.lugarTrabajo);
    setJefeSector(jefe.sector);
    setJefePin(jefe.pin);
    setIsJefeModalOpen(true);
  };

  const handleSaveJefeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jefeName.trim() || !jefeEmail.trim() || !jefePin.trim()) return;

    let updated: JefeUser[];
    if (editingJefeId) {
      updated = jefesList.map((j) =>
        j.id === editingJefeId
          ? {
              ...j,
              name: jefeName.trim(),
              email: jefeEmail.trim(),
              lugarTrabajo: jefeSede,
              sector: jefeSector,
              pin: jefePin.trim(),
            }
          : j
      );
      setJefeNotice(`¡Usuario de jefatura ${jefeName} actualizado exitosamente!`);
    } else {
      const newJefe: JefeUser = {
        id: `jefe-${Date.now()}`,
        name: jefeName.trim(),
        email: jefeEmail.trim(),
        lugarTrabajo: jefeSede,
        sector: jefeSector,
        pin: jefePin.trim(),
      };
      updated = [newJefe, ...jefesList];
      setJefeNotice(`¡Nuevo usuario de jefatura ${jefeName} creado exitosamente!`);
    }

    setJefesList(updated);
    updateJefeUsers(updated);
    setIsJefeModalOpen(false);
    setTimeout(() => setJefeNotice(''), 4500);
  };

  const handleDeleteJefe = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este usuario de jefatura?')) {
      const updated = jefesList.filter((j) => j.id !== id);
      setJefesList(updated);
      updateJefeUsers(updated);
      setJefeNotice('Usuario de jefatura eliminado.');
      setTimeout(() => setJefeNotice(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Configuraciones Generales, Branding & Jefaturas
            </h2>
            <p className="text-xs text-zinc-400">
              Personaliza logos de header/footer, imágenes de portada, tipografía, paleta de colores y usuarios jefes para {activeTenant.name}
            </p>
          </div>
        </div>

        {successNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>¡Identidad visual aplicada exitosamente!</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSection('branding')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            activeSection === 'branding'
              ? 'bg-amber-600 text-zinc-950 shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Branding & Portadas</span>
        </button>

        <button
          onClick={() => setActiveSection('jefes')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
            activeSection === 'jefes'
              ? 'bg-cyan-600 text-white shadow-sm font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gestión de Usuarios Jefes ({jefesList.length})</span>
        </button>
      </div>

      {/* SECTION 1: BRANDING WHITE-LABEL */}
      {activeSection === 'branding' && (
        <form onSubmit={handleSaveBranding} className="space-y-6">
          {/* Section 1: Logos & Cover Banner */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-zinc-800 pb-2">
              <Image className="w-4 h-4 text-indigo-400" />
              <span>1. Logotipos Header / Footer e Imagen de Portada</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Nombre Comercial de la Empresa</label>
                <input
                  type="text"
                  value={brandingForm.name}
                  onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Subtítulo / Bajada Institucional</label>
                <input
                  type="text"
                  value={brandingForm.subtitle}
                  onChange={(e) => setBrandingForm({ ...brandingForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Logo Header & Logo Footer URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Logo en Header (Barra Superior) · PNG / SVG
                </label>
                <input
                  type="text"
                  value={brandingForm.headerLogoUrl || ''}
                  onChange={(e) =>
                    setBrandingForm({
                      ...brandingForm,
                      headerLogoUrl: e.target.value,
                      logoUrl: e.target.value,
                    })
                  }
                  placeholder="https://ejemplo.com/logo-header.png"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-[11px]"
                />
                {brandingForm.headerLogoUrl && (
                  <div className="mt-2 p-2 bg-zinc-950 rounded border border-zinc-800 flex items-center gap-3">
                    <img src={brandingForm.headerLogoUrl} alt="Header Preview" className="h-6 w-auto object-contain" />
                    <span className="text-[10px] text-emerald-400">Previsualización de Header</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Logo en Footer (Pie de Página) · PNG / SVG
                </label>
                <input
                  type="text"
                  value={brandingForm.footerLogoUrl || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, footerLogoUrl: e.target.value })}
                  placeholder="https://ejemplo.com/logo-footer.png"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-[11px]"
                />
                {brandingForm.footerLogoUrl && (
                  <div className="mt-2 p-2 bg-zinc-950 rounded border border-zinc-800 flex items-center gap-3">
                    <img src={brandingForm.footerLogoUrl} alt="Footer Preview" className="h-5 w-auto object-contain" />
                    <span className="text-[10px] text-emerald-400">Previsualización de Footer</span>
                  </div>
                )}
              </div>
            </div>

            {/* Imagen de Portada / Banner */}
            <div className="text-xs pt-1">
              <label className="block text-zinc-300 font-medium mb-1">
                Imagen de Portada / Banner de Fondo para Cartelera & Empleos
              </label>
              <input
                type="text"
                value={brandingForm.bannerUrl || ''}
                onChange={(e) => setBrandingForm({ ...brandingForm, bannerUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-[11px]"
              />
              {brandingForm.bannerUrl && (
                <div className="mt-2 relative h-24 rounded-lg overflow-hidden border border-zinc-700">
                  <img
                    src={brandingForm.bannerUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold text-xs">
                    Portada Activa
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Automated Alert Emails */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-zinc-800 pb-2">
              <Mail className="w-4 h-4 text-red-400" />
              <span>2. Correos para Alertas Automáticas (DNI, Firmas en Disconformidad, Recibos)</span>
            </div>
            <p className="text-xs text-zinc-400">
              Toda alerta generada por el sistema se dispara automáticamente a estos correos electrónicos. Puedes especificar múltiples direcciones separadas por comas.
            </p>

            <div>
              <label className="block text-zinc-300 font-medium text-xs mb-1">
                Emails Receptores de RRHH / Administración
              </label>
              <input
                type="text"
                value={brandingForm.adminNotificationEmails}
                onChange={(e) => setBrandingForm({ ...brandingForm, adminNotificationEmails: e.target.value })}
                placeholder="rrhh@empresa.com, personal@empresa.com, direccion@empresa.com"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Section 3: Typography, Font Size & Colors */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-zinc-800 pb-2">
              <Type className="w-4 h-4 text-emerald-400" />
              <span>3. Formato, Tipografía & Paleta Corporativa</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Familia Tipográfica</label>
                <select
                  value={brandingForm.fontFamily}
                  onChange={(e) => setBrandingForm({ ...brandingForm, fontFamily: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Corporativa Moderna)</option>
                  <option value="Outfit">Outfit (Geométrica Limpia)</option>
                  <option value="Manrope">Manrope (Estructurada B2B)</option>
                  <option value="DM Sans">DM Sans (Elegante & Legible)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Escala de Tamaño de Letra</label>
                <select
                  value={brandingForm.fontSizeScale}
                  onChange={(e) => setBrandingForm({ ...brandingForm, fontSizeScale: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
                >
                  <option value="compact">Compacta (Alta densidad para planta/operaciones)</option>
                  <option value="normal">Estándar (Equilibrada SaaS B2B)</option>
                  <option value="comfortable">Cómoda (Tipografía más amplia y accesible)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Color de Acento Corporativo</label>
                <select
                  value={brandingForm.brandColor}
                  onChange={(e) => setBrandingForm({ ...brandingForm, brandColor: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium"
                >
                  <option value="indigo">Índigo Tecnológico</option>
                  <option value="blue">Azul Corporativo</option>
                  <option value="cyan">Cian Vibrante</option>
                  <option value="emerald">Esmeralda Industrial</option>
                  <option value="amber">Ámbar Cítrico</option>
                  <option value="rose">Rosa / Magenta</option>
                  <option value="violet">Violeta Intenso</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Module Titles & Banner Covers */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>4. Título Personalizado & Portada / Banner de Cada Módulo</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Personaliza la denominación y la imagen de cabecera que verán los usuarios en cada módulo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {(Object.keys(defaultTitles) as ModuleKey[]).map((key) => {
                const coverUrl = brandingForm.moduleCoverImages?.[key] || '';
                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200 capitalize text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                        <span>{key}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Por defecto: {defaultTitles[key]}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Título Personalizado</label>
                      <input
                        type="text"
                        value={brandingForm.moduleTitles[key] || ''}
                        onChange={(e) => handleModuleTitleChange(key, e.target.value)}
                        placeholder={defaultTitles[key]}
                        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        URL de Imagen de Portada / Banner (Opcional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={coverUrl}
                          onChange={(e) => handleModuleCoverImageChange(key, e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs"
                        />
                        {coverUrl && (
                          <button
                            type="button"
                            onClick={() => handleModuleCoverImageChange(key, '')}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                            title="Quitar imagen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Cover Thumbnail Preview */}
                      {coverUrl && (
                        <div className="mt-2 h-16 w-full rounded-lg overflow-hidden border border-zinc-800 relative group">
                          <img
                            src={coverUrl}
                            alt={`Portada ${key}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-xs text-[9px] text-zinc-300 px-1.5 py-0.5 rounded">
                            Vista previa
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Guardar Configuraciones & Aplicar Branding
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: GESTIÓN DE USUARIOS JEFES (REQ 8) */}
      {activeSection === 'jefes' && (
        <div className="space-y-5">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Gestión de Usuarios Jefes y Supervisores de Sector</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Genera, edita y administra los nombres, emails, sedes asignadas y contraseñas/PINes de acceso para jefaturas.
              </p>
            </div>

            <button
              onClick={handleOpenNewJefeModal}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario Jefe</span>
            </button>
          </div>

          {jefeNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{jefeNotice}</span>
            </div>
          )}

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Nombre Completo</th>
                    <th className="px-4 py-3">Email Corporativo</th>
                    <th className="px-4 py-3">Sede / Lugar de Trabajo</th>
                    <th className="px-4 py-3">Sector / Área Supervisada</th>
                    <th className="px-4 py-3">Contraseña / PIN de Acceso</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {jefesList.map((j) => (
                    <tr key={j.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">{j.name}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{j.email}</td>
                      <td className="px-4 py-3 text-zinc-400">{j.lugarTrabajo}</td>
                      <td className="px-4 py-3 text-cyan-300 font-medium">{j.sector}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-300 font-bold">
                          {j.pin}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditJefeModal(j)}
                            className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                            title="Editar usuario jefe"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteJefe(j.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded cursor-pointer"
                            title="Eliminar usuario jefe"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jefesList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No hay usuarios jefes configurados. Haz clic en "Nuevo Usuario Jefe".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR JEFE (REQ 8) */}
      {isJefeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-sm text-white">
                  {editingJefeId ? 'Editar Usuario de Jefatura' : 'Nuevo Usuario de Jefatura'}
                </h3>
              </div>
              <button onClick={() => setIsJefeModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJefeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nombre y Apellido del Jefe *</label>
                <input
                  type="text"
                  value={jefeName}
                  onChange={(e) => setJefeName(e.target.value)}
                  placeholder="Ej. Carlos Varela"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Email Corporativo *</label>
                <input
                  type="email"
                  value={jefeEmail}
                  onChange={(e) => setJefeEmail(e.target.value)}
                  placeholder="carlos.varela@empresa.com"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Sede / Planta *</label>
                  <select
                    value={jefeSede}
                    onChange={(e) => setJefeSede(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {activeTenant.sedes.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Sector Supervisado *</label>
                  <select
                    value={jefeSector}
                    onChange={(e) => setJefeSector(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  >
                    {activeTenant.masterDropdowns.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  Contraseña / PIN de Acceso de Jefatura *
                </label>
                <input
                  type="text"
                  value={jefePin}
                  onChange={(e) => setJefePin(e.target.value)}
                  placeholder="Ej. 1122"
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-600/60 rounded-lg text-amber-300 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  PIN numérico o alfanumérico para iniciar sesión en "Acceso Jefatura".
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJefeModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {editingJefeId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
