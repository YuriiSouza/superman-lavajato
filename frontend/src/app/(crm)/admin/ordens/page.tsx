'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const STATUS_OPTIONS = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'] as const;
const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Aguardando', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
};
const STATUS_COLOR: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  CONCLUIDO: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  CANCELADO: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};
const PAYMENT_OPTIONS = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'];
const PAYMENT_LABEL: Record<string, string> = {
  PIX: 'Pix', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito',
};

const FILTER_TABS = [
  { key: '', label: 'Todas' },
  { key: 'PENDENTE', label: 'Aguardando' },
  { key: 'EM_ANDAMENTO', label: 'Em andamento' },
  { key: 'CONCLUIDO', label: 'Concluídas' },
];

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function OrdensPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);

  // Dados para o modal de nova OS (carregados uma vez)
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Estado do formulário de nova OS
  const [form, setForm] = useState({
    clientId: '', vehicleId: '', serviceId: '', paymentMethod: 'PIX', notes: '',
  });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOrders = (status?: string) => {
    setLoading(true);
    crm.orders.list(status ? { status } : {}).then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    if (modal && clients.length === 0) {
      // Só busca clientes e serviços quando o modal é aberto pela primeira vez
      Promise.all([crm.clients.list(), crm.services.list()]).then(([c, s]) => {
        setClients(c);
        setServices(s);
      });
    }
  }, [modal]);

  function handleFilter(status: string) {
    setFilter(status);
    loadOrders(status || undefined);
  }

  // Quando o cliente muda, busca os veículos daquele cliente
  async function handleClientChange(clientId: string) {
    setForm((f) => ({ ...f, clientId, vehicleId: '' }));
    if (clientId) {
      const vList = await crm.vehicles.list(clientId);
      setVehicles(vList);
    } else {
      setVehicles([]);
    }
  }

  // Quando o serviço muda, preenche automaticamente o valor
  function handleServiceChange(serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    setForm((f) => ({ ...f, serviceId }));
    setTotalValue(svc ? String(svc.price) : '');
  }

  async function handleUpdateStatus(id: string, status: string) {
    await crm.orders.update(id, { status });
    loadOrders(filter || undefined);
  }

  async function handleCreate() {
    if (!form.clientId || !form.vehicleId || !form.serviceId || !totalValue) return;
    setSaving(true);
    try {
      await crm.orders.create({ ...form, totalValue: parseFloat(totalValue) });
      setModal(false);
      setForm({ clientId: '', vehicleId: '', serviceId: '', paymentMethod: 'PIX', notes: '' });
      setTotalValue('');
      setVehicles([]);
      loadOrders(filter || undefined);
    } finally {
      setSaving(false);
    }
  }

  const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ordens de serviço</h1>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Nova OS
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {FILTER_TABS.map((t) => (
          <button key={t.key} onClick={() => handleFilter(t.key)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              filter === t.key
                ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">Nenhuma ordem encontrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['Placa', 'Cliente', 'Serviço', 'Pagamento', 'Valor', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{o.vehicle?.plate}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{o.client?.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o.service?.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{PAYMENT_LABEL[o.paymentMethod]}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{fmt(o.totalValue)}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium focus:ring-2 focus:ring-blue-500 ${STATUS_COLOR[o.status]} bg-transparent`}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
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
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente *</label>
            <select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)} className={inputCls}>
              <option value="">Selecione...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Veículo *</label>
            <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              disabled={!form.clientId} className={inputCls}>
              <option value="">Selecione o cliente primeiro</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Serviço *</label>
            <select value={form.serviceId} onChange={(e) => handleServiceChange(e.target.value)} className={inputCls}>
              <option value="">Selecione...</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} — R$ {Number(s.price).toFixed(2)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor total (R$) *</label>
            <input type="number" step="0.01" value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de pagamento *</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
              {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{PAYMENT_LABEL[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModal(false)}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button onClick={handleCreate}
              disabled={saving || !form.clientId || !form.vehicleId || !form.serviceId || !totalValue}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Criando...' : 'Criar OS'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
