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
  { title: 'Actions', url: '/actions', icon: Zap },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavClassName = (path: string) => {
    const isActive = currentPath === path;
    return isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        {/* Mobile-optimized brand section */}
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b">
          <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-accent flex-shrink-0" />
          {state !== "collapsed" && (
            <div className="min-w-0">
              <h2 className="font-bold text-primary text-sm sm:text-base truncate">Heat Wave</h2>
              <p className="text-xs text-muted-foreground">Locksmith</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm">Business Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end
                      className={`${getNavClassName(item.url)} touch-target p-2 sm:p-3 rounded-lg transition-colors`}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {state !== "collapsed" && (
                        <span className="text-sm sm:text-base truncate">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}