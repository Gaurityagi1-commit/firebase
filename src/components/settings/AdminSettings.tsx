'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, AlertTriangle, Users, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, deleteUser, updateUser, type AdminUserUpdateData } from '@/services/userService'; // Assuming admin services exist
import type { UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth'; // Import useAuth hook
// Assuming an EditUserDialog component exists or will be created
// import EditUserDialog from './EditUserDialog';


export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth(); // Get current user info

  // State for dialogs
  // const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);
  // const [userToEdit, setUserToEdit] = React.useState<UserProfile | null>(null);
  const [currentActionUserId, setCurrentActionUserId] = React.useState<string | null>(null);


  // Fetch all users (query enabled based on admin role and auth loading state)
  const { data: users, isLoading: isLoadingUsers, isError, error } = useQuery({
    queryKey: ['allUsers'],
    queryFn: getAllUsers,
    enabled: !isLoadingAuth && !!currentUser && currentUser.role === 'admin', // Only enable if logged in and admin
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });


  // --- Delete User Mutation ---
  const { mutate: deleteUserMutate, isPending: isDeletingUser } = useMutation({
      mutationFn: deleteUser,
      onSuccess: (_, userId) => {
           queryClient.invalidateQueries({ queryKey: ['allUsers'] });
           // Optionally remove immediately from cache
          queryClient.setQueryData(['allUsers'], (oldData: UserProfile[] | undefined) =>
              oldData ? oldData.filter(u => u.id !== userId) : []
          );
           toast({
               title: "User Deleted",
               description: "The user account and their associated data have been deleted.",
           });
           setCurrentActionUserId(null); // Reset action state
      },
      onError: (error: any, userId) => {
          console.error(`Failed to delete user ${userId}:`, error);
          toast({
              title: "Error Deleting User",
              description: error.message || "Could not delete the user.",
              variant: "destructive",
          });
          setCurrentActionUserId(null); // Reset action state
      },
  });


  // --- Edit User Mutation (Placeholder) ---
  // const { mutate: updateUserMutate, isPending: isUpdatingUser } = useMutation({
  //     mutationFn: ({ id, data }: { id: string; data: AdminUserUpdateData }) => updateUser(id, data),
  //     onSuccess: (updatedUser) => {
  //         queryClient.invalidateQueries({ queryKey: ['allUsers'] });
  //         setIsEditUserDialogOpen(false);
  //         setUserToEdit(null);
  //         toast({
  //             title: "User Updated",
  //             description: `User ${updatedUser.username} updated successfully.`,
  //         });
  //     },
  //     onError: (error: any, variables) => {
  //         console.error(`Failed to update user ${variables.id}:`, error);
  //         toast({
  //             title: "Error Updating User",
  //             description: error.message || "Could not update the user.",
  //             variant: "destructive",
  //         });
  //     },
  // });


  // --- Event Handlers ---
  // const handleEditClick = (user: UserProfile) => {
  //     setUserToEdit(user);
  //     setIsEditUserDialogOpen(true);
  // };

  // const handleUpdateUser = (updatedData: AdminUserUpdateData) => {
  //     if (userToEdit) {
  //         updateUserMutate({ id: userToEdit.id, data: updatedData });
  //     }
  // };

  const handleDeleteClick = (userId: string) => {
       setCurrentActionUserId(userId); // Set the user ID being acted upon
       deleteUserMutate(userId);
  };


  // --- Render Logic ---

  // Don't render anything if auth is loading or user is not admin
   if (isLoadingAuth) {
     return (
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/3" />
             <Skeleton className="h-4 w-2/3" />
          </CardHeader>
           <CardContent>
              <Skeleton className="h-10 w-full" />
           </CardContent>
        </Card>
     );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null; // Or display a message indicating admin access is required
  }

  // Loading state for users query
   if (isLoadingUsers) {
     return (
        <Card>
          <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
            <CardDescription>Manage user accounts.</CardDescription>
          </CardHeader>
           <CardContent>
                <div className="space-y-4">
                     <Skeleton className="h-10 w-full mb-4" /> {/* Header Row */}
                     {Array.from({ length: 3 }).map((_, i) => (
                         <Skeleton key={i} className="h-12 w-full mb-2" /> /* Data Rows */
                     ))}
                 </div>
           </CardContent>
        </Card>
     );
  }

  // Error state for users query
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
           <CardDescription className="text-destructive">Failed to load users: {error?.message}</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" onClick={() => queryClient.refetchQueries({queryKey: ['allUsers']})}>
                Retry
            </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
            <CardTitle>Admin Settings</CardTitle>
            <CardDescription>Manage user accounts.</CardDescription>
        </div>
         <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
         </Button> {/* Add functionality later */}
      </CardHeader>
      <CardContent>
         <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Created At</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className={user.id === currentUser?.id ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">{user.username} {user.id === currentUser?.id && '(You)'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                   <TableCell className="hidden sm:table-cell">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                   <TableCell>
                       {user.id !== currentUser?.id && ( // Don't show actions for the current admin user
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                             <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                disabled={isDeletingUser && currentActionUserId === user.id}
                             >
                               {isDeletingUser && currentActionUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                <span className="sr-only">Toggle menu</span>
                             </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem
                                // onClick={() => handleEditClick(user)}
                                disabled // Re-enable when EditUserDialog is ready
                             >
                               <Edit className="mr-2 h-4 w-4" />
                                Edit
                             </DropdownMenuItem>
                              <DropdownMenuSeparator />
                                <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                            onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                                            disabled={isDeletingUser && currentActionUserId === user.id}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete User
                                        </DropdownMenuItem>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                     <AlertDialogHeader>
                                       <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         This action cannot be undone. This will permanently delete the user
                                         <span className="font-semibold"> {user.username}</span> and all their associated clients, quotations, and reminders.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Cancel</AlertDialogCancel>
                                       <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => handleDeleteClick(user.id)}
                                          disabled={isDeletingUser && currentActionUserId === user.id}
                                       >
                                          {(isDeletingUser && currentActionUserId === user.id) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          Delete User
                                       </AlertDialogAction>
                                     </AlertDialogFooter>
                                   </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                         </DropdownMenu>
                       )}
                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No other users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
       {/* Edit User Dialog Placeholder */}
       {/* {userToEdit && (
            <EditUserDialog
                isOpen={isEditUserDialogOpen}
                onClose={() => { setIsEditUserDialogOpen(false); setUserToEdit(null); }}
                user={userToEdit}
                onUpdateUser={handleUpdateUser}
                isSubmitting={isUpdatingUser}
            />
        )} */}
    </Card>
  );
}
