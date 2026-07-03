'use client';

import { useEffect, useState, useCallback } from 'react';
import { Receipt, Plus, X, CheckCircle2, AlertTriangle, Clock, PiggyBank } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const CATEGORIES: Record<string, string> = {
  PRODUTO: 'Produto', COMBUSTIVEL: 'Combustível', MANUTENCAO: 'Manutenção',
  SALARIO: 'Salário', ALUGUEL: 'Aluguel', CONTA: 'Conta/Serviço', OUTRO: 'Outro',
};

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  PAGO:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  VENCIDO:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDENTE: <Clock size={12} />,
  PAGO:     <CheckCircle2 size={12} />,
  VENCIDO:  <AlertTriangle size={12} />,
};

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const inputCls = 'mt-1 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function ContasPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [showNew, setShowNew] = useState(false);

  // mapa billId → reservedTotal
  const [reserveMap, setReserveMap] = useState<Record<string, number>>({});
  // modal de reserva por conta
  const [reserveTarget, setReserveTarget] = useState<any | null>(null);
  const [reserveAmt, setReserveAmt] = useState('');
  const [reserveNote, setReserveNote] = useState('');
  const [savingReserve, setSavingReserve] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'OUTRO', amount: '', dueDate: '', notes: '', recurring: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [b, s, groups] = await Promise.all([
      crm.bills.list(filter || undefined),
      crm.bills.summary(),
      crm.financial.reserves.list(),
    ]);
    setBills(b);
    setSummary(s);
    const map: Record<string, number> = {};
    for (const g of groups as any[]) map[g.bill.id] = g.reservedTotal;
    setReserveMap(map);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await crm.bills.create({
      name: form.name,
      category: form.category,
      amount: Number(form.amount),
      dueDate: form.dueDate,
      notes: form.notes || undefined,
      recurring: form.recurring,
    });
    setShowNew(false);
    setForm({ name: '', category: 'OUTRO', amount: '', dueDate: '', notes: '', recurring: false });
    load();
  }

  async function markPaid(id: string) {
    await crm.bills.markPaid(id);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Remover esta conta?')) return;
    await crm.bills.remove(id);
    load();
  }

  async function handleAddReserve() {
    const amount = parseFloat(reserveAmt.replace(',', '.'));
    if (!amount || !reserveTarget) return;
    setSavingReserve(true);
    try {
      await crm.financial.reserves.create({
        billId: reserveTarget.id,
        amount,
        description: reserveNote.trim() || undefined,
      });
      setReserveTarget(null);
      setReserveAmt('');
      setReserveNote('');
      load();
    } finally { setSavingReserve(false); }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contas a Pagar</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Gerenciamento financeiro</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={13} /> Nova conta
        </button>
      </div>

      {/* resumo */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pendente</p>
            <p className="text-base font-semibold text-yellow-600 dark:text-yellow-400">{fmt(summary.pending.total)}</p>
            <p className="text-xs text-gray-400">{summary.pending.count} conta(s)</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vencido</p>
            <p className="text-base font-semibold text-red-600 dark:text-red-400">{fmt(summary.overdue.total)}</p>
            <p className="text-xs text-gray-400">{summary.overdue.count} conta(s)</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pago (mês)</p>
            <p className="text-base font-semibold text-green-600 dark:text-green-400">{fmt(summary.paidThisMonth.total)}</p>
            <p className="text-xs text-gray-400">{summary.paidThisMonth.count} conta(s)</p>
          </div>
        </div>
      )}

      {/* filtros */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDENTE', 'VENCIDO', 'PAGO'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {s === '' ? 'Todas' : s === 'PENDENTE' ? 'Pendentes' : s === 'VENCIDO' ? 'Vencidas' : 'Pagas'}
          </button>
        ))}
      </div>

      {/* lista */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : bills.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conta encontrada</p>
          </div>
        ) : (
          bills.map((b: any) => {
            const reserved = reserveMap[b.id] ?? 0;
            const billAmt = Number(b.amount);
            const pct = billAmt > 0 ? Math.min(100, Math.round((reserved / billAmt) * 100)) : 0;
            return (
              <div key={b.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{b.name}</p>
                      {b.recurring && <span className="text-xs text-blue-500">recorrente</span>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {CATEGORIES[b.category] ?? b.category} · Vence {new Date(b.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">{fmt(b.amount)}</span>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[b.status]}`}>
                    {STATUS_ICON[b.status]}
                    {b.status === 'PENDENTE' ? 'Pendente' : b.status === 'PAGO' ? 'Pago' : 'Vencido'}
                  </span>
                  {b.status !== 'PAGO' && (
                    <>
                      <button
                        onClick={() => { setReserveTarget(b); setReserveAmt(''); setReserveNote(''); }}
                        className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline shrink-0"
                        title="Adicionar à reserva"
                      >
                        <PiggyBank size={12} /> Reservar
                      </button>
                      <button
                        onClick={() => markPaid(b.id)}
                        className="text-xs text-green-600 dark:text-green-400 hover:underline shrink-0"
                      >
                        Pagar
                      </button>
                    </>
                  )}
                  <button onClick={() => remove(b.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 shrink-0">
                    <X size={14} />
                  </button>
                </div>
                {/* barra de reserva (só aparece quando há algo reservado) */}
                {reserved > 0 && b.status !== 'PAGO' && (
                  <div className="mt-2 ml-0">
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <PiggyBank size={10} /> {fmt(reserved)} reservado ({pct}%)
                      </span>
                      <span>falta {fmt(Math.max(0, billAmt - reserved))}</span>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-purple-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* modal reserva por conta */}
      {reserveTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Reservar para esta conta</h2>
              <button onClick={() => setReserveTarget(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-4">
              {reserveTarget.name} — {fmt(Number(reserveTarget.amount))}
              {(reserveMap[reserveTarget.id] ?? 0) > 0 && (
                <span className="ml-1 text-gray-400">({fmt(reserveMap[reserveTarget.id])} já reservado)</span>
              )}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Valor a reservar (R$)</label>
                <input
                  type="number" step="0.01" min="0.01" placeholder="0,00"
                  value={reserveAmt}
                  onChange={(e) => setReserveAmt(e.target.value)}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Observação (opcional)</label>
                <input
                  value={reserveNote}
                  onChange={(e) => setReserveNote(e.target.value)}
                  placeholder="Ex: 1ª parcela"
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setReserveTarget(null)}
                  className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button
                  onClick={handleAddReserve}
                  disabled={savingReserve || !reserveAmt}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg"
                >
                  {savingReserve ? 'Salvando...' : 'Reservar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* modal nova conta */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Nova conta</h2>
              <button onClick={() => setShowNew(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Descrição</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Valor</label>
                  <input required type="number" step="0.01" min="0.01" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="R$"
                    className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Vencimento</label>
                <input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Observação</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                  className="rounded" />
                Conta recorrente (mensal)
              </label>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg mt-2 transition-colors">
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
