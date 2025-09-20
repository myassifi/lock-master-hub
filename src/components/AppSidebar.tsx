import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  Zap,
  Flame
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Customers', url: '/customers', icon: Users },
  { title: 'Jobs', url: '/jobs', icon: Briefcase },
  { title: 'Inventory', url: '/inventory', icon: Package },
  { title: 'Activity Tracker', url: '/actions', icon: Zap },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const getNavClassName = (path: string) => {
    const isActive = currentPath === path;
    return isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-sm scale-105 border-r-4 border-accent" 
      : "hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-102";
  };

  return (
    <Sidebar 
      className="border-r bg-sidebar-background/95 backdrop-blur-sm shadow-lg"
      collapsible="icon"
    >
      <SidebarContent>
        {/* Enhanced brand section */}
        <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="relative">
            <Flame className="h-7 w-7 text-accent flex-shrink-0" />
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-full opacity-20 blur-sm"></div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-primary text-base truncate bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Heat Wave
              </h2>
              <p className="text-xs text-muted-foreground">Locksmith Pro</p>
            </div>
          )}
        </div>

        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            {!isCollapsed && "Business Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink 
                      to={item.url} 
                      end
                      className={({ isActive }) => 
                        `${getNavClassName(item.url)} touch-target p-3 rounded-lg transition-all duration-200 flex items-center gap-3 w-full group ${
                          isActive ? 'font-medium bg-primary text-primary-foreground shadow-md' : ''
                        }`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium truncate">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mobile bottom spacing */}
        <div className="flex-1" />
        
        {/* Footer info when expanded */}
        {!isCollapsed && (
          <div className="p-4 border-t bg-card/30">
            <p className="text-xs text-muted-foreground text-center">
              Professional Locksmith<br />Management System
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}