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
  Loader2,
  ShieldCheck, // Icon for Admin
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth hook
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Ensure tooltip imports

interface AppLayoutProps {
  children: ReactNode;
}

// Define base navigation items accessible to all logged-in users
const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/reminders', label: 'Reminders', icon: Bell },
];

// Define navigation items accessible only to admins
const adminNavItems = [
    // Example: Add an Admin Dashboard or User Management link
    // { href: '/admin/users', label: 'Manage Users', icon: ShieldCheck },
];

const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, isLoading: isLoadingAuth, isAdmin } = useAuth(); // Use the auth hook

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
      router.refresh(); // Force reload to clear cache
      // Invalidate user profile query to ensure clean state on next login
       queryClient.invalidateQueries({ queryKey: ['myProfile'] });
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

  // Combine nav items based on role
  const navItems = [
    ...baseNavItems,
    ...(isAdmin ? adminNavItems : []), // Add admin items if user is admin
    { href: '/settings', label: 'Settings', icon: Settings }, // Settings is always last
  ];

  // Helper to get initials for Avatar Fallback
  const getInitials = (name?: string) => {
      if (!name) return 'U';
      const names = name.split(' ');
      if (names.length === 1) return names[0][0].toUpperCase();
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  return (
     // Use a key tied to loading state to force re-render of SidebarProvider if needed, or manage open state carefully
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <Sidebar side="left" variant="sidebar">
        <SidebarHeader className="p-4 items-center justify-center">
             <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                <span className="text-xl font-bold group-data-[collapsible=icon]:hidden transition-opacity duration-200">SF</span>
                 <span className="text-lg group-data-[collapsible=icon]:hidden transition-opacity duration-200">SalesFlow</span>
             </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          {isLoadingAuth ? (
              // Skeleton loader for nav items
              <div className="space-y-2 px-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)}
              </div>
          ) : (
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={item.label}
                        variant="default"
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
          )}
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center transition-all duration-200">
              {isLoadingAuth ? (
                  <>
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                          <Skeleton className="h-4 w-16 rounded" />
                          <Skeleton className="h-3 w-24 rounded" />
                      </div>
                      <Skeleton className="ml-auto h-8 w-8 group-data-[collapsible=icon]:hidden transition-opacity duration-200 rounded" />
                  </>
              ) : user ? (
                  <>
                      <Avatar className="h-9 w-9">
                         {/* Use a generic avatar or fetch from user profile if available */}
                         <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={`${user.username}'s Avatar`} />
                         <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                        <span className="text-sm font-medium">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      <TooltipProvider>
                          <Tooltip>
                             <TooltipTrigger asChild>
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
                             </TooltipTrigger>
                              <TooltipContent side="right" align="center">
                                 Logout
                             </TooltipContent>
                           </Tooltip>
                       </TooltipProvider>
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
                    </>
                ) : (
                     // Render something if user data failed to load but auth isn't loading (error state)
                     <div className="text-xs text-destructive group-data-[collapsible=icon]:hidden">Error loading user</div>
                )}
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        {/* Render children only if authentication check is complete (or handle loading state within children) */}
        {!isLoadingAuth ? children : (
            // Optional: Add a main content area loader if needed
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
};

// Export queryClient instance needed for invalidation in logout
import queryClient from '@/lib/queryClient';

export default AppLayout;
