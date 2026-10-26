import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTranslation } from '../../i18n/useTranslation';
import { LanguageCode } from '../../types';
import { NotificationsBell } from './NotificationsBell';
import {
  UserCheck,
  Shield,
  Building2,
  LogOut,
  KeyRound,
  Briefcase,
  Sparkles,
  Users,
  ChevronDown,
  Globe,
  Camera,
} from 'lucide-react';

interface NavbarProps {
  onSelectSuperAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectSuperAdmin }) => {
  const { role, setRole, currentEmployee, currentJefe, setIsEmployeeModalOpen, setIsAdminModalOpen, logout } = useAuth();
  const { activeTenant, tenants, switchTenant } = useTenant();
  const { currentLang, setLanguage } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone & Tenant Selector */}
        <div className="flex items-center gap-3 shrink-0">
          {(activeTenant.branding.headerLogoUrl || activeTenant.branding.logoUrl) ? (
            <img
              src={activeTenant.branding.headerLogoUrl || activeTenant.branding.logoUrl}
              alt={activeTenant.name}
              className="h-8 w-auto max-w-[140px] object-contain rounded"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              {activeTenant.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white leading-tight">
                {activeTenant.branding.name || activeTenant.name}
              </span>
              {tenants.length > 1 && (
                <select
                  value={activeTenant.id}
                  onChange={(e) => switchTenant(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700/80 text-[11px] text-zinc-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hidden sm:inline-block"
                  title="Cambiar empresa activa"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight hidden sm:inline">
              {activeTenant.branding.subtitle}
            </span>
          </div>
        </div>

        {/* Center / Fast Role Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setRole('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'admin'
                ? 'bg-amber-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin RRHH</span>
          </button>

          <button
            onClick={() => setRole('jefe')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'jefe'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Jefatura</span>
          </button>

          <button
            onClick={() => setRole('employee')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'employee'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Colaborador</span>
          </button>

          <button
            onClick={() => setRole('public')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'public'
                ? 'bg-zinc-700 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <span>Público ATS</span>
          </button>

          <button
            onClick={() => setRole('cocina')}
            title="Panel de Cocina & Viandas"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'cocina'
                ? 'bg-amber-600 text-white shadow'
                : 'text-amber-400/90 hover:text-amber-200 hover:bg-amber-950/40'
            }`}
          >
            <span>Cocina</span>
          </button>

          <button
            onClick={() => setRole('tesorero')}
            title="Panel de Tesorería & Cajas Chicas"
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'tesorero'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-400/90 hover:text-emerald-200 hover:bg-emerald-950/40'
            }`}
          >
            <span>Tesorero</span>
          </button>

          <button
            onClick={() => setRole('fichador')}
            title="Kiosco Fichador Sede (Terminal de tablet para fichar)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'fichador'
                ? 'bg-rose-600 text-white shadow'
                : 'text-rose-400/90 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kiosco Fichador</span>
          </button>
        </div>

        {/* Right Action Zone: Language Selector + Notifications Bell + Active Role + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Universal Language Selector */}
          <div className="relative flex items-center">
            <select
              value={currentLang}
              onChange={(e) => setLanguage(e.target.value as LanguageCode, role === 'admin')}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2 py-1 pr-6 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none font-medium"
              title="Seleccionar idioma"
            >
              <option value="es">🇪🇸 ES</option>
              <option value="en">🇬🇧 EN</option>
              <option value="it">🇮🇹 IT</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="de">🇩🇪 DE</option>
              <option value="zh">🇨🇳 中文</option>
            </select>
            <Globe className="w-3 h-3 text-zinc-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Notifications Bell with unread operational alerts */}
          <NotificationsBell />

          {/* Role badge mobile / current indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            {role === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
            {role === 'jefe' && <Briefcase className="w-3.5 h-3.5 text-cyan-400" />}
            {role === 'employee' && <UserCheck className="w-3.5 h-3.5 text-indigo-400" />}
            {role === 'fichador' && <Camera className="w-3.5 h-3.5 text-rose-400" />}
            {role === 'superadmin' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            <span className="font-semibold text-zinc-200 capitalize text-[11px]">
              {role === 'employee' ? currentEmployee.name.split(' ')[0] : role === 'fichador' ? 'Fichador Sede' : role}
            </span>
          </div>

          {/* Quick SuperAdmin Button */}
          {onSelectSuperAdmin && (
            <button
              onClick={onSelectSuperAdmin}
              title="SuperAdmin Multi-Tenant"
              className="p-1.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-purple-300 rounded-lg text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {role !== 'public' && (
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
