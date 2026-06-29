'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Plus, User } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const PAYMENT_OPTIONS = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'];
const PAYMENT_LABEL: Record<string, string> = {
  PIX: 'Pix', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito',
};
const VEHICLE_TYPES = ['SEDAN', 'SUV', 'HATCH', 'PICKUP', 'MOTO', 'OUTRO'];

const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NovaOSModal({ open, onClose, onSuccess }: Props) {
  // --- Client search ---
  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });
  const [savingClient, setSavingClient] = useState(false);

  // --- Vehicle ---
  const [clientVehicles, setClientVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [newVehicleMode, setNewVehicleMode] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plate: '', model: '', color: '', type: 'SEDAN' });
  const [savingVehicle, setSavingVehicle] = useState(false);

  // --- Service order fields ---
  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const resetAll = useCallback(() => {
    setClientQuery(''); setClientResults([]); setShowDrop(false); setDropRect(null);
    setSelectedClient(null); setNewClientMode(false); setNewClient({ name: '', phone: '' });
    setClientVehicles([]); setSelectedVehicle(null); setNewVehicleMode(false);
    setNewVehicle({ plate: '', model: '', color: '', type: 'SEDAN' });
    setServiceId(''); setTotalValue(''); setNotes('');
  }, []);

  useEffect(() => {
    if (open) {
      crm.services.list().then(setServices);
    } else {
      resetAll();
    }
  }, [open, resetAll]);

  // Debounced client search
  useEffect(() => {
    if (selectedClient || clientQuery.length < 2) {
      setClientResults([]); setShowDrop(false); return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await crm.clients.list(clientQuery);
        setClientResults(res);
        openDropdown();
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientQuery, selectedClient]);

  function openDropdown() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropRect({ top: r.bottom + 4, left: r.left, width: r.width });
      setShowDrop(true);
    }
  }

  function selectClient(client: any) {
    setSelectedClient(client);
    setClientQuery(client.name);
    setShowDrop(false);
    setClientVehicles(client.vehicles ?? []);
    setSelectedVehicle(client.vehicles?.length === 1 ? client.vehicles[0] : null);
    setNewVehicleMode(false);
  }

  function clearClient() {
    setSelectedClient(null);
    setClientQuery('');
    setClientVehicles([]);
    setSelectedVehicle(null);
    setNewVehicleMode(false);
    setShowDrop(false);
  }

  async function handleCreateClient() {
    if (!newClient.name || !newClient.phone) return;
    setSavingClient(true);
    try {
      const created = await crm.clients.create(newClient);
      selectClient({ ...created, vehicles: [] });
      setNewClientMode(false);
      setNewVehicleMode(true);
    } finally {
      setSavingClient(false);
    }
  }

  async function handleCreateVehicle() {
    if (!newVehicle.plate || !newVehicle.model || !selectedClient) return;
    setSavingVehicle(true);
    try {
      const created = await crm.vehicles.create({ ...newVehicle, clientId: selectedClient.id });
      const updated = [...clientVehicles, created];
      setClientVehicles(updated);
      setSelectedVehicle(created);
      setNewVehicleMode(false);
      setNewVehicle({ plate: '', model: '', color: '', type: 'SEDAN' });
    } finally {
      setSavingVehicle(false);
    }
  }

  function handleServiceChange(id: string) {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setTotalValue(String(svc.price));
  }

  async function handleSubmit() {
    if (!selectedClient || !selectedVehicle || !serviceId || !totalValue) return;
    setSaving(true);
    try {
      await crm.orders.create({
        clientId: selectedClient.id,
        vehicleId: selectedVehicle.id,
        serviceId,
        totalValue: parseFloat(totalValue),
        notes,
      });
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !!selectedClient && !!selectedVehicle && !!serviceId && !!totalValue;

  if (!open) return null;

  // Dropdown rendered via portal so it is never clipped by overflow:hidden containers
  const dropdown = showDrop && !selectedClient && dropRect
    ? createPortal(
        <div
          style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width, zIndex: 9999 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-56 overflow-y-auto"
        >
          {searching && (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2.5">Buscando...</p>
          )}
          {!searching && clientResults.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2.5">Nenhum cliente encontrado</p>
          )}
          {clientResults.map((c) => (
            <button
              key={c.id}
              onMouseDown={() => selectClient(c)}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {c.phone}
                {c.vehicles?.length > 0 && ` · ${c.vehicles.map((v: any) => v.plate).join(', ')}`}
              </p>
            </button>
          ))}
          <button
            onMouseDown={() => {
              setNewClientMode(true);
              setShowDrop(false);
              setNewClient({ name: clientQuery, phone: '' });
            }}
            className="w-full text-left px-3 py-2.5 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
          >
            <Plus size={14} /> Criar novo cliente
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {dropdown}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-xl relative max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Nova ordem de serviço</h3>
            <button onClick={onClose}>
              <X size={18} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </button>
          </div>

          {/* Body — scroll closes dropdown so portal position stays valid */}
          <div
            className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
            onScroll={() => setShowDrop(false)}
          >
            {/* ── CLIENTE ── */}
            <section>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Cliente
              </p>

              {!newClientMode ? (
                <div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      ref={inputRef}
                      className={`${inputCls} pl-8 pr-8`}
                      placeholder="Buscar por nome, telefone ou placa..."
                      value={clientQuery}
                      onChange={(e) => {
                        setClientQuery(e.target.value);
                        if (selectedClient) clearClient();
                      }}
                      onFocus={() => clientResults.length > 0 && !selectedClient && openDropdown()}
                      onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                    />
                    {(clientQuery || selectedClient) && (
                      <button
                        onClick={clearClient}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Selected client pill */}
                  {selectedClient && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                      <User size={14} className="text-blue-500 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{selectedClient.name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{selectedClient.phone}</p>
                      </div>
                    </div>
                  )}

                  {!showDrop && !selectedClient && (
                    <button
                      onClick={() => { setNewClientMode(true); setNewClient({ name: clientQuery, phone: '' }); }}
                      className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Criar novo cliente
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-800/60">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Novo cliente</p>
                  <input className={inputCls} placeholder="Nome *" value={newClient.name}
                    onChange={(e) => setNewClient((p) => ({ ...p, name: e.target.value }))} />
                  <input className={inputCls} placeholder="Telefone *" value={newClient.phone}
                    onChange={(e) => setNewClient((p) => ({ ...p, phone: e.target.value }))} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setNewClientMode(false)}
                      className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Cancelar
                    </button>
                    <button onClick={handleCreateClient} disabled={savingClient || !newClient.name || !newClient.phone}
                      className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60">
                      {savingClient ? 'Criando...' : 'Criar cliente'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ── VEÍCULO ── */}
            {selectedClient && (
              <section>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Veículo
                </p>

                {clientVehicles.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {clientVehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVehicle(v); setNewVehicleMode(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          selectedVehicle?.id === v.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <span className="font-mono text-xs font-semibold">{v.plate}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">{v.model}</span>
                        {v.color && <span className="text-gray-400 dark:text-gray-500 ml-1">· {v.color}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {!newVehicleMode ? (
                  <button onClick={() => setNewVehicleMode(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <Plus size={12} />
                    {clientVehicles.length === 0 ? 'Adicionar veículo' : 'Adicionar outro veículo'}
                  </button>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-800/60">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Novo veículo</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="Placa *" value={newVehicle.plate}
                        onChange={(e) => setNewVehicle((p) => ({ ...p, plate: e.target.value.toUpperCase() }))} />
                      <input className={inputCls} placeholder="Modelo *" value={newVehicle.model}
                        onChange={(e) => setNewVehicle((p) => ({ ...p, model: e.target.value }))} />
                      <input className={inputCls} placeholder="Cor" value={newVehicle.color}
                        onChange={(e) => setNewVehicle((p) => ({ ...p, color: e.target.value }))} />
                      <select className={inputCls} value={newVehicle.type}
                        onChange={(e) => setNewVehicle((p) => ({ ...p, type: e.target.value }))}>
                        {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setNewVehicleMode(false); setNewVehicle({ plate: '', model: '', color: '', type: 'SEDAN' }); }}
                        className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Cancelar
                      </button>
                      <button onClick={handleCreateVehicle} disabled={savingVehicle || !newVehicle.plate || !newVehicle.model}
                        className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60">
                        {savingVehicle ? 'Adicionando...' : 'Adicionar veículo'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── SERVIÇO / PAGAMENTO ── */}
            {selectedVehicle && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Serviço *</label>
                  <select value={serviceId} onChange={(e) => handleServiceChange(e.target.value)} className={inputCls}>
                    <option value="">Selecione...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — R$ {Number(s.price).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor total (R$) *
                  </label>
                  <input type="number" step="0.01" value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    rows={2} className={`${inputCls} resize-none`} />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving || !canSubmit}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Criando...' : 'Criar OS'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
