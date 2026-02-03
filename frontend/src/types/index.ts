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
  createdAt: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Ticket {
  id: number;
  customerId: number;
  productType: string;
  shelf: string;
  brand?: string | null;
  model?: string | null;
  reported_malfunction?: string | null;
  ticketStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  total_price?: number | null;
  createdAt: string;
  closedAt?: string | null;
  customer?: Customer;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  closer?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Product {
  id: number;
  ticketId: number;
  productType: string;
  shelf: string;
  brand?: string | null;
  model?: string | null;
}

export interface ProductType {
  id: number;
  name: string;
}

export interface Shelf {
  id: number;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}
