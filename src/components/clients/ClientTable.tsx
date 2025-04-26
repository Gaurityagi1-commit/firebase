'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Client, Priority } from '@/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem, // Use Item instead of CheckboxItem for actions
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem, // Keep for filters
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Filter, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteClient, updateClient, type ClientInputData } from '@/services/clientService'; // Import deleteClient
import EditClientDialog from './EditClientDialog'; // Assuming EditClientDialog exists
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth'; // Import useAuth hook


interface ClientTableProps {
  clients: Client[];
  showPagination?: boolean;
  showFiltering?: boolean;
}

const priorityColors: Record<Priority, string> = {
  '1 month': 'bg-red-500 hover:bg-red-600',
  '2 months': 'bg-yellow-500 hover:bg-yellow-600',
  '3 months': 'bg-blue-500 hover:bg-blue-600',
  'none': 'bg-gray-400 hover:bg-gray-500',
};

export function ClientTable({ clients, showPagination = true, showFiltering = true }: ClientTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState<Set<Priority>>(new Set(['1 month', '2 months', '3 months', 'none']));
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [clientToEdit, setClientToEdit] = React.useState<Client | null>(null);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: isLoadingAuth } = useAuth(); // Get auth status

  // We need user data associated with clients if admin is viewing
  // For simplicity now, we assume client data fetched might include owner info if needed,
  // or we'd need another query/join on the backend. Let's add a placeholder column for admin view.

  const filteredClients = React.useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm)) ||
        client.requirements.toLowerCase().includes(searchTerm.toLowerCase());
        // || (isAdmin && client.userId.toLowerCase().includes(searchTerm.toLowerCase())); // Search by userId if admin?

      const matchesPriority = priorityFilter.has(client.priority);

      return matchesSearch && matchesPriority;
    });
  }, [clients, searchTerm, priorityFilter, isAdmin]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = React.useMemo(() => {
     if (!showPagination) return filteredClients;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage, showPagination]);


  const handlePriorityChange = (priority: Priority, checked: boolean) => {
    setPriorityFilter((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(priority);
      } else {
        newSet.delete(priority);
      }
      return newSet;
    });
    setCurrentPage(1); // Reset page when filters change
  };

  // --- Delete Mutation ---
  const { mutate: deleteClientMutate, isPending: isDeleting } = useMutation({
      mutationFn: deleteClient,
      onSuccess: (_, clientId) => {
          // Invalidate queries that depend on clients list
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] }); // Example if dashboard uses it

          // Optional: Optimistic update (remove immediately)
          // queryClient.setQueryData(['clients'], (oldData: Client[] | undefined) =>
          //     oldData ? oldData.filter(c => c.id !== clientId) : []
          // );

          toast({
              title: "Client Deleted",
              description: "The client and associated data have been deleted.",
          });
      },
      onError: (error: any, clientId) => {
          console.error(`Failed to delete client ${clientId}:`, error);
          toast({
              title: "Error Deleting Client",
              description: error.message || "Could not delete the client. Please try again.",
              variant: "destructive",
          });
          // Consider invalidating query here too to refetch correct state if optimistic update failed
          // queryClient.invalidateQueries({ queryKey: ['clients'] });
      },
  });

  // --- Edit Mutation ---
   const { mutate: updateClientMutate, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientInputData }) => updateClient(id, data),
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
       // Optional: Optimistic update
      // queryClient.setQueryData(['clients'], (oldData: Client[] | undefined) =>
      //   oldData ? oldData.map(c => c.id === updatedClient.id ? updatedClient : c) : []
      // );
      setIsEditDialogOpen(false); // Close edit dialog
      setClientToEdit(null);
      toast({
        title: "Client Updated",
        description: `Client "${updatedClient.name}" updated successfully.`,
      });
    },
    onError: (error: any, variables) => {
      console.error(`Failed to update client ${variables.id}:`, error);
      toast({
        title: "Error Updating Client",
        description: error.message || "Could not update the client. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleEditClick = (client: Client) => {
      setClientToEdit(client);
      setIsEditDialogOpen(true);
  }

  const handleUpdateClient = (updatedData: ClientInputData) => {
      if (clientToEdit) {
         updateClientMutate({ id: clientToEdit.id, data: updatedData });
      }
  }


  const priorityOptions: Priority[] = ['1 month', '2 months', '3 months', 'none'];
  const currentDeletingId = React.useRef<string | null>(null); // To track which delete button is spinning

  return (
    <div className="w-full space-y-4">
      {showFiltering && (
         <div className="flex items-center gap-4">
            <Input
              placeholder="Filter clients..."
              value={searchTerm}
              onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1); // Reset page on search
              }}
              className="max-w-sm"
            />
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Filter className="mr-2 h-4 w-4" /> Priority <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {priorityOptions.map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority}
                    checked={priorityFilter.has(priority)}
                    onCheckedChange={(checked) => handlePriorityChange(priority, Boolean(checked))}
                  >
                    {priority === 'none' ? 'No Priority' : priority}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      )}

      <div className="rounded-md border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Priority</TableHead>
               <TableHead className="hidden md:table-cell">Requirements</TableHead>
              <TableHead className="hidden sm:table-cell">Created At</TableHead>
               {isAdmin && <TableHead className="hidden lg:table-cell">Owner ID</TableHead>} {/* Show Owner for Admins */}
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      className={`text-white ${priorityColors[client.priority]}`}
                      variant="secondary" // Use secondary to avoid default background override
                    >
                      {client.priority === 'none' ? 'None' : client.priority}
                    </Badge>
                  </TableCell>
                   <TableCell className="hidden md:table-cell max-w-xs truncate">{client.requirements}</TableCell>
                   <TableCell className="hidden sm:table-cell">{client.createdAt ? format(new Date(client.createdAt), 'PP') : '-'}</TableCell>
                    {isAdmin && <TableCell className="hidden lg:table-cell text-xs font-mono">{client.userId}</TableCell>} {/* Show Owner ID */}
                   <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting && currentDeletingId.current === client.id}>
                           {isDeleting && currentDeletingId.current === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" /> }
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <DropdownMenuItem onClick={() => handleEditClick(client)}>
                               <Edit className="mr-2 h-4 w-4" />
                               Edit
                           </DropdownMenuItem>
                           {/* <DropdownMenuItem>View Details</DropdownMenuItem> */} {/* Add link/action later */}
                           <DropdownMenuSeparator />
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                       className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                       onSelect={(e) => e.preventDefault()} // Prevent closing dropdown immediately
                                       disabled={isDeleting && currentDeletingId.current === client.id}
                                     >
                                       <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                     </DropdownMenuItem>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     This action cannot be undone. This will permanently delete the client
                                     <span className="font-semibold"> {client.name}</span> and their related quotations and reminders.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => {
                                          currentDeletingId.current = client.id;
                                          deleteClientMutate(client.id);
                                      }}
                                      disabled={isDeleting && currentDeletingId.current === client.id}
                                    >
                                       {isDeleting && currentDeletingId.current === client.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Delete Client
                                    </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                 <TableCell colSpan={isAdmin ? 8 : 7} className="h-24 text-center"> {/* Adjust colspan based on admin view */}
                  No clients found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
             <span className="text-sm text-muted-foreground">
               Page {currentPage} of {totalPages}
             </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Edit Client Dialog */}
        {clientToEdit && (
            <EditClientDialog
                isOpen={isEditDialogOpen}
                onClose={() => { setIsEditDialogOpen(false); setClientToEdit(null); }}
                client={clientToEdit}
                onUpdateClient={handleUpdateClient}
                isSubmitting={isUpdating}
            />
        )}
    </div>
  );
}
