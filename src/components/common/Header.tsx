import type { FC, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  title: string;
  children?: ReactNode;
}

const Header: FC<HeaderProps> = ({ title, children }) => {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <SidebarTrigger className="md:hidden" /> {/* Only show trigger on mobile */}
      <h1 className="text-xl font-semibold text-primary">{title}</h1>
      <div className="ml-auto flex items-center gap-4">
        {children}
      </div>
    </header>
  );
};

export default Header;
