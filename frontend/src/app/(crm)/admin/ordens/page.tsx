'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Aguardando', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
};
const STATUS_CLS: Record<string, string> = {
  PENDENTE: 'bg-blue-100 text-blue-700',
  EM_ANDAMENTO: 'bg-yellow-100 text-yellow-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};
const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito',
};

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function OrdensPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [modal, setModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: '', vehicleId: '', serviceId: '', totalValue: '', paymentMethod: 'PIX', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const fn = filter === 'today' ? crm.orders.today() : crm.orders.list(filter !== 'all' ? { status: filter } : {});
    fn.then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  async function openNew() {
    const [c, s] = await Promise.all([crm.clients.list(), crm.services.list()]);
    setClients(c);
    setServices(s);
    setVehicles([]);
    setForm({ clientId: '', vehicleId: '', serviceId: '', totalValue: '', paymentMethod: 'PIX', notes: '' });
    setModal(true);
  }

  async function handleClientChange(id: string) {
    setForm((f) => ({ ...f, clientId: id, vehicleId: '' }));
    if (id) {
      const v = await crm.vehicles.list(id);
      setVehicles(v);
    }
  }

  function handleServiceChange(id: string) {
    const svc = services.find((s) => s.id === id);
    setForm((f) => ({ ...f, serviceId: id, totalValue: svc ? String(svc.price) : f.totalValue }));
  }

  async function handleSave() {
    if (!form.clientId || !form.vehicleId || !form.serviceId || !form.totalValue) return;
    setSaving(true);
    try {
      await crm.orders.create({ ...form, totalValue: parseFloat(form.totalValue) });
      setModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await crm.orders.update(id, { status });
    load();
  }

  const total = orders.reduce((s, o) => s + Number(o.totalValue), 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Ordens de serviço</h1>
          <p className="text-sm text-gray-500">{orders.length} ordens · total {fmt(total)}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Nova OS
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['today', 'Hoje'], ['all', 'Todas'], ['PENDENTE', 'Aguardando'], ['EM_ANDAMENTO', 'Em andamento'], ['CONCLUIDO', 'Concluídas']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Nenhuma ordem encontrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Placa</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Serviço</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Pagamento</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Valor</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 bg-gray-50">{o.vehicle?.plate}</td>
                  <td className="px-4 py-3 text-gray-900">{o.client?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{o.service?.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(Number(o.totalValue))}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer ${STATUS_CLS[o.status]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nova ordem de serviço">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
              <select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecionar cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Veículo *</label>
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                disabled={!form.clientId || vehicles.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">{vehicles.length === 0 ? 'Selecione o cliente primeiro' : 'Selecionar veículo'}</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Serviço *</label>
              <select value={form.serviceId} onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecionar serviço</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} — R$ {Number(s.price).toFixed(2)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor total (R$) *</label>
              <input type="number" step="0.01" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                placeholder="80.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pagamento *</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(PAYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex: veículo muito sujo" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.clientId || !form.vehicleId || !form.serviceId}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Salvando...' : 'Criar OS'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
