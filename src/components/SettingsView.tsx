import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { 
  Store, 
  QrCode, 
  Receipt, 
  RotateCcw, 
  Save, 
  CheckCircle,
  Volume2,
  Printer,
  Eye,
  Sparkles,
  Database,
  Server
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDefaultData, dbConnected, dbName } = usePOS();
  const [form, setForm] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Sample items for receipt live preview calculation
  const demoItems = [
    { name: 'กาแฟอเมริกาโน่เย็น (M)', qty: 1, price: 65, total: 65 },
    { name: 'แซนด์วิชแฮมชีสโทสต์', qty: 1, price: 55, total: 55 },
    { name: 'น้ำดื่มสิงห์ 600ml', qty: 2, price: 10, total: 20 },
  ];
  const demoSubtotal = 140;
  const demoDiscount = 10;
  const demoAfterDiscount = demoSubtotal - demoDiscount; // 130

  const vatRate = form.vatRate || 0;
  let demoTax = 0;
  let demoNetTotal = demoAfterDiscount;

  if (vatRate > 0) {
    if (form.vatIncluded) {
      demoTax = (demoAfterDiscount * vatRate) / (100 + vatRate);
      demoNetTotal = demoAfterDiscount;
    } else {
      demoTax = (demoAfterDiscount * vatRate) / 100;
      demoNetTotal = demoAfterDiscount + demoTax;
    }
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">⚙️ ตั้งค่าระบบและข้อมูลร้านค้า (Settings)</h2>
          <p className="view-subtitle">กำหนดข้อมูลหัวใบเสร็จ การคำนวณภาษี และบัญชีรับเงินพร้อมเพย์ พร้อมระบบ Live Preview ใบเสร็จทันที</p>
        </div>

        {savedSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle size={18} />
            <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
          </div>
        )}
      </div>

      <div className="settings-grid-layout">
        {/* Left Column: Configuration Forms */}
        <form onSubmit={handleSave} className="settings-form-col">
          {/* Store Profile Card */}
          <div className="stat-card">
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Store size={20} color="var(--primary)" />
              <span>ข้อมูลร้านค้าและใบกำกับภาษีอย่างย่อ</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  ชื่อร้านค้า (จะแสดงบนหัวใบเสร็จ) *
                </label>
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px' }}
                  value={form.storeName}
                  onChange={e => setForm({ ...form, storeName: e.target.value })}
                  placeholder="เช่น NEXUS Smart Mart"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  ชื่อสาขา
                </label>
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px' }}
                  value={form.branchName}
                  onChange={e => setForm({ ...form, branchName: e.target.value })}
                  placeholder="เช่น สาขาที่ 0001 (ทองหล่อ)"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  เลขประจำตัวผู้เสียภาษีอากร 13 หลัก
                </label>
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px', fontFamily: 'var(--font-mono)' }}
                  value={form.taxId}
                  onChange={e => setForm({ ...form, taxId: e.target.value })}
                  placeholder="เช่น 0105562089123"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px' }}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="เช่น 02-123-4567 หรือ 081-234-5678"
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  ที่อยู่ร้านค้า (สำหรับพิมพ์บนใบเสร็จ)
                </label>
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px' }}
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="เช่น 888/9 อาคารสยามสแควร์ ชั้น 2 ถนนพระราม 1 ปทุมวัน กทม. 10330"
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  ข้อความท้ายใบเสร็จ
                </label>
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px' }}
                  value={form.receiptFooter}
                  onChange={e => setForm({ ...form, receiptFooter: e.target.value })}
                  placeholder="เช่น ขอบคุณที่ใช้บริการ / กรุณาเก็บใบเสร็จไว้เป็นหลักฐาน"
                />
              </div>
            </div>
          </div>

          {/* Payment & PromptPay */}
          <div className="stat-card">
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={20} color="var(--cyan)" />
              <span>ตั้งค่าพร้อมเพย์สำหรับสร้าง QR สแกนจ่าย</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  เบอร์โทรศัพท์พร้อมเพย์ หรือเลขบัตรประชาชน/เลขนิติบุคคล (10 หรือ 13 หลัก)
                </label>
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px', fontFamily: 'var(--font-mono)' }}
                  value={form.promptPayId}
                  onChange={e => setForm({ ...form, promptPayId: e.target.value })}
                  placeholder="เช่น 0891234567 หรือ 0105562089123"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  ระบบจะนำหมายเลขนี้ไปสร้าง EMVCo QR Code อัตโนมัติตามยอดเงินในบิล
                </span>
              </div>
            </div>
          </div>

          {/* Tax & System Config */}
          <div className="stat-card">
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={20} color="var(--warning)" />
              <span>การคำนวณภาษีมูลค่าเพิ่ม (VAT) และระบบเสียง</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  อัตราภาษีมูลค่าเพิ่ม (%)
                </label>
                <input
                  type="number"
                  step="any"
                  className="barcode-input"
                  style={{ height: 44, padding: '0 14px', fontFamily: 'var(--font-mono)' }}
                  value={form.vatRate}
                  onChange={e => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  รูปแบบภาษี
                </label>
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="radio"
                      name="vatInc"
                      checked={form.vatIncluded}
                      onChange={() => setForm({ ...form, vatIncluded: true })}
                    />
                    <span>ภาษีรวมใน (Inclusive)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="radio"
                      name="vatInc"
                      checked={!form.vatIncluded}
                      onChange={() => setForm({ ...form, vatIncluded: false })}
                    />
                    <span>ภาษีแยกนอก (Exclusive)</span>
                  </label>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={form.enableSound}
                    onChange={e => setForm({ ...form, enableSound: e.target.checked })}
                  />
                  <Volume2 size={16} />
                  <span>เปิดเสียงเอฟเฟกต์บี๊บขณะยิงบาร์โค้ดและเสียงเตือนเมื่อคิดเงินสำเร็จ</span>
                </label>
              </div>
            </div>
          </div>

          {/* Database System Card (PostgreSQL Local Server) */}
          <div className="settings-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="settings-section-title">
              <Database size={20} color="var(--success)" />
              <span>ฐานข้อมูลระบบร้านค้า (Local Database Server)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: dbConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${dbConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 38, 
                    height: 38, 
                    borderRadius: 'var(--radius-full)', 
                    background: dbConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: dbConnected ? 'var(--success)' : 'var(--danger)'
                  }}>
                    <Server size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {dbConnected ? 'เชื่อมต่อฐานข้อมูล PostgreSQL สำเร็จ' : 'กำลังเชื่อมต่อฐานข้อมูล...'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      ระบบกำลังใช้งาน: <strong style={{ color: 'var(--text-primary)' }}>{dbName}</strong> (Localhost:5432) • Node.js Server Port 5001
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: dbConnected ? 'var(--success-surface)' : 'var(--danger-surface)',
                  color: dbConnected ? 'var(--success)' : 'var(--danger)'
                }}>
                  {dbConnected ? 'ONLINE • ทำงานปกติ' : 'OFFLINE'}
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                ✨ <strong>ระบบร้านค้าต่อฐานข้อมูล PostgreSQL ครบทุกโมดูล:</strong> สินค้า, สต็อก, ลูกค้าสมาชิก, บัญชีผู้ใช้งาน, ประวัติยอดขาย, บิลพัก และการตั้งค่าร้านค้า ทั้งหมดถูกจัดเก็บในฐานข้อมูลกลางอย่างปลอดภัย รองรับการเปิดใช้งานหลายเครื่องพร้อมกันในร้านผ่านระบบ Local Server
              </div>
            </div>
          </div>

          {/* Action Save Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              onClick={resetToDefaultData}
            >
              <RotateCcw size={16} />
              <span>รีเซ็ตข้อมูลเป็นค่าเริ่มต้น (Reset Demo Data)</span>
            </button>

            <button type="submit" className="btn-checkout" style={{ height: 48, padding: '0 32px' }}>
              <Save size={18} />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Receipt Preview */}
        <div className="settings-preview-col">
          <div className="receipt-preview-card">
            {/* Preview Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} color="var(--primary)" />
                <span>ตัวอย่างใบเสร็จจริง (80mm)</span>
              </div>
              <span className="live-preview-badge">
                <span className="pulse-dot"></span> Live Preview
              </span>
            </div>

            {/* Thermal Paper Container */}
            <div className="receipt-paper-wrapper">
              <div className="receipt-paper preview-mode" id="settings-receipt-preview">
                {/* Store Info Header */}
                <div className="receipt-header">
                  <div className="receipt-store-title">{form.storeName || 'ชื่อร้านค้าของคุณ'}</div>
                  {form.branchName && (
                    <div style={{ fontWeight: 600 }}>{form.branchName}</div>
                  )}
                  {form.address && (
                    <div style={{ fontSize: '0.7rem', color: '#4b5563', margin: '4px 0' }}>
                      {form.address}
                    </div>
                  )}
                  {form.phone && <div>โทร. {form.phone}</div>}
                  {form.taxId && <div>เลขประจำตัวผู้เสียภาษี: {form.taxId}</div>}
                </div>

                {/* Bill Meta */}
                <div style={{ fontSize: '0.75rem', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>เลขที่บิล:</span>
                    <strong>INV-{formattedDate.replace(/\//g, '')}-001</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>วันที่: {formattedDate}</span>
                    <span>เวลา: {formattedTime}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>พนักงาน:</span>
                    <span>แคชเชียร์ 01 (Demo)</span>
                  </div>
                </div>

                <div className="receipt-divider"></div>

                {/* Item List */}
                <div style={{ margin: '6px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 4, fontSize: '0.74rem' }}>
                    <span>รายการสินค้า</span>
                    <span>จำนวน x ราคา = รวม</span>
                  </div>

                  {demoItems.map((item, idx) => (
                    <div key={idx} className="receipt-item-row" style={{ fontSize: '0.73rem' }}>
                      <div style={{ maxWidth: '58%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {idx + 1}. {item.name}
                      </div>
                      <div>
                        {item.qty} x {item.price.toFixed(2)} = {item.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider"></div>

                {/* Totals & Tax Calculation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.74rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>รวมเป็นเงิน:</span>
                    <span>฿{demoSubtotal.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>ส่วนลดโปรโมชั่น:</span>
                    <span>-฿{demoDiscount.toFixed(2)}</span>
                  </div>

                  {vatRate > 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#4b5563' }}>
                      <span>VAT ({vatRate}% {form.vatIncluded ? 'รวมใน' : 'แยกนอก'}):</span>
                      <span>฿{demoTax.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.71rem', color: '#6b7280' }}>
                      <span>VAT (0% ไม่คิดภาษี):</span>
                      <span>฿0.00</span>
                    </div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 800, 
                    fontSize: '0.92rem', 
                    marginTop: 4, 
                    borderTop: '1px solid #111827', 
                    paddingTop: 4 
                  }}>
                    <span>ยอดสุทธิ (NET):</span>
                    <span>฿{demoNetTotal.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span>การชำระเงิน:</span>
                    <strong>พร้อมเพย์ (PromptPay)</strong>
                  </div>

                  {form.promptPayId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#4b5563' }}>
                      <span>พร้อมเพย์:</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{form.promptPayId}</span>
                    </div>
                  )}
                </div>

                {/* Receipt Footer */}
                <div className="receipt-footer">
                  <div>{form.receiptFooter || 'ขอบคุณที่ใช้บริการ / Thank you'}</div>
                  <div style={{ marginTop: 6, fontSize: '0.66rem', letterSpacing: '1.5px', color: '#6b7280' }}>
                    * * * NEXUS POS SYSTEM * * *
                  </div>
                </div>
              </div>
            </div>

            {/* Test Print Action & Info */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', height: 42, justifyContent: 'center' }}
                onClick={() => window.print()}
                title="ทดสอบสั่งพิมพ์ไปยังเครื่องพิมพ์ความร้อน (Thermal 80mm)"
              >
                <Printer size={16} />
                <span>ทดสอบพิมพ์ใบเสร็จ (Print Test)</span>
              </button>

              <div style={{ 
                fontSize: '0.74rem', 
                color: 'var(--text-muted)', 
                lineHeight: 1.45,
                background: 'rgba(99, 102, 241, 0.05)',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6
              }}>
                <Sparkles size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>ระบบแสดงผลสด:</strong> เมื่อคุณพิมพ์ชื่อร้าน สาขา ที่อยู่ เลขผู้เสียภาษี หรือท้ายบิล ตัวอย่างใบเสร็จจะอัปเดตให้เห็นทันที
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
