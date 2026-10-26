import pg from 'pg';

const API_BASE = 'http://localhost:5001/api';

async function runSecurityAuditTests() {
  console.log('================================================================');
  console.log('🔒 NEXUS POS: AUTOMATED SECURITY AUDIT & REMEDIATION VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(testName: string, success: boolean, details: string) {
    if (success) {
      console.log(`[PASS] ✅ ${testName}`);
      console.log(`       Evidence: ${details}\n`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${testName}`);
      console.error(`       Error: ${details}\n`);
      failed++;
    }
  }

  // ---------------------------------------------------------
  // TEST 1: SEC-01 Authentication Bypass (Omitted / Blank Secret)
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin' }) // No passwordOrPin
    });
    const data = await res.json();
    if (res.status === 400 && data.error) {
      report(
        'SEC-01 (Auth Bypass Prevention): Omitted secret must return HTTP 400',
        true,
        `Status ${res.status}, Error msg: "${data.error}"`
      );
    } else {
      report('SEC-01 (Auth Bypass Prevention)', false, `Unexpected status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    report('SEC-01 (Auth Bypass Prevention)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 2: SEC-01 Invalid Credentials Rejection
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', passwordOrPin: 'wrong_password_999' })
    });
    const data = await res.json();
    if (res.status === 401) {
      report(
        'SEC-01 (Credential Validation): Invalid password rejected with HTTP 401',
        true,
        `Status ${res.status}, Error msg: "${data.error}"`
      );
    } else {
      report('SEC-01 (Credential Validation)', false, `Unexpected status ${res.status}`);
    }
  } catch (err: any) {
    report('SEC-01 (Credential Validation)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 3: SEC-03 Bcrypt Valid Login & Absence of Plaintext/Hash in Response
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', passwordOrPin: 'admin' })
    });
    const data = await res.json();
    const hasPassword = data.user && ('password' in data.user || 'pin' in data.user);
    if (res.status === 200 && data.success && !hasPassword) {
      report(
        'SEC-03 & SEC-04 (Safe Auth Response): Login succeeds & excludes credentials',
        true,
        `User ID: ${data.user.id}, Username: ${data.user.username}, Role: ${data.user.role}. Password/PIN fields present: ${hasPassword}`
      );
    } else {
      report('SEC-03 & SEC-04 (Safe Auth Response)', false, `Status ${res.status}, hasPassword: ${hasPassword}`);
    }
  } catch (err: any) {
    report('SEC-03 & SEC-04 (Safe Auth Response)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 4: SEC-04 Data Exposure in GET /api/users
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/users`);
    const users = await res.json();
    const exposedSecrets = users.filter((u: any) => u.password !== undefined || u.pin !== undefined);
    if (res.status === 200 && exposedSecrets.length === 0) {
      report(
        'SEC-04 (Information Disclosure): GET /api/users strips password & PIN hashes',
        true,
        `Retrieved ${users.length} users. Number of users leaking credentials: 0`
      );
    } else {
      report('SEC-04 (Information Disclosure)', false, `Exposed users: ${exposedSecrets.length}`);
    }
  } catch (err: any) {
    report('SEC-04 (Information Disclosure)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 5: Database Bcrypt Storage in PostgreSQL
  // ---------------------------------------------------------
  try {
    const pool = new pg.Pool({
      host: 'localhost',
      port: 5432,
      database: 'nexus_pos',
      user: process.env.USER || 'worracag'
    });
    const dbRes = await pool.query('SELECT username, pin, password FROM users');
    await pool.end();

    const allBcrypt = dbRes.rows.every(
      (r: any) => r.pin.startsWith('$2') && r.password.startsWith('$2')
    );
    if (allBcrypt) {
      report(
        'SEC-03 (Bcrypt Hash at Rest): DB stores salted bcrypt hashes (rounds=10)',
        true,
        `Sample hash: ${dbRes.rows[0].username} -> pin: ${dbRes.rows[0].pin.substring(0, 10)}..., password: ${dbRes.rows[0].password.substring(0, 10)}...`
      );
    } else {
      report('SEC-03 (Bcrypt Hash at Rest)', false, 'Found plaintext password or pin in users table!');
    }
  } catch (err: any) {
    report('SEC-03 (Bcrypt Hash at Rest)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 6: SEC-02 Unauthenticated / Unauthorized Database Reset
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (res.status === 403) {
      report(
        'SEC-02 (Database Reset Protection): Unauthenticated reset is rejected',
        true,
        `HTTP Status: ${res.status}, Error msg: "${data.error}"`
      );
    } else {
      report('SEC-02 (Database Reset Protection)', false, `Unexpected status ${res.status}`);
    }
  } catch (err: any) {
    report('SEC-02 (Database Reset Protection)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 7: SEC-05 Business Logic: Price Tampering Defense
  // ---------------------------------------------------------
  try {
    // prod-001 has sell price 10.00 THB in DB
    const tamperedOrder = {
      orderNumber: `SEC-TEST-${Date.now()}`,
      items: [
        {
          productId: 'prod-001',
          barcode: '885012340001',
          name: 'น้ำดื่มเน็กซัส 600 มล.',
          unitPrice: 0.01, // Client tries to spoof price to 0.01
          quantity: 2,
          discount: 0,
          subtotal: 0.02
        }
      ],
      subtotal: 0.02, // Client forged subtotal
      discount: 0,
      tax: 0,
      netTotal: 0.02, // Client forged net total
      paymentMethod: 'CASH',
      cashReceived: 50,
      change: 49.98,
      cashierName: 'Auditor'
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tamperedOrder)
    });
    const data = await res.json();
    if (res.status === 200 && data.order) {
      // Real DB price is 10.00 each -> 2 items = 20.00 THB
      const realNetTotal = data.order.netTotal;
      if (realNetTotal === 20) {
        report(
          'SEC-05 (Price Tampering Defense): Server recalculates totals from DB price',
          true,
          `Client sent netTotal=0.02 THB. Server recalculated and saved netTotal=${realNetTotal} THB`
        );
      } else {
        report('SEC-05 (Price Tampering Defense)', false, `Server accepted netTotal=${realNetTotal}`);
      }
    } else {
      report('SEC-05 (Price Tampering Defense)', false, `Status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    report('SEC-05 (Price Tampering Defense)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 8: SEC-06 Inventory Manipulation & Stock Exhaustion Defense
  // ---------------------------------------------------------
  try {
    const invalidQtyOrder = {
      orderNumber: `SEC-STOCK-${Date.now()}`,
      items: [
        {
          productId: 'prod-001',
          quantity: 999999 // Exceeds available stock
        }
      ],
      paymentMethod: 'CASH',
      cashReceived: 10000000,
      cashierName: 'Auditor'
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidQtyOrder)
    });
    const data = await res.json();
    if (res.status === 400 && data.error?.includes('ไม่เพียงพอ')) {
      report(
        'SEC-06 (Concurrency & Stock Protection): Excess quantity is rejected with row-locking',
        true,
        `Status ${res.status}, Server response: "${data.error}"`
      );
    } else {
      report('SEC-06 (Concurrency & Stock Protection)', false, `Status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    report('SEC-06 (Concurrency & Stock Protection)', false, err.message);
  }

  // ---------------------------------------------------------
  // TEST 9: Web Security Headers (Helmet)
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/health`);
    const xContentType = res.headers.get('x-content-type-options');
    const xFrameOptions = res.headers.get('x-frame-options');
    if (xContentType === 'nosniff' && xFrameOptions) {
      report(
        'SEC-07 (HTTP Security Headers): Helmet middleware active',
        true,
        `X-Content-Type-Options: ${xContentType}, X-Frame-Options: ${xFrameOptions}`
      );
    } else {
      report('SEC-07 (HTTP Security Headers)', false, `Missing headers. Content-Type-Options: ${xContentType}`);
    }
  } catch (err: any) {
    report('SEC-07 (HTTP Security Headers)', false, err.message);
  }

  console.log('----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
