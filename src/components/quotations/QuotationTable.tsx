'use client';

import * as React from 'react';
import type { Quotation } from '@/types';
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem, // Use Item for actions
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Filter, ChevronDown, Edit, Trash2, Loader2 } from 'lucide-react'; // Add icons
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { useMutation, useQueryClient } from '@tanstack/react-query'; // For mutations
import { deleteQuotation } from '@/services/quotationService'; // Import delete service
import { useToast } from '@/hooks/use-toast'; // For notifications
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // For delete confirmation

interface QuotationTableProps {
  quotations: Quotation[];
  showPagination?: boolean;
  showFiltering?: boolean;
}

const statusColors: Record<Quotation['status'], string> = {
  draft: 'bg-gray-400 hover:bg-gray-500',
  sent: 'bg-blue-500 hover:bg-blue-600',
  accepted: 'bg-green-500 hover:bg-green-600',
  rejected: 'bg-red-500 hover:bg-red-600',
};

const statusOptions: Quotation['status'][] = ['draft', 'sent', 'accepted', 'rejected'];

export function QuotationTable({ quotations, showPagination = true, showFiltering = true }: QuotationTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Set<Quotation['status']>>(new Set(statusOptions));
  const [currentPage, setCurrentPage] = React.useState(1);
  const [currentActionId, setCurrentActionId] = React.useState<string | null>(null);
  const itemsPerPage = 10;
  const { isAdmin, isLoading: isLoadingAuth } = useAuth(); // Get admin status
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // --- Delete Mutation ---
  const { mutate: deleteQuotationMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteQuotation,
    onSuccess: (_, quotationId) => {
        queryClient.invalidateQueries({ queryKey: ['quotations'] });
         queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
         // Optional: Optimistic update
        // queryClient.setQueryData(['quotations'], (oldData: Quotation[] | undefined) =>
        //     oldData ? oldData.filter(q => q.id !== quotationId) : []
        // );
        toast({
            title: "Quotation Deleted",
            description: "The quotation has been successfully deleted.",
        });
         setCurrentActionId(null);
    },
    onError: (error: any, quotationId) => {
        console.error(`Failed to delete quotation ${quotationId}:`, error);
        toast({
            title: "Error Deleting Quotation",
            description: error.message || "Could not delete the quotation.",
            variant: "destructive",
        });
         setCurrentActionId(null);
    },
  });


  const filteredQuotations = React.useMemo(() => {
    return quotations.filter((quotation) => {
      const matchesSearch =
        quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.amount.toString().includes(searchTerm);
        // || (isAdmin && quotation.userId.toLowerCase().includes(searchTerm.toLowerCase())); // Add user search for admin

       const matchesStatus = statusFilter.has(quotation.status);

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter, isAdmin]);

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const paginatedQuotations = React.useMemo(() => {
    if (!showPagination) return filteredQuotations;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(startIndex, startIndex + itemsPerPage);
   }, [filteredQuotations, currentPage, itemsPerPage, showPagination]);

   const handleStatusChange = (status: Quotation['status'], checked: boolean) => {
    setStatusFilter((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(status);
      } else {
        newSet.delete(status);
      }
      return newSet;
    });
    setCurrentPage(1); // Reset page when filters change
  };

  const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const handleDeleteClick = (quotationId: string) => {
       setCurrentActionId(quotationId);
       deleteQuotationMutate(quotationId);
  }

  // TODO: Implement Edit functionality
  const handleEditClick = (quotation: Quotation) => {
      console.log("Edit quotation:", quotation.id);
      toast({ title: "Edit Action", description: "Edit functionality not yet implemented." });
  }

  return (
    <div className="w-full space-y-4">
      {showFiltering && (
         <div className="flex items-center gap-4">
            <Input
              placeholder="Filter quotations..."
              value={searchTerm}
              onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setCurrentPage(1);
              }}
              className="max-w-sm"
            />
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Filter className="mr-2 h-4 w-4" /> Status <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter.has(status)}
                    onCheckedChange={(checked) => handleStatusChange(status, Boolean(checked))}
                    className="capitalize"
                  >
                    {status}
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
              <TableHead>Quotation ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Details</TableHead>
              <TableHead className="hidden sm:table-cell">Created At</TableHead>
              {isAdmin && <TableHead className="hidden lg:table-cell">Owner ID</TableHead>} {/* Show Owner for Admins */}
               <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedQuotations.length > 0 ? (
              paginatedQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-mono text-xs">{quotation.id}</TableCell>
                  <TableCell className="font-medium">{quotation.clientName}</TableCell>
                  <TableCell>{formatCurrency(quotation.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize text-white ${statusColors[quotation.status]}`}
                      variant="secondary"
                    >
                      {quotation.status}
                    </Badge>
                  </TableCell>
                   <TableCell className="hidden md:table-cell max-w-xs truncate">{quotation.details}</TableCell>
                  <TableCell className="hidden sm:table-cell">{format(new Date(quotation.createdAt), 'PP')}</TableCell>
                   {isAdmin && <TableCell className="hidden lg:table-cell text-xs font-mono">{quotation.userId}</TableCell>} {/* Show Owner ID */}
                  <TableCell>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                             aria-haspopup="true"
                             size="icon"
                             variant="ghost"
                             disabled={isDeleting && currentActionId === quotation.id}
                            >
                             {isDeleting && currentActionId === quotation.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <DropdownMenuItem onClick={() => handleEditClick(quotation)}>
                               <Edit className="mr-2 h-4 w-4" />
                                Edit
                           </DropdownMenuItem>
                          {/* <DropdownMenuItem>View Details</DropdownMenuItem> */}
                          {/* <DropdownMenuItem>Download PDF</DropdownMenuItem> */}
                           <DropdownMenuSeparator />
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                       className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                       onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                                       disabled={isDeleting && currentActionId === quotation.id}
                                  >
                                       <Trash2 className="mr-2 h-4 w-4" />
                                       Delete
                                   </DropdownMenuItem>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     This action cannot be undone. This will permanently delete the quotation for
                                     <span className="font-semibold"> {quotation.clientName}</span> (ID: {quotation.id.substring(0, 8)}...).
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                   <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDeleteClick(quotation.id)}
                                      disabled={isDeleting && currentActionId === quotation.id}
                                   >
                                      {(isDeleting && currentActionId === quotation.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Delete Quotation
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
                 <TableCell colSpan={isAdmin ? 8 : 7} className="h-24 text-center"> {/* Adjust colspan */}
                  No quotations found.
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
    </div>
  );
}
