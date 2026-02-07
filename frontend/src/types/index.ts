export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Customer {
  id: number;
  name: string;
  surname: string;
  phone: string;
  address?: string | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number | null;
  creator?: { id: number; name: string; email: string };
  updater?: { id: number; name: string; email: string } | null;
}

export interface ProductType {
  id: number;
  type: string;
}

export interface Shelf {
  id: number;
  zone: string;
  row: number;
}

export type ProductStatus = 'RECEIVED' | 'IN_REPAIR' | 'WAITING_PARTS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';
export type TicketStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface Product {
  id: number;
  productTypeId: number;
  shelfId: number;
  ticketId: number;
  model: string;
  brand?: string | null;
  price?: number | null;
  status: ProductStatus;
  description?: string | null;
  receivedDate: string;
  deliveryDate?: string | null;
  created_at: string;
  updated_at: string;
  productType?: ProductType;
  shelf?: Shelf;
  ticket?: Ticket;
}

export interface Ticket {
  id: number;
  customerId: number;
  issue_description?: string | null;
  total_price?: number | null;
  closed_at?: string | null;
  ticketStatus: TicketStatus;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number | null;
  customer?: Customer;
  products?: Product[];
  creator?: { id: number; name: string; email: string };
  updater?: { id: number; name: string; email: string } | null;
}

export interface WhatsAppStatus {
  isReady: boolean;
  isInitializing: boolean;
  qrCode: string | null;
}
