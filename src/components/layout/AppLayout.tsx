import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { CrossMarketingBanner } from '@/components/marketing/CrossMarketingBanner';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <CrossMarketingBanner />
          <header
            className="sticky top-0 z-10 flex h-14 items-center gap-4 px-4 text-white"
            style={{
              backgroundImage: `url('/images/header-gradient.svg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <SidebarTrigger className="text-white/80 hover:text-white hover:bg-white/10" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
