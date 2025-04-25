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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Filter, ChevronDown } from 'lucide-react';

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
  const itemsPerPage = 10;

  const filteredQuotations = React.useMemo(() => {
    return quotations.filter((quotation) => {
      const matchesSearch =
        quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.id.toLowerCase().includes(searchTerm.toLowerCase());

       const matchesStatus = statusFilter.has(quotation.status);

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

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
                  <TableCell className="hidden sm:table-cell">{format(quotation.createdAt, 'PP')}</TableCell>
                  <TableCell>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {/* Add actions like Edit, View, Download PDF */}
                          <DropdownMenuCheckboxItem>Edit</DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem>View Details</DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem>Download PDF</DropdownMenuCheckboxItem>
                           <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">Delete</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
