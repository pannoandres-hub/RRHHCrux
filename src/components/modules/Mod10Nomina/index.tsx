import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useTenant } from '../../../context/TenantContext';
import { useAuth } from '../../../context/AuthContext';
import { EmployeeProfile, NominaFieldDef } from '../../../types';
import {
  Users,
  UserPlus,
  UserX,
  Search,
  Filter,
  Backpack,
  AlertTriangle,
  Calendar,
  Building2,
  MapPin,
  Briefcase,
  FileCheck2,
  CheckCircle2,
  Mail,
  X,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Printer,
  Download,
  Upload,
  Edit2,
  Sliders,
  Plus,
  Trash2,
  FileSpreadsheet,
  HelpCircle,
  Clock,
} from 'lucide-react';

export const Mod10Nomina: React.FC = () => {
  const {
    activeTenant,
    tenantData,
    hireEmployee,
    terminateEmployee,
    updateEmployee,
    updateNominaCustomFields,
    updateTenantData,
    addNotificationAlert,
  } = useTenant();
  const { role, currentJefe } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'nomina' | 'demografia' | 'bajas' | 'kits' | 'alertas'>('nomina');
  const [probationDaysFilter, setProbationDaysFilter] = useState<number>(90);
  const [demoSectorFilter, setDemoSectorFilter] = useState<string>('Todos');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('Todos');
  const [sedeFilter, setSedeFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modals state
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFieldsConfigModalOpen, setIsFieldsConfigModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [selectedEmpForDetail, setSelectedEmpForDetail] = useState<EmployeeProfile | null>(null);
  const [selectedEmpForTermination, setSelectedEmpForTermination] = useState<EmployeeProfile | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);

  // Alta mode: 'nuevo_legajo' or 'cubrir_vacante'
  const [altaMode, setAltaMode] = useState<'nuevo_legajo' | 'cubrir_vacante'>('nuevo_legajo');
  const [selectedVacantPositionId, setSelectedVacantPositionId] = useState('');

  // Form State: Alta
  const [newLegajo, setNewLegajo] = useState('');
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCargo, setNewCargo] = useState('');
  const [newArea, setNewArea] = useState(activeTenant.masterDropdowns.areas[0] || 'Producción & Mantenimiento');
  const [newRazonSocial, setNewRazonSocial] = useState(activeTenant.masterDropdowns.razonesSociales[0] || 'Nexus Industrial S.A.');
  const [newLugarTrabajo, setNewLugarTrabajo] = useState(activeTenant.sedes[0]?.name || 'Planta Industrial Pilar');
  const [newCuil, setNewCuil] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newDniExpiry, setNewDniExpiry] = useState('2029-05-10');
  const [newHireDate, setNewHireDate] = useState('2026-10-15');
  const [newContractType, setNewContractType] = useState<EmployeeProfile['contractType']>('Tiempo Indeterminado');
  const [newBirthDate, setNewBirthDate] = useState('1994-08-15');
  const [newNationality, setNewNationality] = useState('Argentina');
  const [newGender, setNewGender] = useState<EmployeeProfile['gender']>('Masculino');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newZipCode, setNewZipCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newChildrenList, setNewChildrenList] = useState<{ id: string; name: string; birthDate: string }[]>([]);
  const [childTempName, setChildTempName] = useState('');
  const [childTempBirth, setChildTempBirth] = useState('');

  // Form State: Baja
  const [termDate, setTermDate] = useState('2026-10-31');
  const [termReason, setTermReason] = useState('Renuncia voluntaria');
  const [termVacancyOption, setTermVacancyOption] = useState<'Vacante Activa' | 'Vacante Suspendida'>('Vacante Activa');

  // Form State: Editar Legajo / Ficha
  const [editLegajo, setEditLegajo] = useState('');
  const [editName, setEditName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editRazonSocial, setEditRazonSocial] = useState('');
  const [editLugarTrabajo, setEditLugarTrabajo] = useState('');
  const [editCuil, setEditCuil] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editDniExpiry, setEditDniExpiry] = useState('');
  const [editHireDate, setEditHireDate] = useState('');
  const [editContractType, setEditContractType] = useState<EmployeeProfile['contractType']>('Tiempo Indeterminado');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCustomFields, setEditCustomFields] = useState<Record<string, any>>({});

  // Custom Fields config state
  const defaultFields: NominaFieldDef[] = [
    { id: 'field-children', key: 'children', label: 'Hijos / Asignación Familiar', type: 'boolean', visible: true, isStandard: true },
    { id: 'field-cuil', key: 'cuil', label: 'CUIL', type: 'text', visible: true, isStandard: true },
    { id: 'field-dni', key: 'dni', label: 'DNI / Identificación', type: 'text', visible: true, isStandard: true },
    { id: 'field-titulo', key: 'tituloProfesional', label: 'Título Profesional / Universitario', type: 'text', visible: true, isStandard: false },
    { id: 'field-penales', key: 'antecedentesPenales', label: 'Certificado Antecedentes Penales (RNR)', type: 'boolean', visible: true, isStandard: false },
    { id: 'field-obraSocial', key: 'obraSocial', label: 'Obra Social / Prepaga', type: 'text', visible: true, isStandard: false },
    { id: 'field-talleUniforme', key: 'talleUniforme', label: 'Talle de Indumentaria / Calzado', type: 'text', visible: false, isStandard: false },
  ];
  const customFieldsConfig = activeTenant.nominaCustomFields && activeTenant.nominaCustomFields.length > 0
    ? activeTenant.nominaCustomFields
    : defaultFields;

  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState('');
  const [newCustomFieldType, setNewCustomFieldType] = useState<'text' | 'boolean' | 'date' | 'number'>('text');

  // Kit Escolar Config State
  const [kitCutoffDate, setKitCutoffDate] = useState('2026-06-30');
  const [kitMinAge, setKitMinAge] = useState<number>(2);
  const [kitMaxAge, setKitMaxAge] = useState<number>(17);

  // Delivered Kits tracking
  const [deliveredKits, setDeliveredKits] = useState<Record<string, boolean>>({});

  // DNI alert notification state
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('');

  // Employees filtering
  const allEmployees = tenantData.employees;

  const filteredEmployees = allEmployees.filter((emp) => {
    // If Jefe, filter to only their sector/workplace if configured
    if (role === 'jefe' && currentJefe) {
      if (emp.area !== currentJefe.sector && emp.lugarTrabajo !== currentJefe.lugarTrabajo) {
        return false;
      }
    }

    if (sectorFilter !== 'Todos' && emp.area !== sectorFilter) return false;
    if (sedeFilter !== 'Todas' && emp.lugarTrabajo !== sedeFilter) return false;
    if (statusFilter !== 'Todos' && emp.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${emp.name} ${emp.lastName}`.toLowerCase().includes(q);
      const matchLegajo = emp.legajo.toLowerCase().includes(q);
      const matchDni = emp.dni.includes(q);
      const matchCargo = emp.cargo.toLowerCase().includes(q);
      return matchName || matchLegajo || matchDni || matchCargo;
    }
    return true;
  });

  // Calculate headcount metrics
  const totalEmployeesCount = allEmployees.length;
  const activeCount = allEmployees.filter((e) => e.status === 'Activo').length;
  const vacantesActivasCount = allEmployees.filter((e) => e.status === 'Vacante Activa').length;
  const vacantesSuspendidasCount = allEmployees.filter((e) => e.status === 'Vacante Suspendida').length;

  // DNI Expiration calculations (reference date 2026-10-15)
  const todayMs = new Date('2026-10-15').getTime();
  const getDniStatus = (expiryDateStr: string) => {
    if (!expiryDateStr) return { status: 'ok', days: 999 };
    const expiryMs = new Date(expiryDateStr).getTime();
    const diffDays = Math.ceil((expiryMs - todayMs) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'vencido', days: diffDays };
    if (diffDays <= 15) return { status: 'critico', days: diffDays };
    if (diffDays <= 30) return { status: 'alerta', days: diffDays };
    if (diffDays <= 60) return { status: 'aviso', days: diffDays };
    return { status: 'ok', days: diffDays };
  };

  const employeesWithDniAlert = allEmployees.filter((emp) => {
    if (emp.status !== 'Activo') return false;
    const { status } = getDniStatus(emp.dniExpiryDate);
    return status !== 'ok';
  });

  // Kit Escolar Children calculations
  // Reference date: 30/06 of current year
  const cutoffDateObj = new Date(kitCutoffDate);
  const cutoffYear = cutoffDateObj.getFullYear();

  interface KitBeneficiary {
    childId: string;
    childName: string;
    birthDate: string;
    ageAtCutoff: number;
    parentName: string;
    parentLegajo: string;
    parentArea: string;
    parentLugar: string;
    parentEmail: string;
    category: 'Jardín de Infantes' | 'Primaria' | 'Secundaria' | 'Fuera de rango';
  }

  const kitBeneficiaries: KitBeneficiary[] = [];

  allEmployees
    .filter((e) => e.status === 'Activo' && e.children && e.children.length > 0)
    .forEach((parent) => {
      parent.children.forEach((child) => {
        const bDate = new Date(child.birthDate);
        let age = cutoffYear - bDate.getFullYear();
        const mDiff = cutoffDateObj.getMonth() - bDate.getMonth();
        if (mDiff < 0 || (mDiff === 0 && cutoffDateObj.getDate() < bDate.getDate())) {
          age--;
        }

        if (age >= kitMinAge && age <= kitMaxAge) {
          let category: KitBeneficiary['category'] = 'Fuera de rango';
          if (age >= 2 && age <= 5) category = 'Jardín de Infantes';
          else if (age >= 6 && age <= 12) category = 'Primaria';
          else if (age >= 13 && age <= 17) category = 'Secundaria';

          kitBeneficiaries.push({
            childId: child.id,
            childName: child.name,
            birthDate: child.birthDate,
            ageAtCutoff: age,
            parentName: `${parent.name} ${parent.lastName}`.trim(),
            parentLegajo: parent.legajo,
            parentArea: parent.area,
            parentLugar: parent.lugarTrabajo,
            parentEmail: parent.email,
            category,
          });
        }
      });
    });

  const jadinCount = kitBeneficiaries.filter((b) => b.category === 'Jardín de Infantes').length;
  const primariaCount = kitBeneficiaries.filter((b) => b.category === 'Primaria').length;
  const secundariaCount = kitBeneficiaries.filter((b) => b.category === 'Secundaria').length;

  // Handlers
  const handleAddChild = () => {
    if (!childTempName.trim() || !childTempBirth) return;
    setNewChildrenList([
      ...newChildrenList,
      { id: `ch-${Date.now()}`, name: childTempName.trim(), birthDate: childTempBirth },
    ]);
    setChildTempName('');
    setChildTempBirth('');
  };

  const handleRemoveChild = (id: string) => {
    setNewChildrenList(newChildrenList.filter((c) => c.id !== id));
  };

  const vacantEmployeesList = allEmployees.filter(
    (e) => e.status === 'Vacante Activa' || e.status === 'Vacante Suspendida'
  );

  const handleSelectVacancy = (vacantId: string) => {
    setSelectedVacantPositionId(vacantId);
    const target = vacantEmployeesList.find((v) => v.id === vacantId);
    if (target) {
      setNewLegajo(target.legajo);
      setNewCargo(target.cargo);
      setNewArea(target.area);
      setNewRazonSocial(target.razonSocial);
      setNewLugarTrabajo(target.lugarTrabajo);
    }
  };

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLegajo.trim() || !newName.trim() || !newLastName.trim()) {
      alert('Por favor completa los campos obligatorios (Legajo, Nombre, Apellido)');
      return;
    }

    if (altaMode === 'cubrir_vacante' && selectedVacantPositionId) {
      updateEmployee(selectedVacantPositionId, {
        legajo: newLegajo.trim(),
        name: newName.trim(),
        lastName: newLastName.trim(),
        cargo: newCargo.trim() || 'Colaborador',
        area: newArea,
        razonSocial: newRazonSocial,
        lugarTrabajo: newLugarTrabajo,
        cuil: newCuil.trim() || '20-00000000-0',
        dni: newDni.trim() || '00000000',
        dniExpiryDate: newDniExpiry,
        hireDate: newHireDate,
        contractType: newContractType,
        birthDate: newBirthDate,
        nationality: newNationality,
        gender: newGender,
        address: {
          street: newStreet.trim() || 'Calle Principal 123',
          city: newCity.trim() || 'Buenos Aires',
          district: newDistrict.trim() || 'Centro',
          zipCode: newZipCode.trim() || '1000',
        },
        phone: newPhone.trim() || '+54 11 0000-0000',
        email: newEmail.trim() || `${newLegajo.toLowerCase()}@empresa.com`,
        children: newChildrenList,
        status: 'Activo',
      });
      alert(`¡Puesto vacante cubierto con éxito! El colaborador ${newName} ${newLastName} ha sido asignado al legajo ${newLegajo}.`);
    } else {
      hireEmployee({
        legajo: newLegajo.trim(),
        name: newName.trim(),
        lastName: newLastName.trim(),
        cargo: newCargo.trim() || 'Colaborador',
        area: newArea,
        razonSocial: newRazonSocial,
        lugarTrabajo: newLugarTrabajo,
        cuil: newCuil.trim() || '20-00000000-0',
        dni: newDni.trim() || '00000000',
        dniExpiryDate: newDniExpiry,
        hireDate: newHireDate,
        contractType: newContractType,
        birthDate: newBirthDate,
        nationality: newNationality,
        gender: newGender,
        address: {
          street: newStreet.trim() || 'Calle Principal 123',
          city: newCity.trim() || 'Buenos Aires',
          district: newDistrict.trim() || 'Centro',
          zipCode: newZipCode.trim() || '1000',
        },
        phone: newPhone.trim() || '+54 11 0000-0000',
        email: newEmail.trim() || `${newLegajo.toLowerCase()}@empresa.com`,
        receiptPasscode: `REC-${newLegajo.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
        children: newChildrenList,
      });
      alert(`¡Colaborador ${newName} ${newLastName} dado de alta con éxito! Se sincronizó en Novedades de Liquidación, Legajos y Horarios.`);
    }

    setIsHireModalOpen(false);
    // Reset form
    setNewLegajo('');
    setNewName('');
    setNewLastName('');
    setNewCargo('');
    setSelectedVacantPositionId('');
    setAltaMode('nuevo_legajo');
    setNewChildrenList([]);
  };

  const handleOpenEditEmployee = (emp: EmployeeProfile) => {
    setEditingEmployee(emp);
    setEditLegajo(emp.legajo);
    setEditName(emp.name);
    setEditLastName(emp.lastName);
    setEditCargo(emp.cargo);
    setEditArea(emp.area);
    setEditRazonSocial(emp.razonSocial);
    setEditLugarTrabajo(emp.lugarTrabajo);
    setEditCuil(emp.cuil);
    setEditDni(emp.dni);
    setEditDniExpiry(emp.dniExpiryDate || '2029-05-10');
    setEditHireDate(emp.hireDate || '2026-10-15');
    setEditContractType(emp.contractType || 'Tiempo Indeterminado');
    setEditEmail(emp.email || '');
    setEditPhone(emp.phone || '');
    setEditCustomFields({ ...(emp.customFields || {}) });
    setIsEditModalOpen(true);
  };

  const handleSaveEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    updateEmployee(editingEmployee.id, {
      legajo: editLegajo.trim(),
      name: editName.trim(),
      lastName: editLastName.trim(),
      cargo: editCargo.trim(),
      area: editArea,
      razonSocial: editRazonSocial,
      lugarTrabajo: editLugarTrabajo,
      cuil: editCuil.trim(),
      dni: editDni.trim(),
      dniExpiryDate: editDniExpiry,
      hireDate: editHireDate,
      contractType: editContractType,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      customFields: editCustomFields,
    });

    setIsEditModalOpen(false);
    setEditingEmployee(null);
    alert(`¡Legajo ${editLegajo} actualizado con éxito! Los cambios se reflejaron automáticamente en Nómina, SAC, Legajos y Horarios.`);
  };

  // Custom fields handlers
  const handleToggleFieldVisible = (fieldId: string) => {
    const updated = customFieldsConfig.map((f) =>
      f.id === fieldId ? { ...f, visible: !f.visible } : f
    );
    updateNominaCustomFields(updated);
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomFieldLabel.trim()) return;

    const newKey = `custom_${Date.now()}`;
    const newField: NominaFieldDef = {
      id: `field-${Date.now()}`,
      key: newKey,
      label: newCustomFieldLabel.trim(),
      type: newCustomFieldType,
      visible: true,
      isStandard: false,
    };

    updateNominaCustomFields([...customFieldsConfig, newField]);
    setNewCustomFieldLabel('');
    alert(`¡Campo "${newField.label}" añadido a la nómina con éxito!`);
  };

  const handleRemoveCustomField = (fieldId: string) => {
    const target = customFieldsConfig.find((f) => f.id === fieldId);
    if (target?.isStandard) {
      alert('Los campos estándar del sistema no pueden eliminarse, pero puedes ocultarlos.');
      return;
    }
    const updated = customFieldsConfig.filter((f) => f.id !== fieldId);
    updateNominaCustomFields(updated);
  };

  // Excel / CSV Template Download
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const standardHeaders = [
      'Legajo',
      'Nombre',
      'Apellido',
      'Cargo',
      'Area',
      'RazonSocial',
      'LugarTrabajo',
      'CUIL',
      'DNI',
      'VencimientoDNI',
      'FechaIngreso',
      'TipoContrato',
      'Email',
      'Telefono',
    ];
    const customHeaders = customFieldsConfig
      .filter((f) => f.visible && !f.isStandard)
      .map((f) => f.label);
    const headers = [...standardHeaders, ...customHeaders];

    const sampleRow1 = [
      'LEG-2001',
      'Esteban',
      'Quinteros',
      'Supervisor de Planta',
      activeTenant.masterDropdowns.areas[0] || 'Producción & Mantenimiento',
      activeTenant.masterDropdowns.razonesSociales[0] || 'Nexus Industrial S.A.',
      activeTenant.sedes[0]?.name || 'Planta Industrial Pilar',
      '20-33445566-9',
      '33445566',
      '2030-12-31',
      '2026-10-01',
      'Tiempo Indeterminado',
      'esteban.q@empresa.com',
      '+54 11 5555-1234',
      ...customHeaders.map(() => 'Ingeniero Mecánico / Homologado'),
    ];

    const sampleRow2 = [
      'LEG-2002',
      'Lucía',
      'Méndez',
      'Analista de RRHH',
      'Recursos Humanos',
      activeTenant.masterDropdowns.razonesSociales[0] || 'Nexus Industrial S.A.',
      activeTenant.sedes[0]?.name || 'Planta Industrial Pilar',
      '27-38991122-4',
      '38991122',
      '2031-04-15',
      '2026-10-15',
      'Tiempo Indeterminado',
      'lucia.m@empresa.com',
      '+54 11 4444-9876',
      ...customHeaders.map(() => 'Lic. en Relaciones del Trabajo'),
    ];

    if (format === 'csv') {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'plantilla_nomina_personal.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Nomina');
      XLSX.writeFile(wb, 'plantilla_nomina_personal.xlsx');
    }
  };

  // Excel / CSV File Upload Parser
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('El archivo Excel subido está vacío o no tiene formato de tabla válido.');
          return;
        }

        const newEmployeesList: EmployeeProfile[] = data.map((row, idx) => {
          const legajo = String(row['Legajo'] || row['legajo'] || `LEG-${3000 + idx}`).trim();
          const name = String(row['Nombre'] || row['nombre'] || 'Colaborador').trim();
          const lastName = String(row['Apellido'] || row['apellido'] || '').trim();
          const cargo = String(row['Cargo'] || row['cargo'] || 'Operario').trim();
          const area = String(row['Area'] || row['Área'] || activeTenant.masterDropdowns.areas[0]).trim();
          const razonSocial = String(row['RazonSocial'] || row['Razón Social'] || activeTenant.masterDropdowns.razonesSociales[0]).trim();
          const lugarTrabajo = String(row['LugarTrabajo'] || row['Sede'] || activeTenant.sedes[0]?.name).trim();
          const cuil = String(row['CUIL'] || row['cuil'] || '20-00000000-0').trim();
          const dni = String(row['DNI'] || row['dni'] || '00000000').trim();
          const dniExpiryDate = String(row['VencimientoDNI'] || row['Vencimiento'] || '2029-12-31').trim();
          const hireDate = String(row['FechaIngreso'] || row['Ingreso'] || '2026-10-15').trim();

          // Extract custom fields values
          const customFieldsData: Record<string, any> = {};
          customFieldsConfig
            .filter((f) => !f.isStandard)
            .forEach((f) => {
              if (row[f.label] !== undefined) {
                customFieldsData[f.key] = row[f.label];
              }
            });

          return {
            id: `emp-import-${Date.now()}-${idx}`,
            legajo,
            name,
            lastName,
            cargo,
            area,
            razonSocial,
            lugarTrabajo,
            cuil,
            dni,
            dniExpiryDate,
            hireDate,
            probationEndDate: '2027-04-15',
            contractType: 'Tiempo Indeterminado',
            birthDate: '1995-01-01',
            nationality: 'Argentina',
            gender: 'Otro',
            address: {
              street: 'Dirección Registrada',
              city: 'Buenos Aires',
              district: 'Central',
              zipCode: '1000',
            },
            phone: String(row['Telefono'] || '+54 11 0000-0000'),
            email: String(row['Email'] || `${legajo.toLowerCase()}@empresa.com`),
            receiptPasscode: `REC-${legajo.replace(/[^0-9]/g, '') || '1045'}`,
            children: [],
            status: 'Activo',
            customFields: customFieldsData,
          };
        });

        updateTenantData({ employees: [...newEmployeesList, ...tenantData.employees] });
        setIsExcelImportModalOpen(false);
        alert(`¡Carga masiva completada exitosamente! Se importaron ${newEmployeesList.length} colaboradores a la nómina activa.`);
      } catch (err: any) {
        alert(`Error al procesar el archivo Excel: ${err?.message || 'Formato no compatible'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleOpenTerminate = (emp: EmployeeProfile) => {
    setSelectedEmpForTermination(emp);
    setIsTerminateModalOpen(true);
  };

  const handleTerminateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForTermination) return;

    terminateEmployee(
      selectedEmpForTermination.id,
      termDate,
      termReason,
      termVacancyOption
    );

    setIsTerminateModalOpen(false);
    setSelectedEmpForTermination(null);
    alert(
      `Baja procesada correctamente para el legajo ${selectedEmpForTermination.legajo}.\n` +
      `La posición ha quedado registrada como "${termVacancyOption}". Se aplicó la cascada automática en Novedades, Cumpleaños, Viandas y Turnos futuros.`
    );
  };

  const handleTriggerDniEmailAlert = () => {
    if (employeesWithDniAlert.length === 0) {
      alert('No hay DNI próximos a vencer en este momento.');
      return;
    }

    const recipient = activeTenant.branding.adminNotificationEmails || 'rrhh@empresa.com';
    const names = employeesWithDniAlert.map((e) => `${e.name} ${e.lastName} (Legajo ${e.legajo}, Vence ${e.dniExpiryDate})`).join(', ');

    addNotificationAlert({
      type: 'dni_expiry',
      title: `Vencimiento de DNI detectado (${employeesWithDniAlert.length} colaboradores)`,
      description: `Los siguientes colaboradores tienen DNI vencido o próximo a caducar: ${names}. Notificación automática despachada a ${recipient}.`,
      urgency: 'alta',
    });

    setAlertSuccessMsg(`¡Alerta automática despachada a ${recipient}! Se registró en la campana de notificaciones.`);
    setTimeout(() => setAlertSuccessMsg(''), 5000);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Módulo Exclusivo de Administración & RRHH</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          El módulo de Nómina de Personal y Bajas está estrictamente reservado a la Gerencia de Recursos Humanos y Administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {activeTenant.branding.moduleTitles.nomina || 'Nómina de Personal'}
            </h2>
            <p className="text-xs text-zinc-400">
              Gestión integral de colaboradores, altas, bajas con vacantes, kits escolares al 30/06 y alertas de DNI
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsHireModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Alta de Personal</span>
            </button>
            <button
              onClick={() => setIsFieldsConfigModalOpen(true)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Agregar o quitar campos de la nómina"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Campos Nómina</span>
            </button>
            <button
              onClick={() => setIsExcelImportModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cargar colaboradores masivamente con plantilla Excel o CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Carga Masiva Excel</span>
            </button>
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Descargar plantilla de Excel con especificación de columnas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla .xlsx</span>
            </button>
          </div>
        )}
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Dotación Total</div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{totalEmployeesCount}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Puestos y vacantes</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Colaboradores Activos</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{activeCount}</div>
          <div className="mt-1 text-[11px] text-emerald-500/80">Dotación en funciones</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Vacantes Activas</div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{vacantesActivasCount}</div>
          <div className="mt-1 text-[11px] text-amber-500/80">En proceso de selección</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Vacantes Suspendidas</div>
          <div className="mt-2 text-2xl font-bold text-zinc-400 font-mono">{vacantesSuspendidasCount}</div>
          <div className="mt-1 text-[11px] text-zinc-500">Puestos congelados</div>
        </div>

        <div
          onClick={() => setActiveTab('alertas')}
          className="bg-zinc-900/70 border border-red-500/30 hover:border-red-500/60 rounded-xl p-4 cursor-pointer transition-all col-span-2 sm:col-span-1"
        >
          <div className="text-[11px] text-red-400 font-medium uppercase tracking-wider flex items-center justify-between">
            <span>DNI por Vencer</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400 font-mono">{employeesWithDniAlert.length}</div>
          <div className="mt-1 text-[11px] text-red-300/80">Alertas automáticas</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('nomina')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'nomina'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Nómina Activa ({filteredEmployees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('demografia')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'demografia'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Demografía & Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('bajas')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'bajas'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <UserX className="w-3.5 h-3.5 text-rose-400" />
          <span>Bajas & Egresos ({allEmployees.filter((e) => e.status !== 'Activo').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kits')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'kits'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Backpack className="w-3.5 h-3.5 text-amber-400" />
          <span>Kits Escolares ({kitBeneficiaries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alertas')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'alertas'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>Alertas de DNI ({employeesWithDniAlert.length})</span>
        </button>
      </div>

      {/* TAB 1: TABLA PRINCIPAL DE NÓMINA */}
      {activeTab === 'nomina' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por legajo, nombre, DNI o cargo..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                <option value="Todos">Sector: Todos</option>
                {activeTenant.masterDropdowns.areas.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={sedeFilter}
                onChange={(e) => setSedeFilter(e.target.value)}
                className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                <option value="Todas">Lugar: Todos</option>
                {activeTenant.sedes.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Activo">Activos</option>
                <option value="Vacante Activa">Vacantes Activas</option>
                <option value="Vacante Suspendida">Vacantes Suspendidas</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Legajo</th>
                    <th className="px-4 py-3">Colaborador / Puesto</th>
                    <th className="px-4 py-3">Cargo & Área</th>
                    <th className="px-4 py-3">Razón Social & Lugar</th>
                    <th className="px-4 py-3">DNI & Vencimiento</th>
                    <th className="px-4 py-3">Ingreso</th>
                    {customFieldsConfig
                      .filter((f) => f.visible && !f.isStandard)
                      .map((f) => (
                        <th key={f.id} className="px-4 py-3 text-zinc-300">
                          {f.label}
                        </th>
                      ))}
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {filteredEmployees.map((emp) => {
                    const isVacant = emp.status.startsWith('Vacante');
                    const { status: dniStatus, days: dniDays } = getDniStatus(emp.dniExpiryDate);

                    return (
                      <tr key={emp.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-zinc-300">
                          {emp.legajo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {emp.photoUrl && !isVacant ? (
                              <img
                                src={emp.photoUrl}
                                alt={emp.name}
                                className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-[10px] shrink-0">
                                {isVacant ? 'VAC' : emp.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className={`font-semibold ${isVacant ? 'text-amber-400' : 'text-white'}`}>
                                {isVacant ? emp.status : `${emp.name} ${emp.lastName}`}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                {isVacant ? 'Posición disponible' : `CUIL: ${emp.cuil}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-zinc-200 font-medium">{emp.cargo}</div>
                          <div className="text-[11px] text-zinc-400">{emp.area}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-zinc-300">{emp.razonSocial}</div>
                          <div className="text-[11px] text-zinc-500">{emp.lugarTrabajo}</div>
                        </td>
                        <td className="px-4 py-3">
                          {isVacant ? (
                            <span className="text-zinc-500">—</span>
                          ) : (
                            <div>
                              <div className="text-zinc-200 font-mono">{emp.dni}</div>
                              <div className="text-[11px] flex items-center gap-1 mt-0.5">
                                {dniStatus === 'vencido' && (
                                  <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                                    Vencido ({emp.dniExpiryDate})
                                  </span>
                                )}
                                {dniStatus === 'critico' && (
                                  <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px] font-medium border border-red-500/30">
                                    Vence en {dniDays} días
                                  </span>
                                )}
                                {dniStatus === 'alerta' && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-medium border border-amber-500/30">
                                    Vence en {dniDays} días
                                  </span>
                                )}
                                {dniStatus === 'aviso' && (
                                  <span className="px-1.5 py-0.2 rounded bg-yellow-500/10 text-yellow-300 text-[10px]">
                                    Vence en {dniDays} días
                                  </span>
                                )}
                                {dniStatus === 'ok' && (
                                  <span className="text-zinc-500 text-[10px] font-mono">
                                    {emp.dniExpiryDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-400">
                          {emp.hireDate}
                        </td>
                        {customFieldsConfig
                          .filter((f) => f.visible && !f.isStandard)
                          .map((f) => (
                            <td key={f.id} className="px-4 py-3 text-zinc-300">
                              {emp.customFields?.[f.key] !== undefined
                                ? String(emp.customFields[f.key])
                                : '—'}
                            </td>
                          ))}
                        <td className="px-4 py-3">
                          {emp.status === 'Activo' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                              Activo
                            </span>
                          )}
                          {emp.status === 'Vacante Activa' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                              Vacante Activa
                            </span>
                          )}
                          {emp.status === 'Vacante Suspendida' && (
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold">
                              Suspendida
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenEditEmployee(emp)}
                                className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                title="Editar Legajo, Puesto y Datos de Nómina"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedEmpForDetail(emp)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                              title="Ver ficha completa"
                            >
                              Ficha
                            </button>
                            {isAdmin && emp.status === 'Activo' && (
                              <button
                                onClick={() => handleOpenTerminate(emp)}
                                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                title="Procesar baja con vacante"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Baja</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No se encontraron colaboradores ni vacantes para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KITS ESCOLARES (AL 30/06) */}
      {activeTab === 'kits' && (
        <div className="space-y-4">
          {/* Banner with rules info & parameterization */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Backpack className="w-4 h-4" />
                  <span>Reporte de Asignación de Kits Escolares</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Cálculo automático de hijos de colaboradores en edad escolar cumplida al <strong>30 de junio</strong>. Rango y edades 100% configurables por la empresa.
                </p>
              </div>

              {/* Age Bounds & Cutoff controls */}
              <div className="flex flex-wrap items-center gap-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Fecha de corte:</span>
                  <input
                    type="date"
                    value={kitCutoffDate}
                    onChange={(e) => setKitCutoffDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Edad Mínima:</span>
                  <input
                    type="number"
                    value={kitMinAge}
                    onChange={(e) => setKitMinAge(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-14 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Edad Máxima:</span>
                  <input
                    type="number"
                    value={kitMaxAge}
                    onChange={(e) => setKitMaxAge(Number(e.target.value))}
                    min={11}
                    max={25}
                    className="w-14 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Category summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Kits a Entregar</div>
                <div className="text-xl font-bold text-white font-mono mt-1">{kitBeneficiaries.length}</div>
                <div className="text-[11px] text-zinc-500">Beneficiarios globales</div>
              </div>

              <div className="bg-zinc-950/60 border border-pink-500/30 rounded-lg p-3">
                <div className="text-[10px] text-pink-400 uppercase font-semibold">Jardín de Infantes (2 a 5 años)</div>
                <div className="text-xl font-bold text-pink-400 font-mono mt-1">{jadinCount}</div>
                <div className="text-[11px] text-zinc-500">Mochila, pintores, crayones</div>
              </div>

              <div className="bg-zinc-950/60 border border-blue-500/30 rounded-lg p-3">
                <div className="text-[10px] text-blue-400 uppercase font-semibold">Primaria (6 a 12 años)</div>
                <div className="text-xl font-bold text-blue-400 font-mono mt-1">{primariaCount}</div>
                <div className="text-[11px] text-zinc-500">Cuadernos, cartucheras, útiles</div>
              </div>

              <div className="bg-zinc-950/60 border border-purple-500/30 rounded-lg p-3">
                <div className="text-[10px] text-purple-400 uppercase font-semibold">Secundaria (13 a 17 años)</div>
                <div className="text-xl font-bold text-purple-400 font-mono mt-1">{secundariaCount}</div>
                <div className="text-[11px] text-zinc-500">Carpetas, calculadora, blocks</div>
              </div>
            </div>
          </div>

          {/* Beneficiaries Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Padrón Oficial de Beneficiarios al {kitCutoffDate}
              </span>
              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Planilla</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Hijo / Beneficiario</th>
                    <th className="px-4 py-3">Nacimiento & Edad</th>
                    <th className="px-4 py-3">Categoría de Kit</th>
                    <th className="px-4 py-3">Titular (Colaborador)</th>
                    <th className="px-4 py-3">Legajo & Área</th>
                    <th className="px-4 py-3">Sede de Entrega</th>
                    <th className="px-4 py-3 text-center">Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {kitBeneficiaries.map((b) => {
                    const isDelivered = deliveredKits[b.childId] || false;
                    return (
                      <tr key={b.childId} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">
                          {b.childName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-zinc-300">{b.birthDate}</span>
                          <span className="ml-2 text-zinc-500 font-semibold">({b.ageAtCutoff} años)</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.category === 'Jardín de Infantes'
                                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                : b.category === 'Primaria'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {b.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-200 font-medium">
                          {b.parentName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-zinc-400">{b.parentLegajo}</div>
                          <div className="text-[11px] text-zinc-500">{b.parentArea}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {b.parentLugar}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setDeliveredKits({
                                ...deliveredKits,
                                [b.childId]: !isDelivered,
                              })
                            }
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                              isDelivered
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {isDelivered ? 'Entregado ✓' : 'Marcar entrega'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {kitBeneficiaries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No hay hijos registrados en edad escolar para el rango configurado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALERTAS DE DNI AUTOMÁTICAS */}
      {activeTab === 'alertas' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Control de Caducidad de Documentos de Identidad (DNI)</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Generación automática de alertas con despacho por correo a: <strong className="text-zinc-300 font-mono">{activeTenant.branding.adminNotificationEmails || 'rrhh@empresa.com'}</strong>
                </p>
              </div>

              <button
                onClick={handleTriggerDniEmailAlert}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Disparar Alerta & Auto-Email</span>
              </button>
            </div>

            {alertSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{alertSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-300">
              Colaboradores en Estado Crítico o Próximos a Vencer ({employeesWithDniAlert.length})
            </div>

            <div className="divide-y divide-zinc-800">
              {employeesWithDniAlert.map((emp) => {
                const { status, days } = getDniStatus(emp.dniExpiryDate);
                return (
                  <div key={emp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {emp.name} {emp.lastName} <span className="text-xs text-zinc-400 font-mono">({emp.legajo})</span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {emp.cargo} · {emp.area} · {emp.lugarTrabajo}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 font-mono">
                          DNI: {emp.dni} · Fecha de Vencimiento: <strong className="text-white">{emp.dniExpiryDate}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          status === 'vencido'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : status === 'critico'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {status === 'vencido' ? 'VENCIDO' : `Vence en ${days} días`}
                      </span>
                      <a
                        href={`mailto:${emp.email}?subject=Aviso Urgente: Renovación de DNI&body=Estimado/a ${emp.name}, le informamos que su DNI vencerá el ${emp.dniExpiryDate}. Por favor presente la constancia de renovación en RRHH.`}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
                        title="Enviar correo individual al colaborador"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {employeesWithDniAlert.length === 0 && (
                <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p>Todos los documentos de identidad (DNI) de la nómina se encuentran al día y vigentes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: DEMOGRAFÍA & MÉTRICAS DE PERSONAL */}
      {activeTab === 'demografia' && (() => {
        const activeList = allEmployees.filter((e) => e.status === 'Activo');
        const mothers = activeList.filter((e) => e.gender === 'Femenino' && e.children && e.children.length > 0);
        const fathers = activeList.filter((e) => e.gender === 'Masculino' && e.children && e.children.length > 0);
        const totalChildren = activeList.reduce((acc, curr) => acc + (curr.children?.length || 0), 0);
        
        const nowRef = new Date('2026-10-15');
        const totalTenureDays = activeList.reduce((acc, curr) => {
          if (!curr.hireDate) return acc;
          const diff = Math.max(0, nowRef.getTime() - new Date(curr.hireDate).getTime());
          return acc + Math.floor(diff / (1000 * 60 * 60 * 24));
        }, 0);
        const avgTenure = activeList.length > 0 ? (totalTenureDays / activeList.length / 365.25).toFixed(1) : '0';

        // Filtered probation employees
        const probationList = activeList.map((emp) => {
          const hireTime = new Date(emp.hireDate).getTime();
          const elapsed = Math.max(0, Math.floor((nowRef.getTime() - hireTime) / (1000 * 60 * 60 * 24)));
          const daysLeft = Math.max(0, probationDaysFilter - elapsed);
          const isUnder = elapsed <= probationDaysFilter;
          return { emp, elapsed, daysLeft, isUnder };
        }).filter((p) => {
          if (!p.isUnder) return false;
          if (demoSectorFilter !== 'Todos' && p.emp.area !== demoSectorFilter) return false;
          return true;
        });

        return (
          <div className="space-y-6">
            {/* Demographic Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-zinc-400">Madres en Nómina</div>
                <div className="text-2xl font-bold text-rose-400 font-mono">{mothers.length} colaboradoras</div>
                <div className="text-[11px] text-zinc-500">Beneficiarias de asignación familiar</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-zinc-400">Padres en Nómina</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">{fathers.length} colaboradores</div>
                <div className="text-[11px] text-zinc-500">Total hijos en padrón: {totalChildren}</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-zinc-400">Antigüedad Promedio</div>
                <div className="text-2xl font-bold text-amber-400 font-mono">{avgTenure} años</div>
                <div className="text-[11px] text-zinc-500">Estabilidad media del equipo activo</div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-1">
                <div className="text-xs text-zinc-400">Puestos en Vacancia</div>
                <div className="text-2xl font-bold text-white font-mono">{vacantesActivasCount + vacantesSuspendidasCount} puestos</div>
                <div className="text-[11px] text-zinc-400">
                  <span className="text-amber-400 font-semibold">{vacantesActivasCount} Activas</span> · {vacantesSuspendidasCount} Suspendidas
                </div>
              </div>
            </div>

            {/* Probation Period Countdown Dashboard */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Control y Cuenta Regresiva de Períodos de Prueba (Art. 92 Bis LCT)</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Monitorea los días restantes para efectivización o decisión antes del vencimiento formal del período de prueba.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span>Plazo de Prueba:</span>
                    <select
                      value={probationDaysFilter}
                      onChange={(e) => setProbationDaysFilter(parseInt(e.target.value, 10))}
                      className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200"
                    >
                      <option value={30}>Hito Inicial (30 días)</option>
                      <option value={90}>Estándar Legal (90 días / 3 meses)</option>
                      <option value={150}>Pre-cierre (150 días / 5 meses)</option>
                      <option value={180}>Convenio Especial (180 días / 6 meses)</option>
                    </select>
                  </div>

                  <select
                    value={demoSectorFilter}
                    onChange={(e) => setDemoSectorFilter(e.target.value)}
                    className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200"
                  >
                    <option value="Todos">Todos los sectores</option>
                    {activeTenant.masterDropdowns.areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-2 px-3">Colaborador</th>
                      <th className="py-2 px-3">Cargo</th>
                      <th className="py-2 px-3">Sector</th>
                      <th className="py-2 px-3">Fecha de Ingreso</th>
                      <th className="py-2 px-3">Días Transcurridos</th>
                      <th className="py-2 px-3">Cuenta Regresiva</th>
                      <th className="py-2 px-3">Estado Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {probationList.map(({ emp, elapsed, daysLeft }) => {
                      const isCritical = daysLeft <= 15;
                      return (
                        <tr key={emp.id} className="hover:bg-zinc-800/30">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{emp.name} {emp.lastName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{emp.legajo}</div>
                          </td>
                          <td className="py-3 px-3 text-zinc-300">{emp.cargo}</td>
                          <td className="py-3 px-3 text-zinc-400">{emp.area}</td>
                          <td className="py-3 px-3 font-mono text-zinc-300">{emp.hireDate}</td>
                          <td className="py-3 px-3 font-mono font-medium text-white">{elapsed} días</td>
                          <td className="py-3 px-3 font-mono font-bold">
                            <span className={isCritical ? 'text-rose-400 animate-pulse' : 'text-amber-300'}>
                              {daysLeft === 0 ? 'Plazo Cumplido' : `${daysLeft} días restantes`}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isCritical
                                  ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {isCritical ? 'Decisión Inmediata' : 'En Evaluación'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {probationList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-zinc-500">
                          No hay colaboradores en período de prueba para el rango seleccionado ({probationDaysFilter} días).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB: BAJAS & EGRESOS */}
      {activeTab === 'bajas' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span>Registro de Bajas, Egresos y Puestos Vacantes</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Histórico de desvinculaciones, renuncias y estados de vacante para reemplazo o cobertura.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2.5 px-3">Legajo & Puesto</th>
                    <th className="py-2.5 px-3">Colaborador Anterior</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3">Sede</th>
                    <th className="py-2.5 px-3">Estado de Vacante</th>
                    <th className="py-2.5 px-3">Liquidación Final</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {allEmployees
                    .filter((e) => e.status !== 'Activo')
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-zinc-800/30">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{emp.cargo}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{emp.legajo}</div>
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {emp.name} {emp.lastName}
                        </td>
                        <td className="py-3 px-3 text-zinc-400">{emp.area}</td>
                        <td className="py-3 px-3 text-zinc-400">{emp.lugarTrabajo}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              emp.status === 'Vacante Activa'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : emp.status === 'Vacante Suspendida'
                                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-emerald-400 font-mono">
                          ✓ Transferido a SAC
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedVacantPositionId(emp.id);
                              setAltaMode('cubrir_vacante');
                              setNewLegajo(emp.legajo);
                              setNewCargo(emp.cargo);
                              setNewArea(emp.area);
                              setNewRazonSocial(emp.razonSocial);
                              setNewLugarTrabajo(emp.lugarTrabajo);
                              setIsHireModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-[11px] transition-colors"
                          >
                            Cubrir Vacante
                          </button>
                        </td>
                      </tr>
                    ))}

                  {allEmployees.filter((e) => e.status !== 'Activo').length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No hay registros de bajas o vacantes vacías en la nómina.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {isHireModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white">Alta de Nuevo Colaborador</h3>
              </div>
              <button
                onClick={() => setIsHireModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modalidad de Alta: Nuevo Legajo vs Cubrir Vacante */}
            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5">
              <span className="text-zinc-300 font-semibold block text-[11px]">Modalidad de Ingreso:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${altaMode === 'nuevo_legajo' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                  <input
                    type="radio"
                    name="altaMode"
                    checked={altaMode === 'nuevo_legajo'}
                    onChange={() => {
                      setAltaMode('nuevo_legajo');
                      setSelectedVacantPositionId('');
                    }}
                    className="accent-indigo-500 mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-xs text-white">Generar Nuevo Legajo</div>
                    <div className="text-[10px] text-zinc-400">Crear una nueva posición vacante y legajo</div>
                  </div>
                </label>
                <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${altaMode === 'cubrir_vacante' ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                  <input
                    type="radio"
                    name="altaMode"
                    checked={altaMode === 'cubrir_vacante'}
                    onChange={() => setAltaMode('cubrir_vacante')}
                    className="accent-amber-500 mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-xs text-amber-300">Cubrir Puesto Vacante Existente</div>
                    <div className="text-[10px] text-zinc-400">Asignar colaborador a vacante activa/suspendida</div>
                  </div>
                </label>
              </div>

              {altaMode === 'cubrir_vacante' && (
                <div className="pt-1.5 animate-in fade-in duration-150">
                  <label className="block text-zinc-300 font-medium mb-1">
                    Seleccionar Puesto Vacante a Cubrir ({vacantEmployeesList.length} disponibles):
                  </label>
                  {vacantEmployeesList.length > 0 ? (
                    <select
                      value={selectedVacantPositionId}
                      onChange={(e) => handleSelectVacancy(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-amber-500/60 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    >
                      <option value="">-- Elige la posición vacante a ocupar --</option>
                      {vacantEmployeesList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.legajo} · {v.cargo} ({v.area} - {v.lugarTrabajo}) [{v.status}]
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-amber-400 text-xs">
                      No hay vacantes activas o suspendidas en este momento. Selecciona "Generar Nuevo Legajo".
                    </p>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleHireSubmit} className="space-y-4 text-xs">
              {/* Sección 1: Datos Laborales Core */}
              <div>
                <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2">
                  1. Asignación Laboral & Puesto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Legajo *</label>
                    <input
                      type="text"
                      value={newLegajo}
                      onChange={(e) => setNewLegajo(e.target.value)}
                      placeholder="Ej. LEG-1200"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Cargo *</label>
                    <input
                      type="text"
                      value={newCargo}
                      onChange={(e) => setNewCargo(e.target.value)}
                      placeholder="Ej. Analista de Procesos"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Sector / Área</label>
                    <select
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                    >
                      {activeTenant.masterDropdowns.areas.map((s: string) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Razón Social</label>
                    <select
                      value={newRazonSocial}
                      onChange={(e) => setNewRazonSocial(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                    >
                      {activeTenant.masterDropdowns.razonesSociales.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Lugar de Trabajo / Sede</label>
                    <select
                      value={newLugarTrabajo}
                      onChange={(e) => setNewLugarTrabajo(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                    >
                      {activeTenant.sedes.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Tipo de Contratación</label>
                    <select
                      value={newContractType}
                      onChange={(e) => setNewContractType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                    >
                      <option value="Tiempo Indeterminado">Tiempo Indeterminado</option>
                      <option value="Plazo Fijo">Plazo Fijo</option>
                      <option value="Eventual">Eventual</option>
                      <option value="Pasantía">Pasantía</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Identidad y Fechas */}
              <div className="pt-3 border-t border-zinc-800">
                <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2">
                  2. Datos Personales & DNI
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">CUIL</label>
                    <input
                      type="text"
                      value={newCuil}
                      onChange={(e) => setNewCuil(e.target.value)}
                      placeholder="20-34567890-4"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Número de DNI</label>
                    <input
                      type="text"
                      value={newDni}
                      onChange={(e) => setNewDni(e.target.value)}
                      placeholder="34567890"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Vencimiento DNI</label>
                    <input
                      type="date"
                      value={newDniExpiry}
                      onChange={(e) => setNewDniExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={newHireDate}
                      onChange={(e) => setNewHireDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Contacto */}
              <div className="pt-3 border-t border-zinc-800">
                <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2">
                  3. Contacto & Domicilio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="empleado@empresa.com"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+54 11 5555-4444"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Calle y Altura</label>
                    <input
                      type="text"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="Av. Libertador 1200"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Hijos para Kit Escolar */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
                    4. Hijos a Cargo (Kits Escolares al 30/06)
                  </h4>
                  <span className="text-[10px] text-zinc-500">{newChildrenList.length} registrados</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={childTempName}
                    onChange={(e) => setChildTempName(e.target.value)}
                    placeholder="Nombre del hijo/a..."
                    className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <input
                    type="date"
                    value={childTempBirth}
                    onChange={(e) => setChildTempBirth(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-medium"
                  >
                    + Agregar
                  </button>
                </div>

                {newChildrenList.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                    {newChildrenList.map((ch) => (
                      <div key={ch.id} className="flex items-center justify-between text-[11px] p-1.5 bg-zinc-900 rounded">
                        <span className="text-white font-medium">{ch.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-400">{ch.birthDate}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(ch.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsHireModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Confirmar Alta de Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAJA DE PERSONAL */}
      {isTerminateModalOpen && selectedEmpForTermination && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-red-400">
                <UserX className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-white">Procesar Baja de Colaborador</h3>
              </div>
              <button
                onClick={() => setIsTerminateModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1 text-xs">
              <div className="text-white font-semibold text-sm">
                {selectedEmpForTermination.name} {selectedEmpForTermination.lastName}
              </div>
              <div className="text-zinc-400">
                Legajo: <strong className="text-zinc-200 font-mono">{selectedEmpForTermination.legajo}</strong> · {selectedEmpForTermination.cargo}
              </div>
              <div className="text-zinc-500 text-[11px]">
                {selectedEmpForTermination.area} · {selectedEmpForTermination.lugarTrabajo}
              </div>
            </div>

            <form onSubmit={handleTerminateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Fecha de Baja / Egreso</label>
                <input
                  type="date"
                  value={termDate}
                  onChange={(e) => setTermDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Motivo de Desvinculación</label>
                <select
                  value={termReason}
                  onChange={(e) => setTermReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                >
                  <option value="Renuncia voluntaria">Renuncia voluntaria</option>
                  <option value="Despido sin causa">Despido sin causa</option>
                  <option value="Despido con causa">Despido con causa</option>
                  <option value="Fin de contrato a plazo fijo">Fin de contrato a plazo fijo</option>
                  <option value="Mutuo acuerdo (Art. 241 LCT)">Mutuo acuerdo (Art. 241 LCT)</option>
                  <option value="Jubilación">Jubilación</option>
                </select>
              </div>

              {/* Vacancy choice requested explicitly */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Tratamiento del Puesto en Dotación
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-zinc-700 bg-zinc-800/40 cursor-pointer">
                    <input
                      type="radio"
                      name="vacancyOption"
                      checked={termVacancyOption === 'Vacante Activa'}
                      onChange={() => setTermVacancyOption('Vacante Activa')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-semibold text-white">Dejar como Vacante Activa</div>
                      <div className="text-[11px] text-zinc-400 leading-relaxed">
                        El puesto permanece abierto para reclutamiento inmediato en el ATS. Mantiene el conteo de dotación autorizada.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-zinc-700 bg-zinc-800/40 cursor-pointer">
                    <input
                      type="radio"
                      name="vacancyOption"
                      checked={termVacancyOption === 'Vacante Suspendida'}
                      onChange={() => setTermVacancyOption('Vacante Suspendida')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-semibold text-white">Dejar como Vacante Suspendida</div>
                      <div className="text-[11px] text-zinc-400 leading-relaxed">
                        El puesto queda congelado transitoriamente sin búsqueda activa.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cascade explanation callout */}
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300 leading-relaxed space-y-1">
                <div className="font-semibold text-red-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Cascada de Baja Automática:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-red-300/90 text-[10px]">
                  <li>Se elimina de Cumpleaños, Aniversarios, Viandas y Capacitaciones.</li>
                  <li>En Horarios: Se borran todos los turnos futuros a partir del {termDate}.</li>
                  <li>En Novedades: Se retira de la matriz principal y se envía al reporte oficial de Bajas.</li>
                  <li>Se preserva el acceso del usuario por <strong>3 meses</strong> para firmar recibos pendientes.</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTerminateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Confirmar Baja y Cascada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA COMPLETA DE COLABORADOR */}
      {selectedEmpForDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white">Ficha de Legajo</h3>
              </div>
              <button
                onClick={() => setSelectedEmpForDetail(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {selectedEmpForDetail.photoUrl ? (
                <img
                  src={selectedEmpForDetail.photoUrl}
                  alt={selectedEmpForDetail.name}
                  className="w-14 h-14 rounded-full object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-base">
                  {selectedEmpForDetail.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-base font-bold text-white">
                  {selectedEmpForDetail.name} {selectedEmpForDetail.lastName}
                </h4>
                <div className="text-xs text-indigo-400 font-mono font-semibold">
                  Legajo: {selectedEmpForDetail.legajo}
                </div>
                <div className="text-xs text-zinc-400">
                  {selectedEmpForDetail.cargo} · {selectedEmpForDetail.area}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 block text-[10px]">CUIL:</span>
                <span className="text-zinc-200 font-mono font-semibold">{selectedEmpForDetail.cuil}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">DNI:</span>
                <span className="text-zinc-200 font-mono">{selectedEmpForDetail.dni}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Vencimiento DNI:</span>
                <span className="text-zinc-200 font-mono">{selectedEmpForDetail.dniExpiryDate}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Fecha de Ingreso:</span>
                <span className="text-zinc-200 font-mono">{selectedEmpForDetail.hireDate}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Razón Social:</span>
                <span className="text-zinc-200">{selectedEmpForDetail.razonSocial}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Lugar de Trabajo:</span>
                <span className="text-zinc-200">{selectedEmpForDetail.lugarTrabajo}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Email:</span>
                <span className="text-zinc-200 truncate block">{selectedEmpForDetail.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Teléfono:</span>
                <span className="text-zinc-200">{selectedEmpForDetail.phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-500 block text-[10px]">Clave de Acceso a Recibos:</span>
                <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {selectedEmpForDetail.receiptPasscode}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEmpForDetail(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LEGAJO / COLABORADOR */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white">
                  Editar Legajo & Datos de Nómina · {editingEmployee.legajo}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEmployee} className="space-y-4">
              <div>
                <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2">
                  1. Datos Laborales & Puesto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Legajo *</label>
                    <input
                      type="text"
                      value={editLegajo}
                      onChange={(e) => setEditLegajo(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Cargo *</label>
                    <input
                      type="text"
                      value={editCargo}
                      onChange={(e) => setEditCargo(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Sector / Área</label>
                    <select
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    >
                      {activeTenant.masterDropdowns.areas.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Razón Social</label>
                    <select
                      value={editRazonSocial}
                      onChange={(e) => setEditRazonSocial(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    >
                      {activeTenant.masterDropdowns.razonesSociales.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Lugar de Trabajo / Sede</label>
                    <select
                      value={editLugarTrabajo}
                      onChange={(e) => setEditLugarTrabajo(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    >
                      {activeTenant.sedes.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2">
                  2. Identificación & Documentación Legal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">CUIL *</label>
                    <input
                      type="text"
                      value={editCuil}
                      onChange={(e) => setEditCuil(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">DNI *</label>
                    <input
                      type="text"
                      value={editDni}
                      onChange={(e) => setEditDni(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Vencimiento DNI</label>
                    <input
                      type="date"
                      value={editDniExpiry}
                      onChange={(e) => setEditDniExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={editHireDate}
                      onChange={(e) => setEditHireDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] mb-2">
                  3. Contacto & Campos Personalizados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Email Corporativo</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                {customFieldsConfig.filter((f) => !f.isStandard && f.visible).length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 mt-3 space-y-2">
                    <span className="text-[11px] font-semibold text-amber-400">Campos Adicionales de Empresa:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customFieldsConfig
                        .filter((f) => !f.isStandard && f.visible)
                        .map((f) => (
                          <div key={f.id}>
                            <label className="block text-zinc-400 mb-1">{f.label}</label>
                            <input
                              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                              value={editCustomFields[f.key] || ''}
                              onChange={(e) =>
                                setEditCustomFields({ ...editCustomFields, [f.key]: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                              placeholder={`Ingresar ${f.label.toLowerCase()}...`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-sm cursor-pointer"
                >
                  Guardar Cambios de Legajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURACIÓN DE CAMPOS DE NÓMINA (AGREGAR / QUITAR) */}
      {isFieldsConfigModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm text-white">
                  Configuración de Columnas & Campos de Nómina
                </h3>
              </div>
              <button
                onClick={() => setIsFieldsConfigModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed">
              Personaliza qué campos forman parte de la nómina de tu empresa. Puedes activar o desactivar columnas estándar (como Hijos o CUIL) y agregar campos personalizados según tu industria (Título, Antecedentes Penales, etc.).
            </p>

            {/* List of current fields */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {customFieldsConfig.map((field) => (
                <div
                  key={field.id}
                  className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{field.label}</span>
                      {field.isStandard && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          Estándar
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Tipo: {field.type} · Clave: {field.key}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFieldVisible(field.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                        field.visible
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {field.visible ? 'Visible en Tabla' : 'Oculto'}
                    </button>
                    {!field.isStandard && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="text-zinc-600 hover:text-red-400 p-1"
                        title="Eliminar campo personalizado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add new custom field */}
            <form onSubmit={handleAddCustomField} className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                + Agregar Nuevo Campo Personalizado
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Nombre / Etiqueta del Campo *</label>
                  <input
                    type="text"
                    value={newCustomFieldLabel}
                    onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                    placeholder="Ej. Título Profesional / RNR"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Tipo de Dato</label>
                  <select
                    value={newCustomFieldType}
                    onChange={(e) => setNewCustomFieldType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="text">Texto Libre</option>
                    <option value="boolean">Verdadero / Falso (Booleano)</option>
                    <option value="date">Fecha (YYYY-MM-DD)</option>
                    <option value="number">Numérico</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Incorporar Campo a la Nómina</span>
              </button>
            </form>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsFieldsConfigModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CARGA MASIVA DE NÓMINA DESDE EXCEL / CSV */}
      {isExcelImportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">
                  Carga Masiva de Nómina desde Excel (.xlsx) / CSV
                </h3>
              </div>
              <button
                onClick={() => setIsExcelImportModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Column Guide & Specifications */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <HelpCircle className="w-4 h-4" />
                <span>Guía Oficial de Columnas Requeridas por la Plataforma</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Para que el lector inteligente procese automáticamente tu archivo, la hoja de cálculo debe contener las siguientes columnas en su primera fila (encabezados):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                <div className="p-1.5 bg-zinc-900 rounded border border-emerald-500/30 text-emerald-300">
                  Legajo (Obligatorio)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-emerald-500/30 text-emerald-300">
                  Nombre (Obligatorio)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-emerald-500/30 text-emerald-300">
                  Apellido (Obligatorio)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  Cargo (Puesto)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  Area (Sector)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  RazonSocial (Empresa)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  LugarTrabajo (Sede)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  CUIL (20-XXXXXXXX-X)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  DNI (Número)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  VencimientoDNI (AAAA-MM-DD)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  FechaIngreso (AAAA-MM-DD)
                </div>
                <div className="p-1.5 bg-zinc-900 rounded border border-zinc-700 text-zinc-300">
                  Email & Telefono
                </div>
              </div>
              {customFieldsConfig.filter((f) => !f.isStandard && f.visible).length > 0 && (
                <div className="pt-2 text-[10px] text-zinc-400">
                  * Campos personalizados activos que también puedes incluir como columnas adicionales:{' '}
                  <strong className="text-white">
                    {customFieldsConfig
                      .filter((f) => !f.isStandard && f.visible)
                      .map((f) => f.label)
                      .join(', ')}
                  </strong>
                </div>
              )}
            </div>

            {/* Template Download Section */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white">¿No tienes el archivo armado?</h4>
                <p className="text-zinc-400 text-[11px]">
                  Descarga la plantilla con encabezados exactos y dos filas de ejemplo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Plantilla Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Upload Input Area */}
            <div className="p-6 bg-zinc-950/80 border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 rounded-xl text-center space-y-3 transition-colors">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
              <div>
                <h4 className="font-semibold text-white text-sm">Subir Archivo Excel o CSV</h4>
                <p className="text-[11px] text-zinc-400">
                  Soporta formatos estándar .xlsx, .xls y .csv
                </p>
              </div>
              <label className="inline-block px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer shadow-sm transition-colors">
                <span>Seleccionar Archivo de mi Equipo</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsExcelImportModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
