'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ShieldCheck, BadgeCheck, User } from 'lucide-react';
import { crm } from '@/lib/crm/api';
import { useSession } from 'next-auth/react';

type Role = 'ADMIN' | 'CAIXA' | 'OPERADOR';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  CAIXA: 'Caixa',
  OPERADOR: 'Operador',
};

const ROLE_COLOR: Record<Role, string> = {
  ADMIN: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  CAIXA: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  OPERADOR: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
};

const ROLE_ICON: Record<Role, typeof ShieldCheck> = {
  ADMIN: ShieldCheck,
  CAIXA: BadgeCheck,
  OPERADOR: User,
};

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ['Clientes', 'Ordens de serviço', 'Caixa do dia', 'Dashboard', 'Reativação', 'Segmentação', 'Serviços', 'Usuários', 'Configurações'],
  CAIXA: ['Clientes', 'Ordens de serviço', 'Caixa do dia', 'Configurações'],
  OPERADOR: ['Clientes', 'Ordens de serviço', 'Configurações'],
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'OPERADOR' as Role };

export default function UsuariosPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const currentRole = ((session?.user as any)?.role as Role) ?? 'OPERADOR';

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | { type: 'edit'; user: UserItem } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<UserItem | null>(null);

  const load = () => {
    setLoading(true);
    crm.users.list().then(setUsers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal('create');
  }

  function openEdit(user: UserItem) {
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setError('');
    setModal({ type: 'edit', user });
  }

  async function save() {
    if (!form.name.trim() || !form.email.trim()) { setError('Nome e email são obrigatórios.'); return; }
    if (modal === 'create' && form.password.length < 6) { setError('Senha mínima: 6 caracteres.'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') {
        await crm.users.create({ name: form.name, email: form.email, password: form.password, role: form.role });
      } else if (modal && typeof modal === 'object') {
        const data: any = { name: form.name, role: form.role };
        if (form.password.length >= 6) data.password = form.password;
        await crm.users.update(modal.user.id, data);
      }
      load();
      setModal(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(user: UserItem) {
    try {
      await crm.users.remove(user.id);
      load();
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erro ao remover.');
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usuários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie o acesso dos operadores ao sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Novo usuário
        </button>
      </div>

      {/* permissões por role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['ADMIN', 'CAIXA', 'OPERADOR'] as Role[]).map((r) => {
          const Icon = ROLE_ICON[r];
          return (
            <div key={r} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[r]}`}>
                  <span className="flex items-center gap-1"><Icon size={11} /> {ROLE_LABEL[r]}</span>
                </span>
              </div>
              <ul className="space-y-1">
                {ROLE_PERMISSIONS[r].map((p) => (
                  <li key={p} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* lista */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100">
          {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
        </div>

        {loading ? (
          <div className="p-4 space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((u) => {
              const Icon = ROLE_ICON[u.role];
              const isMe = u.id === currentUserId;
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                      {isMe && <span className="text-[10px] text-gray-400 dark:text-gray-500">(você)</span>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLOR[u.role]}`}>
                    <Icon size={11} /> {ROLE_LABEL[u.role]}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => setDeleteConfirm(u)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {modal === 'create' ? 'Novo usuário' : 'Editar usuário'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={modal !== 'create'}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha {modal !== 'create' && <span className="text-gray-400">(deixe em branco para não alterar)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil de acesso</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentRole === 'ADMIN' && (
                    <option value="ADMIN">Administrador — acesso total</option>
                  )}
                  <option value="CAIXA">Caixa — sem dashboards e histórico</option>
                  <option value="OPERADOR">Operador — só clientes e OS</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Remover usuário?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong>{deleteConfirm.name}</strong> perderá o acesso ao sistema imediatamente.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => remove(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
