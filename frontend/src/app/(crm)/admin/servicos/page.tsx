'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const EMPTY = { name: '', description: '', price: '', duration: '', features: '', highlight: false };

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function ServicosPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const load = () => {
    setLoading(true);
    crm.services.listAll().then(setServices).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModal(true);
  }

  function openEdit(s: any) {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? '',
      price: String(s.price),
      duration: String(s.duration),
      features: Array.isArray(s.features) ? s.features.join('\n') : '',
      highlight: s.highlight ?? false,
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.duration) return;
    setSaving(true);
    try {
      const features = form.features
        .split('\n')
        .map((f: string) => f.trim())
        .filter(Boolean);
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price.replace(',', '.')),
        duration: parseInt(form.duration),
        features,
        highlight: form.highlight,
      };
      if (editing) {
        await crm.services.update(editing.id, data);
      } else {
        await crm.services.create(data);
      }
      setModal(false);
      load();
    } finally { setSaving(false); }
  }

  async function handleToggleActive(s: any) {
    await crm.services.update(s.id, { active: !s.active });
    load();
  }

  async function handleDelete(s: any) {
    if (!confirm(`Remover "${s.name}"? OS vinculadas serão mantidas.`)) return;
    await crm.services.remove(s.id);
    load();
  }

  const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const visible = showInactive ? services : services.filter((s) => s.active);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Serviços</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {services.filter((s) => s.active).length} ativos · {services.filter((s) => !s.active).length} inativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
              showInactive
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {showInactive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {showInactive ? 'Ocultar inativos' : 'Ver inativos'}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Novo serviço
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            </div>
          ))
        ) : visible.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
            Nenhum serviço cadastrado.
          </p>
        ) : (
          visible.map((s) => (
            <div key={s.id} className={`flex items-center gap-4 px-4 py-3 ${!s.active ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                  {s.highlight && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                      Destaque
                    </span>
                  )}
                  {!s.active && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {s.duration} min
                  {s.description && ` · ${s.description}`}
                </p>
              </div>

              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                {fmt(Number(s.price))}
              </p>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(s)}
                  title={s.active ? 'Desativar' : 'Ativar'}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {s.active
                    ? <ToggleRight size={18} className="text-green-500" />
                    : <ToggleLeft size={18} />}
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar serviço' : 'Novo serviço'}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Lavagem Completa"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição curta
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Interna e externa para um carro impecável."
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0,00"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duração (min) *
              </label>
              <input
                type="number" min="1"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="30"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              O que está incluso (um item por linha)
            </label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"Lavagem externa completa\nAspiração interna\nLimpeza de vidros"}
              rows={4}
              className={inputCls}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.highlight}
              onChange={(e) => setForm({ ...form, highlight: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Destacar como "Mais escolhido" na landing page
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setModal(false)}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.price || !form.duration}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
