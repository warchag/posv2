import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { pool, initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

// ----------------------------------------------------
// Security Middleware 1: HTTP Security Headers (Helmet)
// ----------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: false, // Allows local Vite dev server and customer display cross-window
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ----------------------------------------------------
// ----------------------------------------------------
// Security Middleware 2: Restrictive CORS Whitelist
// ----------------------------------------------------
const customAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [];

const isOriginAllowed = (origin: string): boolean => {
  if (!origin) return true; // Allow non-browser requests (e.g. curl, server-to-server)
  if (customAllowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    // Allow localhost and 127.0.0.1 on any port (5173, 5174, etc.)
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    // Allow private LAN ranges for secondary screen/customer display on local network
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  } catch {
    return false;
  }
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// ----------------------------------------------------
// Security Middleware 3: Rate Limiter on Authentication
// ----------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 attempts per minute per IP
  message: { error: 'มีการพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 1 นาทีแล้วลองใหม่อีกครั้ง' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: Sanitize safe user object (Never expose password or PIN!)
function sanitizeUser(user: any) {
  if (!user) return null;
  const { password, pin, ...safeUser } = user;
  return safeUser;
}

// ----------------------------------------------------
// Health Check Endpoint
// ----------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*)::int as product_count FROM products');
    res.json({
      status: 'ok',
      database: 'PostgreSQL (Connected)',
      timestamp: result.rows[0].current_time,
      productsCount: result.rows[0].product_count
    });
  } catch (err: any) {
    console.error('Health check error:', err);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// ----------------------------------------------------
// 1. Products API
// ----------------------------------------------------
app.get('/api/products', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, barcode, name, category, 
        cost_price::float as "costPrice", 
        sell_price::float as "sellPrice", 
        stock, min_stock as "minStock", 
        unit, emoji, image, color
      FROM products 
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายการสินค้าได้' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, barcode, name, category, costPrice, sellPrice, stock, minStock, unit, emoji, image, color } = req.body;

    if (!barcode?.trim() || !name?.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุบาร์โค้ดและชื่อสินค้า' });
    }

    const numCost = Math.max(0, parseFloat(costPrice) || 0);
    const numSell = Math.max(0, parseFloat(sellPrice) || 0);
    const numStock = Math.max(0, parseInt(stock, 10) || 0);
    const numMinStock = Math.max(0, parseInt(minStock, 10) || 0);
    const finalId = id || `prod-${Date.now()}`;

    await pool.query(`
      INSERT INTO products (id, barcode, name, category, cost_price, sell_price, stock, min_stock, unit, emoji, image, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [finalId, barcode.trim(), name.trim(), category?.trim() || 'ทั่วไป', numCost, numSell, numStock, numMinStock, unit?.trim() || 'ชิ้น', emoji || '', image || '', color || '#2f6b3c']);

    // Ensure category exists
    if (category?.trim()) {
      await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [category.trim()]);
    }

    res.json({ success: true, id: finalId });
  } catch (err: any) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้างสินค้าได้ (อาจมีบาร์โค้ดนี้อยู่แล้ว)' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { barcode, name, category, costPrice, sellPrice, stock, minStock, unit, emoji, image, color } = req.body;

    if (!barcode?.trim() || !name?.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุบาร์โค้ดและชื่อสินค้า' });
    }

    const numCost = Math.max(0, parseFloat(costPrice) || 0);
    const numSell = Math.max(0, parseFloat(sellPrice) || 0);
    const numStock = Math.max(0, parseInt(stock, 10) || 0);
    const numMinStock = Math.max(0, parseInt(minStock, 10) || 0);

    await pool.query(`
      UPDATE products SET
        barcode = $1, name = $2, category = $3, cost_price = $4, sell_price = $5,
        stock = $6, min_stock = $7, unit = $8, emoji = $9, image = $10, color = $11
      WHERE id = $12
    `, [barcode.trim(), name.trim(), category?.trim() || 'ทั่วไป', numCost, numSell, numStock, numMinStock, unit?.trim() || 'ชิ้น', emoji || '', image || '', color || '#2f6b3c', id]);

    if (category?.trim()) {
      await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [category.trim()]);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('PUT /api/products error:', err);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลสินค้าได้' });
  }
});

app.patch('/api/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const delta = parseInt(req.body.delta, 10);

    if (isNaN(delta)) {
      return res.status(400).json({ error: 'ค่าปรับสต็อกต้องเป็นตัวเลขที่ถูกต้อง' });
    }

    const result = await pool.query(`
      UPDATE products 
      SET stock = GREATEST(0, stock + $1)
      WHERE id = $2
      RETURNING stock, name
    `, [delta, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้านี้ในระบบ' });
    }

    res.json({ success: true, newStock: result.rows[0].stock });
  } catch (err: any) {
    console.error('PATCH /api/products/:id/stock error:', err);
    res.status(500).json({ error: 'ไม่สามารถปรับปรุงสต็อกสินค้าได้' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/products error:', err);
    res.status(500).json({ error: 'ไม่สามารถลบสินค้าได้' });
  }
});

// ----------------------------------------------------
// 2. Categories API
// ----------------------------------------------------
app.get('/api/categories', async (_req, res) => {
  try {
    const result = await pool.query('SELECT name FROM categories ORDER BY name ASC');
    res.json(result.rows.map(r => r.name));
  } catch (err: any) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'กรุณาระบุชื่อหมวดหมู่' });
    await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [name.trim()]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/categories error:', err);
    res.status(500).json({ error: 'ไม่สามารถเพิ่มหมวดหมู่ได้' });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const check = await pool.query('SELECT COUNT(*) FROM products WHERE category = $1', [name]);
    if (parseInt(check.rows[0].count, 10) > 0) {
      return res.status(400).json({ error: 'ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากมีสินค้าใช้งานอยู่' });
    }
    await pool.query('DELETE FROM categories WHERE name = $1', [name]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/categories error:', err);
    res.status(500).json({ error: 'ไม่สามารถลบหมวดหมู่ได้' });
  }
});

// ----------------------------------------------------
// 3. Customers API
// ----------------------------------------------------
app.get('/api/customers', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, member_code as "memberCode", 
        first_name as "firstName", 
        last_name as "lastName", 
        phone, 
        created_at as "createdAt"
      FROM customers 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('GET /api/customers error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสมาชิกได้' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { id, memberCode, firstName, lastName, phone } = req.body;
    if (!memberCode?.trim() || !firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลสมาชิกให้ครบถ้วน' });
    }

    const finalId = id || `cust-${Date.now()}`;
    const cleanCode = memberCode.trim().toUpperCase();

    const check = await pool.query('SELECT id FROM customers WHERE UPPER(member_code) = $1', [cleanCode]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: `รหัสสมาชิก "${cleanCode}" มีอยู่ในระบบแล้ว` });
    }

    const result = await pool.query(`
      INSERT INTO customers (id, member_code, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, member_code as "memberCode", first_name as "firstName", last_name as "lastName", phone, created_at as "createdAt"
    `, [finalId, cleanCode, firstName.trim(), lastName.trim(), phone.trim()]);

    res.json({ success: true, customer: result.rows[0] });
  } catch (err: any) {
    console.error('POST /api/customers error:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้างข้อมูลสมาชิกได้' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { memberCode, firstName, lastName, phone } = req.body;
    const cleanCode = memberCode?.trim()?.toUpperCase();

    if (cleanCode) {
      const check = await pool.query('SELECT id FROM customers WHERE UPPER(member_code) = $1 AND id != $2', [cleanCode, id]);
      if (check.rows.length > 0) {
        return res.status(400).json({ error: `รหัสสมาชิก "${cleanCode}" ซ้ำกับสมาชิกท่านอื่น` });
      }
    }

    await pool.query(`
      UPDATE customers SET
        member_code = COALESCE($1, member_code),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone)
      WHERE id = $5
    `, [cleanCode, firstName?.trim(), lastName?.trim(), phone?.trim(), id]);

    res.json({ success: true });
  } catch (err: any) {
    console.error('PUT /api/customers error:', err);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลสมาชิกได้' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/customers error:', err);
    res.status(500).json({ error: 'ไม่สามารถลบข้อมูลสมาชิกได้' });
  }
});

// ----------------------------------------------------
// 4. Users API (Secured: Credentials Hashed & Stripped)
// ----------------------------------------------------
app.get('/api/users', async (_req, res) => {
  try {
    // SECURITY: Never return password or PIN hashes in list API
    const result = await pool.query(`
      SELECT 
        id, username, name, role, avatar, 
        is_active as "isActive", created_at as "createdAt"
      FROM users 
      ORDER BY role ASC, name ASC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, username, name, role, pin, password, avatar } = req.body;
    if (!username?.trim() || !name?.trim() || !role) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้ ชื่อ-นามสกุล และบทบาทให้ครบถ้วน' });
    }

    if (!pin || !/^\d{4}$/.test(pin.trim())) {
      return res.status(400).json({ error: 'รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น' });
    }

    const finalId = id || `user-${Date.now()}`;
    const cleanUsername = username.trim().toLowerCase();

    const check = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [cleanUsername]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: `ชื่อผู้ใช้ "${cleanUsername}" มีอยู่ในระบบแล้ว` });
    }

    // Hash password & PIN securely with bcrypt
    const hashedPin = bcrypt.hashSync(pin.trim(), 10);
    const rawPassword = password?.trim() || pin.trim();
    const hashedPassword = bcrypt.hashSync(rawPassword, 10);

    await pool.query(`
      INSERT INTO users (id, username, name, role, pin, password, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [finalId, cleanUsername, name.trim(), role, hashedPin, hashedPassword, avatar || (role === 'ADMIN' ? '👑' : '🛒')]);

    res.json({ success: true, id: finalId });
  } catch (err: any) {
    console.error('POST /api/users error:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้างผู้ใช้งานได้' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, role, pin, password, avatar, isActive } = req.body;

    let hashedPin = undefined;
    if (pin !== undefined && pin !== '') {
      if (!/^\d{4}$/.test(pin.trim())) {
        return res.status(400).json({ error: 'รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น' });
      }
      hashedPin = pin.startsWith('$2') ? pin : bcrypt.hashSync(pin.trim(), 10);
    }

    let hashedPassword = undefined;
    if (password !== undefined && password !== '') {
      hashedPassword = password.startsWith('$2') ? password : bcrypt.hashSync(password.trim(), 10);
    }

    await pool.query(`
      UPDATE users SET
        username = COALESCE($1, username),
        name = COALESCE($2, name),
        role = COALESCE($3, role),
        pin = COALESCE($4, pin),
        password = COALESCE($5, password),
        avatar = COALESCE($6, avatar),
        is_active = COALESCE($7, is_active)
      WHERE id = $8
    `, [username?.trim()?.toLowerCase(), name?.trim(), role, hashedPin, hashedPassword, avatar, isActive, id]);

    res.json({ success: true });
  } catch (err: any) {
    console.error('PUT /api/users error:', err);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userRes.rows[0]?.role === 'ADMIN') {
      const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'");
      if (parseInt(adminCount.rows[0].count, 10) <= 1) {
        return res.status(400).json({ error: 'ไม่สามารถลบแอดมินคนสุดท้ายของระบบได้' });
      }
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/users error:', err);
    res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้งานได้' });
  }
});

// ----------------------------------------------------
// Secure Login Endpoint (SEC-01 & Brute Force Protected)
// ----------------------------------------------------
app.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { identifier, passwordOrPin } = req.body;
    const cleanId = identifier?.trim();
    const candidateSecret = passwordOrPin?.trim();

    // CRITICAL FIX (SEC-01): Reject immediately if secret is missing or empty
    if (!cleanId || !candidateSecret) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน หรือรหัส PIN' });
    }

    // Query active users
    const result = await pool.query(`
      SELECT 
        id, username, name, role, pin, password, avatar, is_active as "isActive"
      FROM users 
      WHERE is_active = true
    `);

    let matchedUser: any = null;

    for (const u of result.rows) {
      // Check 1: Identifier matches username
      if (u.username.toLowerCase() === cleanId.toLowerCase()) {
        const passMatch = u.password?.startsWith('$2')
          ? bcrypt.compareSync(candidateSecret, u.password)
          : u.password === candidateSecret;
        const pinMatch = u.pin?.startsWith('$2')
          ? bcrypt.compareSync(candidateSecret, u.pin)
          : u.pin === candidateSecret;

        if (passMatch || pinMatch) {
          matchedUser = u;
          break;
        }
      }

      // Check 2: 4-digit PIN direct login
      if (/^\d{4}$/.test(cleanId) && candidateSecret === cleanId) {
        const pinMatch = u.pin?.startsWith('$2')
          ? bcrypt.compareSync(cleanId, u.pin)
          : u.pin === cleanId;
        if (pinMatch) {
          matchedUser = u;
          break;
        }
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้ รหัสผ่าน หรือรหัส PIN ไม่ถูกต้อง' });
    }

    // Return safe user without exposing password or PIN hash
    res.json({ success: true, user: sanitizeUser(matchedUser) });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
});

// ----------------------------------------------------
// 5. Orders & Checkout API (SEC-05 & SEC-06 Hardened)
// ----------------------------------------------------
app.get('/api/orders', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, order_number as "orderNumber", 
        items, 
        subtotal::float, 
        discount::float, 
        tax::float, 
        net_total::float as "netTotal", 
        payment_method as "paymentMethod", 
        cash_received::float as "cashReceived", 
        change::float, 
        cashier_name as "cashierName", 
        customer, 
        timestamp
      FROM orders 
      ORDER BY timestamp DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลประวัติการขายได้' });
  }
});

app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      id, orderNumber, items, discount,
      paymentMethod, cashReceived,
      cashierName, customer, timestamp
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'รายการสินค้าในบิลต้องไม่ว่างเปล่า' });
    }

    // 1. Fetch system settings for tax rate
    const settRes = await client.query('SELECT vat_rate, vat_included FROM settings WHERE id = $1', ['default']);
    const vatRate = parseFloat(settRes.rows[0]?.vat_rate || '7');
    const vatIncluded = settRes.rows[0]?.vat_included !== false;

    await client.query('BEGIN');

    let computedSubtotal = 0;
    const verifiedItems = [];

    // 2. Server-side validation of products, actual prices, and atomic stock check
    for (const item of items) {
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`จำนวนสินค้าต้องเป็นตัวเลขจำนวนเต็มบวก (พบ: ${item.quantity})`);
      }

      // Lock row for update to prevent concurrent overselling race condition
      const prodRes = await client.query(`
        SELECT id, name, barcode, sell_price::float as "sellPrice", cost_price::float as "costPrice", stock, unit
        FROM products 
        WHERE id = $1 
        FOR UPDATE
      `, [item.productId]);

      if (prodRes.rows.length === 0) {
        throw new Error(`ไม่พบสินค้ารหัส "${item.productId}" ในฐานข้อมูล`);
      }

      const product = prodRes.rows[0];

      if (product.stock < quantity) {
        throw new Error(`สินค้า "${product.name}" มีสต็อกคงเหลือ ${product.stock} ${product.unit || 'ชิ้น'} ไม่เพียงพอสำหรับการสั่งซื้อ ${quantity} ${product.unit || 'ชิ้น'}`);
      }

      // Deduct stock safely
      await client.query(`
        UPDATE products 
        SET stock = stock - $1 
        WHERE id = $2
      `, [quantity, product.id]);

      const itemSubtotal = parseFloat((product.sellPrice * quantity).toFixed(2));
      computedSubtotal += itemSubtotal;

      verifiedItems.push({
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        unitPrice: product.sellPrice,
        costPrice: product.costPrice,
        quantity: quantity,
        discount: 0,
        subtotal: itemSubtotal
      });
    }

    computedSubtotal = parseFloat(computedSubtotal.toFixed(2));

    // 3. Server-side calculation of discounts, taxes, and net totals
    const requestedDiscount = Math.max(0, parseFloat(discount) || 0);
    const validDiscount = parseFloat(Math.min(requestedDiscount, computedSubtotal).toFixed(2));
    const taxableAmount = parseFloat((computedSubtotal - validDiscount).toFixed(2));

    const computedTax = vatIncluded
      ? parseFloat((taxableAmount * (vatRate / (100 + vatRate))).toFixed(2))
      : parseFloat((taxableAmount * (vatRate / 100)).toFixed(2));

    const computedNetTotal = vatIncluded
      ? taxableAmount
      : parseFloat((taxableAmount + computedTax).toFixed(2));

    // 4. Validate cash received
    const validMethods = ['CASH', 'PROMPTPAY', 'CREDIT_CARD'];
    const finalPaymentMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'CASH';
    const finalCashReceived = parseFloat(cashReceived) || computedNetTotal;

    if (finalPaymentMethod === 'CASH' && finalCashReceived < computedNetTotal) {
      throw new Error(`จำนวนเงินสดที่รับมา (฿${finalCashReceived}) ไม่เพียงพอกับยอดชำระจริง (฿${computedNetTotal})`);
    }

    const computedChange = finalPaymentMethod === 'CASH'
      ? parseFloat(Math.max(0, finalCashReceived - computedNetTotal).toFixed(2))
      : 0;

    const finalId = id || `order-${Date.now()}`;
    const finalOrderNumber = orderNumber || `POS-${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}`;

    // 5. Insert verified Order record
    await client.query(`
      INSERT INTO orders (
        id, order_number, items, subtotal, discount, tax,
        net_total, payment_method, cash_received, change,
        cashier_name, customer, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      finalId, finalOrderNumber, JSON.stringify(verifiedItems), computedSubtotal, validDiscount, computedTax,
      computedNetTotal, finalPaymentMethod, finalCashReceived, computedChange,
      cashierName || 'Cashier', customer ? JSON.stringify(customer) : null, timestamp || new Date().toISOString()
    ]);

    // 6. Update Shift metrics with verified net total
    await client.query(`
      UPDATE shifts
      SET 
        total_sales = total_sales + $1,
        cash_sales = CASE WHEN $2 = 'CASH' THEN cash_sales + $1 ELSE cash_sales END,
        prompt_pay_sales = CASE WHEN $2 = 'PROMPTPAY' THEN prompt_pay_sales + $1 ELSE prompt_pay_sales END,
        orders_count = orders_count + 1
      WHERE status = 'OPEN'
    `, [computedNetTotal, finalPaymentMethod]);

    await client.query('COMMIT');

    const createdOrder = {
      id: finalId,
      orderNumber: finalOrderNumber,
      items: verifiedItems,
      subtotal: computedSubtotal,
      discount: validDiscount,
      tax: computedTax,
      netTotal: computedNetTotal,
      paymentMethod: finalPaymentMethod,
      cashReceived: finalCashReceived,
      change: computedChange,
      cashierName: cashierName || 'Cashier',
      customer,
      timestamp: timestamp || new Date().toISOString()
    };

    res.json({ success: true, order: createdOrder });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err.message);
    res.status(400).json({ error: err.message || 'ไม่สามารถบันทึกรายการคำสั่งซื้อได้' });
  } finally {
    client.release();
  }
});

