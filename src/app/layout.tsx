import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/common/AppLayout'; // Import AppLayout
import Providers from '@/components/common/Providers'; // Import Providers

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
    <html lang="en" suppressHydrationWarning> {/* Added suppressHydrationWarning for potential theme issues */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
         <Providers> {/* Wrap with QueryClientProvider */}
           {/* Wrap children with AppLayout */}
           <AppLayout>{children}</AppLayout>
         </Providers>
      </body>
    </html>
  );
}
