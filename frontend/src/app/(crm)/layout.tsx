import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/crm/auth';
import { ThemeProvider } from '@/components/crm/ThemeProvider';
import CrmShell from '@/components/crm/CrmShell';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <ThemeProvider>
      <CrmShell>{children}</CrmShell>
    </ThemeProvider>
  );
}
