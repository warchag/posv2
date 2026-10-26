import React from 'react';
import { usePOS } from '../context/POSContext';
import { Printer, X, PlusCircle, CheckCircle2 } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { activeReceiptOrder, setActiveReceiptOrder, settings, closePaymentModal } = usePOS();

  if (!activeReceiptOrder) return null;

  const order = activeReceiptOrder;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setActiveReceiptOrder(null);
    closePaymentModal();
  };

  const formattedDate = new Date(order.timestamp).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formattedTime = new Date(order.timestamp).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <CheckCircle2 size={20} color="var(--success)" />
            <span>ชำระเงินสำเร็จ • พิมพ์ใบเสร็จ</span>
          </div>
          <button className="icon-btn" onClick={handleClose} title="ปิด">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Thermal Paper Preview */}
        <div className="modal-body" style={{ background: '#0a0f1d', padding: '16px 0' }}>
          <div className="receipt-paper" id="printable-receipt">
            {/* Store Info */}
            <div className="receipt-header">
              <div className="receipt-store-title">{settings.storeName}</div>
              <div>{settings.branchName}</div>
              <div style={{ fontSize: '0.7rem', color: '#4b5563', margin: '4px 0' }}>{settings.address}</div>
              <div>โทร. {settings.phone}</div>
              <div>เลขประจำตัวผู้เสียภาษี: {settings.taxId}</div>
            </div>

            {/* Bill Meta */}
            <div style={{ fontSize: '0.75rem', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>เลขที่บิล:</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>วันที่: {formattedDate}</span>
                <span>เวลา: {formattedTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>พนักงาน:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.customer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, paddingTop: 3, borderTop: '1px dashed #e5e7eb' }}>
                  <span>ลูกค้าสมาชิก:</span>
                  <strong>{order.customer.firstName} {order.customer.lastName} ({order.customer.memberCode})</strong>
                </div>
              )}
            </div>

            <div className="receipt-divider"></div>

            {/* Items */}
            <div style={{ margin: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 4 }}>
                <span>รายการสินค้า</span>
                <span>จำนวน x ราคา = รวม</span>
              </div>

              {order.items.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <div style={{ maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idx + 1}. {item.name}
                  </div>
                  <div>
                    {item.quantity} x {item.unitPrice.toFixed(2)} = {item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>รวมเป็นเงิน:</span>
                <span>฿{order.subtotal.toFixed(2)}</span>
              </div>

              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>ส่วนลด:</span>
                  <span>-฿{order.discount.toFixed(2)}</span>
                </div>
              )}

              {settings.vatRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280' }}>
                  <span>VAT ({settings.vatRate}% {settings.vatIncluded ? 'รวมใน' : 'แยกนอก'}):</span>
                  <span>฿{order.tax.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: 4, borderTop: '1px solid #000', paddingTop: 4 }}>
                <span>ยอดสุทธิ (NET):</span>
                <span>฿{order.netTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>การชำระเงิน:</span>
                <strong>
                  {order.paymentMethod === 'CASH'
                    ? 'เงินสด (Cash)'
                    : order.paymentMethod === 'PROMPTPAY'
                    ? 'พร้อมเพย์ (PromptPay)'
                    : 'บัตรเครดิต'}
                </strong>
              </div>

              {order.paymentMethod === 'CASH' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>รับเงินมา:</span>
                    <span>฿{order.cashReceived.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>เงินทอน:</span>
                    <span>฿{order.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="receipt-footer">
              <div>{settings.receiptFooter}</div>
              <div style={{ marginTop: 6, fontSize: '0.68rem', letterSpacing: '2px' }}>
                * * * NEXUS POS SYSTEM * * *
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-footer">
          <button className="btn-secondary" style={{ height: 44, padding: '0 16px' }} onClick={handleClose}>
            <PlusCircle size={16} />
            <span>เริ่มบิลถัดไป</span>
          </button>

          <button
            className="btn-checkout"
            style={{ height: 44, padding: '0 20px', background: 'var(--primary-gradient)' }}
            onClick={handlePrint}
          >
            <Printer size={18} />
            <span>พิมพ์ใบเสร็จ (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
