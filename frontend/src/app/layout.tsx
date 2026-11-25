import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { fetchSiteSettings } from "@/lib/site";
import AuthSessionProvider from "@/components/crm/SessionProvider";
import { THEME_INIT_SCRIPT } from "@/components/crm/theme-script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display condensada (ar de placa e automobilismo): placas e números principais
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSiteSettings();
  return {
    metadataBase: new URL("https://supermanlavajato.com.br"),
    title: {
      default: `${site.name} — ${site.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    keywords: [
      "lava a jato",
      "lavagem de carro",
      "enceramento",
      "detalhamento automotivo",
      site.name,
    ],
    openGraph: {
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      type: "website",
      locale: "pt_BR",
      siteName: site.name,
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description: site.description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${barlowCondensed.variable} h-full`}
      // a classe `dark` é adicionada pelo script de tema antes da hidratação
      suppressHydrationWarning
    >
      <head>
        {/* Aplica o tema do CRM antes da primeira pintura — evita o flash branco
            no F5. Precisa ser um <script> síncrono no <head>: o next/script
            (beforeInteractive) só executa depois que o JS do Next carrega.
            O React só avisa sobre este <script> se remontar a árvore no
            cliente, o que acontece apenas após um erro de hidratação. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased h-full">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
