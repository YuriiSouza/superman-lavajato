'use client';

import { useEffect, useState } from 'react';
import { crm } from '@/lib/crm/api';

const PERIOD_LABELS: Record<string, string> = { day: 'Hoje', week: 'Últimos 7 dias', month: 'Este mês' };
const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', DINHEIRO: 'Dinheiro', CARTAO_CREDITO: 'Crédito', CARTAO_DEBITO: 'Débito',
};

export default function FinanceiroPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    setLoading(true);
    crm.financial(period).then(setData).finally(() => setLoading(false));
  }, [period]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500">{PERIOD_LABELS[period]}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${period === p ? 'bg-white font-medium shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-2">Receita total</p>
              <p className="text-2xl font-semibold text-green-600">{fmt(data.total)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-2">Atendimentos</p>
              <p className="text-2xl font-semibold text-gray-900">{data.ordersCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-2">Ticket médio</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.ordersCount > 0 ? fmt(data.total / data.ordersCount) : 'R$ 0,00'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Por serviço</h2>
              {Object.keys(data.byService ?? {}).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sem dados.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.byService ?? {})
                    .sort(([, a]: any, [, b]: any) => b.revenue - a.revenue)
                    .map(([name, info]: any) => {
                      const pct = data.total > 0 ? (info.revenue / data.total) * 100 : 0;
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-700">{name}</span>
                            <span className="text-gray-500">{info.count}x · {fmt(info.revenue)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Por forma de pagamento</h2>
              {Object.keys(data.byPayment ?? {}).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sem dados.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.byPayment ?? {})
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .map(([method, value]: any) => {
                      const pct = data.total > 0 ? (value / data.total) * 100 : 0;
                      return (
                        <div key={method}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-700">{PAYMENT_LABELS[method] ?? method}</span>
                            <span className="text-gray-500">{fmt(value)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
