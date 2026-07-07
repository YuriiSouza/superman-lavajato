import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rotas bloqueadas por role (prefixo de pathname)
const BLOCKED_ROUTES: Record<string, string[]> = {
  CAIXA: [
    "/admin/dashboard",
    "/admin/caixa",
    "/admin/reativacao",
    "/admin/segmentos",
    "/admin/servicos",
  ],
  OPERADOR: [
    "/admin/dashboard",
    "/admin/caixa",
    "/admin/reativacao",
    "/admin/segmentos",
    "/admin/servicos",
    "/admin/usuarios",
    "/admin/financeiro",
  ],
};

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;

  // Protege toda área /admin — redireciona para login se não autenticado
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = (token.role as string) ?? "OPERADOR";
    const blocked = BLOCKED_ROUTES[role] ?? [];
    const isBlocked = blocked.some((route) => pathname.startsWith(route));

    if (isBlocked) {
      return NextResponse.redirect(new URL("/admin/sem-acesso", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
