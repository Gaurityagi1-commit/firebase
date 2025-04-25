'use client';

import type { FC, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
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
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

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

  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <Sidebar side="left" variant="sidebar">
        <SidebarHeader className="p-4 items-center justify-center">
            {/* Placeholder for Logo - Replace with actual logo component or image if available */}
             <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
                </svg>
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
                <AvatarImage src="https://picsum.photos/50/50" alt="Admin User" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-xs text-muted-foreground">admin@salesflow.com</span>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto group-data-[collapsible=icon]:hidden transition-opacity duration-200">
                  <LogOut className="h-5 w-5" />
              </Button>
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        {children}
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
