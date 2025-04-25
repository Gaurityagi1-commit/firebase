'use client';

import * as React from 'react';
import type { Reminder } from '@/types';
import { format, isPast, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Calendar, Mail, MessageSquare, Briefcase } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"


interface ReminderListProps {
  reminders: Reminder[];
  onToggleComplete: (reminderId: string) => void;
  onDelete: (reminderId: string) => void;
  // onEdit: (reminder: Reminder) => void; // Optional: Add edit functionality later
}

const reminderTypeIcons: Record<Reminder['type'], React.ElementType> = {
    email: Mail,
    whatsapp: MessageSquare,
    meeting: Users, // Assuming meeting involves people
    'follow-up': Briefcase,
};

export function ReminderList({ reminders, onToggleComplete, onDelete }: ReminderListProps) {
  const sortedReminders = React.useMemo(() => {
    return [...reminders].sort((a, b) => {
       // Sort by completion status first (incomplete first), then by date
       if (a.completed !== b.completed) {
         return a.completed ? 1 : -1;
       }
       return a.reminderDateTime.getTime() - b.reminderDateTime.getTime();
    });
  }, [reminders]);

  const getRelativeDate = (date: Date): string => {
    const diffDays = differenceInDays(date, new Date());
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    return format(date, 'PP'); // e.g., Jun 20, 2024
  };

  return (
    <div className="space-y-4">
       {sortedReminders.length > 0 ? sortedReminders.map((reminder) => {
         const Icon = reminderTypeIcons[reminder.type] || Calendar;
         const isOverdue = isPast(reminder.reminderDateTime) && !reminder.completed;
         return (
            <Card key={reminder.id} className={cn("transition-all hover:shadow-md", reminder.completed && "opacity-60")}>
              <CardContent className="p-4 flex items-start gap-4">
                 <Checkbox
                    id={`reminder-${reminder.id}`}
                    checked={reminder.completed}
                    onCheckedChange={() => onToggleComplete(reminder.id)}
                    className="mt-1 shrink-0"
                    aria-label={`Mark reminder for ${reminder.clientName} as ${reminder.completed ? 'incomplete' : 'complete'}`}
                 />
                <div className="flex-1 grid gap-1">
                  <div className="flex items-center justify-between">
                     <p className={cn("font-medium", reminder.completed && "line-through")}>
                        {reminder.message}
                     </p>
                     <div className="flex items-center gap-2">
                        {/* Edit Button - Placeholder */}
                         {/* <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => console.log('Edit', reminder.id)}>
                           <Edit className="h-4 w-4" />
                         </Button> */}
                          <AlertDialog>
                           <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 This action cannot be undone. This will permanently delete the reminder.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => onDelete(reminder.id)}
                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                               >
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
                        <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
                             <Calendar className="h-3.5 w-3.5" />
                             {format(reminder.reminderDateTime, 'Pp')} ({getRelativeDate(reminder.reminderDateTime)})
                             {isOverdue && <Badge variant="destructive" className="ml-1">Overdue</Badge>}
                        </span>
                    </div>
                </div>
              </CardContent>
            </Card>
         )
       }) : (
           <Card className="text-center py-12">
              <CardHeader>
                  <CardTitle>No Reminders Yet</CardTitle>
                  <CardDescription>Add your first reminder using the button above.</CardDescription>
              </CardHeader>
           </Card>
       )}
    </div>
  );
}

// Add Users icon import if not already present
import { Users } from 'lucide-react';
