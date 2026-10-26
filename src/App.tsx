import React, { useState, useEffect } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { AuthModals } from './components/layout/AuthModals';

// Core modules
import { Mod1Cartelera } from './components/modules/Mod1Cartelera';
import { Mod2Viandas } from './components/modules/Mod2Viandas';
import { Mod3Horarios } from './components/modules/Mod3Horarios';
import { Mod4Clima } from './components/modules/Mod4Clima';
import { Mod5Documentos } from './components/modules/Mod5Documentos';
import { Mod6Capacitaciones } from './components/modules/Mod6Capacitaciones';
import { Mod7Onboarding } from './components/modules/Mod7Onboarding';
import { Mod8SAC } from './components/modules/Mod8SAC';
import { Mod9ATS } from './components/modules/Mod9ATS';
import { Mod10Nomina } from './components/modules/Mod10Nomina';
import { Mod11Legajos } from './components/modules/Mod11Legajos';
import { Mod12Vacaciones } from './components/modules/Mod12Vacaciones';
import { Mod13Recibos } from './components/modules/Mod13Recibos';
import { ModBranding } from './components/modules/ModBranding';
import { Mod10SuperAdmin } from './components/modules/Mod10SuperAdmin';
import { ModFichadas } from './components/modules/ModFichadas';
import { ModEvaluaciones } from './components/modules/ModEvaluaciones';
import { ModContabilidad } from './components/modules/ModContabilidad';
import { ModLiquidacion } from './components/modules/ModLiquidacion';
import { ModAgenteIA } from './components/modules/ModAgenteIA';
import { ModTareas } from './components/modules/ModTareas';
import { ModAlertas } from './components/modules/ModAlertas';

const MainApp: React.FC = () => {
  const { role } = useAuth();
  const { activeTenant } = useTenant();

  // If public, default to ATS (Portal de Empleos), otherwise default to cartelera
  const [activeModule, setActiveModule] = useState<string>(() => (role === 'public' ? 'ats' : 'cartelera'));

  useEffect(() => {
    if (role === 'public') {
      setActiveModule('ats');
    } else if (role === 'employee') {
      const allowed = [
        'cartelera',
        'fichadas',
        'horarios',
        'tareas',
        'alertas',
        'documentos',
        'evaluaciones',
        'capacitaciones',
        'vacaciones',
        'recibos',
        'viandas',
        'clima',
        'onboarding',
      ];
      if (!allowed.includes(activeModule)) {
        setActiveModule('cartelera');
      }
    } else if (role === 'cocina') {
      if (activeModule !== 'viandas' && activeModule !== 'cartelera') {
        setActiveModule('viandas');
      }
      const allowed = [
        'fichadas',
        'horarios',
        'tareas',
        'alertas',
        'evaluaciones',
        'contabilidad',
        'documentos',
        'viandas',
        'vacaciones',
        'capacitaciones',
        'nomina',
        'cartelera',
        'recibos',
      ];
      if (!allowed.includes(activeModule)) {
        setActiveModule('horarios');
      }
    } else if (role === 'fichador') {
      if (activeModule !== 'fichadas') {
        setActiveModule('fichadas');
      }
    }
  }, [role]);

  // Dynamic brand accents
  const getBrandTheme = () => {
    switch (activeTenant.branding.brandColor) {
      case 'cyan':
        return 'theme-cyan';
      case 'emerald':
        return 'theme-emerald';
      case 'amber':
        return 'theme-amber';
      case 'rose':
        return 'theme-rose';
      case 'violet':
        return 'theme-violet';
      case 'blue':
        return 'theme-blue';
      case 'indigo':
      default:
        return 'theme-indigo';
    }
  };

  // Dynamic typography font styles based on white-label branding
  const getFontFamilyStyle = () => {
    switch (activeTenant.branding.fontFamily) {
      case 'Outfit':
        return { fontFamily: "'Outfit', sans-serif" };
      case 'Manrope':
        return { fontFamily: "'Manrope', sans-serif" };
      case 'DM Sans':
        return { fontFamily: "'DM Sans', sans-serif" };
      case 'Plus Jakarta Sans':
      default:
        return { fontFamily: "'Plus Jakarta Sans', sans-serif" };
    }
  };

  const getFontSizeClass = () => {
    switch (activeTenant.branding.fontSizeScale) {
      case 'compact':
        return 'text-[13px]';
      case 'comfortable':
        return 'text-[16px]';
      case 'normal':
      default:
        return 'text-[14px]';
    }
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'cartelera':
        return <Mod1Cartelera />;
      case 'viandas':
        return <Mod2Viandas />;
      case 'horarios':
        return <Mod3Horarios />;
      case 'clima':
        return <Mod4Clima />;
      case 'documentos':
        return <Mod5Documentos />;
      case 'capacitaciones':
        return <Mod6Capacitaciones />;
      case 'onboarding':
        return <Mod7Onboarding />;
      case 'sac':
        return <Mod8SAC />;
      case 'ats':
        return <Mod9ATS />;
      case 'nomina':
        return <Mod10Nomina />;
      case 'legajos':
        return <Mod11Legajos />;
      case 'vacaciones':
        return <Mod12Vacaciones />;
      case 'recibos':
        return <Mod13Recibos />;
      case 'fichadas':
        return <ModFichadas />;
      case 'evaluaciones':
        return <ModEvaluaciones />;
      case 'contabilidad':
        return <ModContabilidad />;
      case 'liquidacion':
        return <ModLiquidacion />;
      case 'agente_ia':
        return <ModAgenteIA />;
      case 'tareas':
        return <ModTareas />;
      case 'alertas':
        return <ModAlertas />;
      case 'branding':
        return <ModBranding />;
      case 'superadmin':
        return <Mod10SuperAdmin />;
      default:
        return <Mod1Cartelera />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#0A0E17] text-zinc-100 ${getFontSizeClass()}`}
      style={getFontFamilyStyle()}
    >
      <Navbar onSelectSuperAdmin={() => setActiveModule('superadmin')} />

      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        <Sidebar activeModule={activeModule} onSelectModule={(mod) => setActiveModule(mod)} />

        <main className="flex-1 p-4 md:p-8 min-w-0 overflow-y-auto">
          {renderActiveModule()}
        </main>
      </div>

      <Footer onOpenSuperAdmin={() => setActiveModule('superadmin')} />
      <AuthModals />
    </div>
  );
};

export default function App() {
  return (
    <TenantProvider>
      <I18nProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </I18nProvider>
    </TenantProvider>
  );
}
