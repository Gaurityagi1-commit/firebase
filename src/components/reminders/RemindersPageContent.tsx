'use client';

import React from 'react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ReminderList } from './ReminderList'; // Assuming ReminderList component exists
import { mockClients } from '@/lib/mock-data'; // Example client data for selector
import AddReminderDialog from './AddReminderDialog'; // Assuming AddReminderDialog exists
import type { Reminder } from '@/types';
import { scheduleReminder, type ReminderDetails } from '@/services/reminder';
import { useToast } from '@/hooks/use-toast';


// Mock reminder data - replace with actual data fetching
const mockReminders: Reminder[] = [
  {
    id: 'rem_1',
    clientId: 'cli_1',
    clientName: 'Acme Corporation',
    reminderDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    message: 'Follow up on Model X quotation.',
    type: 'follow-up',
    completed: false,
    createdAt: new Date(),
  },
  {
    id: 'rem_2',
    clientId: 'cli_2',
    clientName: 'Globex Industries',
    reminderDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    message: 'Schedule Model Y demo.',
    type: 'meeting',
    completed: false,
    createdAt: new Date(),
  },
   {
    id: 'rem_3',
    clientId: 'cli_4',
    clientName: 'Wayne Enterprises',
    reminderDateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (overdue)
    message: 'Discuss special project details.',
    type: 'meeting',
    completed: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
    {
    id: 'rem_4',
    clientId: 'cli_1',
    clientName: 'Acme Corporation',
    reminderDateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    message: 'Send service contract proposal.',
    type: 'email',
    completed: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
];


export default function RemindersPageContent() {
   const [isAddReminderDialogOpen, setIsAddReminderDialogOpen] = React.useState(false);
   const [reminders, setReminders] = React.useState<Reminder[]>(mockReminders); // State for reminders
   const { toast } = useToast();


  const handleAddReminder = async (data: any) => {
     console.log('Adding reminder data:', data);
     const client = mockClients.find(c => c.id === data.clientId);
     if (!client) {
         console.error("Client not found for reminder");
         toast({
             title: "Error",
             description: "Could not find the selected client.",
             variant: "destructive",
           });
         return;
     }

     const reminderDetails: ReminderDetails = {
         email: client.email, // Get email from selected client
         phoneNumber: client.phone, // Get phone from selected client (ensure it's formatted correctly for WhatsApp)
         reminderDateTime: data.reminderDateTime,
         message: data.message,
       };

     try {
         const success = await scheduleReminder(reminderDetails); // Call the service
         if (success) {
             // Simulate adding to list (replace with actual API fetch/update)
             const newReminder: Reminder = {
                id: `rem_${Date.now()}`,
                clientId: data.clientId,
                clientName: client.name,
                reminderDateTime: data.reminderDateTime,
                message: data.message,
                type: data.type, // Assuming type is part of form data
                completed: false,
                createdAt: new Date(),
             };
             setReminders(prev => [newReminder, ...prev]);
             setIsAddReminderDialogOpen(false);
              toast({
                 title: "Success",
                 description: "Reminder scheduled successfully.",
                 variant: "default", // Use default (or success if you have one)
               });
         } else {
             // Handle scheduling failure
              toast({
                 title: "Error",
                 description: "Failed to schedule reminder. Please try again.",
                 variant: "destructive",
               });
         }
     } catch (error) {
         console.error("Error scheduling reminder:", error);
          toast({
             title: "Error",
             description: "An unexpected error occurred.",
             variant: "destructive",
           });
     }
  };

  const handleToggleComplete = (reminderId: string) => {
      setReminders(prevReminders =>
          prevReminders.map(r =>
              r.id === reminderId ? { ...r, completed: !r.completed } : r
          )
      );
      // TODO: Add API call to update reminder status
       toast({
           title: "Reminder Updated",
           description: `Reminder marked as ${reminders.find(r=>r.id === reminderId)?.completed ? 'incomplete' : 'complete'}.`,
       });
  };

  const handleDeleteReminder = (reminderId: string) => {
     setReminders(prevReminders => prevReminders.filter(r => r.id !== reminderId));
      // TODO: Add API call to delete reminder
       toast({
           title: "Reminder Deleted",
           description: "The reminder has been removed.",
           variant: "destructive",
       });
  }


  return (
    <>
      <Header title="Reminders">
         <Button onClick={() => setIsAddReminderDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Reminder
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <ReminderList
            reminders={reminders}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteReminder}
        />
      </main>
      <AddReminderDialog
          clients={mockClients}
          isOpen={isAddReminderDialogOpen}
          onClose={() => setIsAddReminderDialogOpen(false)}
          onAddReminder={handleAddReminder}
        />
    </>
  );
}
