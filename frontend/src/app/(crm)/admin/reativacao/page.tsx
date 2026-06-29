'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, RefreshCw, Clock, History, Users } from 'lucide-react';
import { crm } from '@/lib/crm/api';
import OSActionsWidget from '@/components/crm/OSActionsWidget';

const THRESHOLD_OPTIONS = [15, 30, 45];

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days} dia${days !== 1 ? 's' : ''} atrás`;
}

function dateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function daysSinceContact(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

type ContactFilter = 'all' | 'pending' | 'contacted';
const CONTACT_FILTER_OPTS: { key: ContactFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Não contatados' },
  { key: 'contacted', label: 'Já contatados' },
];

export default function ReativacaoPage() {
  const [tab, setTab] = useState<'queue' | 'history'>(() => {
    try { return (localStorage.getItem('reat_tab') as any) || 'queue'; } catch { return 'queue'; }
  });
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [days, setDays] = useState<number>(() => {
    try { return Number(localStorage.getItem('reat_days')) || 30; } catch { return 30; }
  });
  const [contactFilter, setContactFilter] = useState<ContactFilter>(() => {
    try { return (localStorage.getItem('reat_contact') as ContactFilter) || 'all'; } catch { return 'all'; }
  });
  const [logging, setLogging] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, string>>({});

  const loadQueue = useCallback((d: number) => {
    setLoading(true);
    crm.reactivation.queue(d).then(setData).finally(() => setLoading(false));
  }, []);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    crm.reactivation.history(100).then(setHistory).finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    try { localStorage.setItem('reat_days', String(days)); } catch {}
    loadQueue(days);
  }, [days, loadQueue]);

  useEffect(() => {
    try { localStorage.setItem('reat_tab', tab); } catch {}
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  useEffect(() => {
    try { localStorage.setItem('reat_contact', contactFilter); } catch {}
  }, [contactFilter]);

  async function handleSend(c: any) {
    // Abre o WhatsApp
    const url = `https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(c.whatsappMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Registra no banco
    setLogging((prev) => ({ ...prev, [c.id]: true }));
    try {
      await crm.reactivation.log({
        clientId: c.id,
        daysSince: c.daysSince ?? undefined,
        message: c.whatsappMessage,
      });
      const now = new Date().toISOString();
      setSentMap((prev) => ({ ...prev, [c.id]: now }));
    } finally {
      setLogging((prev) => ({ ...prev, [c.id]: false }));
    }
  }

  // sentAt para um cliente: usa mapa otimista ou o que veio da API
  function getLastContact(c: any): string | null {
    return sentMap[c.id] ?? c.lastContact?.sentAt ?? null;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-x-hidden">
      {/* ── cabeçalho ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reativação</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tab === 'queue'
              ? (() => {
                  const q: any[] = data?.queue ?? [];
                  const filtered = q.filter((c) => {
                    const sent = sentMap[c.id] ?? c.lastContact?.sentAt;
                    if (contactFilter === 'pending') return !sent;
                    if (contactFilter === 'contacted') return !!sent;
                    return true;
                  });
                  return `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''} · sem visita há mais de ${days} dias`;
                })()
              : `${history.length} mensagens enviadas`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tab === 'queue' && (
            <>
              <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {CONTACT_FILTER_OPTS.map((o) => (
                  <button key={o.key} onClick={() => setContactFilter(o.key)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                      contactFilter === o.key
                        ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">sem visita há mais de</span>
              <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
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
              <button onClick={() => loadQueue(days)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                <RefreshCw size={13} />
              </button>
            </>
          )}
          {tab === 'history' && (
            <button onClick={loadHistory}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={13} />
            </button>
          )}
          <OSActionsWidget />
        </div>
      </div>

      {/* ── abas ── */}
      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('queue')}
          className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-md transition-colors ${
            tab === 'queue'
              ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}>
          <Users size={13} /> Fila
        </button>
        <button onClick={() => setTab('history')}
          className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-md transition-colors ${
            tab === 'history'
              ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}>
          <History size={13} /> Histórico
        </button>
      </div>

      {/* ── fila ── */}
      {tab === 'queue' && (
        loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data?.queue?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum cliente na fila. 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(data.queue as any[])
              .filter((c) => {
                const alreadySent = (sentMap[c.id] ?? c.lastContact?.sentAt) !== null && (sentMap[c.id] ?? c.lastContact?.sentAt) !== undefined;
                if (contactFilter === 'pending') return !alreadySent;
                if (contactFilter === 'contacted') return alreadySent;
                return true;
              })
              .map((c: any) => {
              const lastContact = getLastContact(c);
              const contactDays = lastContact ? daysSinceContact(lastContact) : null;
              const alreadySent = lastContact !== null;

              return (
                <div key={c.id}
                  className={`bg-white dark:bg-gray-900 rounded-xl border p-4 transition-colors ${
                    alreadySent
                      ? 'border-green-200 dark:border-green-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* nome + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          (c.daysSince ?? 0) > 60
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                        }`}>
                          {c.daysSince ?? '?'} dias sem visita
                        </span>
                        {alreadySent && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            <Clock size={10} />
                            Contatado {contactDays === 0 ? 'hoje' : `há ${contactDays}d`}
                          </span>
                        )}
                      </div>

                      {/* telefone + veículo */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {c.phone}
                        {c.vehicle && ` · ${c.vehicle}`}
                        {c.plate && ` (${c.plate})`}
                      </p>

                      {/* mensagem */}
                      <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 italic">
                        "{c.whatsappMessage}"
                      </p>

                      {/* info do último contato */}
                      {alreadySent && (
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1.5">
                          Última mensagem enviada em {dateLabel(lastContact!)}
                        </p>
                      )}
                    </div>

                    {/* botão enviar */}
                    <button
                      onClick={() => handleSend(c)}
                      disabled={logging[c.id]}
                      className={`flex items-center gap-1.5 text-white text-xs px-3 py-2 rounded-lg flex-shrink-0 transition-colors disabled:opacity-60 ${
                        alreadySent
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      <MessageCircle size={13} />
                      {logging[c.id] ? '...' : alreadySent ? 'Reenviar' : 'Enviar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── histórico ── */}
      {tab === 'history' && (
        historyLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma mensagem enviada ainda.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {history.map((log: any) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.client?.name}</p>
                      {log.daysSince != null && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {log.daysSince} dias sem visita
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{log.client?.phone}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{log.message}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeSince(log.sentAt)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{dateLabel(log.sentAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
