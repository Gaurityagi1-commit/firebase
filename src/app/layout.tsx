'use client' // Required for using usePathname

import type { ReactNode } from 'react';
import { Inter } from 'next/font/google'; // Use a standard font like Inter
import './globals.css';
import AppLayout from '@/components/common/AppLayout'; // Import AppLayout
import Providers from '@/components/common/Providers'; // Import Providers
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { usePathname } from 'next/navigation'; // Import usePathname

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' }); // Configure Inter font

// Metadata can remain in a server component or be moved here if needed globally
// export const metadata: Metadata = {
//   title: 'SalesFlow CRM', // Update title
//   description: 'CRM for managing clients and quotations', // Update description
// };

// List of paths where the main AppLayout should NOT be applied
const noLayoutPaths = ['/login', '/register'];

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const showLayout = !noLayoutPaths.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      {/* Remove extra whitespace */}
      <head>
         {/* You can add metadata here if needed */}
         <title>SalesFlow CRM</title>
         <meta name="description" content="CRM for managing clients and quotations" />
         {/* Add other meta tags, link tags for fonts etc. here */}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
         <Providers> {/* Wrap with QueryClientProvider */}
           {showLayout ? (
               <AppLayout>{children}</AppLayout> // Apply layout only to authenticated routes
           ) : (
                children // Render children directly for login/register pages
           )}
           <Toaster /> {/* Add Toaster here for global toasts */}
         </Providers>
      </body>
    </html>
  );
}
