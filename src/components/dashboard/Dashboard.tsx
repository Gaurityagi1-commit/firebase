'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, FileText, Bell, BarChart, Loader2, AlertTriangle } from 'lucide-react';
import Header from '@/components/common/Header';
import { ClientTable } from '@/components/clients/ClientTable';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { getClients } from '@/services/clientService';
import { getQuotations } from '@/services/quotationService';
// Note: Reminders are not fetched here yet, would need getReminders service call
import type { Client, Quotation } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function Dashboard() {
  // Fetch Clients
  const { data: clients, isLoading: isLoadingClients, isError: isErrorClients, error: errorClients } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  // Fetch Quotations
  const { data: quotations, isLoading: isLoadingQuotations, isError: isErrorQuotations, error: errorQuotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: getQuotations,
  });

  // TODO: Fetch Reminders
  // const { data: reminders, isLoading: isLoadingReminders, isError: isErrorReminders, error: errorReminders } = useQuery({
  //   queryKey: ['reminders'],
  //   queryFn: getReminders,
  // });
  const upcomingReminders = 5; // Placeholder - replace with actual data length when fetched

  // Combine loading and error states
  const isLoading = isLoadingClients || isLoadingQuotations; // || isLoadingReminders;
  const isError = isErrorClients || isErrorQuotations; // || isErrorReminders;
  const error = errorClients || errorQuotations; // || errorReminders;

  // Calculate stats only when data is available
  const totalClients = clients?.length ?? 0;
  const totalQuotations = quotations?.length ?? 0;
  const highPriorityClients = clients?.filter(client => client.priority === '1 month').length ?? 0;
  const recentClients = clients?.slice(-5).reverse() ?? []; // Get recent 5 clients (assuming sorted by date, reverse for newest first)
  const recentQuotations = quotations?.slice(-5).reverse() ?? []; // Get recent 5 quotations

  // --- Loading State ---
  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto animate-pulse">
           {/* Skeleton for Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <Skeleton className="h-32 rounded-lg" />
               <Skeleton className="h-32 rounded-lg" />
               <Skeleton className="h-32 rounded-lg" />
               <Skeleton className="h-32 rounded-lg" />
            </div>
             {/* Skeleton for Recent Activity Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full rounded" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full rounded" />
                    </CardContent>
                </Card>
            </div>
        </main>
      </>
    );
  }

   // --- Error State ---
  if (isError) {
      return (
         <>
           <Header title="Dashboard" />
           <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
                <div className="flex flex-col items-center text-destructive bg-destructive/10 p-6 rounded-md border border-destructive">
                    <AlertTriangle className="h-12 w-12 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Failed to load dashboard data</h2>
                    <p className="text-center max-w-md">{error?.message || 'An unexpected error occurred while fetching data.'}</p>
                    {/* Add a retry button maybe? */}
                </div>
           </main>
         </>
      )
  }


  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              {/* <p className="text-xs text-muted-foreground">+2 from last month</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuotations}</div>
              {/* <p className="text-xs text-muted-foreground">+5 drafts created</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingReminders}</div>
               {/* <p className="text-xs text-muted-foreground">3 due this week</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority (1 Mo)</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highPriorityClients}</div>
               <p className="text-xs text-muted-foreground">Needs timely follow-up</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Sections */}
        <div className="grid gap-6 md:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle>Recent Clients</CardTitle>
                {recentClients.length === 0 && <CardDescription>No recent clients added.</CardDescription>}
             </CardHeader>
              {recentClients.length > 0 && (
                 <CardContent>
                   <ClientTable clients={recentClients} showPagination={false} showFiltering={false} />
                 </CardContent>
              )}
           </Card>
            <Card>
             <CardHeader>
               <CardTitle>Recent Quotations</CardTitle>
                {recentQuotations.length === 0 && <CardDescription>No recent quotations added.</CardDescription>}
             </CardHeader>
             {recentQuotations.length > 0 && (
                 <CardContent>
                   <QuotationTable quotations={recentQuotations} showPagination={false} showFiltering={false} />
                 </CardContent>
              )}
           </Card>
        </div>
      </main>
    </>
  );
}
