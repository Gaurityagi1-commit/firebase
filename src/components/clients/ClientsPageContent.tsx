'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { ClientTable } from './ClientTable';
import AddClientDialog from './AddClientDialog';
import { getClients, createClient, type ClientInputData } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function ClientsPageContent() {
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch clients using React Query
  const { data: clients, isLoading, isError, error } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  // Mutation for adding a client
  const { mutate: addClientMutate, isPending: isAddingClient } = useMutation({
    mutationFn: createClient,
    onSuccess: (newClient) => {
      // Invalidate and refetch the clients query to show the new client
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddClientDialogOpen(false); // Close the dialog
      toast({
        title: "Success",
        description: `Client "${newClient.name}" added successfully.`,
      });
    },
    onError: (error) => {
        console.error("Failed to add client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddClient = (clientData: ClientInputData) => {
     addClientMutate(clientData);
  };

  return (
    <>
      <Header title="Clients">
        <Button onClick={() => setIsAddClientDialogOpen(true)} disabled={isAddingClient}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {isLoading && (
           // Enhanced Skeleton Loading State
          <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[120px] ml-auto" />
            </div>
             <div className="rounded-md border shadow-sm">
                 <div className="p-4">
                     <Skeleton className="h-8 w-full mb-4" /> {/* Header Row */}
                     {Array.from({ length: 5 }).map((_, i) => (
                         <Skeleton key={i} className="h-12 w-full mb-2" /> /* Data Rows */
                     ))}
                 </div>
             </div>
             <div className="flex justify-end gap-2">
                 <Skeleton className="h-9 w-20" />
                 <Skeleton className="h-9 w-20" />
             </div>
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center h-64 text-destructive bg-destructive/10 p-6 rounded-md border border-destructive">
             <AlertTriangle className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load clients</h2>
            <p className="text-center">{error?.message || 'An unexpected error occurred.'}</p>
            <Button variant="outline" className="mt-4" onClick={() => queryClient.refetchQueries({ queryKey: ['clients'] })}>
                Retry
            </Button>
          </div>
        )}
        {!isLoading && !isError && clients && (
          <ClientTable clients={clients} />
        )}
      </main>
      <AddClientDialog
        isOpen={isAddClientDialogOpen}
        onClose={() => setIsAddClientDialogOpen(false)}
        onAddClient={handleAddClient}
        // Pass isAddingClient to disable form submission while mutation is pending
        isSubmitting={isAddingClient}
      />
    </>
  );
}
