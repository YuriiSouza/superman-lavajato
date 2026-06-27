'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { crm } from '@/lib/crm/api';

export default function ReativacaoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = (d: number) => {
    setLoading(true);
    crm.reactivation(d).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(days); }, [days]);

  const urgency = (d: number | null) => {
    if (d === null) return 'text-red-500';
    if (d > 45) return 'text-red-600 font-semibold';
    if (d > 30) return 'text-red-500';
    return 'text-yellow-600';
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Reativação via WhatsApp</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} clientes para contatar</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Gatilho:</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={15}>15 dias sem visita</option>
              <option value={30}>30 dias sem visita</option>
              <option value={45}>45 dias sem visita</option>
            </select>
          </div>
          <button onClick={() => load(days)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg">
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.queue?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">Nenhum cliente para reativar com esse critério.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.queue?.map((c: any) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                  {c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <span className={`text-xs ${urgency(c.daysSince)}`}>
                      {c.daysSince !== null ? `${c.daysSince} dias sem visita` : 'Nunca veio'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.phone}
                    {c.vehicle && ` · ${c.vehicle}`}
                    {c.plate && ` · ${c.plate}`}
                  </p>
                  <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Mensagem</p>
                    <p className="text-sm text-gray-800">{c.whatsappMessage}</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(c.whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  <MessageCircle size={14} /> Enviar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
