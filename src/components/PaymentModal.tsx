import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import type { PaymentMethod } from '../types/pos';
import { generatePromptPayPayload } from '../utils/promptpay';
import QRCode from 'qrcode';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  CheckCircle, 
  X, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    closePaymentModal,
    cartTotal,
    completeCheckout,
    settings
  } = usePOS();

  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(cartTotal);
  const [cashInputStr, setCashInputStr] = useState<string>(cartTotal.toString());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Sync cash input when modal opens
  useEffect(() => {
    if (isPaymentModalOpen) {
      setCashReceived(cartTotal);
      setCashInputStr(cartTotal.toString());
      setMethod('CASH');
      setTimeout(() => {
        cashInputRef.current?.select();
      }, 50);
    }
  }, [isPaymentModalOpen, cartTotal]);

  // Generate PromptPay QR Code dynamically when PromptPay tab is selected
  useEffect(() => {
    if (method === 'PROMPTPAY' && isPaymentModalOpen) {
      const payload = generatePromptPayPayload(settings.promptPayId, cartTotal);
      QRCode.toDataURL(payload, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [method, isPaymentModalOpen, settings.promptPayId, cartTotal]);

  // Handle keyboard shortcuts (Esc to close, Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPaymentModalOpen) return;
      if (e.key === 'Escape') {
        closePaymentModal();
      } else if (e.key === 'Enter') {
        if (method === 'CASH') {
          if (cashReceived >= cartTotal) {
            handleComplete();
          }
        } else {
          handleComplete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaymentModalOpen, method, cashReceived, cartTotal]);

  if (!isPaymentModalOpen) return null;

  const change = Math.max(0, cashReceived - cartTotal);
  const isCashInsufficient = cashReceived < cartTotal;

  const handleCashChange = (valStr: string) => {
    setCashInputStr(valStr);
    const num = parseFloat(valStr) || 0;
    setCashReceived(num);
  };

  const handleQuickAddCash = (amount: number) => {
    setCashReceived(amount);
    setCashInputStr(amount.toString());
    cashInputRef.current?.focus();
  };

  const handleComplete = () => {
    if (method === 'CASH' && isCashInsufficient) {
      alert('จำนวนเงินสดที่รับมาไม่เพียงพอกับยอดชำระ');
      return;
    }
    const order = completeCheckout(method, cashReceived);
    if (order) {
      closePaymentModal();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <CheckCircle size={22} color="var(--success)" />
            <span>ชำระเงินค่าสินค้า</span>
          </div>
          <button className="icon-btn" onClick={closePaymentModal} title="ปิดหน้าต่าง [Esc]">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Total Amount Due Banner */}
          <div 
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>ยอดรวมสุทธิที่ต้องชำระ</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>รวมภาษีมูลค่าเพิ่มและส่วนลดแล้ว</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              ฿{cartTotal.toFixed(2)}
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="payment-tabs">
            <button
              className={`payment-tab-btn ${method === 'CASH' ? 'active' : ''}`}
              onClick={() => setMethod('CASH')}
            >
              <Banknote size={24} />
              <span>เงินสด (Cash)</span>
            </button>

            <button
              className={`payment-tab-btn ${method === 'PROMPTPAY' ? 'active' : ''}`}
              onClick={() => setMethod('PROMPTPAY')}
            >
              <QrCode size={24} />
              <span>สแกน QR พร้อมเพย์</span>
            </button>

            <button
              className={`payment-tab-btn ${method === 'CREDIT_CARD' ? 'active' : ''}`}
              onClick={() => setMethod('CREDIT_CARD')}
            >
              <CreditCard size={24} />
              <span>บัตรเครดิต / โอน</span>
            </button>
          </div>

          {/* Method 1: Cash Details */}
          {method === 'CASH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  เงินสดที่ได้รับจากลูกค้า (บาท)
                </label>
                <input
                  ref={cashInputRef}
                  type="number"
                  step="any"
                  className="barcode-input"
                  style={{
                    height: 52,
                    fontSize: '1.4rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '0 16px',
                    borderColor: isCashInsufficient ? 'var(--danger)' : 'var(--border-medium)'
                  }}
                  value={cashInputStr}
                  onChange={e => handleCashChange(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="quick-cash-grid">
                <button
                  type="button"
                  className="quick-cash-btn exact"
                  onClick={() => handleQuickAddCash(cartTotal)}
                >
                  พอดี (฿{cartTotal.toFixed(2)})
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickAddCash(Math.ceil(cartTotal / 100) * 100 || 100)}
                >
                  ฿{(Math.ceil(cartTotal / 100) * 100 || 100).toLocaleString()}
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickAddCash(500)}
                >
                  ฿500
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickAddCash(1000)}
                >
                  ฿1,000
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickAddCash(2000)}
                >
                  ฿2,000
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickAddCash(cartTotal + 50)}
                >
                  +฿50
                </button>
              </div>

              {/* Change Box */}
              <div className="change-box">
                <div>
                  <div className="change-label">
                    {isCashInsufficient ? '⚠️ เงินไม่พอ (ยังขาดอีก)' : 'เงินทอนให้ลูกค้า'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isCashInsufficient ? 'ลูกค้ายังชำระไม่ครบ' : 'กรุณาทอนเงินให้ถูกต้อง'}
                  </div>
                </div>
                <div 
                  className="change-amount"
                  style={{ color: isCashInsufficient ? 'var(--danger)' : 'var(--warning)' }}
                >
                  ฿{isCashInsufficient ? (cartTotal - cashReceived).toFixed(2) : change.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Method 2: PromptPay QR Details */}
          {method === 'PROMPTPAY' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div 
                style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="PromptPay QR Code" style={{ width: 190, height: 190, display: 'block' }} />
                ) : (
                  <div style={{ width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    กำลังสร้าง QR...
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  สแกนจ่ายด้วย Mobile Banking ทุกธนาคาร
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  พร้อมเพย์: <strong style={{ color: 'var(--cyan)' }}>{settings.promptPayId}</strong> ({settings.storeName})
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  ยอดชำระ ฿{cartTotal.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Method 3: Credit Card / Transfer */}
          {method === 'CREDIT_CARD' && (
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
                <ShieldCheck size={20} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>รับชำระผ่านบัตร EDC หรือโอนธนาคาร</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                • รูดหรือแตะบัตรบนเครื่องรูดบัตร (EDC Terminal) หน้าร้าน <br />
                • ตรวจสอบสลิปหรือใบทำรายการให้เรียบร้อยก่อนกดยืนยัน
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" style={{ height: 44, padding: '0 18px' }} onClick={closePaymentModal}>
            ยกเลิก [Esc]
          </button>

          <button
            className="btn-checkout"
            style={{ height: 44, padding: '0 24px', fontSize: '0.95rem' }}
            disabled={method === 'CASH' && isCashInsufficient}
            onClick={handleComplete}
          >
            <span>ยืนยันการรับเงิน</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
