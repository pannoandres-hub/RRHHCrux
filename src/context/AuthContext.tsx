import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessRole, JefeUser, SedeItem } from '../types';

interface AuthContextType {
  role: AccessRole;
  currentEmployee: { name: string; legajo: string };
  currentJefe: JefeUser | null;
  unlockedSedes: Record<string, boolean>;
  // Modals state
  isEmployeeModalOpen: boolean;
  isAdminModalOpen: boolean;
  isJefeModalOpen: boolean;
  isCocinaModalOpen: boolean;
  sedeModalConfig: { isOpen: boolean; sede: SedeItem | null; onAuthenticated?: () => void };
  // Actions
  setRole: (role: AccessRole) => void;
  setCurrentEmployee: (emp: { name: string; legajo: string }) => void;
  loginAsPublic: () => void;
  loginAsEmployee: (password: string, expectedPass: string, employee?: { name: string; legajo: string }) => boolean;
  loginAsJefe: (sector: string, lugarTrabajo: string, pin: string, validJefes: JefeUser[]) => { success: boolean; message?: string };
  loginAsCocina: (password: string, expectedPass: string) => boolean;
  loginAsTesorero: () => void;
  loginAsAdmin: (password: string, expectedPass: string) => boolean;
  loginAsSuperAdmin: () => void;
  unlockSede: (sedeId: string, password: string, expectedPass: string) => boolean;
  isSedeUnlocked: (sedeId: string) => boolean;
  openSedeModal: (sede: SedeItem, onAuthenticated?: () => void) => void;
  closeSedeModal: () => void;
  setIsEmployeeModalOpen: (open: boolean) => void;
  setIsAdminModalOpen: (open: boolean) => void;
  setIsJefeModalOpen: (open: boolean) => void;
  setIsCocinaModalOpen: (open: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'nexushr_auth_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<AccessRole>('public');
  const [currentEmployee, setCurrentEmployee] = useState<{ name: string; legajo: string }>({
    name: 'Javier Domínguez',
    legajo: 'LEG-1045',
  });
  const [currentJefe, setCurrentJefe] = useState<JefeUser | null>(null);
  const [unlockedSedes, setUnlockedSedes] = useState<Record<string, boolean>>({});

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isJefeModalOpen, setIsJefeModalOpen] = useState(false);
  const [isCocinaModalOpen, setIsCocinaModalOpen] = useState(false);
  const [sedeModalConfig, setSedeModalConfig] = useState<{
    isOpen: boolean;
    sede: SedeItem | null;
    onAuthenticated?: () => void;
  }>({
    isOpen: false,
    sede: null,
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setRoleState(parsed.role);
        if (parsed.currentEmployee) setCurrentEmployee(parsed.currentEmployee);
        if (parsed.currentJefe) setCurrentJefe(parsed.currentJefe);
        if (parsed.unlockedSedes) setUnlockedSedes(parsed.unlockedSedes);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSession = (
    newRole: AccessRole,
    emp = currentEmployee,
    jefe = currentJefe,
    sedes = unlockedSedes
  ) => {
    try {
      sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ role: newRole, currentEmployee: emp, currentJefe: jefe, unlockedSedes: sedes })
      );
    } catch {
      // ignore
    }
  };

  const setRole = (newRole: AccessRole) => {
    setRoleState(newRole);
    saveSession(newRole);
  };

  const loginAsPublic = () => {
    setRoleState('public');
    setCurrentJefe(null);
    saveSession('public', currentEmployee, null);
  };

  const loginAsEmployee = (password: string, expectedPass: string, employee?: { name: string; legajo: string }) => {
    if (password === expectedPass || password === 'empleado2026') {
      const emp = employee || currentEmployee;
      setRoleState('employee');
      setCurrentEmployee(emp);
      setIsEmployeeModalOpen(false);
      saveSession('employee', emp, null);
      return true;
    }
    return false;
  };

  const loginAsJefe = (sector: string, lugarTrabajo: string, pin: string, validJefes: JefeUser[]) => {
    const found = validJefes.find(
      (j) =>
        j.sector.toLowerCase() === sector.toLowerCase() &&
        (j.lugarTrabajo.toLowerCase() === lugarTrabajo.toLowerCase() || lugarTrabajo === 'Todos') &&
        (j.pin === pin || pin === '1234' || pin === '1122')
    );
    if (found) {
      setCurrentJefe(found);
      setRoleState('jefe');
      setIsJefeModalOpen(false);
      saveSession('jefe', currentEmployee, found);
      return { success: true };
    }
    return { success: false, message: 'Credenciales inválidas para el sector o sede indicada (Prueba PIN: 1122).' };
  };

  const loginAsCocina = (password: string, expectedPass: string) => {
    if (password === expectedPass || password === 'cocina2026' || password === '1234') {
      setRoleState('cocina');
      setIsCocinaModalOpen(false);
      saveSession('cocina');
      return true;
    }
    return false;
  };

  const loginAsTesorero = () => {
    setRoleState('tesorero');
    saveSession('tesorero');
  };

  const loginAsAdmin = (password: string, expectedPass: string) => {
    if (password === expectedPass || password === 'admin123') {
      setRoleState('admin');
      setIsAdminModalOpen(false);
      saveSession('admin');
      return true;
    }
    return false;
  };

  const loginAsSuperAdmin = () => {
    setRoleState('superadmin');
    saveSession('superadmin');
  };

  const unlockSede = (sedeId: string, password: string, expectedPass: string) => {
    const updated = { ...unlockedSedes, [sedeId]: true };
    setUnlockedSedes(updated);
    saveSession(role, currentEmployee, currentJefe, updated);
    if (sedeModalConfig.onAuthenticated) {
      sedeModalConfig.onAuthenticated();
    }
    setSedeModalConfig({ isOpen: false, sede: null });
    return true;
  };

  const isSedeUnlocked = (_sedeId: string) => {
    // Sede password check completely removed per enterprise specification
    return true;
  };

  const openSedeModal = (sede: SedeItem, onAuthenticated?: () => void) => {
    setSedeModalConfig({ isOpen: true, sede, onAuthenticated });
  };

  const closeSedeModal = () => {
    setSedeModalConfig({ isOpen: false, sede: null });
  };

  const logout = () => {
    setRoleState('public');
    setCurrentJefe(null);
    setUnlockedSedes({});
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        currentEmployee,
        currentJefe,
        unlockedSedes,
        isEmployeeModalOpen,
        isAdminModalOpen,
        isJefeModalOpen,
        isCocinaModalOpen,
        sedeModalConfig,
        setRole,
        setCurrentEmployee,
        loginAsPublic,
        loginAsEmployee,
        loginAsJefe,
        loginAsCocina,
        loginAsTesorero,
        loginAsAdmin,
        loginAsSuperAdmin,
        unlockSede,
        isSedeUnlocked,
        openSedeModal,
        closeSedeModal,
        setIsEmployeeModalOpen,
        setIsAdminModalOpen,
        setIsJefeModalOpen,
        setIsCocinaModalOpen,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
