'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { crm } from '@/lib/crm/api';
import NovaOSModal from '@/components/crm/NovaOSModal';
import ReceberPagamentoModal from '@/components/crm/ReceberPagamentoModal';

const STATUS_OPTIONS = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'PAGO', 'CANCELADO'] as const;
const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Aguardando', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído',
  PAGO: 'Pago', CANCELADO: 'Cancelado',
};
const STATUS_COLOR: Record<string, string> = {
  PENDENTE:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  CONCLUIDO:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  PAGO:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  CANCELADO:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};
const PAYMENT_LABEL: Record<string, string> = {
  PIX: 'Pix', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito',
};

const FILTER_TABS = [
  { key: '', label: 'Todas' },
  { key: 'PENDENTE', label: 'Aguardando' },
  { key: 'EM_ANDAMENTO', label: 'Em andamento' },
  { key: 'CONCLUIDO', label: 'Concluídas' },
  { key: 'PAGO', label: 'Pagas' },
  { key: 'CANCELADO', label: 'Canceladas' },
];

const STORAGE_KEY = 'ordens_filters';

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function todayISO() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

function fmtDateBR(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function paymentSummary(order: any): string {
  if (order.payments?.length) {
    return order.payments
      .map((p: any) => `${PAYMENT_LABEL[p.method] ?? p.method} ${fmt(p.amount)}`)
      .join(' + ');
  }
  if (order.paymentMethod) return PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod;
  return '—';
}

function saveFilters(status: string, date: string) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, date })); } catch {}
}

export default function OrdensPage() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r).status : ''; } catch { return ''; }
  });
  const [date, setDate]       = useState(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r).date : ''; } catch { return ''; }
  });
  const [modal, setModal]     = useState(false);
  const [paying, setPaying]   = useState<any | null>(null);

  const loadOrders = useCallback((status: string, dateVal: string) => {
    setLoading(true);
    const params: any = {};
    if (status) params.status = status;
    if (dateVal) params.date = dateVal;
    crm.orders.list(params).then(setOrders).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrders(filter, date); }, []);

  function handleFilter(newStatus: string) {
    setFilter(newStatus);
    saveFilters(newStatus, date);
    loadOrders(newStatus, date);
  }

  function handleDate(newDate: string) {
    setDate(newDate);
    saveFilters(filter, newDate);
    loadOrders(filter, newDate);
  }

  function clearDate() {
    setDate('');
    saveFilters(filter, '');
    loadOrders(filter, '');
  }

  function handleStatusChange(order: any, newStatus: string) {
    if (newStatus === 'PAGO') {
      setPaying({ ...order, nextStatus: 'PAGO' });
    } else {
      crm.orders.update(order.id, { status: newStatus })
        .then(() => loadOrders(filter, date));
    }
  }

  async function handlePaymentConfirm(payments: { method: string; amount: number }[]) {
    await crm.orders.update(paying.id, { status: 'PAGO', payments });
    setPaying(null);
    loadOrders(filter, date);
  }

  const isToday = date === todayISO();

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-x-hidden">

      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ordens de serviço</h1>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Nova OS</span><span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* filtros */}
      <div className="space-y-2">
        {/* tabs de status — scroll horizontal no mobile */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-max">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleFilter(t.key)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  filter === t.key
                    ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* seletor de data */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDate(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          {date && (
            <>
              {isToday ? (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">hoje</span>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">{fmtDateBR(date)}</span>
              )}
              <button onClick={clearDate} className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* tabela */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
            Nenhuma ordem encontrada.
          </p>
        ) : (
          <>
            {/* desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
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
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{paymentSummary(o)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{fmt(o.totalValue)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium focus:ring-2 focus:ring-blue-500 ${STATUS_COLOR[o.status]} bg-transparent`}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile: cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {orders.map((o) => (
                <div key={o.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{o.client?.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        <span className="font-mono">{o.vehicle?.plate}</span> · {o.service?.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">{fmt(o.totalValue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{paymentSummary(o)}</span>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer font-medium focus:ring-2 focus:ring-blue-500 ${STATUS_COLOR[o.status]} bg-transparent`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <NovaOSModal
        open={modal}
        onClose={() => setModal(false)}
        onSuccess={() => loadOrders(filter, date)}
      />

      <ReceberPagamentoModal
        open={!!paying}
        totalValue={paying ? Number(paying.totalValue) : 0}
        clientName={paying ? `${paying.client?.name} — ${paying.vehicle?.plate}` : ''}
        onConfirm={handlePaymentConfirm}
        onClose={() => setPaying(null)}
      />
    </div>
  );
}
