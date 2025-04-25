'use client';

import * as React from 'react';
import type { Reminder } from '@/types';
import { format, isPast, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Calendar, Mail, MessageSquare, Briefcase, Users, Loader2 } from 'lucide-react'; // Import Users
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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


interface ReminderListProps {
  reminders: Reminder[];
  onToggleComplete: (reminderId: string) => void;
  onDelete: (reminderId: string) => void;
  // onEdit: (reminder: Reminder) => void; // Optional: Add edit functionality later
  isDeleting?: boolean; // Is any delete operation in progress?
  isToggling?: boolean; // Is any toggle operation in progress?
}

const reminderTypeIcons: Record<Reminder['type'], React.ElementType> = {
    email: Mail,
    whatsapp: MessageSquare,
    meeting: Users, // Assuming meeting involves people
    'follow-up': Briefcase,
};

export function ReminderList({ reminders, onToggleComplete, onDelete, isDeleting = false, isToggling = false }: ReminderListProps) {
  const [currentActionId, setCurrentActionId] = React.useState<string | null>(null); // Track which specific item is being actioned

  const sortedReminders = React.useMemo(() => {
    return [...reminders].sort((a, b) => {
       // Sort by completion status first (incomplete first), then by date
       if (a.completed !== b.completed) {
         return a.completed ? 1 : -1;
       }
        // Ensure dates are valid before comparing
       const dateA = a.reminderDateTime instanceof Date ? a.reminderDateTime.getTime() : 0;
       const dateB = b.reminderDateTime instanceof Date ? b.reminderDateTime.getTime() : 0;
       return dateA - dateB;
    });
  }, [reminders]);

  const getRelativeDate = (date: Date): string => {
     if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date'; // Handle invalid dates
    const now = new Date();
    now.setHours(0,0,0,0); // Compare dates only
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);

    const diffDays = differenceInDays(targetDate, now);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    return format(date, 'PP'); // e.g., Jun 20, 2024
  };

  const isActionPending = (id: string) => (isDeleting || isToggling) && currentActionId === id;

  return (
    <div className="space-y-4">
       {sortedReminders.length > 0 ? sortedReminders.map((reminder) => {
         const Icon = reminderTypeIcons[reminder.type] || Calendar;
         const isValidDate = reminder.reminderDateTime instanceof Date && !isNaN(reminder.reminderDateTime.getTime());
         const isOverdue = isValidDate && isPast(reminder.reminderDateTime) && !reminder.completed;
         const isPending = isActionPending(reminder.id);

         return (
            <Card key={reminder.id} className={cn("transition-all hover:shadow-md", reminder.completed && "opacity-60", isPending && "opacity-70 pointer-events-none")}>
              <CardContent className="p-4 flex items-start gap-4">
                 <Checkbox
                    id={`reminder-${reminder.id}`}
                    checked={reminder.completed}
                    onCheckedChange={() => {
                        setCurrentActionId(reminder.id);
                        onToggleComplete(reminder.id);
                    }}
                    className="mt-1 shrink-0"
                    aria-label={`Mark reminder for ${reminder.clientName} as ${reminder.completed ? 'incomplete' : 'complete'}`}
                    disabled={isPending} // Disable checkbox during any action on this item
                 />
                <div className="flex-1 grid gap-1">
                  <div className="flex items-center justify-between">
                     <p className={cn("font-medium", reminder.completed && "line-through")}>
                        {reminder.message}
                     </p>
                     <div className="flex items-center gap-2">
                         {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {/* Edit Button - Placeholder */}
                         {/* <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => console.log('Edit', reminder.id)} disabled={isPending}>
                           <Edit className="h-4 w-4" />
                         </Button> */}
                          <AlertDialog>
                           <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isPending}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 This action cannot be undone. This will permanently delete the reminder for <span className="font-semibold">{reminder.clientName}</span>: "{reminder.message}".
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel disabled={isDeleting && currentActionId === reminder.id}>Cancel</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => {
                                     setCurrentActionId(reminder.id);
                                     onDelete(reminder.id);
                                 }}
                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 disabled={isDeleting && currentActionId === reminder.id}
                               >
                                  {(isDeleting && currentActionId === reminder.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                 Delete
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                      </div>
                   </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {reminder.clientName}
                        </span>
                         <span className="flex items-center gap-1">
                            <Icon className="h-3.5 w-3.5" />
                            <span className="capitalize">{reminder.type}</span>
                         </span>
                         {isValidDate ? (
                             <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
                                <Calendar className="h-3.5 w-3.5" />
                                {format(reminder.reminderDateTime, 'Pp')} ({getRelativeDate(reminder.reminderDateTime)})
                                {isOverdue && <Badge variant="destructive" className="ml-1">Overdue</Badge>}
                             </span>
                         ) : (
                             <span className="flex items-center gap-1 text-destructive">
                                 <Calendar className="h-3.5 w-3.5" /> Invalid Date
                             </span>
                         )}
                    </div>
                </div>
              </CardContent>
            </Card>
         )
       }) : null}
        {/* Placeholder for when there are no reminders (handled in parent now) */}
    </div>
  );
}
