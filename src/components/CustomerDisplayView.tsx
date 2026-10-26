import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { generatePromptPayPayload } from '../utils/promptpay';
import QRCode from 'qrcode';
import { 
  Zap, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  X, 
  Maximize2, 
  Minimize2,
  Sparkles,
  QrCode,
  Banknote,
  UserCheck
} from 'lucide-react';
import type { CartItem, Order, Customer } from '../types/pos';

interface CustomerDisplayViewProps {
  isStandalone?: boolean;
  onClose?: () => void;
}

export const CustomerDisplayView: React.FC<CustomerDisplayViewProps> = ({ 
  isStandalone = false, 
  onClose 
}) => {
  const context = usePOS();

  // Local state for standalone dual-screen synchronization
  const [syncState, setSyncState] = useState<{
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
  }>(() => {
    try {
      const saved = localStorage.getItem('nexus_pos_customer_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      cart: context.cart,
      cartSubtotal: context.cartSubtotal,
      cartDiscount: context.cartDiscount,
      cartTax: context.cartTax,
      cartTotal: context.cartTotal,
      cartTotalItems: context.cartTotalItems,
      isPaymentModalOpen: context.isPaymentModalOpen,
      activeReceiptOrder: context.activeReceiptOrder,
      customer: context.selectedCustomer,
      storeName: context.settings.storeName,
      branchName: context.settings.branchName,
      promptPayId: context.settings.promptPayId
    };
  });

  const [currentTime, setCurrentTime] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // If in-app, use context directly; if standalone, use syncState
  const cart = isStandalone ? syncState.cart : context.cart;
  const cartSubtotal = isStandalone ? syncState.cartSubtotal : context.cartSubtotal;
  const cartDiscount = isStandalone ? syncState.cartDiscount : context.cartDiscount;
  const cartTax = isStandalone ? syncState.cartTax : context.cartTax;
  const cartTotal = isStandalone ? syncState.cartTotal : context.cartTotal;
  const cartTotalItems = isStandalone ? syncState.cartTotalItems : context.cartTotalItems;
  const isPaymentModalOpen = isStandalone ? syncState.isPaymentModalOpen : context.isPaymentModalOpen;
  const activeReceiptOrder = isStandalone ? syncState.activeReceiptOrder : context.activeReceiptOrder;
  const customer = isStandalone ? syncState.customer : context.selectedCustomer;
  const storeName = isStandalone ? syncState.storeName : context.settings.storeName;
  const branchName = isStandalone ? syncState.branchName : context.settings.branchName;
  const promptPayId = isStandalone ? syncState.promptPayId : context.settings.promptPayId;

  // Real-time Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('th-TH', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }) + ' • ' + 
        now.toLocaleTimeString('th-TH', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to cross-window sync in standalone mode
  useEffect(() => {
    if (!isStandalone) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexus_pos_customer_state' && e.newValue) {
        try {
          setSyncState(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('nexus_pos_customer_channel');
      channel.onmessage = (event) => {
        if (event.data) {
          setSyncState(event.data);
        }
      };
    } catch {
      // fallback to storage event
    }

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [isStandalone]);

  // Generate PromptPay QR if Payment Modal is active and total > 0
  useEffect(() => {
    if (isPaymentModalOpen && cartTotal > 0 && promptPayId) {
      const payload = generatePromptPayPayload(promptPayId, cartTotal);
      QRCode.toDataURL(payload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(url => setQrDataUrl(url)).catch(() => {});
    } else {
      setQrDataUrl('');
    }
  }, [isPaymentModalOpen, cartTotal, promptPayId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className={`customer-display-screen ${isStandalone ? 'standalone' : 'modal-mode'}`}>
      {/* Customer Screen Top Navigation */}
      <header className="customer-display-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-logo" style={{ width: 40, height: 40 }}>
            <Zap size={22} fill="currentColor" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {storeName}
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {branchName} • จอแสดงผลสำหรับลูกค้า (Customer Display)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="customer-clock-pill">
            <Clock size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
            <span>{currentTime}</span>
          </div>

          {isStandalone ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 38, padding: '0 14px', fontSize: '0.84rem' }}
              onClick={toggleFullscreen}
              title="สลับเต็มจอ (Full Screen)"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isFullscreen ? 'ย่อหน้าต่าง' : 'แสดงเต็มจอ'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-checkout"
                style={{ height: 38, padding: '0 16px', fontSize: '0.84rem' }}
                onClick={context.openCustomerDisplayWindow}
                title="เปิดแยกหน้าต่างสำหรับลากไปยังจอที่ 2 ของเครื่อง POS"
              >
                <ExternalLink size={15} />
                <span>เปิดไปยังจอที่ 2 (Dual Screen)</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={onClose}
                  title="ปิดหน้าจอนี้"
                >
                  <X size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="customer-display-body">
        {/* State 1: Payment Complete Greeting */}
        {activeReceiptOrder ? (
          <div className="customer-complete-card">
            <div className="customer-complete-icon">
              <CheckCircle2 size={56} color="var(--success)" />
            </div>
            <h2 className="customer-complete-title">ชำระเงินเรียบร้อยแล้ว</h2>
            <p className="customer-complete-subtitle">
              เลขที่บิล: <strong>{activeReceiptOrder.orderNumber}</strong> • ขอบคุณที่ใช้บริการ
            </p>

            <div className="customer-change-box">
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ยอดชำระสุทธิ</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                ฿{activeReceiptOrder.netTotal.toFixed(2)}
              </div>

              {activeReceiptOrder.paymentMethod === 'CASH' && activeReceiptOrder.change > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border-medium)' }}>
                  <div style={{ fontSize: '1.05rem', color: 'var(--success)', fontWeight: 600 }}>
                    เงินทอนที่ได้รับ (Change)
                  </div>
                  <div style={{ fontSize: '3.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                    ฿{activeReceiptOrder.change.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              🙏 โอกาสหน้าเชิญใหม่ครับ / Thank you for your visit!
            </div>
          </div>
        ) : cart.length > 0 ? (
          /* State 2: Active Cart & Total Amount */
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: '16px' }}>
            {customer && (
              <div className="customer-member-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="member-banner-icon">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ยินดีต้อนรับสมาชิก: </span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {customer.firstName} {customer.lastName}
                    </strong>
                  </div>
                </div>
                <div className="customer-member-chips">
                  <span className="member-code-tag">{customer.memberCode}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>โทร. {customer.phone}</span>
                </div>
              </div>
            )}
            <div className="customer-split-layout" style={{ flex: 1 }}>
              {/* Left: Item List */}
              <div className="customer-items-panel">
                <div className="customer-panel-header">
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    รายการสินค้าที่สแกน ({cartTotalItems} ชิ้น)
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    แสดงผลตามเวลาจริง
                  </span>
                </div>

                <div className="customer-items-scroll">
                  {cart.map((item, idx) => {
                    const isLatest = idx === cart.length - 1;
                    return (
                      <div 
                        key={item.product.id} 
                        className={`customer-item-row ${isLatest ? 'latest' : ''}`}
                      >
                        <div className="customer-item-info">
                          <div className="customer-item-name">
                            <span>{item.product.name}</span>
                            {isLatest && (
                              <span className="customer-latest-tag">
                                <Sparkles size={11} /> ล่าสุด
                              </span>
                            )}
                          </div>
                          <div className="customer-item-price-calc">
                            {item.quantity} {item.product.unit || 'ชิ้น'} × ฿{item.product.sellPrice.toFixed(2)}
                          </div>
                        </div>

                        <div className="customer-item-total">
                          ฿{(item.product.sellPrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Big Total & Payment QR */}
              <div className="customer-total-panel">
                {/* Payment Prompt / QR Code if cashier opened checkout */}
                {isPaymentModalOpen && qrDataUrl ? (
                  <div className="customer-qr-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                      <QrCode size={18} />
                      <span>สแกนจ่ายผ่านแอปธนาคาร (PromptPay QR)</span>
                    </div>
                    <img 
                      src={qrDataUrl} 
                      alt="PromptPay QR Code" 
                      className="customer-qr-image"
                    />
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      รองรับทุกธนาคาร • ยอดเงินตรงตามบิลอัตโนมัติ
                    </div>
                  </div>
                ) : isPaymentModalOpen ? (
                  <div className="customer-cash-box">
                    <Banknote size={36} color="var(--success)" />
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>
                      ชำระด้วยเงินสด (Cash Payment)
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      กรุณายื่นเงินสดให้แก่พนักงานแคชเชียร์
                    </div>
                  </div>
                ) : null}

                {/* Breakdown summary */}
                <div className="customer-breakdown-card">
                  <div>
                    <div className="customer-summary-header">
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        สรุปยอดชำระเงิน
                      </span>
                      <span className="customer-item-count-badge">
                        {cartTotalItems} ชิ้น ({cart.length} รายการ)
                      </span>
                    </div>

                    <div className="customer-breakdown-row">
                      <span>รวมเป็นเงิน (Subtotal):</span>
                      <span className="customer-num-val">฿{cartSubtotal.toFixed(2)}</span>
                    </div>

                    {cartDiscount > 0 && (
                      <div className="customer-breakdown-row" style={{ color: 'var(--danger)' }}>
                        <span>ส่วนลดโปรโมชั่น:</span>
                        <span className="customer-num-val">-฿{cartDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {cartTax > 0 && (
                      <div className="customer-breakdown-row" style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                        <span>ภาษีมูลค่าเพิ่ม (VAT Included):</span>
                        <span className="customer-num-val">฿{cartTax.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* GIANT TOTAL TO PAY */}
                  <div className="customer-grand-total">
                    <div className="customer-grand-label">ยอดที่ต้องชำระ (TOTAL)</div>
                    <div className="customer-grand-amount">
                      ฿{cartTotal.toFixed(2)}
                    </div>
                  </div>

                  {/* Payment Methods Footer when waiting for payment */}
                  {!isPaymentModalOpen && (
                    <div className="customer-payment-methods-footer">
                      <div className="customer-payment-methods-title">
                        💳 วิธีชำระเงินที่รองรับ
                      </div>
                      <div className="customer-payment-pills">
                        <span className="customer-pay-pill">💵 เงินสด</span>
                        <span className="customer-pay-pill">📱 สแกน QR</span>
                        <span className="customer-pay-pill">💳 บัตรเครดิต</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* State 3: Standby / Welcome Screen */
          <div className="customer-standby-container">
            <div className="customer-standby-hero">
              <div className="customer-standby-logo">
                <ShoppingBag size={58} color="var(--primary)" />
              </div>
              <h2 className="customer-standby-title">ยินดีต้อนรับสู่ {storeName}</h2>
              <p className="customer-standby-subtitle">
                พร้อมให้บริการ • กรุณานำสินค้ามายังจุดชำระเงินเพื่อสแกนบาร์โค้ด
              </p>

              <div className="customer-standby-tips">
                <div className="customer-tip-chip">
                  <span>✨ ชำระได้ทั้งเงินสดและสแกนพร้อมเพย์ QR Code</span>
                </div>
                <div className="customer-tip-chip">
                  <span>🛡️ สินค้ามีปัญหายินดีเปลี่ยนคืนภายใน 7 วัน</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Customer Screen Footer */}
      <footer className="customer-display-footer">
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {context.settings.receiptFooter || 'ขอบคุณที่ใช้บริการ / Thank you for shopping with us!'}
        </div>
        <div className="customer-sync-badge">
          <span className="pulse-dot"></span>
          <span>ซิงค์ข้อมูลกับแคชเชียร์เรียลไทม์</span>
        </div>
      </footer>
    </div>
  );
};

export const CustomerDisplayModal: React.FC = () => {
  const { isCustomerDisplayOpen, setIsCustomerDisplayOpen } = usePOS();

  if (!isCustomerDisplayOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 140 }}>
      <div className="modal-card customer-display-modal-card">
        <CustomerDisplayView onClose={() => setIsCustomerDisplayOpen(false)} />
      </div>
    </div>
  );
};
