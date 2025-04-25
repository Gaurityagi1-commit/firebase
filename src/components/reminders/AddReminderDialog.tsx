'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { Client, Reminder } from '@/types';
import { Calendar as CalendarIcon, Mail, MessageSquare, Users, Briefcase } from 'lucide-react';

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
  reminderDateTime: z.date({ required_error: "A date and time is required." }),
  type: z.enum(['email', 'whatsapp', 'meeting', 'follow-up']),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface AddReminderDialogProps {
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: (data: ReminderFormData) => void;
}

const reminderTypes: { value: Reminder['type']; label: string; icon: React.ElementType }[] = [
  { value: 'follow-up', label: 'Follow-up', icon: Briefcase },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

export default function AddReminderDialog({ clients, isOpen, onClose, onAddReminder }: AddReminderDialogProps) {
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
      // Combine selected date with a default time (e.g., 9:00 AM) or implement time picker
      // For simplicity, let's assume the date picker gives us the date, and we use a fixed time or allow manual input.
      // const finalDateTime = combineDateAndTime(data.reminderDateTime, timeValue); // If using separate time input
       console.log("Submitting reminder data:", data);
       onAddReminder(data);
       form.reset(); // Reset form after submission
    };

   // Reset form when dialog closes
   React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Reminder</DialogTitle>
          <DialogDescription>
            Schedule a reminder for a client. It will be sent via Email/WhatsApp.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {/* Add Time Input Here if needed */}
                    {/* <Input type="time" className="mt-2" /> */}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Scheduling...' : 'Schedule Reminder'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
