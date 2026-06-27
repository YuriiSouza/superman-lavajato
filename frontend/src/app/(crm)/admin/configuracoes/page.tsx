'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { crm } from '@/lib/crm/api';

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'error', text: 'As senhas novas não coincidem.' });
      return;
    }
    if (form.newPassword.length < 6) {
      setMsg({ type: 'error', text: 'A nova senha deve ter ao menos 6 caracteres.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await crm.auth.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ type: 'success', text: 'Senha alterada com sucesso.' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const detail = err?.response?.data?.message ?? 'Erro ao alterar senha.';
      setMsg({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie sua conta</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Usuário logado</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{session?.user?.name ?? '—'}</p>
            <p className="text-xs text-gray-500">{session?.user?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Alterar senha</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Senha atual</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {msg && (
            <p className={`text-xs px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-red-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Sair do sistema</h2>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
        >
          Encerrar sessão
        </button>
      </div>
    </div>
  );
}
