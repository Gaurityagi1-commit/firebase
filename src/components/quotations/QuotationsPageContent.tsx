'use client';

import React from 'react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { QuotationTable } from './QuotationTable';
import { mockQuotations, mockClients } from '@/lib/mock-data'; // Using mock data
import AddQuotationDialog from './AddQuotationDialog';

export default function QuotationsPageContent() {
  const [isAddQuotationDialogOpen, setIsAddQuotationDialogOpen] = React.useState(false);

  const handleAddQuotation = (quotationData: any) => {
     // TODO: Implement actual add quotation logic (e.g., API call)
    console.log('Adding quotation:', quotationData);
     // You might want to refresh the quotation list here
    setIsAddQuotationDialogOpen(false);
  };


  return (
    <>
      <Header title="Quotations">
         <Button onClick={() => setIsAddQuotationDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Quotation
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
         <QuotationTable quotations={mockQuotations} />
      </main>
       <AddQuotationDialog
        clients={mockClients} // Pass clients for selection
        isOpen={isAddQuotationDialogOpen}
        onClose={() => setIsAddQuotationDialogOpen(false)}
        onAddQuotation={handleAddQuotation}
      />
    </>
  );
}
