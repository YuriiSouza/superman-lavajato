import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { fetchSiteSettings } from "@/lib/site";
import AuthSessionProvider from "@/components/crm/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSiteSettings();
  return {
    metadataBase: new URL("https://supermanlavajato.com.br"),
    title: {
      default: `${site.name} — ${site.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    keywords: ["lava a jato", "lavagem de carro", "enceramento", "detalhamento automotivo", site.name],
    openGraph: {
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      type: "website",
      locale: "pt_BR",
      siteName: site.name,
    },
    twitter: { card: "summary_large_image", title: site.name, description: site.description },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="font-sans antialiased h-full">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