// ----------------------------------------------------
// 6. Held Bills API
// ----------------------------------------------------
app.get('/api/held-bills', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, items, total::float, timestamp, note, customer
      FROM held_bills 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error('GET /api/held-bills error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลบิลที่พักไว้ได้' });
  }
});

app.post('/api/held-bills', async (req, res) => {
  try {
    const { id, items, total, timestamp, note, customer } = req.body;
    const finalId = id || `held-${Date.now()}`;
    await pool.query(`
      INSERT INTO held_bills (id, items, total, timestamp, note, customer)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [finalId, JSON.stringify(items || []), Math.max(0, parseFloat(total) || 0), timestamp || new Date().toISOString(), note || '', customer ? JSON.stringify(customer) : null]);
    res.json({ success: true, id: finalId });
  } catch (err: any) {
    console.error('POST /api/held-bills error:', err);
    res.status(500).json({ error: 'ไม่สามารถบันทึกการพักบิลได้' });
  }
});

app.delete('/api/held-bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM held_bills WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/held-bills error:', err);
    res.status(500).json({ error: 'ไม่สามารถลบบิลที่พักไว้ได้' });
  }
});

// ----------------------------------------------------
// 7. Store Settings API
// ----------------------------------------------------
app.get('/api/settings', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        store_name as "storeName", branch_name as "branchName", 
        tax_id as "taxId", address, phone, receipt_footer as "receiptFooter", 
        prompt_pay_id as "promptPayId", vat_rate::float as "vatRate", 
        vat_included as "vatIncluded", enable_sound as "enableSound"
      FROM settings 
      WHERE id = 'default'
    `);
    res.json(result.rows[0] || null);
  } catch (err: any) {
    console.error('GET /api/settings error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { storeName, branchName, taxId, address, phone, receiptFooter, promptPayId, vatRate, vatIncluded, enableSound } = req.body;
    await pool.query(`
      UPDATE settings SET
        store_name = COALESCE($1, store_name),
        branch_name = COALESCE($2, branch_name),
        tax_id = COALESCE($3, tax_id),
        address = COALESCE($4, address),
        phone = COALESCE($5, phone),
        receipt_footer = COALESCE($6, receipt_footer),
        prompt_pay_id = COALESCE($7, prompt_pay_id),
        vat_rate = COALESCE($8, vat_rate),
        vat_included = COALESCE($9, vat_included),
        enable_sound = COALESCE($10, enable_sound),
        updated_at = NOW()
      WHERE id = 'default'
    `, [storeName?.trim(), branchName?.trim(), taxId?.trim(), address?.trim(), phone?.trim(), receiptFooter?.trim(), promptPayId?.trim(), vatRate, vatIncluded, enableSound]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('PUT /api/settings error:', err);
    res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' });
  }
});

// ----------------------------------------------------
// 8. Shift API
// ----------------------------------------------------
app.get('/api/shift', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, cashier_name as "cashierName", start_time as "startTime", end_time as "endTime",
        starting_cash::float as "startingCash", total_sales::float as "totalSales",
        cash_sales::float as "cashSales", prompt_pay_sales::float as "promptPaySales",
        orders_count as "ordersCount", status
      FROM shifts 
      WHERE status = 'OPEN' 
      ORDER BY start_time DESC 
      LIMIT 1
    `);
    res.json(result.rows[0] || null);
  } catch (err: any) {
    console.error('GET /api/shift error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลกะการทำงานได้' });
  }
});

app.post('/api/shift/open', async (req, res) => {
  try {
    const { cashierName, startingCash } = req.body;
    const id = `shift-${Date.now()}`;
    await pool.query(`
      INSERT INTO shifts (id, cashier_name, start_time, starting_cash, status)
      VALUES ($1, $2, $3, $4, 'OPEN')
    `, [id, cashierName?.trim() || 'Cashier', new Date().toISOString(), Math.max(0, parseFloat(startingCash) || 0)]);
    res.json({ success: true, id });
  } catch (err: any) {
    console.error('POST /api/shift/open error:', err);
    res.status(500).json({ error: 'ไม่สามารถเปิดกะได้' });
  }
});

// ----------------------------------------------------
// 9. Reset Database API (SEC-02 Hardened: Protected by Secret Token)
// ----------------------------------------------------
app.post('/api/reset', async (req, res) => {
  // CRITICAL FIX (SEC-02): Disallow unauthenticated reset
  const resetSecret = req.headers['x-admin-reset-key'] || req.body?.secretKey;
  const expectedSecret = process.env.ADMIN_RESET_SECRET || 'nexus-pos-admin-reset-authorized';

  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'คำสั่งล้างฐานข้อมูลถูกปิดการใช้งานในสภาพแวดล้อม Production' });
  }

  if (resetSecret !== expectedSecret) {
    return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: ต้องใช้กุญแจยืนยันความปลอดภัยระดับ Admin สำหรับคำสั่งนี้' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE orders, held_bills CASCADE;');
    await client.query('DELETE FROM products;');
    await client.query('DELETE FROM categories;');
    await client.query('DELETE FROM customers;');
    await client.query('DELETE FROM users;');
    await client.query('DELETE FROM settings;');
    await client.query('DELETE FROM shifts;');
    await client.query('COMMIT');

    // Re-seed defaults
    await initDatabase();

    res.json({ success: true, message: 'Database reset to default data successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('POST /api/reset error:', err);
    res.status(500).json({ error: 'ไม่สามารถรีเซ็ตฐานข้อมูลได้' });
  } finally {
    client.release();
  }
});

// ----------------------------------------------------
// 10. Production Static File Serving (Vite SPA)
// ----------------------------------------------------
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ----------------------------------------------------
// Start Server & Initialize Database
// ----------------------------------------------------
async function startServer() {
  try {
    await initDatabase();
    const server = app.listen(PORT, () => {
      console.log(`🚀 Node.js PostgreSQL POS Server is running on http://localhost:${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`ℹ️ Port ${PORT} is already in use by a running instance. Keeping process alive so client continues.`);
        setInterval(() => {}, 1000 * 60 * 60);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
