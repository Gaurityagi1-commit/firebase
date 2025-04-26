'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage,FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getMyProfile, updateMyProfile, type ProfileUpdateData } from '@/services/userService';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  email: z.string().email('Invalid email address.'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.').optional(),
  confirmNewPassword: z.string().optional(),
}).refine(data => {
    // If new password is provided, current password is required
    if (data.newPassword && !data.currentPassword) return false;
    return true;
}, {
    message: "Current password is required to set a new password.",
    path: ["currentPassword"],
}).refine(data => {
    // If new password is provided, confirm password must match
    if (data.newPassword && data.newPassword !== data.confirmNewPassword) return false;
    return true;
}, {
    message: "New passwords don't match.",
    path: ["confirmNewPassword"],
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current user profile
  const { data: profile, isLoading: isLoadingProfile, isError, error } = useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // Update form defaults when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username,
        email: profile.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    }
  }, [profile, form]);

  // Mutation for updating profile
  const { mutate: updateProfileMutate, isPending: isUpdatingProfile } = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['myProfile'], updatedProfile); // Update cache immediately
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
      form.reset({ // Reset form, keeping updated username/email, clearing passwords
        username: updatedProfile.username,
        email: updatedProfile.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    },
    onError: (error: any) => {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    const updatePayload: ProfileUpdateData = {
        username: data.username,
        email: data.email,
    };
    // Only include password fields if a new password is being set
    if (data.newPassword) {
        updatePayload.currentPassword = data.currentPassword;
        updatePayload.newPassword = data.newPassword;
    }
     updateProfileMutate(updatePayload);
  };

  if (isLoadingProfile) {
    return (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
    );
  }

  if (isError) {
      return (
          <Card>
             <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                 <CardDescription className="text-destructive">Failed to load profile data: {error?.message}</CardDescription>
            </CardHeader>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isUpdatingProfile} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={isUpdatingProfile} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-medium pt-4 border-t">Change Password</h3>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter current password to change" {...field} disabled={isUpdatingProfile} />
                  </FormControl>
                   <FormDescription>
                     Required only if setting a new password.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Leave blank to keep current password" {...field} disabled={isUpdatingProfile}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm new password" {...field} disabled={isUpdatingProfile}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isUpdatingProfile || !form.formState.isDirty}>
              {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
