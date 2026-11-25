"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ClipboardList, X, ChevronRight } from "lucide-react";
import { crm } from "@/lib/crm/api";
import NovaOSModal from "./NovaOSModal";
import ReceberPagamentoModal from "./ReceberPagamentoModal";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/crm/status";
import { Plate } from "@/components/crm/Plate";

const STATUS_LABEL = ORDER_STATUS_LABEL;
const STATUS_COLOR = ORDER_STATUS_STYLE;
const STATUS_OPTIONS = ORDER_STATUSES;
const STATUS_OPTION_LABEL = ORDER_STATUS_LABEL;

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GlobalActions() {
  const [novaOS, setNovaOS] = useState(false);
  const [abertoModal, setAbertoModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [paying, setPaying] = useState<any | null>(null);

  const loadOpen = useCallback(() => {
    setLoadingOrders(true);
    Promise.all([
      crm.orders.list({ status: "PENDENTE" }),
      crm.orders.list({ status: "EM_ANDAMENTO" }),
      crm.orders.list({ status: "CONCLUIDO" }),
    ])
      .then(([a, b, c]) =>
        setOrders(
          [...a, ...b, ...c].sort(
            (x: any, y: any) =>
              new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
          ),
        ),
      )
      .finally(() => setLoadingOrders(false));
  }, []);

  useEffect(() => {
    loadOpen();
    const id = setInterval(loadOpen, 30_000);
    return () => clearInterval(id);
  }, [loadOpen]);

  function openAbertoModal() {
    loadOpen();
    setAbertoModal(true);
  }

  function handleStatusChange(order: any, newStatus: string) {
    if (newStatus === "PAGO") {
      setPaying(order);
    } else {
      crm.orders.update(order.id, { status: newStatus }).then(loadOpen);
    }
  }

  async function handlePaymentConfirm(
    payments: { method: string; amount: number }[],
  ) {
    await crm.orders.update(paying.id, { status: "PAGO", payments });
    setPaying(null);
    loadOpen();
  }

  const count = orders.length;

  return (
    <>
      {/* ── botões flutuantes ── */}
      <div className="fixed bottom-5 right-5 flex flex-col items-end gap-2 z-40">
        {/* OS em aberto */}
        <button
          onClick={openAbertoModal}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          <ClipboardList size={15} />
          OS em aberto
          {count > 0 && (
            <span className="ml-0.5 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>

        {/* Nova OS */}
        <button
          onClick={() => setNovaOS(true)}
          className="flex items-center gap-2 bg-kawasaki-500 hover:bg-kawasaki-400 text-ink-950 shadow-lg px-4 py-2.5 rounded-full text-sm font-medium transition-all"
        >
          <Plus size={15} /> Nova OS
        </button>
      </div>

      {/* ── modal nova OS ── */}
      <NovaOSModal
        open={novaOS}
        onClose={() => setNovaOS(false)}
        onSuccess={() => {
          setNovaOS(false);
          loadOpen();
        }}
      />

      {/* ── modal OS em aberto ── */}
      {abertoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  OS em aberto
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {count} {count === 1 ? "ordem pendente" : "ordens pendentes"}
                </p>
              </div>
              <button
                onClick={() => setAbertoModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* lista */}
            <div className="overflow-y-auto flex-1">
              {loadingOrders ? (
                <div className="p-4 space-y-3 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"
                    />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                  <ClipboardList
                    size={32}
                    className="text-gray-300 dark:text-gray-600"
                  />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nenhuma OS em aberto
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Todas as ordens foram finalizadas
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* status badge */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[o.status]}`}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          <Plate plate={o.vehicle?.plate} className="mr-1.5" />
                          {o.client?.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {o.service?.name}
                        </p>
                      </div>

                      {/* valor */}
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                        {fmt(o.totalValue)}
                      </span>

                      {/* mudar status */}
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-kawasaki-500 shrink-0 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_OPTION_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
              <button
                onClick={() => setNovaOS(true)}
                className="flex items-center gap-1.5 text-sm text-kawasaki-700 dark:text-kawasaki-400 font-medium hover:underline"
              >
                <Plus size={14} /> Nova OS
              </button>
              <button
                onClick={() => setAbertoModal(false)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── modal receber pagamento ── */}
      <ReceberPagamentoModal
        open={!!paying}
        totalValue={paying ? Number(paying.totalValue) : 0}
        clientName={
          paying ? `${paying.client?.name} — ${paying.vehicle?.plate}` : ""
        }
        onConfirm={handlePaymentConfirm}
        onClose={() => setPaying(null)}
      />
    </>
  );
}
