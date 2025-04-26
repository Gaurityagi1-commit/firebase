import type { UserProfile } from '@/types';

const API_BASE_URL = '/api/users';
const PROFILE_API_URL = '/api/profile';

// Type for data used to update own profile
export type ProfileUpdateData = {
  username?: string;
  email?: string;
  currentPassword?: string; // Required only if changing password
  newPassword?: string;
};

// Type for data used by admin to update any user
export type AdminUserUpdateData = {
    username?: string;
    email?: string;
    role?: 'admin' | 'user';
    // Add password if admin should be able to reset it
};


// --- Profile Management (Self) ---

export async function getMyProfile(): Promise<UserProfile> {
  const response = await fetch(PROFILE_API_URL);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
    throw new Error(errorData.message || 'Failed to fetch profile');
  }
  return response.json();
}

export async function updateMyProfile(profileData: ProfileUpdateData): Promise<UserProfile> {
  const response = await fetch(PROFILE_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(errorData.message || 'Failed to update profile');
  }
  return response.json();
}


// --- User Management (Admin Only) ---

export async function getAllUsers(): Promise<UserProfile[]> {
  const response = await fetch(API_BASE_URL); // GET /api/users
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
    // Handle specific errors like 403 Forbidden if needed
    throw new Error(errorData.message || 'Failed to fetch users');
  }
  return response.json();
}

export async function getUserById(id: string): Promise<UserProfile | null> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
        if (response.status === 404) {
            return null; // Not found
        }
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch user ${id}` }));
        throw new Error(errorData.message || `Failed to fetch user ${id}`);
    }
    return response.json();
}


export async function updateUser(id: string, userData: AdminUserUpdateData): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to update user ${id}` }));
        throw new Error(errorData.message || `Failed to update user ${id}`);
    }
    return response.json();
}

export async function deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to delete user ${id}` }));
        throw new Error(errorData.message || `Failed to delete user ${id}`);
    }
}
