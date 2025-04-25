import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Use a standard font like Inter
import './globals.css';
import AppLayout from '@/components/common/AppLayout'; // Import AppLayout
import Providers from '@/components/common/Providers'; // Import Providers
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' }); // Configure Inter font

export const metadata: Metadata = {
  title: 'SalesFlow CRM', // Update title
  description: 'CRM for managing clients and quotations', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* The <body> tag must be the immediate child of <html> to avoid hydration errors */}
      <body className={`${inter.variable} font-sans antialiased`}>
         <Providers> {/* Wrap with QueryClientProvider */}
           {/* Wrap children with AppLayout */}
           <AppLayout>{children}</AppLayout>
           <Toaster /> {/* Add Toaster here for global toasts */}
         </Providers>
      </body>
    </html>
  );
}
