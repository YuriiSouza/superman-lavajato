'use client';

import { useEffect, useState, useCallback } from 'react';
import { Package, Plus, X, AlertTriangle, ClipboardList, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const UNIT_OPTIONS = ['unidade', 'litro', 'ml', 'kg', 'g', 'frasco', 'caixa', 'par'];

const fmt     = (v: number) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtMoney = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

const inputCls =
  'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function EstoquePage() {
  const [products, setProducts]       = useState<any[]>([]);
  const [alerts, setAlerts]           = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<Record<string, any>>({});
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [history, setHistory]         = useState<Record<string, any>>({});

  // modais
  const [showNew, setShowNew]         = useState(false);
  const [countModal, setCountModal]   = useState(false);

  // forms
  const [form, setForm] = useState({ name: '', unit: 'unidade', minQuantity: '', costPrice: '' });

  // contagem periódica
  const [countValues, setCountValues] = useState<Record<string, string>>({});
  const [countNotes, setCountNotes]   = useState('');
  const [savingCount, setSavingCount] = useState(false);
  const [countSaved, setCountSaved]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, a, intel] = await Promise.all([
      crm.stock.products(),
      crm.stock.alerts(),
      crm.stock.intelligence(),
    ]);
    setProducts(p);
    setAlerts(a);
    const intelMap: Record<string, any> = {};
    for (const item of intel) intelMap[item.id] = item;
    setIntelligence(intelMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCountModal() {
    // pré-preenche com a quantidade atual de cada produto
    const initial: Record<string, string> = {};
    for (const p of products) initial[p.id] = String(Number(p.quantity));
    setCountValues(initial);
    setCountNotes('');
    setCountSaved(false);
    setCountModal(true);
  }

  async function handleCount() {
    const items = Object.entries(countValues)
      .map(([productId, qty]) => ({ productId, quantity: parseFloat(qty) || 0 }))
      .filter((item) => !isNaN(item.quantity));

    if (items.length === 0) return;
    setSavingCount(true);
    try {
      await crm.stock.submitCount(items, countNotes.trim() || undefined);
      setCountSaved(true);
      await load();
      setTimeout(() => setCountModal(false), 1200);
    } finally {
      setSavingCount(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await crm.stock.createProduct({
      name: form.name,
      unit: form.unit,
      minQuantity: form.minQuantity ? Number(form.minQuantity) : 0,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
    });
    setShowNew(false);
    setForm({ name: '', unit: 'unidade', minQuantity: '', costPrice: '' });
    load();
  }

  async function toggleExpanded(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!history[id]) {
      const h = await crm.stock.history(id);
      setHistory((prev) => ({ ...prev, [id]: h }));
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estoque</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCountModal}
            disabled={products.length === 0}
            className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            <ClipboardList size={13} /> Registrar contagem
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} /> Novo produto
          </button>
        </div>
      </div>

      {/* alertas */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {alerts.length} produto(s) abaixo do estoque mínimo
            </span>
          </div>
          <div className="space-y-1">
            {alerts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
                <span>{p.name}</span>
                <span>{fmt(Number(p.quantity))} {p.unit} (mín: {fmt(Number(p.minQuantity))})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* lista de produtos */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum produto cadastrado</p>
          </div>
        ) : (
          products.map((p: any) => {
            const low   = Number(p.quantity) <= Number(p.minQuantity);
            const intel = intelligence[p.id];
            const sinceCount = intel?.lastCountedAt ? daysSince(intel.lastCountedAt) : null;

            return (
              <div key={p.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                      {low && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {fmt(Number(p.quantity))} {p.unit}
                      {Number(p.minQuantity) > 0 && <span> · mín {fmt(Number(p.minQuantity))}</span>}
                      {p.costPrice && <span> · {fmtMoney(Number(p.costPrice))}/{p.unit}</span>}
                      {sinceCount !== null && (
                        <span className={sinceCount > 2 ? 'text-amber-400' : 'text-gray-400'}>
                          {' · contagem '}
                          {sinceCount === 0 ? 'hoje' : sinceCount === 1 ? 'ontem' : `${sinceCount}d atrás`}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* previsão de esgotamento */}
                  {intel && intel.avgDailyUsage > 0 && (() => {
                    const days  = intel.estimatedDaysLeft;
                    const color = days <= 7 ? 'text-red-500 font-semibold' : days <= 14 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500';
                    return (
                      <span className={`text-xs shrink-0 ${color}`} title={`Esgota em ${intel.estimatedStockoutDate}`}>
                        {days <= 0 ? 'Esgotado' : `${days}d`}
                      </span>
                    );
                  })()}

                  <button
                    onClick={() => toggleExpanded(p.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {expanded === p.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {expanded === p.id && history[p.id] && (
                  <div className="px-4 pb-3 bg-gray-50 dark:bg-gray-800/50 text-xs space-y-2">
                    <div className="flex items-center justify-between pt-2">
                      <p className="font-medium text-gray-600 dark:text-gray-400">Histórico</p>
                      {intel?.avgDailyUsage > 0 && (
                        <div className="flex gap-3 text-gray-400 dark:text-gray-500">
                          <span>Consumo: <strong>{intel.avgDailyUsage} {p.unit}/dia</strong></span>
                          {intel.estimatedStockoutDate && (
                            <span>Esgota: <strong>{new Date(intel.estimatedStockoutDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                    {history[p.id].entries.length === 0 && (
                      <p className="text-gray-400">Sem compras registradas</p>
                    )}
                    {history[p.id].entries.map((e: any) => (
                      <div key={e.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-400">+ {fmt(Number(e.quantity))} {p.unit}</span>
                        <span>{e.supplier ?? '—'}</span>
                        <span>{new Date(e.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── modal contagem periódica ── */}
      {countModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Contagem de estoque</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={() => setCountModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700">
              <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Informe a quantidade física de cada produto agora. Os valores já estão pré-preenchidos com o estoque atual — altere apenas o que mudou.
                </p>
              </div>
              {products.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    {p.costPrice && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {fmtMoney(Number(p.costPrice))}/{p.unit}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={countValues[p.id] ?? ''}
                      onChange={(e) => setCountValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-12">{p.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Observação (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: contagem noturna, após limpeza…"
                  value={countNotes}
                  onChange={(e) => setCountNotes(e.target.value)}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <button
                onClick={handleCount}
                disabled={savingCount || countSaved}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  countSaved
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                }`}
              >
                {countSaved ? (
                  <><CheckCircle2 size={16} /> Contagem salva!</>
                ) : savingCount ? 'Salvando…' : 'Salvar contagem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── modal novo produto ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Novo produto</h2>
              <button onClick={() => setShowNew(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Nome</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Unidade</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className={`mt-1 ${inputCls}`}
                >
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Qtd mínima</label>
                  <input
                    type="number" step="0.001" min="0"
                    value={form.minQuantity}
                    onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                    className={`mt-1 ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Custo unitário</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="R$"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className={`mt-1 ${inputCls}`}
                  />
                </div>
              </div>
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
