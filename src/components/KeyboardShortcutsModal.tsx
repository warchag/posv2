import React from 'react';
import { usePOS } from '../context/POSContext';
import { Keyboard, X } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = usePOS();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: 'Enter', action: 'ยิงบาร์โค้ด / เพิ่มสินค้าลงตะกร้าทันที' },
    { key: 'F2', action: 'เปิดหน้าต่างคิดเงิน ชำระเงินค่าสินค้า (Checkout)' },
    { key: 'F4', action: 'ล้างสินค้าทั้งหมดในตะกร้า (Clear Cart)' },
    { key: 'Esc', action: 'ปิดหน้าต่างป๊อปอัป / ยกเลิกการทำรายการ' },
    { key: 'Enter (ในหน้าคิดเงิน)', action: 'ยืนยันการรับเงินและออกใบเสร็จ' }
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Keyboard size={20} color="var(--primary)" />
            <span>คีย์ลัดสำหรับแคชเชียร์ (Hotkeys)</span>
          </div>
          <button className="icon-btn" onClick={() => setIsShortcutsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ใช้คีย์ลัดบนคีย์บอร์ดเพื่อคิดเงินได้รวดเร็วโดยไม่ต้องใช้เมาส์คลิก:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {shortcuts.map((sc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span style={{ fontSize: '0.88rem' }}>{sc.action}</span>
                <kbd
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid var(--border-medium)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--cyan)'
                  }}
                >
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-checkout"
            style={{ height: 40, padding: '0 20px', fontSize: '0.9rem' }}
            onClick={() => setIsShortcutsOpen(false)}
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
