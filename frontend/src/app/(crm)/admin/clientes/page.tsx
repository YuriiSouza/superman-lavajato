'use client';

import { useEffect, useState, useTransition } from 'react';
import { Search, Plus, X, ChevronRight, Car, Trash2 } from 'lucide-react';
import { crm } from '@/lib/crm/api';
import OSActionsWidget from '@/components/crm/OSActionsWidget';

const VEHICLE_TYPES = ['SEDAN', 'SUV', 'HATCH', 'PICKUP', 'MOTO', 'OUTRO'];

const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputSmCls =
  'px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500';

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-lg relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'client' | 'detail' | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [vehicleForm, setVehicleForm] = useState({ plate: '', model: '', color: '', type: 'SEDAN' });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [, startTransition] = useTransition();

  const load = (q?: string) => {
    setLoading(true);
    crm.clients.list(q).then(setClients).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function handleSearch(q: string) {
    setSearch(q);
    startTransition(() => load(q));
  }

  async function openDetail(c: any) {
    setLoadingDetail(true);
    setModal('detail');
    setSelected(c);
    setVehicleForm({ plate: '', model: '', color: '', type: 'SEDAN' });
    const full = await crm.clients.get(c.id);
    setDetail(full);
    setLoadingDetail(false);
  }

  async function handleSaveClient() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      if (selected && modal === 'client') {
        await crm.clients.update(selected.id, form);
      } else {
        await crm.clients.create(form);
      }
      setModal(null);
      setForm({ name: '', phone: '', notes: '' });
      setSelected(null);
      load(search);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVehicle() {
    if (!vehicleForm.plate || !vehicleForm.model || !selected) return;
    setSaving(true);
    try {
      await crm.vehicles.create({ ...vehicleForm, clientId: selected.id });
      setVehicleForm({ plate: '', model: '', color: '', type: 'SEDAN' });
      const full = await crm.clients.get(selected.id);
      setDetail(full);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveVehicle(vehicleId: string) {
    if (!confirm('Remover este veículo?')) return;
    await crm.vehicles.remove(vehicleId);
    const full = await crm.clients.get(selected.id);
    setDetail(full);
  }

  function openEdit(c: any) {
    setSelected(c);
    setForm({ name: c.name, phone: c.phone, notes: c.notes ?? '' });
    setModal('client');
  }

  const segmentLabel = (c: any) => {
    const orders = c._count?.orders ?? 0;
    if (orders === 0) return { label: 'Novo', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
    if (orders >= 4) return { label: 'VIP', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
    return { label: 'Regular', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Clientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{clients.length} cadastrados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setSelected(null); setForm({ name: '', phone: '', notes: '' }); setModal('client'); }}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Novo cliente
          </button>
          <OSActionsWidget />
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou placa…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            </div>
          ))
        ) : clients.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">Nenhum cliente encontrado.</p>
        ) : (
          clients.map((c) => {
            const seg = segmentLabel(c);
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => openDetail(c)}
              >
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${seg.cls}`}>{seg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {c.phone} · {c._count?.orders ?? 0} atendimentos · {c.vehicles?.length ?? 0} veículo(s)
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {/* Modal criar/editar cliente */}
      <Modal open={modal === 'client'} onClose={() => setModal(null)} title={selected ? 'Editar cliente' : 'Novo cliente'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="João Silva" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone (WhatsApp) *</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} placeholder="Ex: prefere atendimento pela manhã"
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModal(null)}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button onClick={handleSaveClient} disabled={saving || !form.name || !form.phone}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal detalhe do cliente + veículos */}
      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title={selected?.name ?? 'Cliente'}>
        {loadingDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ) : detail && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{detail.phone}</p>
                {detail.notes && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{detail.notes}</p>}
              </div>
              <button onClick={() => openEdit(detail)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Editar dados
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Car size={15} /> Veículos ({detail.vehicles?.length ?? 0})
                </p>
              </div>

              {detail.vehicles?.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Nenhum veículo cadastrado.</p>
              ) : (
                <div className="space-y-1 mb-3">
                  {detail.vehicles.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 font-semibold">{v.plate}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {v.model} {v.color && `· ${v.color}`} · {v.type}
                        </span>
                      </div>
                      <button onClick={() => handleRemoveVehicle(v.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Adicionar veículo</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
                    placeholder="ABC-1234" className={inputSmCls} />
                  <input value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    placeholder="HB20" className={inputSmCls} />
                  <input value={vehicleForm.color}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                    placeholder="Cor (ex: Prata)" className={inputSmCls} />
                  <select value={vehicleForm.type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                    className={inputSmCls}>
                    {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={handleAddVehicle} disabled={saving || !vehicleForm.plate || !vehicleForm.model}
                  className="w-full py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50">
                  {saving ? 'Adicionando...' : 'Adicionar veículo'}
                </button>
              </div>
            </div>

            {detail.orders?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Últimos atendimentos</p>
                <div className="space-y-1">
                  {detail.orders.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">{o.service?.name}</span>
                      <span className="text-gray-400 dark:text-gray-500">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">R$ {Number(o.totalValue).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
