'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Client, Priority } from '@/types';
import { Loader2 } from 'lucide-react';

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
  } from "@/components/ui/select";

const priorityOptions: Priority[] = ['none', '1 month', '2 months', '3 months'];

const clientSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }).regex(/^\+?[0-9\s-()]*$/, { message: 'Invalid phone number format.' }),
  requirements: z.string().min(5, { message: 'Requirements must be at least 5 characters.' }),
  priority: z.enum(['none', '1 month', '2 months', '3 months']),
});

// Use the exported type from AddClientDialog if available, otherwise redefine
type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientDialogProps {
  client: Client; // The client data to pre-fill the form
  isOpen: boolean;
  onClose: () => void;
  onUpdateClient: (data: ClientFormData) => void;
  isSubmitting?: boolean;
}

export default function EditClientDialog({ client, isOpen, onClose, onUpdateClient, isSubmitting = false }: EditClientDialogProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { // Populate form with existing client data
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      requirements: client?.requirements || '',
      priority: client?.priority || 'none',
    },
  });

  // Reset form when client data changes (e.g., opening dialog for a different client)
  React.useEffect(() => {
     if (client) {
         form.reset({
             name: client.name,
             email: client.email,
             phone: client.phone,
             requirements: client.requirements,
             priority: client.priority,
         });
     }
  }, [client, form, isOpen]); // Add isOpen to reset on dialog open

 const onSubmit = (data: ClientFormData) => {
     if (isSubmitting) return;
    onUpdateClient(data);
  };

  // Disable form fields while submitting
   React.useEffect(() => {
    if (isSubmitting) {
      form.control._disableForm(true);
    } else {
       form.control._disableForm(false);
    }
  }, [isSubmitting, form.control]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Client: {client?.name}</DialogTitle>
          <DialogDescription>
            Update the client details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@acme.com" {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="123-456-7890" {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                     <FormControl>
                       <SelectTrigger>
                         <SelectValue placeholder="Select priority" />
                       </SelectTrigger>
                     </FormControl>
                     <SelectContent>
                       {priorityOptions.map((option) => (
                         <SelectItem key={option} value={option}>
                           {option === 'none' ? 'No Priority' : option}
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
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the client's needs and requirements..."
                      className="resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
