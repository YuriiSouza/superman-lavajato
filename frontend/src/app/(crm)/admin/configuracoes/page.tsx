'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { crm } from '@/lib/crm/api';

const DEFAULT_TEMPLATE =
  'Oi [primeiro_nome]! Já faz [dias] dias que o seu [carro] não aparece aqui. Que tal dar um pulinho? 🦸';

const PLACEHOLDERS = [
  { key: '[primeiro_nome]', label: 'Primeiro nome',  example: 'João'          },
  { key: '[nome]',          label: 'Nome completo',  example: 'João Silva'    },
  { key: '[carro]',         label: 'Carro',          example: 'Onix Prata'   },
  { key: '[placa]',         label: 'Placa',          example: 'TST0101A0'     },
  { key: '[dias]',          label: 'Dias sem visita', example: '35'           },
];

function buildPreview(template: string) {
  let t = template;
  for (const p of PLACEHOLDERS) t = t.replaceAll(p.key, p.example);
  return t;
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function ConfiguracoesPage() {
  const { data: session } = useSession();

  // ── senha ──────────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'As senhas novas não coincidem.' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'A nova senha deve ter ao menos 6 caracteres.' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await crm.auth.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: 'success', text: 'Senha alterada com sucesso.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err?.response?.data?.message ?? 'Erro ao alterar senha.' });
    } finally {
      setPwSaving(false);
    }
  }

  // ── template de reativação ─────────────────────────────────────────────────
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    crm.settings.get('reactivation_template')
      .then((d) => { if (d.value) setTemplate(d.value); })
      .finally(() => setTemplateLoading(false));
  }, []);

  function insertPlaceholder(key: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = template.slice(0, start) + key + template.slice(end);
    setTemplate(next);
    // reposiciona o cursor após o placeholder inserido
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + key.length, start + key.length);
    });
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    setTemplateSaving(true);
    setTemplateMsg(null);
    try {
      await crm.settings.set('reactivation_template', template);
      setTemplateMsg({ type: 'success', text: 'Template salvo com sucesso.' });
    } catch {
      setTemplateMsg({ type: 'error', text: 'Erro ao salvar template.' });
    } finally {
      setTemplateSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie sua conta e preferências</p>
      </div>

      {/* ── usuário ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Usuário logado</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold text-sm">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session?.user?.name ?? '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* ── template de reativação ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Mensagem de reativação (WhatsApp)
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Clique nos campos abaixo para inseri-los na mensagem.
        </p>

        {templateLoading ? (
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <form onSubmit={handleSaveTemplate} className="space-y-3">
            {/* chips de placeholders */}
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => insertPlaceholder(p.key)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-mono"
                >
                  {p.key}
                  <span className="font-sans text-blue-400 dark:text-blue-500 not-italic">→ {p.label}</span>
                </button>
              ))}
            </div>

            {/* editor */}
            <textarea
              ref={textareaRef}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />

            {/* preview */}
            <div className="rounded-lg bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-600 px-3 py-2.5">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Pré-visualização</p>
              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{buildPreview(template)}</p>
            </div>

            {templateMsg && (
              <p className={`text-xs px-3 py-2 rounded-lg ${
                templateMsg.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {templateMsg.text}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTemplate(DEFAULT_TEMPLATE)}
                className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Restaurar padrão
              </button>
              <button
                type="submit"
                disabled={templateSaving}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {templateSaving ? 'Salvando...' : 'Salvar template'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── alterar senha ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Alterar senha</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field === 'currentPassword' ? 'Senha atual' : field === 'newPassword' ? 'Nova senha' : 'Confirmar nova senha'}
              </label>
              <input
                type="password"
                value={pwForm[field]}
                onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                required
                className={inputCls}
              />
            </div>
          ))}
          {pwMsg && (
            <p className={`text-xs px-3 py-2 rounded-lg ${
              pwMsg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {pwMsg.text}
            </p>
          )}
          <button type="submit" disabled={pwSaving}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
            {pwSaving ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </div>

      {/* ── sair ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-900/40 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Sair do sistema</h2>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Encerrar sessão
        </button>
      </div>
    </div>
  );
}
