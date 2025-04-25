'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Client, Quotation } from '@/types';
import { Loader2 } from 'lucide-react'; // Import Loader icon

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const quotationSchema = z.object({
  clientId: z.string().min(1, { message: 'Please select a client.' }),
  details: z.string().min(10, { message: 'Details must be at least 10 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }), // Use coerce for string input
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
});

export type QuotationFormData = z.infer<typeof quotationSchema>; // Export type

interface AddQuotationDialogProps {
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onAddQuotation: (data: QuotationFormData) => void;
  isSubmitting?: boolean; // Optional prop for submission state
  isLoadingClients?: boolean; // Optional prop for client loading state
}

export default function AddQuotationDialog({
    clients,
    isOpen,
    onClose,
    onAddQuotation,
    isSubmitting = false,
    isLoadingClients = false
}: AddQuotationDialogProps) {
  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      clientId: '',
      details: '',
      amount: 0,
      status: 'draft',
    },
  });

  const onSubmit = (data: QuotationFormData) => {
     if (isSubmitting) return;
    onAddQuotation(data);
     // Reset form will be handled by parent on success or dialog close
  };

   // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  // Disable form fields while submitting or loading clients
  const isDisabled = isSubmitting || isLoadingClients;
   React.useEffect(() => {
    if (isDisabled) {
      form.control._disableForm(true);
    } else {
       form.control._disableForm(false);
    }
  }, [isDisabled, form.control]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Quotation</DialogTitle>
          <DialogDescription>
            Fill in the details for the new quotation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isDisabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length === 0 && !isLoadingClients && (
                          <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                      )}
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} disabled={isDisabled}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isDisabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(['draft', 'sent', 'accepted', 'rejected'] as Quotation['status'][]).map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quotation Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter line items, terms, etc."
                      className="resize-none"
                      rows={4}
                      {...field}
                      disabled={isDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isDisabled || !form.formState.isDirty}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {isSubmitting ? 'Saving...' : 'Save Quotation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
