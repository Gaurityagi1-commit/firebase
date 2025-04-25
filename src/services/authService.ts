const API_BASE_URL = '/api/auth';

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(errorData.message || 'Login failed');
  }
  // No need to return anything on success, cookie is set by the API
}

export async function register(username: string, email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(errorData.message || 'Registration failed');
  }
  // No need to return anything on success
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Logout failed' }));
    throw new Error(errorData.message || 'Logout failed');
  }
  // No need to return anything on success, cookie is cleared by the API
}

// Optional: Function to check authentication status (e.g., by making a protected API call)
// export async function checkAuth(): Promise<boolean> {
//   try {
//     // Example: Make a request to a protected API endpoint
//     const response = await fetch('/api/user/profile'); // Replace with an actual protected endpoint
//     return response.ok;
//   } catch (error) {
//     return false;
//   }
// }
