import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

const { Pool } = pg;

// PostgreSQL Connection Pool (Supports Railway DATABASE_URL & Localhost)
export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      database: process.env.DB_NAME || 'nexus_pos',
      user: process.env.DB_USER || process.env.USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('📦 Connected to PostgreSQL. Initializing tables...');

    // 1. Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        name VARCHAR(100) PRIMARY KEY
      );
    `);

    // 2. Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        barcode VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        sell_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'ชิ้น',
        emoji VARCHAR(20),
        image TEXT,
        color VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(100) PRIMARY KEY,
        member_code VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        pin VARCHAR(255),
        password VARCHAR(255),
        avatar VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure pin column in existing tables is wide enough for 60-char bcrypt hashes
    await client.query(`
      ALTER TABLE users ALTER COLUMN pin TYPE VARCHAR(255);
    `);

    // 5. Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        items JSONB NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL,
        discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
        net_total NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        cash_received NUMERIC(10, 2) NOT NULL,
        change NUMERIC(10, 2) NOT NULL DEFAULT 0,
        cashier_name VARCHAR(255) NOT NULL,
        customer JSONB,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Held Bills Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS held_bills (
        id VARCHAR(100) PRIMARY KEY,
        items JSONB NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        timestamp VARCHAR(100) NOT NULL,
        note TEXT,
        customer JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Store Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        store_name VARCHAR(255) NOT NULL,
        branch_name VARCHAR(255) NOT NULL,
        tax_id VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(100) NOT NULL,
        receipt_footer TEXT,
        prompt_pay_id VARCHAR(100),
        vat_rate NUMERIC(5, 2) DEFAULT 7,
        vat_included BOOLEAN DEFAULT TRUE,
        enable_sound BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Shift Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id VARCHAR(100) PRIMARY KEY,
        cashier_name VARCHAR(255) NOT NULL,
        start_time VARCHAR(100) NOT NULL,
        end_time VARCHAR(100),
        starting_cash NUMERIC(10, 2) NOT NULL DEFAULT 0,
        total_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
        cash_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
        prompt_pay_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
        orders_count INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'OPEN'
      );
    `);

    // Auto-seed default initial data if tables are empty
    await seedDefaultData(client);

    console.log('✅ PostgreSQL database tables initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize database tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function seedDefaultData(client: pg.PoolClient) {
  // Check products count
  const prodRes = await client.query('SELECT COUNT(*) FROM products');
  if (parseInt(prodRes.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial products & categories...');
    const categories = ['เครื่องดื่ม', 'ขนมและของว่าง', 'ของใช้ทั่วไป', 'บะหมี่กึ่งสำเร็จรูป'];
    for (const cat of categories) {
      await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [cat]);
    }

    const defaultProducts = [
      { id: 'prod-001', barcode: '885012340001', name: 'น้ำดื่มเน็กซัส 600 มล.', category: 'เครื่องดื่ม', cost_price: 5.5, sell_price: 10.0, stock: 75, min_stock: 20, unit: 'ขวด', emoji: '💧', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80', color: '#0284c7' },
      { id: 'prod-002', barcode: '885012340002', name: 'ชาเขียวรสมะนาว 500 มล.', category: 'เครื่องดื่ม', cost_price: 14.0, sell_price: 20.0, stock: 38, min_stock: 15, unit: 'ขวด', emoji: '🍵', image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&auto=format&fit=crop&q=80', color: '#16a34a' },
      { id: 'prod-003', barcode: '885012340003', name: 'กาแฟอาราบิก้ากระป๋องพร้อมดื่ม', category: 'เครื่องดื่ม', cost_price: 16.0, sell_price: 25.0, stock: 24, min_stock: 10, unit: 'กระป๋อง', emoji: '☕', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80', color: '#78350f' },
      { id: 'prod-004', barcode: '885012340004', name: 'นมโคสดแท้ 100% รสจืด 200 มล.', category: 'เครื่องดื่ม', cost_price: 9.0, sell_price: 13.5, stock: 12, min_stock: 15, unit: 'กล่อง', emoji: '🥛', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80', color: '#64748b' },
      { id: 'prod-005', barcode: '885012340005', name: 'มันฝรั่งทอดกรอบ รสโนริสาหร่าย 50 กรัม', category: 'ขนมและของว่าง', cost_price: 18.0, sell_price: 25.0, stock: 30, min_stock: 10, unit: 'ซอง', emoji: '🥔', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80', color: '#eab308' },
      { id: 'prod-006', barcode: '885012340006', name: 'ขนมปังแซนวิชโฮลวีต', category: 'ขนมและของว่าง', cost_price: 11.0, sell_price: 16.0, stock: 15, min_stock: 8, unit: 'ห่อ', emoji: '🍞', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80', color: '#d97706' },
      { id: 'prod-007', barcode: '885012340007', name: 'บะหมี่กึ่งสำเร็จรูปรสต้มยำกุ้ง', category: 'บะหมี่กึ่งสำเร็จรูป', cost_price: 5.8, sell_price: 7.0, stock: 85, min_stock: 25, unit: 'ซอง', emoji: '🍜', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80', color: '#dc2626' },
      { id: 'prod-008', barcode: '885012340008', name: 'ทิชชู่เปียกสูตรอ่อนโยน 20 แผ่น', category: 'ของใช้ทั่วไป', cost_price: 14.5, sell_price: 22.0, stock: 22, min_stock: 10, unit: 'ห่อ', emoji: '🧻', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80', color: '#0ea5e9' }
    ];

    for (const p of defaultProducts) {
      await client.query(`
        INSERT INTO products (id, barcode, name, category, cost_price, sell_price, stock, min_stock, unit, emoji, image, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING
      `, [p.id, p.barcode, p.name, p.category, p.cost_price, p.sell_price, p.stock, p.min_stock, p.unit, p.emoji, p.image, p.color]);
    }
  }

  // Check Customers count
  const custRes = await client.query('SELECT COUNT(*) FROM customers');
  if (parseInt(custRes.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial customers...');
    const defaultCustomers = [
      { id: 'cust-001', member_code: 'MB-001', first_name: 'สมพร', last_name: 'สุขดี', phone: '081-234-5678' },
      { id: 'cust-002', member_code: 'MB-002', first_name: 'กานดา', last_name: 'รักสงบ', phone: '089-876-5432' },
      { id: 'cust-003', member_code: 'MB-003', first_name: 'ประเสริฐ', last_name: 'มั่นคงดี', phone: '062-345-6789' }
    ];
    for (const c of defaultCustomers) {
      await client.query(`
        INSERT INTO customers (id, member_code, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [c.id, c.member_code, c.first_name, c.last_name, c.phone]);
    }
  }

  // Check Users count
  const usersRes = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(usersRes.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial users (hashed with bcrypt)...');
    const defaultUsers = [
      { id: 'user-admin', username: 'admin', name: 'ผู้จัดการระบบ (Admin)', role: 'ADMIN', pin: bcrypt.hashSync('1234', 10), password: bcrypt.hashSync('admin', 10), avatar: '👑' },
      { id: 'user-cashier-1', username: 'cashier1', name: 'สมชาย มั่นคง (แคชเชียร์ 01)', role: 'CASHIER', pin: bcrypt.hashSync('0000', 10), password: bcrypt.hashSync('1234', 10), avatar: '🛒' },
      { id: 'user-cashier-2', username: 'cashier2', name: 'วิภาดา สดใส (แคชเชียร์ 02)', role: 'CASHIER', pin: bcrypt.hashSync('1111', 10), password: bcrypt.hashSync('1234', 10), avatar: '🛒' }
    ];
    for (const u of defaultUsers) {
      await client.query(`
        INSERT INTO users (id, username, name, role, pin, password, avatar)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [u.id, u.username, u.name, u.role, u.pin, u.password, u.avatar]);
    }
  } else {
    // Migration: Upgrade any existing unhashed plaintext passwords/PINs
    const existingUsers = await client.query('SELECT id, pin, password FROM users');
    for (const u of existingUsers.rows) {
      let needsUpdate = false;
      let hashedPin = u.pin;
      let hashedPass = u.password;
      if (u.pin && !u.pin.startsWith('$2')) {
        hashedPin = bcrypt.hashSync(u.pin, 10);
        needsUpdate = true;
      }
      if (u.password && !u.password.startsWith('$2')) {
        hashedPass = bcrypt.hashSync(u.password, 10);
        needsUpdate = true;
      }
      if (needsUpdate) {
        await client.query('UPDATE users SET pin = $1, password = $2 WHERE id = $3', [hashedPin, hashedPass, u.id]);
      }
    }
  }

  // Check Settings
  const settRes = await client.query('SELECT COUNT(*) FROM settings');
  if (parseInt(settRes.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial store settings...');
    await client.query(`
      INSERT INTO settings (id, store_name, branch_name, tax_id, address, phone, receipt_footer, prompt_pay_id, vat_rate, vat_included, enable_sound)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING
    `, [
      'default',
      'NEXUS RETAIL MART',
      'สาขา 0001 (สำนักงานใหญ่)',
      '0105562089123',
      '88/12 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
      '02-123-4567',
      'ขอบคุณที่ใช้บริการ • สินค้ามีปัญหายินดีเปลี่ยนคืนภายใน 7 วัน',
      '0891234567',
      7.0,
      true,
      true
    ]);
  }

  // Check Shift
  const shiftRes = await client.query('SELECT COUNT(*) FROM shifts');
  if (parseInt(shiftRes.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial shift...');
    await client.query(`
      INSERT INTO shifts (id, cashier_name, start_time, starting_cash, total_sales, cash_sales, prompt_pay_sales, orders_count, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
    `, ['shift-init', 'สมชาย มั่นคง (แคชเชียร์ 01)', new Date().toISOString(), 2000, 0, 0, 0, 0, 'OPEN']);
  }

  // Check Orders
  const ordersRes = await client.query('SELECT COUNT(*) FROM orders');
  if (parseInt(ordersRes.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding initial demo sales orders...');
    const demoOrders = [
      {
        id: 'order-init-001',
        order_number: 'POS-261026090001',
        items: JSON.stringify([
          { productId: 'prod-001', barcode: '885012340001', name: 'น้ำดื่มเน็กซัส 600 มล.', unitPrice: 10.0, costPrice: 5.5, quantity: 2, discount: 0, subtotal: 20.0 },
          { productId: 'prod-003', barcode: '885012340003', name: 'กาแฟอาราบิก้ากระป๋องพร้อมดื่ม', unitPrice: 25.0, costPrice: 16.0, quantity: 1, discount: 0, subtotal: 25.0 }
        ]),
        subtotal: 45.0,
        discount: 0,
        tax: 2.94,
        net_total: 45.0,
        payment_method: 'CASH',
        cash_received: 50.0,
        change: 5.0,
        cashier_name: 'ผู้จัดการระบบ (Admin)',
        customer: JSON.stringify({ id: 'cust-001', memberCode: 'MB-001', firstName: 'สมพร', lastName: 'สุขดี', phone: '081-234-5678' }),
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'order-init-002',
        order_number: 'POS-261026093002',
        items: JSON.stringify([
          { productId: 'prod-002', barcode: '885012340002', name: 'ชาเขียวรสมะนาว 500 มล.', unitPrice: 20.0, costPrice: 14.0, quantity: 1, discount: 0, subtotal: 20.0 },
          { productId: 'prod-004', barcode: '885012340004', name: 'นมโคสดแท้ 100% รสจืด 200 มล.', unitPrice: 13.5, costPrice: 9.0, quantity: 1, discount: 0, subtotal: 13.5 }
        ]),
        subtotal: 33.5,
        discount: 0,
        tax: 2.19,
        net_total: 33.5,
        payment_method: 'PROMPTPAY',
        cash_received: 33.5,
        change: 0,
        cashier_name: 'สมชาย มั่นคง (แคชเชียร์ 01)',
        customer: JSON.stringify({ id: 'cust-002', memberCode: 'MB-002', firstName: 'กานดา', lastName: 'รักสงบ', phone: '089-876-5432' }),
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    for (const o of demoOrders) {
      await client.query(`
        INSERT INTO orders (id, order_number, items, subtotal, discount, tax, net_total, payment_method, cash_received, change, cashier_name, customer, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT DO NOTHING
      `, [o.id, o.order_number, o.items, o.subtotal, o.discount, o.tax, o.net_total, o.payment_method, o.cash_received, o.change, o.cashier_name, o.customer, o.timestamp]);
    }
  }
}
