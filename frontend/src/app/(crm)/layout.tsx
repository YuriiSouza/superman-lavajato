import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/crm/auth";
import { ThemeProvider } from "@/components/crm/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/components/crm/theme-script";
import CrmShell from "@/components/crm/CrmShell";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <ThemeProvider>
      {/* Aplica o tema antes da primeira pintura — evita o flash branco no F5 */}
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <CrmShell>{children}</CrmShell>
    </ThemeProvider>
  );
}
