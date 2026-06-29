'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const METODOS = [
  { value: 'DINHEIRO',       label: 'Dinheiro' },
  { value: 'PIX',            label: 'Pix' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de crédito' },
  { value: 'CARTAO_DEBITO',  label: 'Cartão de débito' },
];

interface Entry { method: string; amount: string }

interface Props {
  open: boolean;
  totalValue: number;
  clientName: string;
  onConfirm: (payments: { method: string; amount: number }[]) => void;
  onClose: () => void;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ReceberPagamentoModal({ open, totalValue, clientName, onConfirm, onClose }: Props) {
  const [entries, setEntries] = useState<Entry[]>([{ method: 'PIX', amount: '' }]);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const total = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const remaining = totalValue - total;
  const isValid = entries.length > 0 && entries.every(e => parseFloat(e.amount) > 0) && Math.abs(remaining) < 0.01;

  function addEntry() {
    setEntries(prev => [...prev, { method: 'DINHEIRO', amount: '' }]);
  }

  function removeEntry(i: number) {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  }

  function setEntry(i: number, field: keyof Entry, value: string) {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  }

  function fillRemaining(i: number) {
    if (remaining <= 0) return;
    setEntry(i, 'amount', remaining.toFixed(2));
  }

  async function handleConfirm() {
    if (!isValid) return;
    setSaving(true);
    const payments = entries.map(e => ({ method: e.method, amount: parseFloat(e.amount) }));
    await onConfirm(payments);
    setSaving(false);
    setEntries([{ method: 'PIX', amount: '' }]);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Receber pagamento</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{clientName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* total */}
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total da OS</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(totalValue)}</span>
          </div>

          {/* entradas */}
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select
                  value={entry.method}
                  onChange={e => setEntry(i, 'method', e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                >
                  {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>

                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entry.amount}
                    onChange={e => setEntry(i, 'amount', e.target.value)}
                    onFocus={() => { if (!entry.amount && remaining > 0) fillRemaining(i); }}
                    placeholder="0,00"
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(i)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* restante */}
          <div className={`flex justify-between items-center text-sm px-1 ${
            remaining < -0.01 ? 'text-red-500' : remaining > 0.01 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
          }`}>
            <span>{remaining < -0.01 ? 'Excedendo' : remaining > 0.01 ? 'Faltando' : '✓ Valor completo'}</span>
            {Math.abs(remaining) >= 0.01 && <span className="font-medium">{fmt(Math.abs(remaining))}</span>}
          </div>

          {/* adicionar forma */}
          <button
            onClick={addEntry}
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus size={14} /> Adicionar outra forma de pagamento
          </button>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || saving}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            {saving ? 'Confirmando…' : 'Confirmar recebimento'}
          </button>
        </div>
      </div>
    </div>
  );
}
