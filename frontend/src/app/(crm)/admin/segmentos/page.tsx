'use client';

import { useEffect, useState } from 'react';
import { Crown, RefreshCw, Clock, Car, Repeat, MessageCircle, Tag, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { crm } from '@/lib/crm/api';
import OSActionsWidget from '@/components/crm/OSActionsWidget';

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/55${digits}`;
}

const SEGMENTS = [
  { key: 'vip', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { key: 'regular', icon: Repeat, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { key: 'churn', icon: Clock, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
  { key: 'premium', icon: Car, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800' },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
      {initials}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRequiresVehicle, setNewRequiresVehicle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRequiresVehicle, setEditRequiresVehicle] = useState(true);

  const load = () => {
    setLoading(true);
    crm.services.categories.list().then(setCategories).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await crm.services.categories.create({ name: newName.trim(), requiresVehicle: newRequiresVehicle });
      setNewName(''); setNewRequiresVehicle(true);
      load();
    } finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    try {
      await crm.services.categories.update(id, { name: editName.trim(), requiresVehicle: editRequiresVehicle });
      setEditId(null);
      load();
    } finally { setSaving(false); }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover categoria? Os serviços não serão apagados.')) return;
    await crm.services.categories.remove(id);
    load();
  }

  function startEdit(cat: any) {
    setEditId(cat.id); setEditName(cat.name); setEditRequiresVehicle(cat.requiresVehicle);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag size={16} className="text-blue-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Categorias de serviço</h2>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Categorias organizam seus serviços. Marque "requer veículo" quando o serviço é para carros, motos etc.
      </p>

      {/* New category form */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Nome da categoria..." value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={saving || !newName.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 shrink-0">
            <Plus size={14} /> Adicionar
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
          <input type="checkbox" checked={newRequiresVehicle}
            onChange={(e) => setNewRequiresVehicle(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600" />
          Requer veículo (carro, moto etc.)
        </label>
      </div>

      {/* Category list */}
      {loading ? (
        <div className="space-y-1.5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">Nenhuma categoria criada ainda.</p>
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
                      <input type="checkbox" checked={editRequiresVehicle}
                        onChange={(e) => setEditRequiresVehicle(e.target.checked)} />
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
                      {cat.requiresVehicle ? 'Requer veículo' : 'Sem veículo necessário'}
                    </p>
                  </div>
                  <button onClick={() => startEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleRemove(cat.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
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
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 overflow-x-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Segmentação de clientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Clique em um segmento para ver os clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg">
            <RefreshCw size={13} /> Atualizar
          </button>
          <OSActionsWidget />
        </div>
      </div>

      <CategoryManager />

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
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{seg.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{seg.count} clientes</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${color}`}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-current border-opacity-20 bg-white dark:bg-gray-900">
                  {seg.clients.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Nenhum cliente neste segmento.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                      {seg.clients.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-2 px-4 py-2.5">
                          <Avatar name={c.name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {c.phone}
                              {c.daysSince !== undefined && ` · ${c.daysSince} dias`}
                              {c.avgTicket && ` · ticket R$ ${Number(c.avgTicket).toFixed(2)}`}
                            </p>
                          </div>
                          {c.phone && (
                            <a
                              href={waLink(c.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-600 flex-shrink-0 p-0.5"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                          {key === 'churn' && (
                            <a href="/admin/reativacao" className="text-xs text-green-600 dark:text-green-400 hover:underline flex-shrink-0">
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
