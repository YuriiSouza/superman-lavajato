'use client';

import { useEffect, useState } from 'react';
import { Car, DollarSign, TrendingDown, Zap, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { crm } from '@/lib/crm/api';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Aguardando',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  CONCLUIDO: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  CANCELADO: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

function MetricCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [dash, setDash] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch em paralelo para não bloquear o carregamento
    Promise.all([crm.dashboard(), crm.orders.today(), crm.reactivation(30)])
      .then(([d, o, r]) => { setDash(d); setOrders(o); setQueue(r.queue.slice(0, 5)); })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const byPayment = dash?.today?.byPayment ?? {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Car} label="Carros hoje" value={dash?.today?.ordersCount ?? 0}
          color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
        <MetricCard icon={DollarSign} label="Faturamento" value={fmt(dash?.today?.revenue ?? 0)}
          sub={`Mês: ${fmt(dash?.month?.revenue ?? 0)}`}
          color="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" />
        <MetricCard icon={Zap} label="Ticket médio" value={fmt(dash?.today?.avgTicket ?? 0)}
          color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" />
        <MetricCard icon={TrendingDown} label="Clientes sumidos" value={dash?.clients?.churn ?? 0}
          sub={`de ${dash?.clients?.total ?? 0} total`}
          color="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ordens de hoje</h2>
            <Link href="/admin/ordens" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Ver todas</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhuma ordem hoje ainda.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.slice(0, 6).map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-1">{o.vehicle?.plate}</span>
                      {o.client?.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{o.service?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 flex-shrink-0">{fmt(Number(o.totalValue))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Reativação urgente</h2>
            <Link href="/admin/reativacao" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Ver fila</Link>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhum cliente na fila.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {queue.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{c.vehicle ?? 'sem veículo'} · {c.daysSince ?? '?'} dias</p>
                  </div>
                  <a
                    href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(c.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 flex-shrink-0"
                  >
                    <MessageCircle size={13} /> Enviar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {Object.keys(byPayment).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Formas de pagamento hoje</h2>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(byPayment).map(([method, value]: any) => (
              <div key={method} className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">{method}: </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
