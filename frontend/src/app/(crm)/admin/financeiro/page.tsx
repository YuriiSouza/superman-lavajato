"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Wallet,
  TrendingUp,
  Smartphone,
  ArrowDownCircle,
  Plus,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  FileText,
  Package,
  ChevronLeft,
  PiggyBank,
} from "lucide-react";
import { crm } from "@/lib/crm/api";
import NovaOSModal from "@/components/crm/NovaOSModal";
import ReceberPagamentoModal from "@/components/crm/ReceberPagamentoModal";
import VehicleTypeChart from "@/components/crm/VehicleTypeChart";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Crédito",
  CARTAO_DEBITO: "Débito",
};

const PAYMENT_COLOR: Record<string, string> = {
  PIX: "bg-sky-500",
  DINHEIRO: "bg-green-500",
  CARTAO_CREDITO: "bg-violet-500",
  CARTAO_DEBITO: "bg-amber-500",
};

const PAYMENT_BADGE: Record<string, string> = {
  DINHEIRO:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  PIX: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  CARTAO_CREDITO:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  CARTAO_DEBITO:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
};

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateOf(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── mini modal ────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button onClick={onClose}>
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

// ── page ─────────────────────────────────────────────────────────────────────

export default function CaixaPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // modais
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [outflowModal, setOutflowModal] = useState(false);
  const [novaOS, setNovaOS] = useState(false);
  const [osModal, setOsModal] = useState(false);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [loadingOS, setLoadingOS] = useState(false);
  const [paying, setPaying] = useState<any | null>(null);

  // caixas anteriores não fechados
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [closingPending, setClosingPending] = useState<any | null>(null);
  const [pendingCount, setPendingCount] = useState("");
  const [savingPending, setSavingPending] = useState(false);

  // forms
  const [openingBalance, setOpeningBalance] = useState("0");
  const [digitalOpening, setDigitalOpening] = useState("0");
  const [physicalCount, setPhysicalCount] = useState("");
  const [saving, setSaving] = useState(false);

  // outflow modal
  const [outflowType, setOutflowType] = useState<
    "EXPENSE" | "BILL" | "PRODUCT" | "RESERVE" | null
  >(null);
  const [outflowSource, setOutflowSource] = useState<"FISICO" | "DIGITAL">(
    "FISICO",
  );
  // EXPENSE
  const [outflowAmount, setOutflowAmount] = useState("");
  const [outflowReason, setOutflowReason] = useState("");
  // BILL
  const [outflowBills, setOutflowBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [billAmount, setBillAmount] = useState("");
  // PRODUCT
  const [outflowProducts, setOutflowProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productQty, setProductQty] = useState("");
  const [productAmount, setProductAmount] = useState("");
  const [productSupplier, setProductSupplier] = useState("");
  // RESERVE
  const [reserveBill, setReserveBill] = useState<any>(null);
  const [reserveAmount, setReserveAmount] = useState("");
  const [reserveNote, setReserveNote] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    crm.cash
      .today()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  function resetOutflowModal() {
    setOutflowModal(false);
    setOutflowType(null);
    setOutflowSource("FISICO");
    setOutflowAmount("");
    setOutflowReason("");
    setSelectedBill(null);
    setBillAmount("");
    setSelectedProduct(null);
    setProductQty("");
    setProductAmount("");
    setProductSupplier("");
    setReserveBill(null);
    setReserveAmount("");
    setReserveNote("");
  }

  function openOutflowModal() {
    setOutflowModal(true);
    crm.bills
      .list()
      .then((all: any[]) =>
        setOutflowBills(all.filter((b) => b.status !== "PAGO")),
      );
    crm.stock.products(true).then(setOutflowProducts);
  }

  function isOutflowValid() {
    if (outflowType === "BILL") return !!selectedBill && Number(billAmount) > 0;
    if (outflowType === "PRODUCT")
      return (
        !!selectedProduct && Number(productQty) > 0 && Number(productAmount) > 0
      );
    if (outflowType === "EXPENSE")
      return Number(outflowAmount) > 0 && !!outflowReason.trim();
    if (outflowType === "RESERVE")
      return !!reserveBill && Number(reserveAmount) > 0;
    return false;
  }

  useEffect(() => {
    load();
    crm.cash.pendingClose().then((sessions: any[]) => {
      setPendingSessions(sessions);
      if (sessions.length > 0) setClosingPending(sessions[0]);
    });
  }, [load]);

  async function handleClosePending() {
    if (!closingPending) return;
    setSavingPending(true);
    try {
      await crm.cash.closeById(
        closingPending.id,
        parseFloat(pendingCount) || 0,
      );
      const remaining = pendingSessions.filter(
        (s) => s.id !== closingPending.id,
      );
      setPendingSessions(remaining);
      setPendingCount("");
      setClosingPending(remaining.length > 0 ? remaining[0] : null);
    } finally {
      setSavingPending(false);
    }
  }

  function fmtDateBR(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  const loadOpenOrders = useCallback(() => {
    setLoadingOS(true);
    Promise.all([
      crm.orders.list({ status: "PENDENTE" }),
      crm.orders.list({ status: "EM_ANDAMENTO" }),
      crm.orders.list({ status: "CONCLUIDO" }),
    ])
      .then(([a, b, c]) =>
        setOpenOrders(
          [...a, ...b, ...c].sort(
            (x: any, y: any) =>
              new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
          ),
        ),
      )
      .finally(() => setLoadingOS(false));
  }, []);

  function openOsModal() {
    loadOpenOrders();
    setOsModal(true);
  }

  async function handlePaymentConfirm(
    payments: { method: string; amount: number }[],
  ) {
    await crm.orders.update(paying.id, { status: "PAGO", payments });
    setPaying(null);
    load();
    loadOpenOrders();
  }

  // ── ações ─────────────────────────────────────────────────────────────────

  async function openCashModal() {
    setOpenModal(true);
    try {
      const s = await crm.cash.suggestedOpening();
      setOpeningBalance(String(s.cash));
      setDigitalOpening(String(s.digital));
    } catch {
      /* sem sugestão, mantém 0 */
    }
  }

  async function handleOpen() {
    setSaving(true);
    try {
      await crm.cash.open({
        openingBalance: parseFloat(openingBalance.replace(",", ".")) || 0,
        digitalOpeningBalance:
          parseFloat(digitalOpening.replace(",", ".")) || 0,
        operatorName: session?.user?.name ?? "Operador",
      });
      setOpenModal(false);
      setOpeningBalance("0");
      setDigitalOpening("0");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    const count = parseFloat(physicalCount.replace(",", "."));
    if (isNaN(count)) return;
    setSaving(true);
    try {
      await crm.cash.close(count);
      setCloseModal(false);
      setPhysicalCount("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleOutflow() {
    if (!isOutflowValid()) return;
    setSaving(true);
    try {
      if (outflowType === "BILL" && selectedBill) {
        await crm.cash.outflow({
          type: "BILL",
          billId: selectedBill.id,
          amount: parseFloat(billAmount.replace(",", ".")),
          source: outflowSource,
        });
      } else if (outflowType === "PRODUCT" && selectedProduct) {
        await crm.cash.outflow({
          type: "PRODUCT",
          productId: selectedProduct.id,
          quantity: parseFloat(productQty.replace(",", ".")),
          amount: parseFloat(productAmount.replace(",", ".")),
          supplier: productSupplier.trim() || undefined,
          source: outflowSource,
        });
      } else if (outflowType === "RESERVE" && reserveBill) {
        await crm.cash.outflow({
          type: "RESERVE",
          billId: reserveBill.id,
          amount: parseFloat(reserveAmount.replace(",", ".")),
          reason: reserveNote.trim() || undefined,
          source: outflowSource,
        });
      } else if (outflowType === "EXPENSE") {
        await crm.cash.outflow({
          type: "EXPENSE",
          amount: parseFloat(outflowAmount.replace(",", ".")),
          reason: outflowReason.trim(),
          source: outflowSource,
        });
      }
      resetOutflowModal();
      load();
    } finally {
      setSaving(false);
    }
  }

  // ── estados derivados ──────────────────────────────────────────────────────

  const cashSession = data?.session ?? null;
  const isOpen = !!cashSession && !cashSession.closedAt;
  const isClosed = !!cashSession && !!cashSession.closedAt;
  const hasToday = !!cashSession;

  const revenue = data?.revenue ?? {
    total: 0,
    byPayment: {},
    ordersCount: 0,
    orders: [],
  };
  const cashReceived = data?.cashReceived ?? 0;
  const digitalReceived = data?.digitalReceived ?? 0;
  const digitalOpeningBalance = data?.digitalOpeningBalance ?? 0;
  const digitalBalance = data?.digitalBalance ?? 0;
  const cashOutflows = data?.cashOutflows ?? 0;
  const digitalOutflows = data?.digitalOutflows ?? 0;
  const outflowsTotal = data?.outflowsTotal ?? 0;
  const cashInDrawer = data?.cashInDrawer ?? 0;
  const difference = data?.difference ?? null;

  // contagem física digitada pelo usuário (preview em tempo real)
  const previewCount = parseFloat(physicalCount.replace(",", "."));
  const previewDiff = isNaN(previewCount) ? null : previewCount - cashInDrawer;

  // ── caixa fechado / não aberto ─────────────────────────────────────────────

  if (!loading && !hasToday) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Caixa do dia
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            O caixa ainda não foi aberto hoje.
          </p>
        </div>
        <button
          onClick={openCashModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <Unlock size={16} /> Abrir caixa
        </button>

        <Modal
          open={openModal}
          onClose={() => setOpenModal(false)}
          title="Abrir caixa"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dinheiro na gaveta (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Notas e moedas físicas na gaveta agora.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Saldo digital — banco / Pix (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={digitalOpening}
                onChange={(e) => setDigitalOpening(e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Saldo atual na conta bancária ou carteira digital.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Operador
              </label>
              <input
                value={session?.user?.name ?? ""}
                disabled
                className={`${inputCls} opacity-60`}
              />
            </div>
            <button
              onClick={handleOpen}
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
            >
              {saving ? "Abrindo..." : "Confirmar abertura"}
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // ── caixa aberto ou fechado ────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-5 overflow-x-hidden">
      {/* ── modal: caixa anterior não fechado ── */}
      {closingPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-5 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <AlertTriangle
                    size={18}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Caixa não fechado
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    O caixa de <strong>{fmtDateBR(closingPending.date)}</strong>{" "}
                    não foi fechado.
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Informe o valor físico em espécie contado no final daquele dia
                para registrar o fechamento.
              </p>

              <div className="space-y-1 mb-5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Dinheiro contado em {fmtDateBR(closingPending.date)}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={pendingCount}
                  onChange={(e) => setPendingCount(e.target.value)}
                  className={inputCls}
                  autoFocus
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Deixe em 0 se não souber o valor exato.
                </p>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={handleClosePending}
                disabled={savingPending}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {savingPending
                  ? "Fechando…"
                  : "Fechar caixa de " + fmtDateBR(closingPending.date)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── cabeçalho ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Caixa do dia
            </h1>
            <span
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                isOpen
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {isOpen ? (
                <>
                  <CheckCircle2 size={10} /> Aberto
                </>
              ) : (
                <>
                  <Lock size={10} /> Fechado
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {cashSession && ` · Operador: ${cashSession.operatorName}`}
            {cashSession?.openedAt &&
              ` · Aberto às ${timeOf(cashSession.openedAt)}`}
            {cashSession?.closedAt &&
              ` · Fechado às ${timeOf(cashSession.closedAt)}`}
          </p>
        </div>

        <div className="flex gap-2">
          {isOpen && (
            <>
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
              <button
                onClick={openOutflowModal}
                className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowDownCircle size={13} /> Sangria
              </button>
              <button
                onClick={() => {
                  load();
                  setCloseModal(true);
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                <Lock size={13} /> Fechar caixa
              </button>
            </>
          )}
          {isClosed && (
            <button
              onClick={async () => {
                await crm.cash.reopen();
                load();
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <Unlock size={13} /> Reabrir caixa
            </button>
          )}
        </div>
      </div>

      <NovaOSModal
        open={novaOS}
        onClose={() => setNovaOS(false)}
        onSuccess={() => {
          load();
          loadOpenOrders();
        }}
      />

      <ReceberPagamentoModal
        open={!!paying}
        totalValue={paying ? Number(paying.totalValue) : 0}
        clientName={
          paying ? `${paying.client?.name} — ${paying.vehicle?.plate}` : ""
        }
        onConfirm={handlePaymentConfirm}
        onClose={() => setPaying(null)}
      />

      {/* ── modal OS em aberto ── */}
      {osModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  OS em aberto
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {openOrders.length}{" "}
                  {openOrders.length === 1 ? "ordem" : "ordens"} pendentes
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
                    <div
                      key={i}
                      className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl"
                    />
                  ))}
                </div>
              ) : openOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                  <ClipboardList
                    size={32}
                    className="text-gray-300 dark:text-gray-600"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma OS em aberto
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {openOrders.map((o: any) => {
                    const statusColor: Record<string, string> = {
                      PENDENTE:
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
                      EM_ANDAMENTO:
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
                      CONCLUIDO:
                        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
                    };
                    const statusLabel: Record<string, string> = {
                      PENDENTE: "Aguardando",
                      EM_ANDAMENTO: "Em andamento",
                      CONCLUIDO: "Concluído",
                    };
                    return (
                      <div
                        key={o.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[o.status]}`}
                        >
                          {statusLabel[o.status]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            <span className="font-mono text-xs text-gray-400 dark:text-gray-500 mr-1.5">
                              {o.vehicle?.plate}
                            </span>
                            {o.client?.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {o.service?.name}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                          {fmt(Number(o.totalValue))}
                        </span>
                        <select
                          value={o.status}
                          onChange={(e) => {
                            const next = e.target.value;
                            if (next === "PAGO") {
                              setPaying(o);
                              setOsModal(false);
                            } else {
                              crm.orders
                                .update(o.id, { status: next })
                                .then(loadOpenOrders);
                            }
                          }}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 cursor-pointer"
                        >
                          {[
                            "PENDENTE",
                            "EM_ANDAMENTO",
                            "CONCLUIDO",
                            "PAGO",
                            "CANCELADO",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {
                                {
                                  PENDENTE: "Aguardando",
                                  EM_ANDAMENTO: "Em andamento",
                                  CONCLUIDO: "Concluído",
                                  PAGO: "Pago",
                                  CANCELADO: "Cancelado",
                                }[s]
                              }
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  setOsModal(false);
                  setNovaOS(true);
                }}
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

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"
            />
          ))}
        </div>
      ) : (
        <>
          {/* ── alerta de diferença no fechamento ── */}
          {isClosed && difference !== null && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                Math.abs(difference) < 0.01
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                  : difference < 0
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
              }`}
            >
              {Math.abs(difference) < 0.01 ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span>
                {Math.abs(difference) < 0.01
                  ? "Caixa fechado sem divergência."
                  : difference < 0
                    ? `Faltando ${fmt(Math.abs(difference))} na gaveta.`
                    : `Sobra de ${fmt(difference)} na gaveta.`}{" "}
                Contagem física: {fmt(Number(cashSession.physicalCount))}
              </span>
            </div>
          )}

          {/* ── cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-green-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receita total
                </p>
              </div>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                {fmt(revenue.total)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {revenue.ordersCount} OS · Dinheiro {fmt(cashReceived)} +
                Digital {fmt(digitalReceived)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-emerald-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Espécie na gaveta
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {fmt(cashInDrawer)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Abertura {fmt(Number(cashSession?.openingBalance ?? 0))} +
                recebido {fmt(cashReceived)}
                {cashOutflows > 0 && ` − sangrias ${fmt(cashOutflows)}`}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={14} className="text-blue-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Digital (Pix + Cartão)
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {fmt(digitalBalance)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Inicial {fmt(digitalOpeningBalance)} + recebido{" "}
                {fmt(digitalReceived)}
                {digitalOutflows > 0 && ` − saídas ${fmt(digitalOutflows)}`}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle size={14} className="text-red-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sangrias
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {fmt(outflowsTotal)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {cashOutflows > 0 && `Espécie ${fmt(cashOutflows)}`}
                {cashOutflows > 0 && digitalOutflows > 0 && " · "}
                {digitalOutflows > 0 && `Digital ${fmt(digitalOutflows)}`}
                {outflowsTotal === 0 && "—"}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-violet-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lucro líquido
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {fmt(revenue.total - outflowsTotal)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Receita {fmt(revenue.total)} − sangrias {fmt(outflowsTotal)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ticket médio
                </p>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {revenue.ordersCount > 0
                  ? fmt(revenue.total / revenue.ordersCount)
                  : "R$ 0,00"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {revenue.ordersCount > 0
                  ? `${fmt(revenue.total)} ÷ ${revenue.ordersCount} OS`
                  : "Nenhuma OS paga hoje"}
              </p>
            </div>
          </div>

          {/* ── veículos por tipo ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              OS por tipo de veículo
            </h2>
            <VehicleTypeChart days={90} />
          </div>

          {/* ── formas de pagamento ── */}
          {Object.keys(revenue.byPayment).length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Formas de pagamento
              </h2>
              <div className="space-y-2.5">
                {Object.entries(revenue.byPayment)
                  .sort(([, a]: any, [, b]: any) => b - a)
                  .map(([method, value]: any) => {
                    const pct =
                      revenue.total > 0 ? (value / revenue.total) * 100 : 0;
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <span
                              className={`w-2 h-2 rounded-full ${PAYMENT_COLOR[method] ?? "bg-gray-400"}`}
                            />
                            {PAYMENT_LABEL[method] ?? method}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {fmt(value)} · {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${PAYMENT_COLOR[method] ?? "bg-gray-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── lista de transações ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Transações do dia
              </h2>
            </div>
            {revenue.orders.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
                Nenhuma OS paga hoje.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {revenue.orders.map((o: any) => {
                  const payments: { method: string; amount: number }[] = o
                    .payments?.length
                    ? o.payments
                    : o.paymentMethod
                      ? [
                          {
                            method: o.paymentMethod,
                            amount: Number(o.totalValue),
                          },
                        ]
                      : [];
                  return (
                    <div
                      key={o.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div className="text-xs text-gray-400 dark:text-gray-500 w-10 shrink-0 font-mono pt-0.5">
                        {timeOf(o.createdAt)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            <span className="font-mono text-xs text-gray-400 dark:text-gray-500 mr-1">
                              {o.vehicle?.plate}
                            </span>
                            {o.client?.name}
                          </p>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                            {fmt(Number(o.totalValue))}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {o.service?.name}
                        </p>
                        {payments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {payments.map((p, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${PAYMENT_BADGE[p.method] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                              >
                                {PAYMENT_LABEL[p.method] ?? p.method}
                                {payments.length > 1 && (
                                  <span className="ml-1 opacity-75">
                                    {fmt(p.amount)}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── sangrias ── */}
          {(cashSession?.outflows?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Sangrias / Saídas
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {cashSession.outflows.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="text-xs text-gray-400 dark:text-gray-500 w-10 shrink-0 font-mono">
                      {timeOf(f.createdAt)}
                    </div>
                    <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {f.reason}
                    </p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        f.source === "DIGITAL"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                      }`}
                    >
                      {f.source === "DIGITAL" ? "Digital" : "Espécie"}
                    </span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0">
                      −{fmt(Number(f.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── modal sangria ── */}
      <Modal
        open={outflowModal}
        onClose={resetOutflowModal}
        title={
          outflowType === "BILL"
            ? "Pagar conta"
            : outflowType === "RESERVE"
              ? "Reservar para conta"
              : outflowType === "PRODUCT"
                ? "Compra de produto"
                : outflowType === "EXPENSE"
                  ? "Gasto avulso"
                  : "Registrar saída"
        }
      >
        {outflowType === null ? (
          /* ── escolha do tipo ── */
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Como você quer registrar essa saída?
            </p>
            {(
              [
                {
                  type: "BILL",
                  icon: <FileText size={18} />,
                  color: "text-violet-500",
                  label: "Pagar conta",
                  desc: "Quita uma conta a pagar cadastrada",
                },
                {
                  type: "RESERVE",
                  icon: <PiggyBank size={18} />,
                  color: "text-emerald-500",
                  label: "Reservar para conta",
                  desc: "Separa dinheiro para pagar futuramente",
                },
                {
                  type: "PRODUCT",
                  icon: <Package size={18} />,
                  color: "text-amber-500",
                  label: "Compra de produto",
                  desc: "Registra compra e entrada no estoque",
                },
                {
                  type: "EXPENSE",
                  icon: <ArrowDownCircle size={18} />,
                  color: "text-red-500",
                  label: "Gasto avulso",
                  desc: "Despesa avulsa ou sangria de caixa",
                },
              ] as const
            ).map(({ type, icon, color, label, desc }) => (
              <button
                key={type}
                onClick={() => setOutflowType(type)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <span className={`shrink-0 ${color}`}>{icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* voltar */}
            <button
              onClick={() => setOutflowType(null)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronLeft size={13} /> Voltar
            </button>

            {/* ── BILL ── */}
            {outflowType === "BILL" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Conta
                  </label>
                  {outflowBills.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
                      Nenhuma conta pendente. Cadastre em{" "}
                      <strong>Contas a pagar</strong>.
                    </p>
                  ) : (
                    <select
                      value={selectedBill?.id ?? ""}
                      onChange={(e) => {
                        const b =
                          outflowBills.find(
                            (b: any) => b.id === e.target.value,
                          ) ?? null;
                        setSelectedBill(b);
                        setBillAmount(b ? String(Number(b.amount)) : "");
                      }}
                      className={inputCls}
                    >
                      <option value="">Selecione uma conta…</option>
                      {outflowBills.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {fmt(Number(b.amount))}
                          {b.status === "VENCIDO" ? " ⚠" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedBill && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs space-y-1 text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Vencimento</span>
                        <span>
                          {new Date(selectedBill.dueDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor da conta</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {fmt(Number(selectedBill.amount))}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor pago (R$)
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── RESERVE ── */}
            {outflowType === "RESERVE" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Conta
                  </label>
                  {outflowBills.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
                      Nenhuma conta pendente. Cadastre em{" "}
                      <strong>Contas a pagar</strong>.
                    </p>
                  ) : (
                    <select
                      value={reserveBill?.id ?? ""}
                      onChange={(e) => {
                        const b =
                          outflowBills.find(
                            (b: any) => b.id === e.target.value,
                          ) ?? null;
                        setReserveBill(b);
                      }}
                      className={inputCls}
                    >
                      <option value="">Selecione uma conta…</option>
                      {outflowBills.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {fmt(Number(b.amount))}
                          {b.status === "VENCIDO" ? " ⚠" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {reserveBill && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 text-xs space-y-1 text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Vencimento</span>
                      <span>
                        {new Date(reserveBill.dueDate).toLocaleDateString(
                          "pt-BR",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total da conta</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {fmt(Number(reserveBill.amount))}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor a reservar (R$)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    value={reserveAmount}
                    onChange={(e) => setReserveAmount(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observação (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: parcela 1 de 2"
                    value={reserveNote}
                    onChange={(e) => setReserveNote(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </>
            )}

            {/* ── PRODUCT ── */}
            {outflowType === "PRODUCT" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Produto
                  </label>
                  {outflowProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
                      Nenhum produto cadastrado. Cadastre em{" "}
                      <strong>Estoque</strong>.
                    </p>
                  ) : (
                    <select
                      value={selectedProduct?.id ?? ""}
                      onChange={(e) => {
                        const p =
                          outflowProducts.find(
                            (p: any) => p.id === e.target.value,
                          ) ?? null;
                        setSelectedProduct(p);
                      }}
                      className={inputCls}
                    >
                      <option value="">Selecione um produto…</option>
                      {outflowProducts.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — estoque: {Number(p.quantity)} {p.unit}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedProduct && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    Estoque atual:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {Number(selectedProduct.quantity)} {selectedProduct.unit}
                    </span>
                    {selectedProduct.costPrice && (
                      <span>
                        {" "}
                        · Custo anterior:{" "}
                        {fmt(Number(selectedProduct.costPrice))}/
                        {selectedProduct.unit}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="1"
                      value={productQty}
                      onChange={(e) => setProductQty(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total pago (R$)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0,00"
                      value={productAmount}
                      onChange={(e) => setProductAmount(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {Number(productQty) > 0 && Number(productAmount) > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Custo unitário:{" "}
                    {fmt(Number(productAmount) / Number(productQty))}/
                    {selectedProduct?.unit ?? "un"}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fornecedor (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Distribuidora XYZ"
                    value={productSupplier}
                    onChange={(e) => setProductSupplier(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </>
            )}

            {/* ── EXPENSE ── */}
            {outflowType === "EXPENSE" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    value={outflowAmount}
                    onChange={(e) => setOutflowAmount(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: vale transporte, gorjeta…"
                    value={outflowReason}
                    onChange={(e) => setOutflowReason(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </>
            )}

            {/* origem — comum a todos os tipos */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Origem do valor
              </label>
              <div className="flex gap-2">
                {(["FISICO", "DIGITAL"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setOutflowSource(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      outflowSource === s
                        ? s === "FISICO"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {s === "FISICO" ? "Espécie (gaveta)" : "Digital (banco)"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOutflow}
              disabled={saving || !isOutflowValid()}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
            >
              {saving
                ? "Registrando…"
                : outflowType === "BILL"
                  ? "Confirmar pagamento"
                  : outflowType === "RESERVE"
                    ? "Confirmar reserva"
                    : outflowType === "PRODUCT"
                      ? "Confirmar compra"
                      : "Registrar saída"}
            </button>
          </div>
        )}
      </Modal>

      {/* ── modal fechar caixa ── */}
      <Modal
        open={closeModal}
        onClose={() => setCloseModal(false)}
        title="Fechar caixa"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 space-y-1 text-sm">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Gaveta (espécie)
            </p>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Abertura</span>
              <span className="text-gray-900 dark:text-gray-100">
                {fmt(Number(cashSession?.openingBalance ?? 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Dinheiro recebido
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {fmt(cashReceived)}
              </span>
            </div>
            {cashOutflows > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Sangrias espécie
                </span>
                <span className="text-red-500">−{fmt(cashOutflows)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
              <span className="text-gray-700 dark:text-gray-300">
                Esperado na gaveta
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {fmt(cashInDrawer)}
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Digital (banco / Pix)
              </p>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700 dark:text-gray-300">
                  Saldo estimado
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {fmt(digitalBalance)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quanto você contou na gaveta? (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>

          {previewDiff !== null && (
            <div
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                Math.abs(previewDiff) < 0.01
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : previewDiff < 0
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
              }`}
            >
              {Math.abs(previewDiff) < 0.01
                ? "✓ Caixa fechado sem divergência"
                : previewDiff < 0
                  ? `Faltando ${fmt(Math.abs(previewDiff))}`
                  : `Sobra de ${fmt(previewDiff)}`}
            </div>
          )}

          <button
            onClick={handleClose}
            disabled={saving || !physicalCount}
            className="w-full py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {saving ? "Fechando..." : "Confirmar fechamento"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
