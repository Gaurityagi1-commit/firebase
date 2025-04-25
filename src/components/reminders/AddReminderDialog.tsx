'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { Client, Reminder } from '@/types';
import { Calendar as CalendarIcon, Mail, MessageSquare, Users, Briefcase, Loader2 } from 'lucide-react';

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
  FormDescription,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const reminderSchema = z.object({
  clientId: z.string().min(1, { message: 'Please select a client.' }),
  message: z.string().min(5, { message: 'Reminder message must be at least 5 characters.' }),
  reminderDateTime: z.date({ required_error: "A date and time is required." })
                        .min(new Date(new Date().setHours(0, 0, 0, 0)), { message: "Reminder date cannot be in the past." }), // Add validation for past dates
  type: z.enum(['email', 'whatsapp', 'meeting', 'follow-up']),
});

export type ReminderFormData = z.infer<typeof reminderSchema>; // Export type

interface AddReminderDialogProps {
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: (data: ReminderFormData) => void;
  isSubmitting?: boolean; // Optional prop for submission state
  isLoadingClients?: boolean; // Optional prop for client loading state
}

const reminderTypes: { value: Reminder['type']; label: string; icon: React.ElementType }[] = [
  { value: 'follow-up', label: 'Follow-up', icon: Briefcase },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

export default function AddReminderDialog({
    clients,
    isOpen,
    onClose,
    onAddReminder,
    isSubmitting = false,
    isLoadingClients = false
}: AddReminderDialogProps) {
  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      clientId: '',
      message: '',
      reminderDateTime: undefined,
      type: 'follow-up',
    },
  });

   const onSubmit = (data: ReminderFormData) => {
       if (isSubmitting) return;
       // TODO: Add time selection if needed, currently only date
       console.log("Submitting reminder data:", data);
       onAddReminder(data);
       // Reset handled by parent or dialog close
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
          <DialogTitle>Add New Reminder</DialogTitle>
          <DialogDescription>
            Schedule a reminder for a client. (Notification setup required separately).
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
                name="reminderDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Reminder Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                             disabled={isDisabled}
                          >
                            {field.value ? (
                              format(field.value, 'PPP') // Just the date for now
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || isDisabled} // Disable past dates & if form disabled
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {/* Add Time Input Here if needed */}
                    {/* <Input type="time" className="mt-2" disabled={isDisabled} /> */}
                    <FormMessage />
                  </FormItem>
                )}
              />

             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isDisabled}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reminderTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                               <type.icon className="h-4 w-4" />
                               {type.label}
                            </div>
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="E.g., Follow up on quotation X, Schedule demo call..."
                      className="resize-none"
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
                {isSubmitting ? 'Scheduling...' : 'Schedule Reminder'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
