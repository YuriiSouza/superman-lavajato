"use client";

import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { crm } from "@/lib/crm/api";
import { SITE_DEFAULTS, type SiteSettings } from "@/lib/site";

const DEFAULT_TEMPLATE =
  "Oi [primeiro_nome]! Já faz [dias] dias que o seu [carro] não aparece aqui. Que tal dar um pulinho? 🦸";

const PLACEHOLDERS = [
  { key: "[primeiro_nome]", label: "Primeiro nome", example: "João" },
  { key: "[nome]", label: "Nome completo", example: "João Silva" },
  { key: "[carro]", label: "Carro", example: "Onix Prata" },
  { key: "[placa]", label: "Placa", example: "TST0101A0" },
  { key: "[dias]", label: "Dias sem visita", example: "35" },
];

function buildPreview(template: string) {
  let t = template;
  for (const p of PLACEHOLDERS) t = t.replaceAll(p.key, p.example);
  return t;
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

function Msg({
  msg,
}: {
  msg: { type: "success" | "error"; text: string } | null;
}) {
  if (!msg) return null;
  return (
    <p
      className={`text-xs px-3 py-2 rounded-lg ${
        msg.type === "success"
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      }`}
    >
      {msg.text}
    </p>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession();

  // ── senha ──────────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "As senhas novas não coincidem." });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({
        type: "error",
        text: "A nova senha deve ter ao menos 6 caracteres.",
      });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await crm.auth.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: "success", text: "Senha alterada com sucesso." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPwMsg({
        type: "error",
        text: err?.response?.data?.message ?? "Erro ao alterar senha.",
      });
    } finally {
      setPwSaving(false);
    }
  }

  // ── informações da empresa ─────────────────────────────────────────────────
  const [company, setCompany] = useState<SiteSettings>(SITE_DEFAULTS);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyMsg, setCompanyMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    crm.settings
      .get("company_info")
      .then((d) => {
        if (d.value) setCompany({ ...SITE_DEFAULTS, ...JSON.parse(d.value) });
      })
      .finally(() => setCompanyLoading(false));
  }, []);

  function updateHour(index: number, field: "day" | "time", value: string) {
    setCompany((c) => {
      const hours = [...c.hours];
      hours[index] = { ...hours[index], [field]: value };
      return { ...c, hours };
    });
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setCompanySaving(true);
    setCompanyMsg(null);
    try {
      await crm.settings.set("company_info", JSON.stringify(company));
      setCompanyMsg({
        type: "success",
        text: "Informações salvas com sucesso.",
      });
    } catch {
      setCompanyMsg({ type: "error", text: "Erro ao salvar informações." });
    } finally {
      setCompanySaving(false);
    }
  }

  // ── template de reativação ─────────────────────────────────────────────────
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    crm.settings
      .get("reactivation_template")
      .then((d) => {
        if (d.value) setTemplate(d.value);
      })
      .finally(() => setTemplateLoading(false));
  }, []);

  function insertPlaceholder(key: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = template.slice(0, start) + key + template.slice(end);
    setTemplate(next);
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
      await crm.settings.set("reactivation_template", template);
      setTemplateMsg({ type: "success", text: "Template salvo com sucesso." });
    } catch {
      setTemplateMsg({ type: "error", text: "Erro ao salvar template." });
    } finally {
      setTemplateSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-2">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Configurações
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gerencie sua conta e as informações da empresa
        </p>
      </div>

      {/* Layout de duas colunas no desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        {/* ── Coluna esquerda: conta ── */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Avatar + info */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-base shrink-0">
                {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {session?.user?.name ?? "—"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.email ?? "—"}
                </p>
              </div>
            </div>

            {/* Alterar senha */}
            <form
              onSubmit={handleChangePassword}
              className="px-6 py-5 space-y-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Alterar senha
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha atual
                </label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, currentPassword: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, newPassword: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirmPassword: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </div>
              <Msg msg={pwMsg} />
              <button
                type="submit"
                disabled={pwSaving}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {pwSaving ? "Salvando..." : "Alterar senha"}
              </button>
            </form>

            {/* Sair */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Encerrar sessão
              </button>
            </div>
          </div>
        </div>

        {/* ── Coluna direita: empresa + template ── */}
        <div className="space-y-6">
          {/* Informações da empresa */}
          <Card
            title="Informações da empresa"
            description="Esses dados aparecem na landing page — rodapé, localização e botões de WhatsApp."
          >
            {companyLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-9 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSaveCompany} className="space-y-5">
                {/* Identidade */}
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Identidade
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da empresa
                      </label>
                      <input
                        value={company.name}
                        onChange={(e) =>
                          setCompany({ ...company, name: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Slogan
                      </label>
                      <input
                        value={company.tagline}
                        onChange={(e) =>
                          setCompany({ ...company, tagline: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição (SEO / meta description)
                    </label>
                    <textarea
                      value={company.description}
                      onChange={(e) =>
                        setCompany({ ...company, description: e.target.value })
                      }
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </fieldset>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Contato */}
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Contato
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        WhatsApp{" "}
                        <span className="font-normal text-gray-400">
                          (só dígitos, com DDI)
                        </span>
                      </label>
                      <input
                        value={company.phone}
                        onChange={(e) =>
                          setCompany({
                            ...company,
                            phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="5562981891074"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefone{" "}
                        <span className="font-normal text-gray-400">
                          (exibição no site)
                        </span>
                      </label>
                      <input
                        value={company.phoneDisplay}
                        onChange={(e) =>
                          setCompany({
                            ...company,
                            phoneDisplay: e.target.value,
                          })
                        }
                        placeholder="(62) 98189-1074"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={company.email}
                        onChange={(e) =>
                          setCompany({ ...company, email: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Endereço
                      </label>
                      <input
                        value={company.address}
                        onChange={(e) =>
                          setCompany({ ...company, address: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Redes sociais */}
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Redes sociais
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Instagram
                      </label>
                      <input
                        value={company.instagram}
                        onChange={(e) =>
                          setCompany({ ...company, instagram: e.target.value })
                        }
                        placeholder="https://instagram.com/..."
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Facebook
                      </label>
                      <input
                        value={company.facebook}
                        onChange={(e) =>
                          setCompany({ ...company, facebook: e.target.value })
                        }
                        placeholder="https://facebook.com/..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Localização */}
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Localização (Google Maps)
                  </legend>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link embed{" "}
                      <span className="font-normal text-gray-400">
                        (iframe src — termina com &output=embed)
                      </span>
                    </label>
                    <input
                      value={company.mapsEmbed}
                      onChange={(e) =>
                        setCompany({ ...company, mapsEmbed: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link "Como chegar"
                    </label>
                    <input
                      value={company.mapsDirections}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          mapsDirections: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </fieldset>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Horário */}
                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Horário de funcionamento
                  </legend>
                  {company.hours.map((h, i) => (
                    <div key={i} className="grid grid-cols-[1fr_160px] gap-2">
                      <input
                        value={h.day}
                        onChange={(e) => updateHour(i, "day", e.target.value)}
                        placeholder="Segunda a Sexta"
                        className={inputCls}
                      />
                      <input
                        value={h.time}
                        onChange={(e) => updateHour(i, "time", e.target.value)}
                        placeholder="08:00 — 18:00"
                        className={inputCls}
                      />
                    </div>
                  ))}
                </fieldset>

                <Msg msg={companyMsg} />

                <button
                  type="submit"
                  disabled={companySaving}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
                >
                  {companySaving
                    ? "Salvando..."
                    : "Salvar informações da empresa"}
                </button>
              </form>
            )}
          </Card>

          {/* Template de reativação */}
          <Card
            title="Mensagem de reativação (WhatsApp)"
            description="Clique nos campos abaixo para inseri-los na posição do cursor."
          >
            {templateLoading ? (
              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ) : (
              <form onSubmit={handleSaveTemplate} className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => insertPlaceholder(p.key)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-mono"
                    >
                      {p.key}
                      <span className="font-sans text-blue-400 dark:text-blue-500">
                        → {p.label}
                      </span>
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                />

                <div className="rounded-lg bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-600 px-3 py-2.5">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                    Pré-visualização
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                    {buildPreview(template)}
                  </p>
                </div>

                <Msg msg={templateMsg} />

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
                    {templateSaving ? "Salvando..." : "Salvar template"}
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
