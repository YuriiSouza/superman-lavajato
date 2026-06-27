'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const THRESHOLD_OPTIONS = [15, 30, 45];

export default function ReativacaoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = (d: number) => {
    setLoading(true);
    crm.reactivation(d).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(days); }, [days]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Fila de reativação</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data?.total ?? 0} clientes sem visitar há mais de {days} dias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Threshold:</span>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {THRESHOLD_OPTIONS.map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  days === d
                    ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={() => load(days)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.queue?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum cliente na fila. 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.queue.map((c: any) => (
            <div key={c.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                    {/* Badge de urgência baseado em dias sem visita */}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (c.daysSince ?? 0) > 60
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    }`}>
                      {c.daysSince ?? '?'} dias
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {c.phone} {c.vehicle && `· ${c.vehicle}`} {c.plate && `(${c.plate})`}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 italic">
                    "{c.whatsappMessage}"
                  </p>
                </div>
                <a
                  href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(c.whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg flex-shrink-0 transition-colors"
                >
                  <MessageCircle size={13} /> Enviar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
