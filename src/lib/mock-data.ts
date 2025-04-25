import type { Client, Quotation, Priority } from '@/types';

export const mockClients: Client[] = [
  {
    id: 'cli_1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '123-456-7890',
    requirements: 'Need 5 Model X machines with custom paint.',
    priority: '1 month',
    createdAt: new Date(2024, 5, 1),
  },
  {
    id: 'cli_2',
    name: 'Globex Industries',
    email: 'sales@globex.com',
    phone: '987-654-3210',
    requirements: 'Interested in Model Y, standard configuration. Wants demo.',
    priority: '2 months',
    createdAt: new Date(2024, 4, 15),
  },
  {
    id: 'cli_3',
    name: 'Stark Enterprises',
    email: 'procurement@stark.net',
    phone: '555-123-4567',
    requirements: 'High volume order potential for Model Z. Needs detailed specs.',
    priority: '3 months',
    createdAt: new Date(2024, 3, 10),
  },
   {
    id: 'cli_4',
    name: 'Wayne Enterprises',
    email: 'bruce@wayne.com',
    phone: '555-987-6543',
    requirements: 'Special project requiring modifications to Model X.',
    priority: '1 month',
    createdAt: new Date(2024, 5, 20),
  },
   {
    id: 'cli_5',
    name: 'Cyberdyne Systems',
    email: 'info@cyberdyne.io',
    phone: '555-555-5555',
    requirements: 'Exploring AI integration capabilities.',
    priority: 'none',
    createdAt: new Date(2024, 5, 25),
  },
];

export const mockQuotations: Quotation[] = [
  {
    id: 'quo_1',
    clientId: 'cli_1',
    clientName: 'Acme Corporation', // Denormalized for easier display
    details: '5x Model X with custom red paint',
    amount: 50000,
    status: 'sent',
    createdAt: new Date(2024, 5, 5),
  },
  {
    id: 'quo_2',
    clientId: 'cli_3',
    clientName: 'Stark Enterprises',
    details: 'Initial draft for 100x Model Z (pending specs)',
    amount: 1000000,
    status: 'draft',
    createdAt: new Date(2024, 4, 1),
  },
  {
     id: 'quo_3',
     clientId: 'cli_1',
     clientName: 'Acme Corporation',
     details: 'Service contract for Model X machines',
     amount: 5000,
     status: 'accepted',
     createdAt: new Date(2024, 5, 10),
   },
];
