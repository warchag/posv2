export type PaymentMethod = 'CASH' | 'PROMPTPAY' | 'CREDIT_CARD' | 'TRANSFER';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  emoji: string;
  image?: string;
  color?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  discount: number; // discount in Baht
}

export interface OrderItem {
  productId: string;
  barcode: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  netTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  change: number;
  cashierName: string;
  customer?: Customer | null;
  timestamp: string;
  status?: 'COMPLETED' | 'VOIDED' | 'REFUNDED';
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  endingCash?: number;
  actualCash?: number;
  cashDifference?: number;
  totalSales: number;
  cashSales: number;
  promptPaySales: number;
  creditCardSales?: number;
  voidSales?: number;
  voidCount?: number;
  ordersCount: number;
  status: 'OPEN' | 'CLOSED';
  note?: string;
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  taxId: string;
  address: string;
  phone: string;
  receiptFooter: string;
  promptPayId: string;
  vatRate: number;
  vatIncluded: boolean;
  enableSound: boolean;
}

export interface HeldBill {
  id: string;
  note: string;
  items: CartItem[];
  customer?: Customer | null;
  timestamp: string;
  total: number;
}

export type UserRole = 'ADMIN' | 'CASHIER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  pin?: string; // 4-digit numeric PIN (hashed/stripped on server)
  password?: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  points?: number;
  totalSpent?: number;
}

export type TabType = 'terminal' | 'inventory' | 'analytics' | 'customers' | 'users' | 'settings';

export interface CustomerDisplayState {
  cart: CartItem[];
  cartSubtotal: number;
  cartDiscount: number;
  cartTax: number;
  cartTotal: number;
  cartTotalItems: number;
  isPaymentModalOpen: boolean;
  activeReceiptOrder: Order | null;
  customer?: Customer | null;
  storeName: string;
  branchName: string;
  promptPayId: string;
}
