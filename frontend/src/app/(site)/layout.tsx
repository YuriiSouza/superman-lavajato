import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { fetchSiteSettings, whatsappLink } from "@/lib/site";

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await fetchSiteSettings();
  const waUrl = whatsappLink(site.phone);

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-kawasaki-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-950"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">{children}</main>
      <Footer site={site} />
      <WhatsAppButton href={waUrl} />
    </>
  );
}
