import type { Product, StoreSettings, User, Customer, Order } from '../types/pos';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    barcode: '885012340001',
    name: 'น้ำดื่มเน็กซัส 600 มล.',
    category: 'เครื่องดื่ม',
    costPrice: 5.5,
    sellPrice: 10.0,
    stock: 75,
    minStock: 20,
    unit: 'ขวด',
    emoji: '💧',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80',
    color: '#0284c7'
  },
  {
    id: 'prod-002',
    barcode: '885012340002',
    name: 'ชาเขียวรสมะนาว 500 มล.',
    category: 'เครื่องดื่ม',
    costPrice: 14.0,
    sellPrice: 20.0,
    stock: 38,
    minStock: 15,
    unit: 'ขวด',
    emoji: '🍵',
    image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&auto=format&fit=crop&q=80',
    color: '#16a34a'
  },
  {
    id: 'prod-003',
    barcode: '885012340003',
    name: 'กาแฟอาราบิก้ากระป๋องพร้อมดื่ม',
    category: 'เครื่องดื่ม',
    costPrice: 16.0,
    sellPrice: 25.0,
    stock: 24,
    minStock: 10,
    unit: 'กระป๋อง',
    emoji: '☕',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    color: '#78350f'
  },
  {
    id: 'prod-004',
    barcode: '885012340004',
    name: 'นมโคสดแท้ 100% รสจืด 200 มล.',
    category: 'เครื่องดื่ม',
    costPrice: 9.0,
    sellPrice: 13.5,
    stock: 12,
    minStock: 15,
    unit: 'กล่อง',
    emoji: '🥛',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
    color: '#64748b'
  },
  {
    id: 'prod-005',
    barcode: '885012340005',
    name: 'มันฝรั่งทอดกรอบ รสบาร์บีคิว 48 กรัม',
    category: 'ขนม & ของว่าง',
    costPrice: 18.0,
    sellPrice: 24.0,
    stock: 45,
    minStock: 15,
    unit: 'ซอง',
    emoji: '🥔',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80',
    color: '#ea580c'
  },
  {
    id: 'prod-006',
    barcode: '885012340006',
    name: 'ถั่วลิสงอบเกลือ 40 กรัม',
    category: 'ขนม & ของว่าง',
    costPrice: 11.0,
    sellPrice: 15.0,
    stock: 5,
    minStock: 10,
    unit: 'ซอง',
    emoji: '🥜',
    image: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=400&auto=format&fit=crop&q=80',
    color: '#d97706'
  },
  {
    id: 'prod-007',
    barcode: '885012340007',
    name: 'บะหมี่กึ่งสำเร็จรูปรสต้มยำกุ้ง',
    category: 'อาหารสำเร็จรูป',
    costPrice: 5.8,
    sellPrice: 8.0,
    stock: 120,
    minStock: 30,
    unit: 'ซอง',
    emoji: '🍜',
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
    color: '#dc2626'
  },
  {
    id: 'prod-008',
    barcode: '885012340008',
    name: 'ปลากระป๋องในซอสมะเขือเทศ 155 กรัม',
    category: 'อาหารสำเร็จรูป',
    costPrice: 14.5,
    sellPrice: 19.0,
    stock: 42,
    minStock: 12,
    unit: 'กระป๋อง',
    emoji: '🥫',
    image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&auto=format&fit=crop&q=80',
    color: '#b91c1c'
  },
  {
    id: 'prod-009',
    barcode: '885012340009',
    name: 'ข้าวหอมมะลิแท้คัดพิเศษ 1 กก.',
    category: 'อาหารสำเร็จรูป',
    costPrice: 42.0,
    sellPrice: 55.0,
    stock: 18,
    minStock: 8,
    unit: 'ถุง',
    emoji: '🍚',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
    color: '#059669'
  },
  {
    id: 'prod-010',
    barcode: '885012340010',
    name: 'ยาสีฟันสูตรสมุนไพรธรรมชาติ 100 กรัม',
    category: 'ของใช้ส่วนตัว',
    costPrice: 45.0,
    sellPrice: 65.0,
    stock: 22,
    minStock: 8,
    unit: 'หลอด',
    emoji: '🪥',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80',
    color: '#0891b2'
  },
  {
    id: 'prod-011',
    barcode: '885012340011',
    name: 'สบู่ก้อนบำรุงผิวผสมวิตามินอี',
    category: 'ของใช้ส่วนตัว',
    costPrice: 14.0,
    sellPrice: 22.0,
    stock: 35,
    minStock: 10,
    unit: 'ก้อน',
    emoji: '🧼',
    image: 'https://images.unsplash.com/photo-1607006314352-8d7b32258832?w=400&auto=format&fit=crop&q=80',
    color: '#ec4899'
  },
  {
    id: 'prod-012',
    barcode: '885012340012',
    name: 'น้ำยาปรับผ้านุ่มสูตรเข้มข้น 500 มล.',
    category: 'ของใช้ในบ้าน',
    costPrice: 29.0,
    sellPrice: 42.0,
    stock: 28,
    minStock: 10,
    unit: 'ถุง',
    emoji: '🌸',
    image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=400&auto=format&fit=crop&q=80',
    color: '#8b5cf6'
  },
  {
    id: 'prod-013',
    barcode: '885012340013',
    name: 'กระดาษชำระแบบม้วน (แพ็ค 6 ม้วน)',
    category: 'ของใช้ในบ้าน',
    costPrice: 48.0,
    sellPrice: 69.0,
    stock: 16,
    minStock: 6,
    unit: 'แพ็ค',
    emoji: '🧻',
    image: 'https://images.unsplash.com/photo-1584556812952-905ffd02b117?w=400&auto=format&fit=crop&q=80',
    color: '#2f6b3c'
  },
  {
    id: 'prod-014',
    barcode: '885012340014',
    name: 'ถ่านไฟฉายอัลคาไลน์ AA (แพ็ค 4 ก้อน)',
    category: 'ของใช้ทั่วไป',
    costPrice: 65.0,
    sellPrice: 89.0,
    stock: 8,
    minStock: 10,
    unit: 'แพ็ค',
    emoji: '🔋',
    image: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=400&auto=format&fit=crop&q=80',
    color: '#eab308'
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'NEXUS RETAIL MART',
  branchName: 'สาขา 0001 (สำนักงานใหญ่)',
  taxId: '0105562089123',
  address: '88/12 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  phone: '02-123-4567',
  receiptFooter: 'ขอบคุณที่ใช้บริการ • สินค้ามีปัญหายินดีเปลี่ยนคืนภายใน 7 วัน',
  promptPayId: '0891234567',
  vatRate: 7,
  vatIncluded: true,
  enableSound: true
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    name: 'ผู้จัดการระบบ (Admin)',
    role: 'ADMIN',
    pin: '1234',
    password: 'admin',
    avatar: '👑',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'user-cashier-1',
    username: 'cashier1',
    name: 'สมชาย มั่นคง (แคชเชียร์ 01)',
    role: 'CASHIER',
    pin: '0000',
    password: '1234',
    avatar: '🛒',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'user-cashier-2',
    username: 'cashier2',
    name: 'วิภาดา สดใส (แคชเชียร์ 02)',
    role: 'CASHIER',
    pin: '1111',
    password: '1234',
    avatar: '🛒',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    memberCode: 'MB-001',
    firstName: 'สมพร',
    lastName: 'สุขดี',
    phone: '081-234-5678',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust-002',
    memberCode: 'MB-002',
    firstName: 'กานดา',
    lastName: 'รักสงบ',
    phone: '089-876-5432',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust-003',
    memberCode: 'MB-003',
    firstName: 'ประเสริฐ',
    lastName: 'มั่นคงดี',
    phone: '062-345-6789',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-init-001',
    orderNumber: 'POS-261026090001',
    items: [
      {
        productId: 'prod-001',
        barcode: '885012340001',
        name: 'น้ำดื่มเน็กซัส 600 มล.',
        unitPrice: 10.0,
        costPrice: 5.5,
        quantity: 2,
        discount: 0,
        subtotal: 20.0
      },
      {
        productId: 'prod-003',
        barcode: '885012340003',
        name: 'กาแฟอาราบิก้ากระป๋องพร้อมดื่ม',
        unitPrice: 25.0,
        costPrice: 16.0,
        quantity: 1,
        discount: 0,
        subtotal: 25.0
      }
    ],
    subtotal: 45.0,
    discount: 0,
    tax: 2.94,
    netTotal: 45.0,
    paymentMethod: 'CASH',
    cashReceived: 50.0,
    change: 5.0,
    cashierName: 'ผู้จัดการระบบ (Admin)',
    customer: {
      id: 'cust-001',
      memberCode: 'MB-001',
      firstName: 'สมพร',
      lastName: 'สุขดี',
      phone: '081-234-5678',
      createdAt: new Date().toISOString()
    },
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'order-init-002',
    orderNumber: 'POS-261026093002',
    items: [
      {
        productId: 'prod-002',
        barcode: '885012340002',
        name: 'ชาเขียวรสมะนาว 500 มล.',
        unitPrice: 20.0,
        costPrice: 14.0,
        quantity: 1,
        discount: 0,
        subtotal: 20.0
      },
      {
        productId: 'prod-004',
        barcode: '885012340004',
        name: 'นมโคสดแท้ 100% รสจืด 200 มล.',
        unitPrice: 13.5,
        costPrice: 9.0,
        quantity: 1,
        discount: 0,
        subtotal: 13.5
      }
    ],
    subtotal: 33.5,
    discount: 0,
    tax: 2.19,
    netTotal: 33.5,
    paymentMethod: 'PROMPTPAY',
    cashReceived: 33.5,
    change: 0,
    cashierName: 'สมชาย มั่นคง (แคชเชียร์ 01)',
    customer: {
      id: 'cust-002',
      memberCode: 'MB-002',
      firstName: 'กานดา',
      lastName: 'รักสงบ',
      phone: '089-876-5432',
      createdAt: new Date().toISOString()
    },
    timestamp: new Date(Date.now() - 1800000).toISOString()
  }
];


