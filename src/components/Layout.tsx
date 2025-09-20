import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { LogOut, Flame, Menu } from 'lucide-react';

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
          {/* Mobile sticky header with improved design */}
          <header className="mobile-sticky h-14 sm:h-16 border-b bg-card/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger className="touch-target p-2 hover:bg-muted/50 rounded-md transition-colors lg:hidden">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-primary truncate">
                    <span className="hidden sm:inline">Heat Wave Locksmith</span>
                    <span className="sm:hidden">Heat Wave</span>
                  </h1>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    Professional Management System
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">Welcome</span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px] lg:max-w-none">
                  {user?.email}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-1 sm:gap-2 responsive-btn touch-target hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </header>

          {/* Main content with improved mobile layout */}
          <main className="flex-1 mobile-container py-4 sm:py-6 smooth-scroll overflow-auto relative">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        
        {/* Floating Action Button for Mobile */}
        <FloatingActionButton />
      </div>
    </SidebarProvider>
  );
}