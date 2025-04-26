'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { ReminderList } from './ReminderList';
import AddReminderDialog from './AddReminderDialog';
import { getReminders, createReminder, deleteReminder, toggleReminderCompletion, type ReminderInputData } from '@/services/reminderService';
import { getClients } from '@/services/clientService'; // Need clients for the dropdown
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Reminder, Client } from '@/types';

export default function RemindersPageContent() {
   const [isAddReminderDialogOpen, setIsAddReminderDialogOpen] = React.useState(false);
   const queryClient = useQueryClient();
   const { toast } = useToast();

   // Fetch Reminders
   const { data: reminders, isLoading: isLoadingReminders, isError: isErrorReminders, error: errorReminders } = useQuery({
     queryKey: ['reminders'],
     queryFn: getReminders,
   });

   // Fetch Clients for the dropdown
   const { data: clients, isLoading: isLoadingClients, isError: isErrorClients, error: errorClients } = useQuery({
     queryKey: ['clients'],
     queryFn: getClients,
     staleTime: Infinity,
   });

   // --- Add Reminder Mutation ---
   const { mutate: addReminderMutate, isPending: isAddingReminder } = useMutation({
     mutationFn: createReminder,
     onSuccess: (newReminder) => {
       queryClient.invalidateQueries({ queryKey: ['reminders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
       setIsAddReminderDialogOpen(false);
       toast({
         title: "Reminder Scheduled",
         description: `Reminder for ${newReminder.clientName} added.`,
       });
       // TODO: Add actual notification scheduling call here if needed
     },
     onError: (error) => {
       console.error("Failed to add reminder:", error);
       toast({
         title: "Error Scheduling Reminder",
         description: error.message || "Could not schedule the reminder.",
         variant: "destructive",
       });
     },
   });

   // --- Delete Reminder Mutation ---
   const { mutate: deleteReminderMutate, isPending: isDeletingReminder } = useMutation({
     mutationFn: deleteReminder,
     onSuccess: (_, reminderId) => {
         // Optimistically update UI before refetching
         queryClient.setQueryData(['reminders'], (oldData: Reminder[] | undefined) =>
             oldData ? oldData.filter(r => r.id !== reminderId) : []
         );
          queryClient.invalidateQueries({ queryKey: ['reminders'] }); // Refetch in background
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
         toast({
           title: "Reminder Deleted",
           description: "The reminder has been removed.",
           // Use default variant for delete confirmation
         });
     },
     onError: (error, reminderId) => {
         console.error(`Failed to delete reminder ${reminderId}:`, error);
         // If optimistic update failed, invalidate to refetch correct state
         queryClient.invalidateQueries({ queryKey: ['reminders'] });
         toast({
           title: "Error Deleting Reminder",
           description: error.message || "Could not delete the reminder.",
           variant: "destructive",
         });
     },
   });

   // --- Toggle Completion Mutation ---
   const { mutate: toggleCompleteMutate, isPending: isTogglingComplete } = useMutation({
       mutationFn: ({ id, completed }: { id: string; completed: boolean }) => toggleReminderCompletion(id, completed),
       onMutate: async ({ id, completed }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['reminders'] });

            // Snapshot the previous value
            const previousReminders = queryClient.getQueryData<Reminder[]>(['reminders']);

            // Optimistically update to the new value
            queryClient.setQueryData<Reminder[]>(['reminders'], (old) =>
                old ? old.map(r => r.id === id ? { ...r, completed: completed } : r) : []
            );

            // Return a context object with the snapshotted value
            return { previousReminders };
       },
       onError: (err, variables, context) => {
           console.error(`Failed to toggle reminder ${variables.id}:`, err);
           // Rollback to the previous value on error
           if (context?.previousReminders) {
               queryClient.setQueryData(['reminders'], context.previousReminders);
           }
            toast({
               title: "Error Updating Reminder",
               description: (err as Error)?.message || "Could not update the reminder status.",
               variant: "destructive",
           });
       },
       onSettled: (data, error, variables) => {
            // Always refetch after error or success:
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] });

             if (!error && data) {
                 toast({
                   title: "Reminder Updated",
                   description: `Reminder marked as ${data.completed ? 'complete' : 'incomplete'}.`,
                 });
             }
       },
   });


   const handleAddReminder = (data: ReminderInputData) => {
      addReminderMutate(data);
   };

   const handleToggleComplete = (reminderId: string, currentStatus: boolean) => {
       // We pass the *new* desired status to the mutation
       toggleCompleteMutate({ id: reminderId, completed: !currentStatus });
   };

   const handleDeleteReminder = (reminderId: string) => {
      deleteReminderMutate(reminderId);
   };

   const isLoading = isLoadingReminders || isLoadingClients;
   const isError = isErrorReminders || isErrorClients;
   const error = errorReminders || errorClients;


  return (
    <>
      <Header title="Reminders">
         <Button onClick={() => setIsAddReminderDialogOpen(true)} disabled={isAddingReminder || isLoadingClients}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Reminder
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
         {isLoading && (
             <div className="space-y-4">
                 {/* Skeleton for Reminder Cards */}
                 {Array.from({ length: 4 }).map((_, i) => (
                     <div key={i} className="rounded-md border bg-card shadow-sm p-4 flex items-start gap-4">
                         <Skeleton className="h-5 w-5 mt-1 shrink-0" />
                         <div className="flex-1 grid gap-2">
                             <Skeleton className="h-5 w-3/4" /> {/* Message */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                 <Skeleton className="h-4 w-24" /> {/* Client */}
                                 <Skeleton className="h-4 w-20" /> {/* Type */}
                                 <Skeleton className="h-4 w-32" /> {/* Date */}
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         )}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-destructive bg-destructive/10 p-6 rounded-md border border-destructive">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to load reminders</h2>
              <p className="text-center">{error?.message || 'An unexpected error occurred.'}</p>
               <Button variant="outline" className="mt-4" onClick={() => {
                   queryClient.refetchQueries({ queryKey: ['reminders'] });
                   queryClient.refetchQueries({ queryKey: ['clients'] });
                 }}>
                  Retry
              </Button>
            </div>
          )}
          {!isLoading && !isError && reminders && (
             <ReminderList
                 reminders={reminders}
                 onToggleComplete={handleToggleComplete}
                 onDelete={handleDeleteReminder}
                 // Pass pending states to disable interactions while mutating
                 isDeleting={isDeletingReminder}
                 isToggling={isTogglingComplete}
             />
         )}
         {!isLoading && !isError && reminders?.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 mb-4 opacity-50"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 .9.9 2.1-2.1"/></svg>
                 <h3 className="text-xl font-semibold mb-2">No Reminders Yet</h3>
                 <p>Click "Add Reminder" to schedule your first one.</p>
             </div>
         )}
      </main>
      <AddReminderDialog
          clients={clients || []}
          isOpen={isAddReminderDialogOpen}
          onClose={() => setIsAddReminderDialogOpen(false)}
          onAddReminder={handleAddReminder}
          isSubmitting={isAddingReminder}
          isLoadingClients={isLoadingClients}
        />
    </>
  );
}
