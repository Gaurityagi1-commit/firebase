'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { QuotationTable } from './QuotationTable';
import AddQuotationDialog from './AddQuotationDialog';
import { getQuotations, createQuotation, type QuotationInputData } from '@/services/quotationService';
import { getClients } from '@/services/clientService'; // Need clients for the dropdown
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '@/types'; // Import Client type

export default function QuotationsPageContent() {
  const [isAddQuotationDialogOpen, setIsAddQuotationDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch Quotations
  const { data: quotations, isLoading: isLoadingQuotations, isError: isErrorQuotations, error: errorQuotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: getQuotations,
  });

  // Fetch Clients for the dropdown in the AddQuotationDialog
  const { data: clients, isLoading: isLoadingClients, isError: isErrorClients, error: errorClients } = useQuery({
    queryKey: ['clients'], // Reuse client data if already fetched
    queryFn: getClients,
     staleTime: Infinity, // Keep client data fresh indefinitely unless invalidated
  });

  // Mutation for adding a quotation
  const { mutate: addQuotationMutate, isPending: isAddingQuotation } = useMutation({
    mutationFn: createQuotation,
    onSuccess: (newQuotation) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setIsAddQuotationDialogOpen(false);
      toast({
        title: "Success",
        description: `Quotation for ${newQuotation.clientName} added successfully.`,
      });
    },
    onError: (error) => {
        console.error("Failed to add quotation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add quotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddQuotation = (quotationData: QuotationInputData) => {
     addQuotationMutate(quotationData);
  };

  // Combine loading states
  const isLoading = isLoadingQuotations || isLoadingClients;
  const isError = isErrorQuotations || isErrorClients;
  const error = errorQuotations || errorClients;

  return (
    <>
      <Header title="Quotations">
         <Button onClick={() => setIsAddQuotationDialogOpen(true)} disabled={isAddingQuotation || isLoadingClients}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Quotation
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
         {isLoading && (
            <div className="space-y-4">
                 <div className="flex items-center gap-4">
                     <Skeleton className="h-10 w-[250px]" />
                     <Skeleton className="h-10 w-[120px] ml-auto" />
                 </div>
                 <div className="rounded-md border shadow-sm">
                     <div className="p-4">
                         <Skeleton className="h-8 w-full mb-4" /> {/* Header */}
                         {Array.from({ length: 5 }).map((_, i) => (
                             <Skeleton key={i} className="h-12 w-full mb-2" /> /* Rows */
                         ))}
                     </div>
                 </div>
                  <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                  </div>
            </div>
         )}
         {isError && !isLoading && ( // Show error only if not loading
           <div className="flex flex-col items-center justify-center h-64 text-destructive bg-destructive/10 p-6 rounded-md border border-destructive">
             <AlertTriangle className="h-12 w-12 mb-4" />
             <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
             <p className="text-center">{error?.message || 'An unexpected error occurred.'}</p>
              <Button variant="outline" className="mt-4" onClick={() => {
                  queryClient.refetchQueries({ queryKey: ['quotations'] });
                  queryClient.refetchQueries({ queryKey: ['clients'] });
                }}>
                 Retry
             </Button>
           </div>
         )}
         {!isLoading && !isError && quotations && clients && (
            <QuotationTable quotations={quotations} />
         )}
      </main>
       <AddQuotationDialog
        clients={clients || []} // Pass fetched clients
        isOpen={isAddQuotationDialogOpen}
        onClose={() => setIsAddQuotationDialogOpen(false)}
        onAddQuotation={handleAddQuotation}
        isSubmitting={isAddingQuotation}
        isLoadingClients={isLoadingClients} // Pass loading state for clients
      />
    </>
  );
}
