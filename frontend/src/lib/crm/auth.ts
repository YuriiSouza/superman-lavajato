import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

async function refreshAccessToken(token: any) {
  // Sem refresh token armazenado (sessão antiga) → forçar novo login
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const { data } = await axios.post(
      `${process.env.API_INTERNAL_URL}/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${token.refreshToken}` },
        timeout: 8000, // 8s — dentro do limite de 10s do Vercel
      },
    );
    return {
      ...token,
      accessToken: data.accessToken,
      accessTokenExpires: Date.now() + 13 * 60 * 1000,
      error: undefined,
    };
  } catch (err: any) {
    // Erro de rede / timeout (backend hibernando) → mantém sessão, tenta de novo na próxima request
    const isAuthError =
      err?.response?.status === 401 || err?.response?.status === 403;
    if (!isAuthError) {
      return {
        ...token,
        // Estende o prazo por 2min para a próxima tentativa
        accessTokenExpires: Date.now() + 2 * 60 * 1000,
      };
    }
    // 401/403 real → refresh token inválido ou expirado → deslogar
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { data } = await axios.post(
            `${process.env.API_INTERNAL_URL}/auth/login`,
            { email: credentials?.email, password: credentials?.password },
          );
          if (data?.accessToken) {
            return {
              ...data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          id: user.id,
          role: (user as any).role,
          accessTokenExpires: Date.now() + 13 * 60 * 1000,
        };
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session as any).error = token.error;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
