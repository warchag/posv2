import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { 
  Product, 
  CartItem, 
  Order, 
  OrderItem, 
  Shift, 
  StoreSettings, 
  HeldBill, 
  PaymentMethod,
  User,
  Customer,
  TabType
} from '../types/pos';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SETTINGS, 
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS
} from '../data/initialData';
import { sound } from '../utils/sound';
import { posApi } from '../services/api';

interface POSContextType {
  dbConnected: boolean;
  dbName: string;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  heldBills: HeldBill[];
  shift: Shift;
  settings: StoreSettings;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  // User Authentication & Management
  users: User[];
  currentUser: User | null;
  login: (usernameOrPin: string, passwordOrPin?: string) => Promise<{ success: boolean; message?: string }>;
  quickLoginAs: (user: User) => Promise<void> | void;
  logout: () => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateUser: (id: string, updates: Partial<User>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };

  // Customer Member Management
  customers: Customer[];
  selectedCustomer: Customer | null;
  selectCustomer: (customer: Customer | null) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => { success: boolean; message?: string; customer?: Customer };
  updateCustomer: (id: string, updates: Partial<Customer>) => { success: boolean; message?: string };
  deleteCustomer: (id: string) => { success: boolean; message?: string };

  // Navigation Sidebar
  isNavSidebarOpen: boolean;
  setIsNavSidebarOpen: (open: boolean) => void;
  toggleNavSidebar: () => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Categories
  categories: string[];
  addCategory: (name: string) => boolean;
  deleteCategory: (name: string) => boolean;

  // Cart actions
  addToCart: (product: Product, quantity?: number) => boolean;
  addByBarcode: (barcode: string) => { success: boolean; message?: string };
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  redeemedPoints: number;
  setRedeemedPoints: (points: number) => void;
  pointsDiscount: number;
  
  // Held Bills
  holdCurrentBill: (note?: string) => boolean;
  resumeHeldBill: (billId: string) => void;
  deleteHeldBill: (billId: string) => void;
  
  // Calculations
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  cartTotalItems: number;
  
  // Checkout & Modals
  isPaymentModalOpen: boolean;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (order: Order | null) => void;
  completeCheckout: (paymentMethod: PaymentMethod, cashReceived: number) => Order | null;
  voidOrder: (orderId: string, reason: string, adminPin: string, voidType?: 'VOID' | 'REFUND') => Promise<{ success: boolean; message?: string }>;
  
  // Inventory actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  adjustStock: (productId: string, delta: number) => void;
  deleteProduct: (productId: string) => void;
  
  // Shift & Settings
  openShift: (cashierName: string, startingCash: number) => Promise<{ success: boolean; message?: string }>;
  closeShift: (actualCash: number, note?: string) => Promise<{ success: boolean; message?: string; shift?: Shift }>;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  activeShiftReport: Shift | null;
  setActiveShiftReport: (shift: Shift | null) => void;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetToDefaultData: () => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;

  // Customer Display
  isCustomerDisplayOpen: boolean;
  setIsCustomerDisplayOpen: (open: boolean) => void;
  openCustomerDisplayWindow: () => void;

  // Manual & auto sync
  refreshData: () => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  'เครื่องดื่ม',
  'ขนม & ของว่าง',
  'อาหารสำเร็จรูป',
  'ของใช้ส่วนตัว',
  'ของใช้ในบ้าน',
  'ของใช้ทั่วไป'
];

