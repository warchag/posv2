import React, { useState, useRef, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { 
  Scan, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  PauseCircle, 
  CreditCard, 
  ShoppingBag, 
  Tag, 
  AlertCircle,
  Sparkles,
  Monitor,
  UserCheck,
  UserPlus,
  X,
  Check,
  Users
} from 'lucide-react';

export const Terminal: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    addByBarcode,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartDiscount,
    setCartDiscount,
    holdCurrentBill,
    cartSubtotal,
    cartTax,
    cartTotal,
    cartTotalItems,
    openPaymentModal,
    settings,
    setIsCustomerDisplayOpen,
    customers,
    selectedCustomer,
    selectCustomer,
    addCustomer
  } = usePOS();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showSimBarcodes, setShowSimBarcodes] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Customer Member selection states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerModalTab, setCustomerModalTab] = useState<'search' | 'create'>('search');
  const [newCode, setNewCode] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const openCreateCustomerTab = (prefilledPhone = '') => {
    const nextNumber = customers.length + 1;
    setNewCode(`MB-${String(nextNumber).padStart(3, '0')}`);
    setNewFirstName('');
    setNewLastName('');
    setNewPhone(prefilledPhone || (customerSearchQuery.match(/^[0-9]+$/) ? customerSearchQuery : ''));
    setCustomerModalTab('create');
  };

  const handleQuickCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newPhone.trim()) {
      alert('กรุณากรอกชื่อ นามสกุล และเบอร์ติดต่อให้ครบถ้วน');
      return;
    }
    const finalCode = newCode.trim() || `MB-${String(customers.length + 1).padStart(3, '0')}`;
    const res = addCustomer({
      memberCode: finalCode,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim()
    });
    if (res.success && res.customer) {
      selectCustomer(res.customer);
      setIsCustomerModalOpen(false);
      setCustomerModalTab('search');
      setCustomerSearchQuery('');
    } else {
      alert(res.message || 'เกิดข้อผิดพลาดในการบันทึกสมาชิก');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.memberCode.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  // Auto-focus barcode input on mount and after cart changes
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard shortcut listener for F2 (Pay) and F4 (Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) openPaymentModal();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && confirm('ต้องการล้างตะกร้าสินค้าทั้งหมดหรือไม่?')) {
          clearCart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, openPaymentModal, clearCart]);

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const res = addByBarcode(barcodeInput);
    if (res.success) {
      setBarcodeInput('');
    } else {
      alert(res.message);
      barcodeInputRef.current?.select();
    }
  };

  // Category tabs
  const categoryTabs = ['ALL', ...categories];

  // Filter products by search query and category
  const filteredProducts = products.filter(product => {
    const matchesCat = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesQuery = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="terminal-layout">
      {/* ================= Catalog Area ================= */}
      <div className="catalog-area">
        {/* Top Search & Barcode Row */}
        <div className="catalog-controls">
          <form className="barcode-input-wrapper" onSubmit={handleBarcodeSubmit}>
            <Scan className="barcode-icon" size={22} />
            <input
              ref={barcodeInputRef}
              type="text"
              className="barcode-input"
              placeholder="สแกนบาร์โค้ด หรือพิมพ์รหัสแล้วกด Enter..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
            />
            <span className="barcode-quick-enter">กด Enter ↵</span>
          </form>

          {/* Search by Name */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: 12, top: 15, color: 'var(--text-muted)' }} 
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 48,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                paddingLeft: 38,
                paddingRight: 12,
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {/* Barcode Simulator / Quick Test Helper */}
          <button
            type="button"
            className="sim-scanner-btn"
            onClick={() => setShowSimBarcodes(!showSimBarcodes)}
            title="จำลองการยิงบาร์โค้ดเพื่อทดสอบระบบ"
          >
            <Sparkles size={16} color="#eab308" />
            <span>จำลองสแกนเนอร์</span>
          </button>

          {/* Customer Display Screen Trigger Button */}
          <button
            type="button"
            className="sim-scanner-btn"
            style={{ 
              borderColor: 'rgba(99, 102, 241, 0.4)', 
              background: 'rgba(99, 102, 241, 0.08)', 
              color: 'var(--primary)' 
            }}
            onClick={() => setIsCustomerDisplayOpen(true)}
            title="เปิดจอแสดงยอดเงินสำหรับลูกค้า (Customer Display / จอที่ 2)"
          >
            <Monitor size={16} />
            <span>🖥️ จอลูกค้า</span>
          </button>
        </div>

        {/* Quick Simulator Barcode Drawer */}
        {showSimBarcodes && (
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>⚡ คลิกเลือกสินค้าด้านล่างเพื่อจำลองการยิงบาร์โค้ดทันที:</span>
              <button 
                onClick={() => setShowSimBarcodes(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                ปิด [✕]
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {products.slice(0, 8).map(prod => (
                <button
                  key={prod.id}
                  onClick={() => {
                    addByBarcode(prod.barcode);
                    barcodeInputRef.current?.focus();
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{prod.emoji}</span>
                  <span>{prod.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                    [{prod.barcode.slice(-4)}]
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="categories-bar">
          {categoryTabs.map(cat => (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'ALL' ? '📦 สินค้าทั้งหมด' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStock;

            return (
              <div
                key={product.id}
                className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                onClick={() => {
                  if (!isOutOfStock) {
                    addToCart(product);
                    barcodeInputRef.current?.focus();
                  }
                }}
              >
                {/* Product Image Box */}
                <div className="product-card-image-box">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="product-card-img" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="product-card-placeholder">
                      <span style={{ fontSize: '2.5rem' }}>{product.emoji}</span>
                    </div>
                  )}

                  {/* Floating Stock Status Badge */}
                  <div
                    className={`stock-tag floating ${
                      isOutOfStock ? 'empty' : isLowStock ? 'low' : 'normal'
                    }`}
                  >
                    {isOutOfStock ? (
                      'หมดสต็อก'
                    ) : isLowStock ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <AlertCircle size={10} /> เหลือ {product.stock} {product.unit}
                      </span>
                    ) : (
                      `สต็อก ${product.stock} ${product.unit}`
                    )}
                  </div>
                </div>

                <div className="product-name" title={product.name}>
                  {product.name}
                </div>

                <div className="product-meta">
                  รหัส: {product.barcode}
                </div>

                <div className="product-price-row">
                  <div className="product-price">
                    ฿{product.sellPrice.toFixed(2)}
                  </div>
                  <div className="add-badge">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= Cart Sidebar ================= */}
      <div className="cart-sidebar">
        {/* Cart Header */}
        <div className="cart-header">
          <div className="cart-title-group">
            <ShoppingBag size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>รายการในตะกร้า</h2>
            <span className="cart-count-badge">{cartTotalItems} ชิ้น</span>
          </div>

          <div className="cart-actions-mini">
            {cart.length > 0 && (
              <>
                <button
                  className="icon-btn"
                  title="พักบิลชั่วคราว"
                  onClick={() => {
                    const note = prompt('ระบุโน้ตสำหรับบิลพัก (เช่น ลูกค้าลืมหยิบกระเป๋าเงิน):');
                    if (note !== null) {
                      holdCurrentBill(note);
                    }
                  }}
                >
                  <PauseCircle size={16} />
                </button>

                <button
                  className="icon-btn"
                  title="ล้างตะกร้าทั้งหมด (F4)"
                  onClick={() => {
                    if (confirm('คุณต้องการล้างสินค้าในตะกร้าทั้งหมดหรือไม่?')) {
                      clearCart();
                    }
                  }}
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Customer Membership Row in Cart */}
        <div className="cart-customer-bar">
          {selectedCustomer ? (
            <div className="cart-customer-card">
              <div className="cart-customer-card-left">
                <div className="cart-customer-avatar">
                  <UserCheck size={16} />
                </div>
                <div className="cart-customer-info">
                  <div className="cart-customer-name">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </div>
                  <div className="cart-customer-meta">
                    <span className="member-code-tag">{selectedCustomer.memberCode}</span>
                    <span className="cart-customer-phone">{selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>
              <div className="cart-customer-card-actions">
                <button
                  type="button"
                  className="cart-customer-action-btn"
                  onClick={() => setIsCustomerModalOpen(true)}
                  title="เปลี่ยนลูกค้าสมาชิก"
                >
                  เปลี่ยน
                </button>
                <button
                  type="button"
                  className="cart-customer-action-btn danger"
                  onClick={() => selectCustomer(null)}
                  title="ยกเลิกการเลือกลูกค้า"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="cart-customer-select-btn"
              onClick={() => {
                setCustomerModalTab('search');
                setIsCustomerModalOpen(true);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={16} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>เลือกลูกค้าสมาชิกสำหรับบิลนี้</span>
              </div>
              <span className="cart-customer-select-tag">+ ค้นหา / สมัคร</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={54} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                ยังไม่มีสินค้าในตะกร้า
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                ยิงบาร์โค้ด หรือคลิกเลือกสินค้าจากรายการด้านซ้ายเพื่อเริ่มคิดเงิน
              </div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="cart-item-row">
                <div className="cart-item-top">
                  <div>
                    <div className="cart-item-name">{item.product.name}</div>
                    <div className="cart-item-subprice">
                      ฿{item.product.sellPrice.toFixed(2)} / {item.product.unit}
                    </div>
                  </div>
                  <button
                    className="cart-item-delete"
                    onClick={() => removeFromCart(item.product.id)}
                    title="ลบรายการนี้"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="cart-item-bottom">
                  {/* Stepper */}
                  <div className="qty-stepper">
                    <button
                      className="qty-btn"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="cart-item-total">
                    ฿{(item.product.sellPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculation Footer */}
        <div className="cart-summary-footer">
          <div className="summary-line">
            <span>ยอดรวมสินค้า ({cartTotalItems} ชิ้น)</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>฿{cartSubtotal.toFixed(2)}</span>
          </div>

          {/* Discount Field */}
          <div className="summary-line">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag size={13} /> ส่วนลดท้ายบิล (บาท)
            </span>
            <input
              type="number"
              min="0"
              max={cartSubtotal}
              value={cartDiscount || ''}
              placeholder="0.00"
              onChange={e => setCartDiscount(Math.max(0, Number(e.target.value) || 0))}
              style={{
                width: '90px',
                textAlign: 'right',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 6px',
                fontFamily: 'var(--font-mono)',
                color: cartDiscount > 0 ? 'var(--danger)' : 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* VAT Information */}
          {settings.vatRate > 0 && (
            <div className="summary-line" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>ภาษีมูลค่าเพิ่ม VAT {settings.vatRate}% ({settings.vatIncluded ? 'รวมใน' : 'แยกนอก'})</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>฿{cartTax.toFixed(2)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="summary-line grand-total">
            <span>ยอดชำระสุทธิ</span>
            <span className="total-amount-display">
              ฿{cartTotal.toFixed(2)}
            </span>
          </div>

          {/* Bottom Checkout Actions */}
          <div className="cart-checkout-actions">
            <button
              className="btn-secondary"
              disabled={cart.length === 0}
              onClick={() => {
                const note = prompt('ระบุชื่อลูกค้าหรือโน้ตสำหรับพักบิล:');
                if (note !== null) holdCurrentBill(note);
              }}
            >
              <PauseCircle size={18} />
              <span>พักบิล</span>
            </button>

            <button
              className="btn-checkout"
              disabled={cart.length === 0}
              onClick={openPaymentModal}
            >
              <CreditCard size={20} />
              <span>ชำระเงิน [F2]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Member Selection Modal */}
      {isCustomerModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Users size={20} color="var(--primary)" />
                <span>เลือกลูกค้าสมาชิก (Member)</span>
              </div>
              <button 
                className="icon-btn" 
                onClick={() => setIsCustomerModalOpen(false)}
                title="ปิด"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="customer-modal-tabs">
              <button
                type="button"
                className={`customer-modal-tab-btn ${customerModalTab === 'search' ? 'active' : ''}`}
                onClick={() => setCustomerModalTab('search')}
              >
                🔍 ค้นหาสมาชิก
              </button>
              <button
                type="button"
                className={`customer-modal-tab-btn ${customerModalTab === 'create' ? 'active' : ''}`}
                onClick={() => openCreateCustomerTab()}
              >
                ➕ สมัครสมาชิกใหม่ทันที
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px' }}>
              {customerModalTab === 'search' ? (
                <div>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search 
                      size={17} 
                      style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} 
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: 38 }}
                      placeholder="พิมพ์เบอร์โทร, รหัสสมาชิก หรือชื่อ-นามสกุล..."
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Customer List */}
                  <div className="customer-quick-list">
                    {filteredCustomers.length === 0 ? (
                      <div className="customer-empty-search">
                        <Users size={32} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          ไม่พบข้อมูลสมาชิกลูกค้าที่ตรงกัน
                        </div>
                        <button
                          type="button"
                          className="btn-checkout"
                          style={{ marginTop: 12, fontSize: '0.82rem', height: 36, padding: '0 14px' }}
                          onClick={() => openCreateCustomerTab()}
                        >
                          <UserPlus size={15} />
                          <span>สมัครสมาชิกใหม่ด้วยเบอร์นี้</span>
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map(cust => {
                        const isSelected = selectedCustomer?.id === cust.id;
                        return (
                          <div 
                            key={cust.id} 
                            className={`customer-quick-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              selectCustomer(cust);
                              setIsCustomerModalOpen(false);
                            }}
                          >
                            <div className="customer-quick-info">
                              <div className="customer-avatar-circle">
                                {cust.firstName.charAt(0)}
                              </div>
                              <div>
                                <div className="customer-quick-name">
                                  {cust.firstName} {cust.lastName}
                                </div>
                                <div className="customer-quick-meta">
                                  <span className="member-code-tag">{cust.memberCode}</span>
                                  <span>โทร. {cust.phone}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={isSelected ? 'btn-selected-tag' : 'btn-select-customer'}
                            >
                              {isSelected ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Check size={14} /> เลือกอยู่
                                </span>
                              ) : (
                                'เลือก'
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Quick Create Member Tab */
                <form onSubmit={handleQuickCreateCustomer} className="customer-quick-form">
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">รหัสสมาชิก</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      placeholder="เช่น MB-004"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="form-label">ชื่อ *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newFirstName}
                        onChange={e => setNewFirstName(e.target.value)}
                        placeholder="ชื่อจริง"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">นามสกุล *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newLastName}
                        onChange={e => setNewLastName(e.target.value)}
                        placeholder="นามสกุล"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">เบอร์ติดต่อ *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      placeholder="เช่น 0812345678"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: 40 }}
                      onClick={() => setCustomerModalTab('search')}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="btn-checkout"
                      style={{ height: 40, padding: '0 18px', fontSize: '0.88rem' }}
                    >
                      <UserCheck size={16} />
                      <span>บันทึกและเลือกทันที</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
