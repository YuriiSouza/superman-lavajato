'use client';

import { useState, useCallback } from 'react';
import { Plus, ClipboardList, X, MessageCircle } from 'lucide-react';

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}
import { crm } from '@/lib/crm/api';
import NovaOSModal from './NovaOSModal';
import ReceberPagamentoModal from './ReceberPagamentoModal';

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_COLOR: Record<string, string> = {
  PENDENTE:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  CONCLUIDO:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
};
const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Aguardando', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído',
};

export default function OSActionsWidget({ onSuccess }: { onSuccess?: () => void }) {
  const [novaOS, setNovaOS]         = useState(false);
  const [osModal, setOsModal]       = useState(false);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [loadingOS, setLoadingOS]   = useState(false);
  const [paying, setPaying]         = useState<any | null>(null);

  const loadOpenOrders = useCallback(() => {
    setLoadingOS(true);
    Promise.all([
      crm.orders.list({ status: 'PENDENTE' }),
      crm.orders.list({ status: 'EM_ANDAMENTO' }),
      crm.orders.list({ status: 'CONCLUIDO' }),
    ])
      .then(([a, b, c]) =>
        setOpenOrders(
          [...a, ...b, ...c].sort((x: any, y: any) =>
            new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
          )
        )
      )
      .finally(() => setLoadingOS(false));
  }, []);

  function openOsModal() {
    loadOpenOrders();
    setOsModal(true);
  }

  async function handlePaymentConfirm(payments: { method: string; amount: number }[]) {
    await crm.orders.update(paying.id, { status: 'PAGO', payments });
    setPaying(null);
    loadOpenOrders();
    onSuccess?.();
  }

  return (
    <>
      {/* botões */}
      <div className="flex gap-2">
        <button
          onClick={() => setNovaOS(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={13} /> Nova OS
        </button>
        <button
          onClick={openOsModal}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ClipboardList size={13} /> Ver OS
        </button>
      </div>

      {/* modal nova OS */}
      <NovaOSModal
        open={novaOS}
        onClose={() => setNovaOS(false)}
        onSuccess={() => { onSuccess?.(); loadOpenOrders(); }}
      />

      {/* modal OS em aberto */}
      {osModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">OS em aberto</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {openOrders.length} {openOrders.length === 1 ? 'ordem' : 'ordens'} pendentes
                </p>
              </div>
              <button
                onClick={() => setOsModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingOS ? (
                <div className="p-4 space-y-3 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                  ))}
                </div>
              ) : openOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                  <ClipboardList size={32} className="text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma OS em aberto</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {openOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {o.client?.name}
                          </p>
                          {o.client?.phone && (
                            <a
                              href={waLink(o.client.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 text-green-500 hover:text-green-600"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          <span className="font-mono">{o.vehicle?.plate}</span>
                          {o.vehicle?.model && <span className="ml-1">· {o.vehicle.model}</span>}
                          <span className="ml-1">· {o.service?.name}</span>
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                        {fmt(Number(o.totalValue))}
                      </span>
                      <select
                        value={o.status}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next === 'PAGO') {
                            setPaying(o);
                          } else {
                            crm.orders.update(o.id, { status: next }).then(loadOpenOrders);
                          }
                        }}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 cursor-pointer"
                      >
                        {['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'PAGO', 'CANCELADO'].map((s) => (
                          <option key={s} value={s}>
                            {{ PENDENTE: 'Aguardando', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído', PAGO: 'Pago', CANCELADO: 'Cancelado' }[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
              <button
                onClick={() => { setOsModal(false); setNovaOS(true); }}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <Plus size={14} /> Nova OS
              </button>
              <button
                onClick={() => setOsModal(false)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal receber pagamento — renderizado por último para ficar acima do modal de OS */}
      <ReceberPagamentoModal
        open={!!paying}
        totalValue={paying ? Number(paying.totalValue) : 0}
        clientName={paying ? `${paying.client?.name} — ${paying.vehicle?.plate}` : ''}
        onConfirm={handlePaymentConfirm}
        onClose={() => setPaying(null)}
      />
    </>
  );
}