const deduplicateOrders = (list: Order[]): Order[] => {
  const map = new Map<string, Order>();
  for (const o of list) {
    if (!o) continue;
    const key = o.id || o.orderNumber;
    if (key && !map.has(key)) {
      map.set(key, o);
    }
  }
  return Array.from(map.values());
};

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial states from localStorage with fallbacks
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        return parsed.map(p => {
          const init = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
          if (init?.image && !p.image) {
            return { ...p, image: init.image };
          }
          return p;
        });
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [activeShiftReport, setActiveShiftReport] = useState<Shift | null>(null);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return deduplicateOrders(parsed);
      }
      return deduplicateOrders(INITIAL_ORDERS);
    } catch {
      return deduplicateOrders(INITIAL_ORDERS);
    }
  });

  const [heldBills, setHeldBills] = useState<HeldBill[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_held_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Users State & Authentication
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_users');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return null;
  });

  // Customers / Members State
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_customers');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_CUSTOMERS;
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [shift, setShift] = useState<Shift>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_shift');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      id: 'shift-' + Date.now(),
      cashierName: 'สมชาย มั่นคง (แคชเชียร์ 01)',
      startTime: new Date().toISOString(),
      startingCash: 2000,
      totalSales: 0,
      cashSales: 0,
      promptPaySales: 0,
      ordersCount: 0,
      status: 'OPEN'
    };
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_categories');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    const productCats = Array.from(new Set(INITIAL_PRODUCTS.map(p => p.category)));
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...productCats]));
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_pos_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nexus_pos_categories', JSON.stringify(categories));
  }, [categories]);

  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
  const toggleNavSidebar = () => setIsNavSidebarOpen(prev => !prev);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCustomerDisplayOpen, setIsCustomerDisplayOpen] = useState(false);

  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [dbName, setDbName] = useState<string>('PostgreSQL (nexus_pos)');

  // Initial load from PostgreSQL Local Server
  const loadDataFromBackend = async () => {
    try {
      const health = await posApi.checkHealth();
      setDbConnected(true);
      if (health.database) setDbName(health.database);

      const [prods, cats, custs, usrs, ords, bills, sett, shft] = await Promise.all([
        posApi.getProducts().catch(() => null),
        posApi.getCategories().catch(() => null),
        posApi.getCustomers().catch(() => null),
        posApi.getUsers().catch(() => null),
        posApi.getOrders().catch(() => null),
        posApi.getHeldBills().catch(() => null),
        posApi.getSettings().catch(() => null),
        posApi.getShift().catch(() => null),
      ]);

      if (prods && prods.length > 0) setProducts(prods);
      if (cats && cats.length > 0) setCategories(cats);
      if (custs && custs.length > 0) setCustomers(custs);
      if (usrs && usrs.length > 0) setUsers(usrs);
      if (ords && Array.isArray(ords)) {
        const cleanOrds = deduplicateOrders(ords);
        setOrders(cleanOrds);
        try {
          localStorage.setItem('nexus_pos_orders', JSON.stringify(cleanOrds));
        } catch {
          // ignore
        }
      }
      if (bills) setHeldBills(bills);
      if (sett) setSettings(sett);
      if (shft) setShift(shft);
    } catch (err) {
      console.warn('Backend server not connected, using offline storage fallback:', err);
      setDbConnected(false);
    }
  };

  useEffect(() => {
    loadDataFromBackend();
    // Health check ping every 10s
    const timer = setInterval(() => {
      posApi.checkHealth()
        .then(() => setDbConnected(true))
        .catch(() => setDbConnected(false));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Whenever user switches to analytics tab, automatically refresh orders from PostgreSQL
  useEffect(() => {
    if (activeTab === 'analytics' && dbConnected) {
      posApi.getOrders()
        .then(ords => {
          if (ords && Array.isArray(ords)) {
            const clean = deduplicateOrders(ords);
            setOrders(clean);
            try {
              localStorage.setItem('nexus_pos_orders', JSON.stringify(clean));
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    }
  }, [activeTab, dbConnected]);

  const openCustomerDisplayWindow = () => {
    const width = 1080;
    const height = 720;
    const left = window.screen?.width ? window.screen.width : 100;
    window.open(
      `${window.location.origin}${window.location.pathname}?display=customer`,
      'NexusCustomerDisplay',
      `width=${width},height=${height},left=${left},top=100,menubar=no,toolbar=no,location=no,status=no`
    );
  };

  // Check if this instance is running as standalone Customer Display Screen
  const isStandaloneDisplay = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('display') === 'customer' ||
    window.location.hash === '#customer-display'
  );

  // Sync sounds setting
  useEffect(() => {
    sound.enabled = settings.enableSound;
  }, [settings.enableSound]);

  // Synchronize orders across browser tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexus_pos_orders' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Save to LocalStorage (skip writing if this instance is a standalone secondary display)
  useEffect(() => {
    if (isStandaloneDisplay) return;
    localStorage.setItem('nexus_pos_products', JSON.stringify(products));
  }, [products, isStandaloneDisplay]);

  useEffect(() => {
    if (isStandaloneDisplay) return;
    localStorage.setItem('nexus_pos_orders', JSON.stringify(orders));
  }, [orders, isStandaloneDisplay]);

  useEffect(() => {
    if (isStandaloneDisplay) return;
    localStorage.setItem('nexus_pos_held_bills', JSON.stringify(heldBills));
  }, [heldBills, isStandaloneDisplay]);

  useEffect(() => {
    if (isStandaloneDisplay) return;
    localStorage.setItem('nexus_pos_settings', JSON.stringify(settings));
  }, [settings, isStandaloneDisplay]);

  useEffect(() => {
    if (isStandaloneDisplay) return;
    localStorage.setItem('nexus_pos_shift', JSON.stringify(shift));
  }, [shift, isStandaloneDisplay]);

  useEffect(() => {
    if (isStandaloneDisplay) return;
    localStorage.setItem('nexus_pos_users', JSON.stringify(users));
  }, [users, isStandaloneDisplay]);

  useEffect(() => {
    if (isStandaloneDisplay) return;
    localStorage.setItem('nexus_pos_customers', JSON.stringify(customers));
  }, [customers, isStandaloneDisplay]);

  useEffect(() => {
    if (isStandaloneDisplay) return;
    if (currentUser) {
      // SECURITY: Strip password and PIN from localStorage persistence
      const { password, pin, ...safeUser } = currentUser as any;
      localStorage.setItem('nexus_pos_current_user', JSON.stringify(safeUser));
    } else {
      localStorage.removeItem('nexus_pos_current_user');
    }
  }, [currentUser, isStandaloneDisplay]);

  // User Auth Methods (Secured: Backend bcrypt verification & rate limited)
  const login = async (identifier: string, passwordOrPin?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim();
    const candidateSecret = (passwordOrPin?.trim()) || cleanId;

    if (!cleanId || !candidateSecret) {
      if (settings.enableSound) sound.playError();
      return { success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน หรือรหัส PIN' };
    }

    try {
      const res = await posApi.login(cleanId, candidateSecret);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setShift(prev => ({ ...prev, cashierName: res.user.name }));
        if (res.user.role === 'CASHIER') {
          setActiveTab('terminal');
        }
        if (settings.enableSound) sound.playSuccess();
        return { success: true };
      }
      if (settings.enableSound) sound.playError();
      return { success: false, message: 'ชื่อผู้ใช้ รหัสผ่าน หรือรหัส PIN ไม่ถูกต้อง' };
    } catch (err: any) {
      console.error('Login error:', err);
      // Fallback for offline mode if DB not reachable
      if (!dbConnected) {
        const found = users.find(u => 
          (u.username.toLowerCase() === cleanId.toLowerCase() || u.pin === cleanId) && u.isActive
        );
        if (found && (found.password === candidateSecret || found.pin === candidateSecret)) {
          setCurrentUser(found);
          setShift(prev => ({ ...prev, cashierName: found.name }));
          if (found.role === 'CASHIER') {
            setActiveTab('terminal');
          }
          if (settings.enableSound) sound.playSuccess();
          return { success: true };
        }
      }
      if (settings.enableSound) sound.playError();
      return { success: false, message: err?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }
  };

  const quickLoginAs = async (user: User) => {
    const demoPins: Record<string, string> = {
      'admin': '1234',
      'cashier1': '0000',
      'cashier2': '1111'
    };
    const pin = demoPins[user.username];
    if (pin) {
      await login(user.username, pin);
    } else {
      setCurrentUser(user);
      setShift(prev => ({ ...prev, cashierName: user.name }));
      if (user.role === 'CASHIER') {
        setActiveTab('terminal');
      }
      if (settings.enableSound) sound.playSuccess();
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedCustomer(null);
    setIsNavSidebarOpen(false);
  };

  // User Management Methods
  const addUser = (newUser: Omit<User, 'id' | 'createdAt'>): { success: boolean; message?: string } => {
    const cleanUsername = newUser.username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'ชื่อผู้ใช้งาน (Username) นี้มีอยู่ในระบบแล้ว' };
    }
    if (!newUser.pin || !/^\d{4}$/.test(newUser.pin)) {
      return { success: false, message: 'รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น' };
    }

    const created: User = {
      ...newUser,
      id: 'user-' + Date.now(),
      username: cleanUsername,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, created]);
    posApi.createUser(created).catch(e => console.error('PostgreSQL user create error:', e));
    return { success: true };
  };

  const updateUser = (id: string, updates: Partial<User>): { success: boolean; message?: string } => {
    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      const duplicate = users.some(u => u.id !== id && u.username.toLowerCase() === cleanUsername);
      if (duplicate) {
        return { success: false, message: 'ชื่อผู้ใช้งาน (Username) นี้มีผู้ใช้อื่นใช้อยู่แล้ว' };
      }
    }
    if (updates.pin && !/^\d{4}$/.test(updates.pin)) {
      return { success: false, message: 'รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น' };
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    posApi.updateUser(id, updates).catch(e => console.error('PostgreSQL user update error:', e));
    return { success: true };
  };

  const deleteUser = (id: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'ไม่พบผู้ใช้งาน' };

    if (currentUser?.id === id) {
      return { success: false, message: 'ไม่สามารถลบบัญชีที่คุณกำลังล็อกอินใช้งานอยู่ได้' };
    }

    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    if (target.role === 'ADMIN' && adminCount <= 1) {
      return { success: false, message: 'ต้องมีผู้ดูแลระบบ (Admin) อย่างน้อย 1 บัญชีในระบบ' };
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    posApi.deleteUser(id).catch(e => console.error('PostgreSQL user delete error:', e));
    return { success: true };
  };

  // Customer Member Methods
  const addCustomer = (newCust: Omit<Customer, 'id' | 'createdAt'>): { success: boolean; message?: string; customer?: Customer } => {
    const cleanCode = newCust.memberCode.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'กรุณาระบุรหัสลูกค้า' };
    if (!newCust.firstName.trim()) return { success: false, message: 'กรุณาระบุชื่อลูกค้า' };

    if (customers.some(c => c.memberCode.toUpperCase() === cleanCode)) {
      return { success: false, message: `รหัสลูกค้า "${cleanCode}" มีอยู่ในระบบแล้ว` };
    }

    const created: Customer = {
      ...newCust,
      id: 'cust-' + Date.now(),
      memberCode: cleanCode,
      firstName: newCust.firstName.trim(),
      lastName: newCust.lastName.trim(),
      phone: newCust.phone.trim(),
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [created, ...prev]);
    posApi.createCustomer(created).catch(e => console.error('PostgreSQL customer create error:', e));
    return { success: true, customer: created };
  };

  const updateCustomer = (id: string, updates: Partial<Customer>): { success: boolean; message?: string } => {
    if (updates.memberCode) {
      const cleanCode = updates.memberCode.trim().toUpperCase();
      if (customers.some(c => c.id !== id && c.memberCode.toUpperCase() === cleanCode)) {
        return { success: false, message: `รหัสลูกค้า "${cleanCode}" มีผู้อื่นใช้อยู่แล้ว` };
      }
    }
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(prev => prev ? { ...prev, ...updates } : null);
    }
    posApi.updateCustomer(id, updates).catch(e => console.error('PostgreSQL customer update error:', e));
    return { success: true };
  };

  const deleteCustomer = (id: string): { success: boolean; message?: string } => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
    posApi.deleteCustomer(id).catch(e => console.error('PostgreSQL customer delete error:', e));
    return { success: true };
  };

  const selectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer && settings.enableSound) {
      sound.playBeep();
    }
  };

  // Cart Calculations
  const pointsDiscount = Math.floor(redeemedPoints / 10); // 10 Points = 1 Baht Discount
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const cartAfterDiscount = Math.max(0, cartSubtotal - cartDiscount - pointsDiscount);
  
  const cartTax = settings.vatRate > 0
    ? settings.vatIncluded
      ? (cartAfterDiscount * settings.vatRate) / (100 + settings.vatRate)
      : (cartAfterDiscount * settings.vatRate) / 100
    : 0;
    
  const cartTotal = settings.vatIncluded 
    ? cartAfterDiscount 
    : cartAfterDiscount + cartTax;

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Sync state for Customer Display (works across browser windows / dual screens)
  useEffect(() => {
    const customerState = {
      cart,
      cartSubtotal,
      cartDiscount: cartDiscount + pointsDiscount,
      cartTax,
      cartTotal,
      cartTotalItems,
      isPaymentModalOpen,
      activeReceiptOrder,
      customer: selectedCustomer,
      storeName: settings.storeName,
      branchName: settings.branchName,
      promptPayId: settings.promptPayId
    };
    try {
      localStorage.setItem('nexus_pos_customer_state', JSON.stringify(customerState));
      const channel = new BroadcastChannel('nexus_pos_customer_channel');
      channel.postMessage(customerState);
      channel.close();
    } catch {
      // Fallback
    }
  }, [
    cart, 
    cartSubtotal, 
    cartDiscount, 
    pointsDiscount,
    cartTax, 
    cartTotal, 
    cartTotalItems, 
    isPaymentModalOpen, 
    activeReceiptOrder, 
    selectedCustomer,
    settings.storeName, 
    settings.branchName, 
    settings.promptPayId
  ]);

  // Cart Actions
  const addToCart = (product: Product, quantity = 1): boolean => {
    if (product.stock <= 0) {
      sound.playError();
      return false;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (nextQty > product.stock) {
          sound.playError();
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: nextQty }
            : item
        );
      }
      return [...prev, { product, quantity, discount: 0 }];
    });

    sound.playBeep();
    return true;
  };

  const addByBarcode = (barcode: string): { success: boolean; message?: string } => {
    const clean = barcode.trim();
    if (!clean) return { success: false, message: 'กรุณาระบุบาร์โค้ด' };

    const prod = products.find(p => p.barcode === clean);
    if (!prod) {
      sound.playError();
      return { success: false, message: `ไม่พบสินค้าบาร์โค้ด: ${clean}` };
    }

    if (prod.stock <= 0) {
      sound.playError();
      return { success: false, message: `สินค้า "${prod.name}" หมดสต็อกแล้ว` };
    }

    addToCart(prod, 1);
    return { success: true };
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (prod && quantity > prod.stock) {
      sound.playError();
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setRedeemedPoints(0);
    setSelectedCustomer(null);
  };

  // Held Bills Actions
  const holdCurrentBill = (note?: string): boolean => {
    if (cart.length === 0) return false;

    const newBill: HeldBill = {
      id: 'held-' + Date.now(),
      note: note || `บิลที่ ${heldBills.length + 1} (${cartTotalItems} ชิ้น)`,
      items: [...cart],
      customer: selectedCustomer,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      total: cartTotal
    };

    setHeldBills(prev => [newBill, ...prev]);
    posApi.createHeldBill(newBill).catch(e => console.error('PostgreSQL createHeldBill error:', e));
    clearCart();
    sound.playSuccess();
    return true;
  };

  const resumeHeldBill = (billId: string) => {
    const target = heldBills.find(b => b.id === billId);
    if (!target) return;

    setCart(target.items);
    setSelectedCustomer(target.customer || null);
    setHeldBills(prev => prev.filter(b => b.id !== billId));
    posApi.deleteHeldBill(billId).catch(e => console.error('PostgreSQL deleteHeldBill error:', e));
    sound.playBeep();
  };

  const deleteHeldBill = (billId: string) => {
    setHeldBills(prev => prev.filter(b => b.id !== billId));
    posApi.deleteHeldBill(billId).catch(e => console.error('PostgreSQL deleteHeldBill error:', e));
  };

  // Checkout Execution
  const completeCheckout = (
    paymentMethod: PaymentMethod,
    cashReceived: number
  ): Order | null => {
    if (cart.length === 0) return null;

    const orderNumber = 'POS-' + new Date().toISOString().replace(/\D/g, '').slice(2, 14);
    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      barcode: item.product.barcode,
      name: item.product.name,
      unitPrice: item.product.sellPrice,
      costPrice: item.product.costPrice,
      quantity: item.quantity,
      discount: item.discount,
      subtotal: item.product.sellPrice * item.quantity - item.discount
    }));

    const finalNetTotal = cartTotal;
    const finalChange = paymentMethod === 'CASH' ? Math.max(0, cashReceived - finalNetTotal) : 0;
    const pointsEarned = selectedCustomer ? Math.floor(finalNetTotal / 25) : 0;
    const finalDiscount = cartDiscount + pointsDiscount;

    const newOrder: Order = {
      id: 'order-' + Date.now(),
      orderNumber,
      items: orderItems,
      subtotal: cartSubtotal,
      discount: finalDiscount,
      tax: cartTax,
      netTotal: finalNetTotal,
      paymentMethod,
      cashReceived: paymentMethod === 'CASH' ? cashReceived : finalNetTotal,
      change: finalChange,
      cashierName: currentUser ? currentUser.name : shift.cashierName,
      customer: selectedCustomer,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      pointsEarned,
      pointsRedeemed: redeemedPoints
    };

    // Deduct stock levels locally
    setProducts(prev =>
      prev.map(p => {
        const sold = cart.find(item => item.product.id === p.id);
        if (sold) {
          return { ...p, stock: Math.max(0, p.stock - sold.quantity) };
        }
        return p;
      })
    );

    // Update member points locally
    if (selectedCustomer) {
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? {
        ...c,
        points: Math.max(0, (c.points || 0) - redeemedPoints + pointsEarned),
        totalSpent: (c.totalSpent || 0) + finalNetTotal
      } : c));
    }

    // Save order history immediately
    const nextOrders = deduplicateOrders([newOrder, ...orders]);
    setOrders(nextOrders);
    try {
      localStorage.setItem('nexus_pos_orders', JSON.stringify(nextOrders));
    } catch {
      // ignore
    }

    // Call PostgreSQL API to persist order and deduct stock in database
    posApi.createOrder({ ...newOrder, pointsRedeemed: redeemedPoints })
      .then(() => {
        posApi.getProducts().then(prods => prods && setProducts(prods)).catch(() => {});
        posApi.getCustomers().then(custs => custs && setCustomers(custs)).catch(() => {});
      })
      .catch(e => console.error('PostgreSQL createOrder error:', e));

    // Update shift metrics
    setShift(prev => ({
      ...prev,
      totalSales: prev.totalSales + finalNetTotal,
      cashSales: paymentMethod === 'CASH' ? prev.cashSales + finalNetTotal : prev.cashSales,
      promptPaySales: paymentMethod === 'PROMPTPAY' ? prev.promptPaySales + finalNetTotal : prev.promptPaySales,
      creditCardSales: (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'TRANSFER') ? (prev.creditCardSales || 0) + finalNetTotal : (prev.creditCardSales || 0),
      ordersCount: prev.ordersCount + 1
    }));

    clearCart();
    setSelectedCustomer(null);
    setIsPaymentModalOpen(false); // Close payment modal immediately
    setActiveReceiptOrder(newOrder); // Open receipt modal
    sound.playSuccess();
    return newOrder;
  };

  // Void / Refund Order Action
  const voidOrder = async (
    orderId: string,
    reason: string,
    adminPin: string,
    voidType: 'VOID' | 'REFUND' = 'VOID'
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await posApi.voidOrder(orderId, { adminPin, reason, voidType });
      if (res.success && res.order) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.order : o));
        posApi.getProducts().then(prods => prods && setProducts(prods)).catch(() => {});
        posApi.getCustomers().then(custs => custs && setCustomers(custs)).catch(() => {});
        posApi.getShift().then(sh => sh && setShift(sh)).catch(() => {});
        if (settings.enableSound) sound.playSuccess();
        return { success: true, message: res.message };
      }
      return { success: false, message: 'ไม่สามารถยกเลิกบิลได้' };
    } catch (err: any) {
      if (settings.enableSound) sound.playError();
      return { success: false, message: err?.message || 'เกิดข้อผิดพลาดในการยกเลิกบิล' };
    }
  };

  // Shift Management Actions
  const openShift = async (cashierName: string, startingCash: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await posApi.openShift(cashierName, startingCash);
      if (res.success) {
        const sh = await posApi.getShift();
        if (sh) setShift(sh);
        if (settings.enableSound) sound.playSuccess();
        return { success: true };
      }
      return { success: false, message: 'ไม่สามารถเปิดกะได้' };
    } catch (err: any) {
      if (settings.enableSound) sound.playError();
      return { success: false, message: err?.message || 'ไม่สามารถเปิดกะได้' };
    }
  };

  const closeShift = async (actualCash: number, note?: string): Promise<{ success: boolean; message?: string; shift?: Shift }> => {
    try {
      const res = await posApi.closeShift({ actualCash, note });
      if (res.success && res.shift) {
        setShift(res.shift);
        setActiveShiftReport(res.shift);
        if (settings.enableSound) sound.playSuccess();
        return { success: true, shift: res.shift };
      }
      return { success: false, message: 'ไม่สามารถปิดกะได้' };
    } catch (err: any) {
      if (settings.enableSound) sound.playError();
      return { success: false, message: err?.message || 'ไม่สามารถปิดกะได้' };
    }
  };

  // Inventory Actions
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const id = 'prod-' + Date.now();
    const created: Product = { ...newProd, id };
    setProducts(prev => [created, ...prev]);
    posApi.createProduct(created).catch(e => console.error('PostgreSQL createProduct error:', e));
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    posApi.updateProduct(updated).catch(e => console.error('PostgreSQL updateProduct error:', e));
  };

  const adjustStock = (productId: string, delta: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
    posApi.adjustStock(productId, delta).catch(e => console.error('PostgreSQL adjustStock error:', e));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    posApi.deleteProduct(productId).catch(e => console.error('PostgreSQL deleteProduct error:', e));
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    posApi.updateSettings(newSettings).catch(e => console.error('PostgreSQL updateSettings error:', e));
  };

  const addCategory = (name: string): boolean => {
    const clean = name.trim();
    if (!clean || categories.includes(clean)) return false;
    setCategories(prev => [...prev, clean]);
    posApi.createCategory(clean).catch(e => console.error('PostgreSQL createCategory error:', e));
    return true;
  };

  const deleteCategory = (name: string): boolean => {
    const clean = name.trim();
    const isUsed = products.some(p => p.category === clean);
    if (isUsed) return false;
    setCategories(prev => prev.filter(c => c !== clean));
    posApi.deleteCategory(clean).catch(e => console.error('PostgreSQL deleteCategory error:', e));
    return true;
  };

  const resetToDefaultData = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลเป็นค่าเริ่มต้นทั้งหมดใช่หรือไม่? ข้อมูลสินค้า ยอดขาย ผู้ใช้งาน และสมาชิกในฐานข้อมูล PostgreSQL จะถูกรีเซ็ต')) {
      posApi.resetDatabase()
        .then(() => {
          localStorage.clear();
          window.location.reload();
        })
        .catch(() => {
          localStorage.clear();
          window.location.reload();
        });
    }
  };

  return (
    <POSContext.Provider
      value={{
        dbConnected,
        dbName,
        products,
        cart,
        orders,
        heldBills,
        shift,
        settings,
        activeTab,
        setActiveTab,
        users,
        currentUser,
        login,
        quickLoginAs,
        logout,
        addUser,
        updateUser,
        deleteUser,
        customers,
        selectedCustomer,
        selectCustomer,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        isNavSidebarOpen,
        setIsNavSidebarOpen,
        toggleNavSidebar,
        theme,
        toggleTheme,
        categories,
        addCategory,
        deleteCategory,
        addToCart,
        addByBarcode,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        redeemedPoints,
        setRedeemedPoints,
        pointsDiscount,
        holdCurrentBill,
        resumeHeldBill,
        deleteHeldBill,
        cartSubtotal,
        cartTax,
        cartTotal,
        cartTotalItems,
        isPaymentModalOpen,
        openPaymentModal: () => {
          if (cart.length > 0) setIsPaymentModalOpen(true);
        },
        closePaymentModal: () => setIsPaymentModalOpen(false),
        activeReceiptOrder,
        setActiveReceiptOrder,
        completeCheckout,
        voidOrder,
        openShift,
        closeShift,
        isShiftModalOpen,
        setIsShiftModalOpen,
        activeShiftReport,
        setActiveShiftReport,
        addProduct,
        updateProduct,
        adjustStock,
        deleteProduct,
        updateSettings,
        resetToDefaultData,
        isShortcutsOpen,
        setIsShortcutsOpen,
        isCustomerDisplayOpen,
        setIsCustomerDisplayOpen,
        openCustomerDisplayWindow,
        refreshData: loadDataFromBackend
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
