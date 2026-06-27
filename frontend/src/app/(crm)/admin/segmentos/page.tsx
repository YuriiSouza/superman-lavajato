'use client';

import { useEffect, useState } from 'react';
import { Crown, RefreshCw, Clock, Car, Repeat } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const SEGMENTS = [
  { key: 'vip', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  { key: 'regular', icon: Repeat, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  { key: 'churn', icon: Clock, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  { key: 'premium', icon: Car, color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
      {initials}
    </div>
  );
}

export default function SegmentosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    crm.segments().then(setData).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Segmentação de clientes</h1>
          <p className="text-sm text-gray-500">Clique em um segmento para ver os clientes</p>
        </div>
        <button onClick={load} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SEGMENTS.map(({ key, icon: Icon, color, bg }) => {
          const seg = data?.[key];
          if (!seg) return null;
          const isOpen = expanded === key;
          return (
            <div key={key} className={`rounded-xl border ${bg} overflow-hidden`}>
              <button
                className="w-full text-left p-4 hover:opacity-90 transition-opacity"
                onClick={() => setExpanded(isOpen ? null : key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={20} className={color} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{seg.label}</p>
                      <p className="text-xs text-gray-500">{seg.count} clientes</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${color}`}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-current border-opacity-20 bg-white">
                  {seg.clients.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Nenhum cliente neste segmento.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                      {seg.clients.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-2 px-4 py-2.5">
                          <Avatar name={c.name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.phone}
                              {c.daysSince !== undefined && ` · ${c.daysSince} dias`}
                              {c.avgTicket && ` · ticket R$ ${Number(c.avgTicket).toFixed(0)}`}
                            </p>
                          </div>
                          {key === 'churn' && (
                            <a
                              href={`/admin/reativacao`}
                              className="text-xs text-green-600 hover:underline flex-shrink-0"
                            >
                              Reativar
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
