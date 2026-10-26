import type { Product, Customer, User, Order, HeldBill, StoreSettings, Shift } from '../types/pos';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const posApi = {
  // Health & connection status
  checkHealth: () => request<{ status: string; database: string; timestamp: string; productsCount: number }>('/health'),

  // Products
  getProducts: () => request<Product[]>('/products'),
  createProduct: (product: Omit<Product, 'id'>) => request<{ success: boolean; id: string }>('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  }),
  updateProduct: (product: Product) => request<{ success: boolean }>(`/products/${product.id}`, {
    method: 'PUT',
    body: JSON.stringify(product)
  }),
  adjustStock: (id: string, delta: number) => request<{ success: boolean; newStock: number }>(`/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ delta })
  }),
  deleteProduct: (id: string) => request<{ success: boolean }>(`/products/${id}`, {
    method: 'DELETE'
  }),

  // Categories
  getCategories: () => request<string[]>('/categories'),
  createCategory: (name: string) => request<{ success: boolean }>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name })
  }),
  deleteCategory: (name: string) => request<{ success: boolean }>(`/categories/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  }),

  // Customers (Membership)
  getCustomers: () => request<Customer[]>('/customers'),
  createCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => request<{ success: boolean; customer: Customer }>('/customers', {
    method: 'POST',
    body: JSON.stringify(customer)
  }),
  updateCustomer: (id: string, customer: Partial<Customer>) => request<{ success: boolean }>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer)
  }),
  deleteCustomer: (id: string) => request<{ success: boolean }>(`/customers/${id}`, {
    method: 'DELETE'
  }),

  // Users (Accounts & Roles)
  getUsers: () => request<User[]>('/users'),
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => request<{ success: boolean; id: string }>('/users', {
    method: 'POST',
    body: JSON.stringify(user)
  }),
  updateUser: (id: string, user: Partial<User>) => request<{ success: boolean }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user)
  }),
  deleteUser: (id: string) => request<{ success: boolean }>(`/users/${id}`, {
    method: 'DELETE'
  }),
  login: (identifier: string, passwordOrPin?: string) => request<{ success: boolean; user: User }>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, passwordOrPin: passwordOrPin || identifier })
  }),

  // Orders & Sales
  getOrders: () => request<Order[]>('/orders'),
  createOrder: (order: Order) => request<{ success: boolean; order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  }),

  // Held Bills
  getHeldBills: () => request<HeldBill[]>('/held-bills'),
  createHeldBill: (bill: HeldBill) => request<{ success: boolean; id: string }>('/held-bills', {
    method: 'POST',
    body: JSON.stringify(bill)
  }),
  deleteHeldBill: (id: string) => request<{ success: boolean }>(`/held-bills/${id}`, {
    method: 'DELETE'
  }),

  // Store Settings
  getSettings: () => request<StoreSettings>('/settings'),
  updateSettings: (settings: Partial<StoreSettings>) => request<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),

  // Shifts
  getShift: () => request<Shift | null>('/shift'),
  openShift: (cashierName: string, startingCash: number) => request<{ success: boolean; id: string }>('/shift/open', {
    method: 'POST',
    body: JSON.stringify({ cashierName, startingCash })
  }),

  // Reset Database
  resetDatabase: () => request<{ success: boolean; message: string }>('/reset', {
    method: 'POST'
  })
};
