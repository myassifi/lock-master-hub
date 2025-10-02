import { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, subtitle, actions, tabs, children }: PageShellProps) {
  return (
    <div className="min-h-dvh flex flex-col pb-16 md:pb-0">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
        
        {/* Tabs Row */}
        {tabs && (
          <div className="mx-auto max-w-7xl px-4 pb-2">
            {tabs}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-4">
        {children}
      </main>
    </div>
  );
}
