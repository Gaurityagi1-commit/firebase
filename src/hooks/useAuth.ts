'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '@/services/userService';
import type { UserProfile } from '@/types';

interface UseAuthReturn {
  user: UserProfile | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: user, isLoading, isError, error } = useQuery<UserProfile, Error>({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    staleTime: 1000 * 60 * 15, // User profile data is relatively stable, cache for 15 mins
    retry: 1, // Don't retry aggressively on auth errors
    refetchOnWindowFocus: true, // Refetch on focus to ensure freshness
     // If getMyProfile throws (e.g., 401), react-query considers it an error.
     // `user` will be undefined in this case.
  });

  const isAuthenticated = !!user && !isError; // User is authenticated if data exists and no error occurred
  const isAdmin = isAuthenticated && user?.role === 'admin';

  return {
    user: user ?? null, // Return null if undefined (loading or error)
    isLoading,
    isError,
    error: error ?? null,
    isAuthenticated,
    isAdmin,
  };
}
