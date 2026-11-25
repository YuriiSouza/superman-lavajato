"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  CAIXA: "/admin/financeiro",
  OPERADOR: "/admin/ordens",
};

// O login fica fora da área /admin (sem tema claro/escuro do CRM): usa sempre
// a identidade da marca, a mesma do site público.
const inputCls =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 transition-colors focus:border-kawasaki-500 focus:outline-none focus:ring-2 focus:ring-kawasaki-500/40";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha incorretos. Confira e tente de novo.");
      setLoading(false);
    } else {
      const session = await getSession();
      const role = (session?.user as any)?.role ?? "OPERADOR";
      router.push(HOME_BY_ROLE[role] ?? "/admin/clientes");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-white lg:flex-row">
      {/* foto da marca: faixa no topo no celular, metade da tela no desktop */}
      <div className="relative h-44 shrink-0 sm:h-56 lg:h-auto lg:w-1/2">
        <Image
          src="/fotos/hero.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-950 lg:bg-gradient-to-r" />
      </div>

      <main className="flex flex-1 items-start justify-center px-6 pb-12 lg:items-center lg:px-16 lg:py-12">
        <div className="w-full max-w-sm">
          <Image
            src="/logo-white.png"
            alt="Superman Estética Automotiva e Lava-Jato"
            width={1024}
            height={397}
            priority
            className="-ml-1 h-16 w-auto"
          />
          <h1 className="mt-8 text-2xl font-semibold">Entrar no sistema</h1>
          <p className="mt-1.5 text-sm text-white/60">
            Ordens de serviço, caixa e estoque do dia.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-white/80"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="voce@supermanlavajato.com.br"
                className={inputCls}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-white/80"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputCls}
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-kawasaki-500 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-kawasaki-400 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
