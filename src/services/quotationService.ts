import type { Quotation } from '@/types';

const API_BASE_URL = '/api/quotations';

// Type for data needed to create/update a quotation
export type QuotationInputData = Omit<Quotation, 'id' | 'createdAt' | 'clientName'>; // clientName is derived

export async function getQuotations(): Promise<Quotation[]> {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch quotations');
  }
   const data = await response.json();
   // Ensure dates are parsed correctly
  return data.map((quotation: any) => ({
    ...quotation,
    createdAt: new Date(quotation.createdAt),
  }));
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch quotation ${id}`);
  }
   const data = await response.json();
   return { ...data, createdAt: new Date(data.createdAt) };
}

export async function createQuotation(quotationData: QuotationInputData): Promise<Quotation> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(quotationData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create quotation' }));
    console.error("Create quotation error response:", errorData);
    throw new Error(errorData.message || 'Failed to create quotation');
  }
   const data = await response.json();
   return { ...data, createdAt: new Date(data.createdAt) };
}

export async function updateQuotation(id: string, quotationData: Partial<QuotationInputData>): Promise<Quotation> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT', // Or PATCH
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(quotationData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to update quotation ${id}` }));
    console.error("Update quotation error response:", errorData);
    throw new Error(errorData.message || `Failed to update quotation ${id}`);
  }
   const data = await response.json();
   return { ...data, createdAt: new Date(data.createdAt) };
}

export async function deleteQuotation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: `Failed to delete quotation ${id}` }));
     console.error("Delete quotation error response:", errorData);
     throw new Error(errorData.message || `Failed to delete quotation ${id}`);
  }
}
