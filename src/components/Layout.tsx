import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Flame } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full smooth-scroll">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile-optimized header */}
          <header className="h-14 sm:h-16 border-b bg-card/50 backdrop-blur-sm mobile-sticky flex items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger className="touch-target" />
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0" />
                <h1 className="text-lg sm:text-xl font-bold text-primary truncate">
                  <span className="hidden sm:inline">Heat Wave Locksmith</span>
                  <span className="sm:hidden">Heat Wave</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block truncate max-w-[120px] lg:max-w-none">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-1 sm:gap-2 responsive-btn touch-target"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>

          {/* Mobile-optimized main content */}
          <main className="flex-1 mobile-container py-4 sm:py-6 smooth-scroll overflow-hidden">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}