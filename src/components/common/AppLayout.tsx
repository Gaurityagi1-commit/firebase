'use client';

import type { FC, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
  Loader2
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger, // Ensure SidebarTrigger is imported if used elsewhere
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout } from '@/services/authService'; // Import logout service
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react'; // Import useState

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      // Redirect to login page after logout
       router.push('/login');
       // Force reload to clear any cached user state in the browser
       router.refresh();
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast({
        title: 'Logout Failed',
        description: error.message || 'Could not log out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <Sidebar side="left" variant="sidebar">
        <SidebarHeader className="p-4 items-center justify-center">
            {/* Placeholder for Logo */}
             <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                 {/* Using a simple text logo for black/white theme */}
                <span className="text-xl font-bold group-data-[collapsible=icon]:hidden transition-opacity duration-200">SF</span>
                 <span className="text-lg group-data-[collapsible=icon]:hidden transition-opacity duration-200">SalesFlow</span>
             </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                    tooltip={item.label}
                    variant="default" // Ensure button variant is consistent
                  >
                   <a>
                     <item.icon className="h-5 w-5" />
                     <span>{item.label}</span>
                   </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center transition-all duration-200">
              <Avatar className="h-9 w-9">
                {/* Placeholder image for user avatar */}
                <AvatarImage src="https://avatar.vercel.sh/user" alt="User Avatar" />
                <AvatarFallback>U</AvatarFallback> {/* Fallback initials */}
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                 {/* Placeholder user info - fetch real user later */}
                <span className="text-sm font-medium">User</span>
                <span className="text-xs text-muted-foreground">user@example.com</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto group-data-[collapsible=icon]:hidden transition-opacity duration-200"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Logout"
              >
                 {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
              </Button>
              {/* Tooltip for logout button when collapsed */}
               <TooltipProvider>
                  <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                             variant="ghost"
                             size="icon"
                             className="hidden group-data-[collapsible=icon]:flex transition-opacity duration-200"
                             onClick={handleLogout}
                             disabled={isLoggingOut}
                             aria-label="Logout"
                           >
                             {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                           </Button>
                     </TooltipTrigger>
                     <TooltipContent side="right" align="center">
                         Logout
                     </TooltipContent>
                   </Tooltip>
               </TooltipProvider>
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
