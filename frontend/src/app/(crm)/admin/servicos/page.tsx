'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2, ToggleLeft, ToggleRight, Tag, Check, Car } from 'lucide-react';
import { crm } from '@/lib/crm/api';

const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const EMPTY_FORM = { name: '', description: '', price: '', duration: '', features: '', highlight: false, categoryId: '' };

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

function CategorySection({ categories, onRefresh }: { categories: any[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newReqV, setNewReqV] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editReqV, setEditReqV] = useState(true);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await crm.services.categories.create({ name: newName.trim(), requiresVehicle: newReqV });
      setNewName(''); setNewReqV(true);
      onRefresh();
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try {
      await crm.services.categories.update(id, { name: editName.trim(), requiresVehicle: editReqV });
      setEditId(null);
      onRefresh();
    } finally { setSaving(false); }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover categoria? Os serviços vinculados ficam sem categoria.')) return;
    await crm.services.categories.remove(id);
    onRefresh();
  }

  function startEdit(cat: any) {
    setEditId(cat.id); setEditName(cat.name); setEditReqV(cat.requiresVehicle);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Categorias de serviço</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">({categories.length})</span>
        </div>
        <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3 space-y-3">
          {/* Create form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input className={inputCls} placeholder="Nome da categoria..."
                value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
              <button onClick={handleCreate} disabled={saving || !newName.trim()}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 shrink-0">
                <Plus size={14} /> Criar
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input type="checkbox" checked={newReqV} onChange={(e) => setNewReqV(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600" />
              Requer veículo (carro, moto etc.)
            </label>
          </div>

          {/* List */}
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Nenhuma categoria ainda.</p>
          ) : (
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                  {editId === cat.id ? (
                    <>
                      <div className="flex-1 space-y-1">
                        <input className={inputCls + ' py-1'} value={editName}
                          onChange={(e) => setEditName(e.target.value)} />
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={editReqV}
                            onChange={(e) => setEditReqV(e.target.checked)} />
                          Requer veículo
                        </label>
                      </div>
                      <button onClick={() => handleUpdate(cat.id)} disabled={saving}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{cat.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {cat.requiresVehicle ? <span className="flex items-center gap-1"><Car size={10} /> Requer veículo</span> : 'Sem veículo'}
                        </p>
                      </div>
                      <button onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleRemove(cat.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServicosPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const loadCategories = () =>
    crm.services.categories.list().then((r) => setCategories(Array.isArray(r) ? r : []));

  const load = () => {
    setLoading(true);
    Promise.all([crm.services.listAll(), crm.services.categories.list()])
      .then(([svcs, cats]) => {
        setServices(Array.isArray(svcs) ? svcs : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
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
      categoryId: s.categoryId ?? '',
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.duration) return;
    setSaving(true);
    try {
      const features = form.features.split('\n').map((f: string) => f.trim()).filter(Boolean);
      const data: any = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price.replace(',', '.')),
        duration: parseInt(form.duration),
        features,
        highlight: form.highlight,
        categoryId: form.categoryId || null,
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

  // Group services by category for display
  const grouped: Record<string, { label: string; services: any[] }> = {};
  for (const s of visible) {
    const key = s.categoryId ?? '__sem__';
    if (!grouped[key]) grouped[key] = { label: s.category?.name ?? 'Sem categoria', services: [] };
    grouped[key].services.push(s);
  }
  const groups = Object.entries(grouped);

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

      {/* Categories management */}
      <CategorySection categories={categories} onRefresh={() => loadCategories().then()} />

      {/* Services list grouped by category */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum serviço cadastrado.</p>
          </div>
        ) : (
          groups.map(([key, group]) => (
            <div key={key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                <Tag size={13} className="text-blue-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {group.label}
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {group.services.map((s) => (
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
                      <button onClick={() => handleToggleActive(s)} title={s.active ? 'Desativar' : 'Ativar'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        {s.active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar serviço' : 'Novo serviço'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria *</label>
            <select className={inputCls} value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— Sem categoria —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{!c.requiresVehicle ? ' (sem veículo)' : ''}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Crie uma categoria primeiro na seção acima.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Lavagem Completa" className={inputCls} autoFocus />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição curta</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Interna e externa para um carro impecável." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$) *</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0,00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duração (min) *</label>
              <input type="number" min="1" value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="30" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              O que está incluso (um item por linha)
            </label>
            <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder={"Lavagem externa completa\nAspiração interna\nLimpeza de vidros"}
              rows={4} className={inputCls} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.highlight}
              onChange={(e) => setForm({ ...form, highlight: e.target.checked })}
              className="rounded border-gray-300 text-blue-600" />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              Destacar como "Mais escolhido" na landing page
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setModal(false)}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.price || !form.duration}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
