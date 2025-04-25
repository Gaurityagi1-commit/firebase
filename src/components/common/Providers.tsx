'use client';

import type { FC, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/queryClient';

interface ProvidersProps {
  children: ReactNode;
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
       {/* You could add ReactQueryDevtools here for development */}
       {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
};

export default Providers;
