'use client';

import { useEffect, useState } from 'react';
import { Car, DollarSign, TrendingUp, UserX, Clock } from 'lucide-react';
import Link from 'next/link';
import { crm } from '@/lib/crm/api';

function MetricCard({ label, value, delta, deltaDown, icon: Icon }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">{label}</span>
        <Icon size={16} className="text-gray-400" />
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {delta && (
        <p className={`text-xs mt-1 ${deltaDown ? 'text-red-500' : 'text-green-600'}`}>{delta}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONCLUIDO: 'bg-green-100 text-green-700',
    EM_ANDAMENTO: 'bg-yellow-100 text-yellow-700',
    PENDENTE: 'bg-blue-100 text-blue-700',
    CANCELADO: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    CONCLUIDO: 'Concluído', EM_ANDAMENTO: 'Em andamento', PENDENTE: 'Aguardando', CANCELADO: 'Cancelado',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([crm.dashboard(), crm.orders.today(), crm.reactivation(30)])
      .then(([dash, ord, react]) => {
        setData(dash);
        setOrders(ord);
        setQueue(react.queue.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const today = data?.today;
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Aberto</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Carros hoje" value={today?.ordersCount ?? 0} delta={`Mês: ${data?.month?.ordersCount ?? 0} atendimentos`} icon={Car} />
        <MetricCard label="Faturamento hoje" value={fmt(today?.revenue ?? 0)} delta={`Mês: ${fmt(data?.month?.revenue ?? 0)}`} icon={DollarSign} />
        <MetricCard label="Ticket médio" value={fmt(today?.avgTicket ?? 0)} icon={TrendingUp} />
        <MetricCard label="Clientes sumidos" value={data?.clients?.churn ?? 0} delta="Precisam de reativação" deltaDown icon={UserX} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Ordens de hoje</h2>
            <Link href="/admin/ordens" className="text-xs text-blue-600 hover:underline">ver todas →</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma ordem hoje ainda.</p>
          ) : (
            <div className="space-y-1">
              {orders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {o.vehicle?.plate}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{o.service?.name}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {fmt(Number(o.totalValue))}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              <span className="text-green-600 mr-1">●</span>
              Reativar agora
            </h2>
            <Link href="/admin/reativacao" className="text-xs text-blue-600 hover:underline">ver todos →</Link>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum cliente para reativar.</p>
          ) : (
            <div className="space-y-1">
              {queue.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                    {c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.vehicle ?? 'Sem veículo'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${(c.daysSince ?? 99) > 30 ? 'text-red-500' : 'text-yellow-600'}`}>
                      {c.daysSince ?? '?'} dias
                    </p>
                    <a
                      href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(c.whatsappMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Enviar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {today?.byPayment && Object.keys(today.byPayment).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Caixa de hoje — por pagamento</h2>
          <div className="flex flex-wrap gap-6">
            {Object.entries(today.byPayment).map(([method, value]: any) => (
              <div key={method}>
                <p className="text-xs text-gray-500">{method.replace('_', ' ')}</p>
                <p className="text-lg font-semibold text-gray-900">{fmt(value)}</p>
              </div>
            ))}
            <div className="ml-auto">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-semibold text-green-600">{fmt(today.revenue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
