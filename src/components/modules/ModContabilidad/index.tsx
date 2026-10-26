import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { SectorInvoice, PettyCashBox, PettyCashMovement } from '../../../types';
import {
  DollarSign,
  Receipt,
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Building,
  TrendingUp,
  ShieldCheck,
  Lock,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const ModContabilidad: React.FC = () => {
  const { role, currentJefe } = useAuth();
  const {
    activeTenant,
    tenantData,
    addSectorInvoice,
    deleteSectorInvoice,
    addPettyCashMovement,
    createPettyCashBox,
    updatePettyCashBox,
    deletePettyCashBox,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'facturas' | 'cajas_chicas' | 'admin_cajas'>('facturas');

  // Facturas State
  const [invoiceSector, setInvoiceSector] = useState<string>(
    role === 'jefe' ? currentJefe?.sector || 'Producción' : activeTenant.masterDropdowns.areas[0] || 'Producción'
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceCompany, setInvoiceCompany] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceAmount, setInvoiceAmount] = useState<string>('');
  const [invoiceDesc, setInvoiceDesc] = useState<string>('');
  const [invoiceFilterSector, setInvoiceFilterSector] = useState<string>('all');

  // Cajas Chicas State
  const [selectedBoxId, setSelectedBoxId] = useState<string>(
    tenantData.pettyCashBoxes?.[0]?.id || ''
  );
  const [movementType, setMovementType] = useState<'gasto' | 'reposicion'>('gasto');
  const [movementDate, setMovementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [movementCompany, setMovementCompany] = useState<string>('');
  const [movementNumber, setMovementNumber] = useState<string>('');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementDesc, setMovementDesc] = useState<string>('');

  // Admin Box Management State
  const [newBoxName, setNewBoxName] = useState<string>('');
  const [newBoxSector, setNewBoxSector] = useState<string>(activeTenant.masterDropdowns.areas[0] || 'Producción');
  const [newBoxReplenishers, setNewBoxReplenishers] = useState<string>('Tesorero, Gerente Administrativo');
  const [newBoxInitialLimit, setNewBoxInitialLimit] = useState<string>('150000');

  // Check if current user is authorized to replenish / change limits
  // Check if current user is authorized to manage cross-sector boxes and approve replenishments
  const isFinanceOfficer =
    role === 'admin' ||
    role === 'superadmin' ||
    role === 'tesorero' ||
    (role === 'jefe' &&
      currentJefe &&
      (currentJefe.sector.toLowerCase().includes('administración') ||
        currentJefe.sector.toLowerCase().includes('finanzas') ||
        currentJefe.sector.toLowerCase().includes('contab') ||
        currentJefe.sector.toLowerCase().includes('tesorería')));

  const isAuthorizedReplenisher = (box?: PettyCashBox) => {
    if (role === 'superadmin' || role === 'admin' || role === 'tesorero' || isFinanceOfficer) return true;
    if (role === 'jefe') {
      const allowed = box?.authorizedReplenishers || ['Tesorero', 'Gerente Administrativo', 'Jefe de Administración'];
      const jefeName = currentJefe?.name || '';
      const jefeSector = currentJefe?.sector || '';
      return allowed.some(
        (a) =>
          a.toLowerCase().includes('tesorero') ||
          a.toLowerCase().includes('admin') ||
          (jefeName && a.toLowerCase().includes(jefeName.toLowerCase())) ||
          (jefeSector && a.toLowerCase().includes(jefeSector.toLowerCase()))
      );
    }
    return false;
  };

  // Available Petty Cash Boxes:
  // If regular jefe: only their sector's boxes
  // If Finance Officer or Admin: all boxes
  const availableBoxes = (tenantData.pettyCashBoxes || []).filter((b) => {
    if (role === 'jefe' && !isFinanceOfficer && currentJefe) {
      return b.sector.toLowerCase() === currentJefe.sector.toLowerCase();
    }
    return true;
  });

  const currentBox = availableBoxes.find((b) => b.id === selectedBoxId) || availableBoxes[0];

  // Invoices:
  // If regular jefe: only their own invoices that they uploaded in their sector
  // If Finance Officer or Admin: all invoices with sector filter
  const invoices = tenantData.sectorInvoices || [];
  const filteredInvoices = invoices.filter((i) => {
    if (role === 'jefe' && !isFinanceOfficer && currentJefe) {
      if (i.sector.toLowerCase() !== currentJefe.sector.toLowerCase()) return false;
      if (i.createdBy !== currentJefe.name && !i.createdBy.toLowerCase().includes(currentJefe.name.toLowerCase())) {
        return false;
      }
    } else {
      if (invoiceFilterSector !== 'all' && i.sector !== invoiceFilterSector) return false;
    }
    return true;
  });

  const totalInvoiced = filteredInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const boxMovements = (tenantData.pettyCashMovements || []).filter((m) => m.boxId === currentBox?.id);

  // Approve replenishment handler for Finance Officer / Admin
  const handleApproveReplenishment = (box: PettyCashBox) => {
    const deficit = box.maxLimit - box.currentBalance;
    if (deficit <= 0) {
      alert(`La caja chica "${box.name}" ya cuenta con su saldo total completo ($${box.maxLimit.toLocaleString('es-AR')}).`);
      return;
    }

    updatePettyCashBox(box.id, { currentBalance: box.maxLimit });
    addPettyCashMovement({
      boxId: box.id,
      type: 'reposicion',
      date: new Date().toISOString().split('T')[0],
      companyName: 'Tesorería Central / Finanzas',
      invoiceNumber: `REP-${Date.now().toString().slice(-4)}`,
      amount: deficit,
      description: `Reposición de fondos aprobada por ${currentJefe ? currentJefe.name : 'Administración Contable'}`,
      createdBy: currentJefe ? currentJefe.name : 'Tesorería Central',
    });

    alert(`¡Reposición de $${deficit.toLocaleString('es-AR')} aprobada y acreditada con éxito en "${box.name}"!`);
  };

  // Handle invoice submission
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceCompany || !invoiceNumber || !invoiceAmount) {
      alert('Por favor completa todos los campos requeridos de la factura.');
      return;
    }

    addSectorInvoice({
      sector: role === 'jefe' && currentJefe ? currentJefe.sector : invoiceSector,
      date: invoiceDate,
      companyName: invoiceCompany,
      invoiceNumber,
      amount: Number(invoiceAmount),
      description: invoiceDesc.trim() || 'Comprobante de gasto operativo de sector',
      createdBy: role === 'jefe' ? (currentJefe?.name || 'Jefe de Sector') : 'Administración Contable',
    });

    setInvoiceCompany('');
    setInvoiceNumber('');
    setInvoiceAmount('');
    setInvoiceDesc('');
    alert('¡Factura registrada exitosamente en el control de gastos!');
  };

  // Handle petty cash movement submission
  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBox) return;

    if (movementType === 'reposicion' && !isAuthorizedReplenisher(currentBox)) {
      alert('Acceso restringido: Solo el área de Tesorería y mandos contables habilitados pueden autorizar reposiciones de fondos.');
      return;
    }

    if (!movementCompany || !movementNumber || !movementAmount) {
      alert('Completa la empresa, número de comprobante y monto.');
      return;
    }

    addPettyCashMovement({
      boxId: currentBox.id,
      type: movementType,
      date: movementDate,
      companyName: movementCompany,
      invoiceNumber: movementNumber,
      amount: Number(movementAmount),
      description: movementDesc.trim() || (movementType === 'reposicion' ? 'Reposición de fondos autorizada' : 'Gasto operativo menor'),
      createdBy: role === 'jefe' ? (currentJefe?.name || 'Jefe de Sector') : 'Tesorero Autorizado',
    });

    setMovementCompany('');
    setMovementNumber('');
    setMovementAmount('');
    setMovementDesc('');
    alert(movementType === 'reposicion' ? '¡Reposición de fondos asentada!' : '¡Gasto de caja chica registrado con éxito!');
  };

  // Admin Box Creation
  const handleCreateBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoxName) return;

    createPettyCashBox({
      name: newBoxName,
      sector: newBoxSector,
      assignedJefeIds: [],
      assignedUserIds: [],
      authorizedReplenishers: newBoxReplenishers.split(',').map((s) => s.trim()),
      currentBalance: Number(newBoxInitialLimit) || 100000,
      maxLimit: Number(newBoxInitialLimit) || 100000,
    });

    setNewBoxName('');
    alert(`Caja Chica "${newBoxName}" creada con éxito.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Gestión Presupuestaria & Cajas Chicas</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Registro contable de facturas de sector y administración descentralizada de fondos fijos con roles de reposición de tesorería.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('facturas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'facturas' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Facturas de Sector
          </button>
          <button
            onClick={() => setActiveTab('cajas_chicas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cajas_chicas' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cajas Chicas Operativas
          </button>
          {(role === 'admin' || role === 'superadmin') && (
            <button
              onClick={() => setActiveTab('admin_cajas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin_cajas' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Definir Cajas (Admin)
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: REGISTRO CONTABLE DE FACTURAS POR SECTOR */}
      {activeTab === 'facturas' && (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Total Gastos Asentados</span>
              <div className="text-xl font-bold text-white mt-1">
                ${totalInvoiced.toLocaleString('es-AR')}
              </div>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Comprobantes Cargados</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{filteredInvoices.length}</div>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Sectores con Registro</span>
              <div className="text-xl font-bold text-indigo-400 mt-1">
                {activeTenant.masterDropdowns.areas.length} áreas
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form to load an invoice */}
            <form
              onSubmit={handleCreateInvoice}
              className="lg:col-span-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Carga de Factura de Sector</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Ingreso directo de comprobantes por jefatura.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Sector / Área</label>
                <select
                  value={invoiceSector}
                  onChange={(e) => setInvoiceSector(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {activeTenant.masterDropdowns.areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Fecha de Factura</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Factura N°</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ej. B 0001-4455"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Empresa - Razón Social</label>
                <input
                  type="text"
                  value={invoiceCompany}
                  onChange={(e) => setInvoiceCompany(e.target.value)}
                  placeholder="Ej. Logística Sur S.A. o Distribuidora Técnica"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Monto Total ($)</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Descripción / Concepto del Gasto</label>
                <textarea
                  rows={2}
                  value={invoiceDesc}
                  onChange={(e) => setInvoiceDesc(e.target.value)}
                  placeholder="Insumos de línea, repuestos o herramientas operativas..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Factura</span>
              </button>
            </form>

            {/* Invoices Table */}
            <div className="lg:col-span-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">Registro de Comprobantes por Sector</h3>
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <select
                    value={invoiceFilterSector}
                    onChange={(e) => setInvoiceFilterSector(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="all">Todos los Sectores</option>
                    {activeTenant.masterDropdowns.areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-semibold">
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Sector</th>
                      <th className="py-2.5 px-3">Empresa / Razón Social</th>
                      <th className="py-2.5 px-3">Factura N°</th>
                      <th className="py-2.5 px-3 text-right">Monto</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          No se han asentado facturas en este sector aún.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-zinc-400">{inv.date}</td>
                          <td className="py-2.5 px-3 font-semibold text-zinc-300">{inv.sector}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{inv.companyName}</td>
                          <td className="py-2.5 px-3 font-mono text-indigo-400">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            ${inv.amount.toLocaleString('es-AR')}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[11px] max-w-[200px] truncate">
                            {inv.description}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => deleteSectorInvoice(inv.id)}
                              title="Eliminar comprobante"
                              className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAJAS CHICAS OPERATIVAS */}
      {activeTab === 'cajas_chicas' && (
        <div className="space-y-6">
          {/* Box Selector Bar */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Wallet className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs text-zinc-400">Caja Chica Seleccionada:</span>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="ml-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none cursor-pointer"
                >
                  {availableBoxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.sector}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {currentBox && (
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-right">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Saldo Disponible</span>
                  <span className="text-lg font-black text-emerald-400">
                    ${currentBox.currentBalance.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="pl-4 sm:pl-6 border-l border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Fondo Total Fijo</span>
                  <span className="text-sm font-bold text-zinc-300">
                    ${currentBox.maxLimit.toLocaleString('es-AR')}
                  </span>
                </div>

                {isFinanceOfficer && currentBox.currentBalance < currentBox.maxLimit && (
                  <button
                    type="button"
                    onClick={() => handleApproveReplenishment(currentBox)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobar Reposición (${(currentBox.maxLimit - currentBox.currentBalance).toLocaleString('es-AR')})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {currentBox ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Movement form */}
              <form
                onSubmit={handleCreateMovement}
                className="lg:col-span-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span>Cargar Movimiento en Caja Chica</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Rendición de tickets o reposición de fondos.</p>
                </div>

                {/* Type: Gasto vs Reposición */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Naturaleza del Movimiento</label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setMovementType('gasto')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        movementType === 'gasto'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Rendición Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('reposicion')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        movementType === 'reposicion'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Reposición Fondo
                    </button>
                  </div>
                </div>

                {/* Governance Warning for Reposición */}
                {movementType === 'reposicion' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gobernanza de Tesorería</span>
                    </div>
                    <div>
                      Autorizados para reponer: <strong>{currentBox.authorizedReplenishers?.join(', ')}</strong>.
                      El admin no altera los montos totales de la caja, sólo los cargos autorizados.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Fecha Comprobante</label>
                    <input
                      type="date"
                      value={movementDate}
                      onChange={(e) => setMovementDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Factura / Ticket N°</label>
                    <input
                      type="text"
                      value={movementNumber}
                      onChange={(e) => setMovementNumber(e.target.value)}
                      placeholder="Ej. T-B 0098"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Empresa - Razón Social</label>
                  <input
                    type="text"
                    value={movementCompany}
                    onChange={(e) => setMovementCompany(e.target.value)}
                    placeholder="Ej. Librería Central o Estación Servicio"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Monto ($)</label>
                  <input
                    type="number"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Descripción</label>
                  <input
                    type="text"
                    value={movementDesc}
                    onChange={(e) => setMovementDesc(e.target.value)}
                    placeholder="Detalle del gasto o reposición..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-white ${
                    movementType === 'reposicion'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{movementType === 'reposicion' ? 'Asentar Reposición' : 'Rendir Gasto de Caja'}</span>
                </button>
              </form>

              {/* Movements history in this box */}
              <div className="lg:col-span-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Movimientos de {currentBox.name}</h3>
                  <span className="text-[11px] font-mono text-zinc-400">{boxMovements.length} asientos</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-semibold">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Empresa / Razón Social</th>
                        <th className="py-2.5 px-3">Comprobante N°</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                        <th className="py-2.5 px-3">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {boxMovements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500">
                            No hay movimientos registrados en esta caja chica.
                          </td>
                        </tr>
                      ) : (
                        boxMovements.map((mov) => (
                          <tr key={mov.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-zinc-400">{mov.date}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  mov.type === 'reposicion'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {mov.type === 'reposicion' ? '+ Reposición' : '- Gasto'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-white font-medium">{mov.companyName}</td>
                            <td className="py-2.5 px-3 font-mono text-zinc-300">{mov.invoiceNumber}</td>
                            <td
                              className={`py-2.5 px-3 text-right font-mono font-bold ${
                                mov.type === 'reposicion' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {mov.type === 'reposicion' ? '+' : '-'}${mov.amount.toLocaleString('es-AR')}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400 text-[11px] max-w-[200px] truncate">
                              {mov.description}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              No hay cajas chicas creadas aún. Un Administrador puede crearlas en la pestaña "Definir Cajas".
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEFINICIÓN Y GOBERNANZA DE CAJAS CHICAS (ADMIN) */}
      {activeTab === 'admin_cajas' && (role === 'admin' || role === 'superadmin') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateBox}
            className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Crear Nueva Caja Chica de Sector</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                El admin nombra y asigna las cajas, pero las reposiciones y montos los gestionan los cargos habilitados.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Nombre de la Caja Chica</label>
              <input
                type="text"
                value={newBoxName}
                onChange={(e) => setNewBoxName(e.target.value)}
                placeholder="Ej. Caja Chica Planta Pacheco o Mantenimiento"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Sector Asignado</label>
              <select
                value={newBoxSector}
                onChange={(e) => setNewBoxSector(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {activeTenant.masterDropdowns.areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Cargos / Usuarios Habilitados para Reposición</label>
              <input
                type="text"
                value={newBoxReplenishers}
                onChange={(e) => setNewBoxReplenishers(e.target.value)}
                placeholder="Ej. Tesorero, Gerente Administrativo..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Separados por coma.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Tope Máximo Inicial ($)</label>
              <input
                type="number"
                value={newBoxInitialLimit}
                onChange={(e) => setNewBoxInitialLimit(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Caja Chica</span>
            </button>
          </form>

          {/* Existing boxes list */}
          <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Cajas Chicas Activas ({tenantData.pettyCashBoxes?.length || 0})</h3>
            <div className="space-y-3">
              {(tenantData.pettyCashBoxes || []).map((b) => (
                <div
                  key={b.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white">{b.name}</div>
                    <div className="text-[11px] text-zinc-400">Sector: {b.sector}</div>
                    <div className="text-[10px] text-zinc-500">
                      Reponedores: {b.authorizedReplenishers?.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">
                        ${b.currentBalance.toLocaleString('es-AR')}
                      </div>
                      <div className="text-[10px] text-zinc-500">Tope: ${b.maxLimit.toLocaleString('es-AR')}</div>
                    </div>
                    <button
                      onClick={() => deletePettyCashBox(b.id)}
                      title="Eliminar caja"
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
