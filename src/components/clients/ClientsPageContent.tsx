'use client';

import React from 'react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ClientTable } from './ClientTable';
import { mockClients } from '@/lib/mock-data'; // Using mock data for now
import AddClientDialog from './AddClientDialog';

export default function ClientsPageContent() {
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = React.useState(false);

  const handleAddClient = (clientData: any) => {
    // TODO: Implement actual add client logic (e.g., API call)
    console.log('Adding client:', clientData);
    // You might want to refresh the client list here
    setIsAddClientDialogOpen(false);
  };

  return (
    <>
      <Header title="Clients">
        <Button onClick={() => setIsAddClientDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
         <ClientTable clients={mockClients} />
      </main>
      <AddClientDialog
        isOpen={isAddClientDialogOpen}
        onClose={() => setIsAddClientDialogOpen(false)}
        onAddClient={handleAddClient}
      />
    </>
  );
}
