import type { Client } from '@/types';

const API_BASE_URL = '/api/clients';

// Type for data needed to create/update a client (excluding id, createdAt)
// Match the Zod schema used in the API route
export type ClientInputData = Omit<Client, 'id' | 'createdAt'>;


export async function getClients(): Promise<Client[]> {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: 'Failed to fetch clients' }));
    throw new Error(errorData.message || 'Failed to fetch clients');
  }
  const data = await response.json();
   // Assuming API returns dates as ISO strings, React Query/components might handle Date conversion if needed
   // Or convert here if necessary:
   // return data.map((client: any) => ({
   //   ...client,
   //   createdAt: new Date(client.createdAt),
   // }));
   return data;
}

export async function getClientById(id: string): Promise<Client | null> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null; // Not found
    }
     const errorData = await response.json().catch(() => ({ message: `Failed to fetch client ${id}` }));
     throw new Error(errorData.message || `Failed to fetch client ${id}`);
  }
   const data = await response.json();
   // Optional Date conversion:
   // return { ...data, createdAt: new Date(data.createdAt) };
   return data;
}

export async function createClient(clientData: ClientInputData): Promise<Client> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clientData),
  });
  if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create client' }));
      console.error("Create client error response:", errorData);
      throw new Error(errorData.message || 'Failed to create client');
  }
   const data = await response.json();
   // Optional Date conversion:
   // return { ...data, createdAt: new Date(data.createdAt) };
   return data;
}

export async function updateClient(id: string, clientData: Partial<ClientInputData>): Promise<Client> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT', // Using PUT as defined in the API route
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clientData),
  });
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: `Failed to update client ${id}` }));
     console.error("Update client error response:", errorData);
     throw new Error(errorData.message || `Failed to update client ${id}`);
  }
   const data = await response.json();
   // Optional Date conversion:
   // return { ...data, createdAt: new Date(data.createdAt) };
   return data;
}

export async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: `Failed to delete client ${id}` }));
     console.error("Delete client error response:", errorData);
     throw new Error(errorData.message || `Failed to delete client ${id}`);
  }
  // No content expected on successful delete typically
}
