import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Bell, BarChart } from 'lucide-react';
import Header from '@/components/common/Header';
import { mockClients, mockQuotations } from '@/lib/mock-data'; // Assuming mock data exists
import { ClientTable } from '@/components/clients/ClientTable'; // Assuming ClientTable exists
import { QuotationTable } from '@/components/quotations/QuotationTable'; // Assuming QuotationTable exists

// Helper function to count clients by priority
const countClientsByPriority = (priority: string) => {
  return mockClients.filter(client => client.priority === priority).length;
}

export default function Dashboard() {
  const totalClients = mockClients.length;
  const totalQuotations = mockQuotations.length;
  const upcomingReminders = 5; // Example data
  const highPriorityClients = countClientsByPriority('1 month');

  const recentClients = mockClients.slice(0, 5); // Get recent 5 clients
  const recentQuotations = mockQuotations.slice(0, 5); // Get recent 5 quotations

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
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuotations}</div>
              <p className="text-xs text-muted-foreground">+5 drafts created</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingReminders}</div>
              <p className="text-xs text-muted-foreground">3 due this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority (1 Mo)</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highPriorityClients}</div>
               <p className="text-xs text-muted-foreground">Needs immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Sections */}
        <div className="grid gap-6 md:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle>Recent Clients</CardTitle>
             </CardHeader>
             <CardContent>
               {/* Render a simplified client list or table */}
               <ClientTable clients={recentClients} showPagination={false} showFiltering={false} />
             </CardContent>
           </Card>
            <Card>
             <CardHeader>
               <CardTitle>Recent Quotations</CardTitle>
             </CardHeader>
             <CardContent>
                {/* Render a simplified quotation list or table */}
               <QuotationTable quotations={recentQuotations} showPagination={false} showFiltering={false} />
             </CardContent>
           </Card>
        </div>
      </main>
    </>
  );
}
