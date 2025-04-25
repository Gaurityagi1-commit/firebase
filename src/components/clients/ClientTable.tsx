'use client';

import * as React from 'react';
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Filter, MoreHorizontal } from 'lucide-react';

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
  const itemsPerPage = 10;

  const filteredClients = React.useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        client.requirements.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = priorityFilter.has(client.priority);

      return matchesSearch && matchesPriority;
    });
  }, [clients, searchTerm, priorityFilter]);

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

  const priorityOptions: Priority[] = ['1 month', '2 months', '3 months', 'none'];

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
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <Badge
                      className={`text-white ${priorityColors[client.priority]}`}
                      variant="secondary" // Use secondary to avoid default background override
                    >
                      {client.priority === 'none' ? 'None' : client.priority}
                    </Badge>
                  </TableCell>
                   <TableCell className="hidden md:table-cell max-w-xs truncate">{client.requirements}</TableCell>
                  <TableCell className="hidden sm:table-cell">{format(client.createdAt, 'PP')}</TableCell>
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
                          {/* Add actions like Edit, View Details, Delete */}
                          <DropdownMenuCheckboxItem>Edit</DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem>View Details</DropdownMenuCheckboxItem>
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
                  No clients found.
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
