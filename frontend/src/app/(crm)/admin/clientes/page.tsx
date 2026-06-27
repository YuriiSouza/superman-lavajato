'use client';

import { useEffect, useState, useTransition } from 'react';
import { Search, Plus, X, ChevronRight } from 'lucide-react';
import { crm } from '@/lib/crm/api';

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [, startTransition] = useTransition();

  const load = (q?: string) => {
    setLoading(true);
    crm.clients.list(q).then(setClients).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function handleSearch(q: string) {
    setSearch(q);
    startTransition(() => load(q));
  }

  async function handleSave() {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      if (selected) {
        await crm.clients.update(selected.id, form);
      } else {
        await crm.clients.create(form);
      }
      setModal(false);
      setForm({ name: '', phone: '', notes: '' });
      setSelected(null);
      load(search);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(c: any) {
    setSelected(c);
    setForm({ name: c.name, phone: c.phone, notes: c.notes ?? '' });
    setModal(true);
  }

  const segmentLabel = (c: any) => {
    const orders = c._count?.orders ?? 0;
    if (orders === 0) return { label: 'Novo', cls: 'bg-gray-100 text-gray-600' };
    if (orders >= 4) return { label: 'VIP', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Regular', cls: 'bg-blue-100 text-blue-700' };
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{clients.length} cadastrados</p>
        </div>
        <button
          onClick={() => { setSelected(null); setForm({ name: '', phone: '', notes: '' }); setModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))
        ) : clients.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Nenhum cliente encontrado.</p>
        ) : (
          clients.map((c) => {
            const seg = segmentLabel(c);
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(c)}>
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${seg.cls}`}>{seg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{c.phone} · {c._count?.orders ?? 0} atendimentos · {c.vehicles?.length ?? 0} veículo(s)</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            );
          })
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={selected ? 'Editar cliente' : 'Novo cliente'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="João Silva" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Telefone (WhatsApp) *</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} placeholder="Ex: prefere atendimento pela manhã"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.phone}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
