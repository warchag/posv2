import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  QrCode, 
  AlertTriangle, 
  FileText, 
  Lock, 
  ArrowRight,
  RefreshCw,
  Coins
} from 'lucide-react';

export const ShiftModal: React.FC = () => {
  const { 
    isShiftModalOpen, 
    setIsShiftModalOpen, 
    shift, 
    activeShiftReport, 
    closeShift, 
    openShift, 
    settings,
    currentUser
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'manage' | 'slip'>('manage');
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New shift form states
  const [newShiftCashier, setNewShiftCashier] = useState(currentUser?.name || 'แคชเชียร์ 1');
  const [newStartingCash, setNewStartingCash] = useState<string>('1000');

  if (!isShiftModalOpen) return null;

  const currentOrReportShift = activeShiftReport || shift;
  const isShiftOpen = shift.status === 'OPEN';

  // Calculations for drawer cash
  const startingCash = Number(currentOrReportShift.startingCash || 0);
  const cashSales = Number(currentOrReportShift.cashSales || 0);
  const promptpaySales = Number(currentOrReportShift.promptPaySales || 0);
  const creditCardSales = Number(currentOrReportShift.creditCardSales || 0);
  const totalSales = Number(currentOrReportShift.totalSales || 0);
  const voidSales = Number(currentOrReportShift.voidSales || 0);
  const voidCount = Number(currentOrReportShift.voidCount || 0);
  const orderCount = Number(currentOrReportShift.ordersCount || 0);

  // Expected cash in drawer = Starting Cash + Cash Sales
  const expectedCash = startingCash + cashSales;

  // Actual cash entered by cashier
  const parsedActualCash = actualCashInput.trim() !== '' ? Number(actualCashInput) : null;
  const cashDifference = parsedActualCash !== null ? parsedActualCash - expectedCash : null;

  const handlePrintZReport = () => {
    setActiveTab('slip');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedActualCash === null || isNaN(parsedActualCash)) {
      alert('กรุณากรอกยอดเงินสดที่นับได้จริงในลิ้นชัก');
      return;
    }

    const confirmMsg = cashDifference !== null && cashDifference !== 0
      ? `เงินสดในลิ้นชัก${cashDifference > 0 ? `เกิน +฿${cashDifference.toFixed(2)}` : `ขาด -฿${Math.abs(cashDifference).toFixed(2)}`}\nคุณยืนยันที่จะปิดกะหรือไม่?`
      : 'คุณยืนยันที่จะปิดกะการขายรอบนี้หรือไม่?';

    if (!confirm(confirmMsg)) return;

    setIsSubmitting(true);
    const res = await closeShift(parsedActualCash, note);
    setIsSubmitting(false);

    if (res.success) {
      setActiveTab('slip');
    } else {
      alert(res.message || 'เกิดข้อผิดพลาดในการปิดกะ');
    }
  };

  const handleOpenNewShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startCash = Number(newStartingCash) || 0;
    setIsSubmitting(true);
    const res = await openShift(newShiftCashier, startCash);
    setIsSubmitting(false);

    if (res.success) {
      alert('เปิดกะการขายรอบใหม่สำเร็จ!');
      setActiveTab('manage');
      setActualCashInput('');
      setNote('');
    } else {
      alert(res.message || 'เกิดข้อผิดพลาดในการเปิดกะ');
    }
  };

  const startTimeFormatted = currentOrReportShift.startTime
    ? new Date(currentOrReportShift.startTime).toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  const endTimeFormatted = currentOrReportShift.endTime
    ? new Date(currentOrReportShift.endTime).toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'กำลังเปิดขายอยู่';

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: activeTab === 'slip' ? '460px' : '620px', width: '100%' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Lock size={20} color="var(--primary)" />
            <span>จัดการรอบการขาย / ปิดกะ (Shift Z-Report)</span>
          </div>
          <button 
            className="icon-btn" 
            onClick={() => setIsShiftModalOpen(false)}
            title="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch between Manage and Printable Slip */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeTab === 'manage' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: activeTab === 'manage' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'manage' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Coins size={16} />
            <span>{isShiftOpen ? 'สรุปยอด & กระทบยอดเงินสด' : 'สถานะกะ & เปิดกะใหม่'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('slip')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeTab === 'slip' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: activeTab === 'slip' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'slip' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <FileText size={16} />
            <span>ใบสรุปปิดกะ (Z-Report Slip)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: activeTab === 'slip' ? '16px 0' : '20px' }}>
          {activeTab === 'manage' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Shift Status Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: isShiftOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isShiftOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isShiftOpen ? 'var(--success)' : 'var(--danger)',
                    boxShadow: isShiftOpen ? '0 0 10px var(--success)' : 'none'
                  }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isShiftOpen ? 'var(--success)' : 'var(--danger)' }}>
                      {isShiftOpen ? 'กะกำลังเปิดขาย (OPEN)' : 'กะถูกปิดเรียบร้อยแล้ว (CLOSED)'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      พนักงาน: <strong>{currentOrReportShift.cashierName}</strong> • เริ่มเมื่อ {startTimeFormatted}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ height: 32, padding: '0 10px', fontSize: '0.78rem' }}
                  onClick={handlePrintZReport}
                >
                  <Printer size={14} />
                  <span>พิมพ์ Z-Report</span>
                </button>
              </div>

              {/* Financial Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {/* Starting Cash */}
                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>
                    <Banknote size={14} color="var(--primary)" />
                    <span>เงินทอนเริ่มต้นกะ</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ฿{startingCash.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Cash Sales */}
                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>
                    <Coins size={14} color="#10b981" />
                    <span>ยอดขายเงินสด (Cash)</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                    ฿{cashSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* PromptPay Sales */}
                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>
                    <QrCode size={14} color="var(--cyan)" />
                    <span>พร้อมเพย์ (PromptPay)</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ฿{promptpaySales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Credit Card Sales */}
                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4 }}>
                    <CreditCard size={14} color="#8b5cf6" />
                    <span>บัตรเครดิต (Card)</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ฿{creditCardSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Net Sales & Voids Summary Row */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ยอดขายสุทธิทั้งหมด ({orderCount} บิลสำเร็จ)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    ฿{totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {voidSales > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <AlertTriangle size={13} />
                      <span>ยกเลิก/คืนเงิน ({voidCount} บิล)</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                      -฿{voidSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
              </div>

              {/* Cash Reconciliation Section */}
              {isShiftOpen ? (
                <form onSubmit={handleCloseShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    background: 'var(--bg-card)'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Coins size={16} color="var(--primary)" />
                      <span>กระทบยอดเงินสดในลิ้นชัก (Cash Count & Reconciliation)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border-subtle)', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>เงินสดที่ควรมีในลิ้นชัก (เริ่มต้น + ขายเงินสด):</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
                        ฿{expectedCash.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    {/* Actual Cash Input */}
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                        เงินสดที่นับได้จริงในลิ้นชัก (บาท) *
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        className="form-input"
                        placeholder="เช่น 1500.00"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, height: 46 }}
                        value={actualCashInput}
                        onChange={e => setActualCashInput(e.target.value)}
                        required
                      />
                    </div>

                    {/* Difference Indicator */}
                    {cashDifference !== null && (
                      <div style={{
                        marginTop: 10,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: cashDifference === 0 
                          ? 'rgba(16, 185, 129, 0.12)' 
                          : cashDifference > 0 
                          ? 'rgba(59, 130, 246, 0.12)' 
                          : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${
                          cashDifference === 0 
                            ? 'rgba(16, 185, 129, 0.3)' 
                            : cashDifference > 0 
                            ? 'rgba(59, 130, 246, 0.3)' 
                            : 'rgba(239, 68, 68, 0.3)'
                        }`
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {cashDifference === 0 
                            ? '✅ เงินในลิ้นชักตรงพอดี (Balanced)' 
                            : cashDifference > 0 
                            ? '🟢 เงินสดในลิ้นชักเกิน (Over)' 
                            : '🔴 เงินสดในลิ้นชักขาด (Short)'}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: cashDifference === 0 ? 'var(--success)' : cashDifference > 0 ? 'var(--primary)' : 'var(--danger)'
                        }}>
                          {cashDifference > 0 ? `+฿${cashDifference.toFixed(2)}` : `฿${cashDifference.toFixed(2)}`}
                        </span>
                      </div>
                    )}

                    {/* Closing Note */}
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                        หมายเหตุ / บันทึกการปิดกะ (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="เช่น จ่ายค่าน้ำแข็ง 50 บาท, ลูกค้าฝากเหรียญทอน ฯลฯ"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit Close Shift Button */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: 44, padding: '0 18px' }}
                      onClick={() => setIsShiftModalOpen(false)}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="btn-checkout"
                      style={{ height: 44, padding: '0 24px', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                      disabled={isSubmitting}
                    >
                      <Lock size={16} />
                      <span>{isSubmitting ? 'กำลังปิดกะ...' : 'บันทึกและปิดกะขาย (Close Shift)'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Shift Closed - Option to Open New Shift */
                <form onSubmit={handleOpenNewShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    background: 'var(--bg-card)'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)' }}>
                      <RefreshCw size={16} />
                      <span>เปิดกะการขายรอบใหม่ (Open New Shift)</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          ชื่อพนักงานแคชเชียร์ *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={newShiftCashier}
                          onChange={e => setNewShiftCashier(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          เงินทอนเริ่มต้นกะ (บาท) *
                        </label>
                        <input
                          type="number"
                          step="100"
                          min="0"
                          className="form-input"
                          style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                          value={newStartingCash}
                          onChange={e => setNewStartingCash(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: 44, padding: '0 18px' }}
                      onClick={() => setIsShiftModalOpen(false)}
                    >
                      ปิดหน้าต่าง
                    </button>
                    <button
                      type="submit"
                      className="btn-checkout"
                      style={{ height: 44, padding: '0 24px' }}
                      disabled={isSubmitting}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isSubmitting ? 'กำลังเปิดกะ...' : 'เริ่มเปิดกะขายใหม่'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ================= Thermal 80mm Z-Report Slip Preview ================= */
            <div style={{ background: '#0a0f1d', padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
              <div className="receipt-paper" id="printable-zreport">
                {/* Store Header */}
                <div className="receipt-header">
                  <div className="receipt-store-title">{settings.storeName}</div>
                  <div>{settings.branchName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#4b5563', margin: '4px 0' }}>{settings.address}</div>
                  <div>โทร. {settings.phone}</div>
                  <div>เลขประจำตัวผู้เสียภาษี: {settings.taxId}</div>
                </div>

                <div style={{
                  margin: '10px 0',
                  padding: '5px',
                  background: '#000',
                  color: '#fff',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  letterSpacing: '1px'
                }}>
                  === รายงานสรุปปิดกะ (Z-REPORT) ===
                </div>

                {/* Shift Details */}
                <div style={{ fontSize: '0.74rem', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>สถานะรอบกะ:</span>
                    <strong>{isShiftOpen ? 'กำลังเปิดกะ' : 'ปิดกะแล้ว'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>พนักงานแคชเชียร์:</span>
                    <strong>{currentOrReportShift.cashierName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>เวลาเปิดกะ:</span>
                    <span>{startTimeFormatted}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>เวลาปิดกะ:</span>
                    <span>{endTimeFormatted}</span>
                  </div>
                </div>

                <div className="receipt-divider"></div>

                {/* Sales Breakdown */}
                <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>รายการสรุปการขาย</span>
                    <span>จำนวนเงิน (บาท)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>เงินทอนเริ่มต้นกะ:</span>
                    <span>{startingCash.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ยอดขายเงินสด (Cash):</span>
                    <span>{cashSales.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ยอดขายพร้อมเพย์ (QR):</span>
                    <span>{promptpaySales.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ยอดขายบัตรเครดิต:</span>
                    <span>{creditCardSales.toFixed(2)}</span>
                  </div>

                  {voidSales > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>บิลยกเลิก/คืนเงิน ({voidCount} บิล):</span>
                      <span>-{voidSales.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="receipt-divider"></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem' }}>
                    <span>ยอดขายสุทธิรวม ({orderCount} บิล):</span>
                    <span>฿{totalSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="receipt-divider"></div>

                {/* Cash Drawer Reconciliation */}
                <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>เงินสดที่ควรมีในลิ้นชัก:</span>
                    <strong>฿{expectedCash.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>เงินสดที่นับได้จริง:</span>
                    <strong>฿{(currentOrReportShift.actualCash !== undefined && currentOrReportShift.actualCash !== null ? Number(currentOrReportShift.actualCash) : (parsedActualCash ?? expectedCash)).toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>ผลต่างเงินสด (Diff):</span>
                    <span>
                      {(() => {
                        const diff = currentOrReportShift.cashDifference !== undefined && currentOrReportShift.cashDifference !== null
                          ? Number(currentOrReportShift.cashDifference)
                          : (cashDifference ?? 0);
                        if (diff === 0) return '฿0.00 (ตรงพอดี)';
                        return diff > 0 ? `+฿${diff.toFixed(2)} (เงินเกิน)` : `-฿${Math.abs(diff).toFixed(2)} (เงินขาด)`;
                      })()}
                    </span>
                  </div>

                  {currentOrReportShift.note && (
                    <div style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: 4 }}>
                      หมายเหตุ: {currentOrReportShift.note}
                    </div>
                  )}
                </div>

                {/* Signatures */}
                <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px dashed #9ca3af', fontSize: '0.74rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                      <div style={{ borderBottom: '1px solid #000', height: 28, marginBottom: 4 }} />
                      <div>( {currentOrReportShift.cashierName} )</div>
                      <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>พนักงานแคชเชียร์</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '45%' }}>
                      <div style={{ borderBottom: '1px solid #000', height: 28, marginBottom: 4 }} />
                      <div>( .................................... )</div>
                      <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>ผู้จัดการร้าน / ผู้ตรวจสอบ</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="receipt-footer">
                  <div>* * * NEXUS POS Z-REPORT SYSTEM * * *</div>
                  <div style={{ fontSize: '0.65rem', marginTop: 3 }}>
                    พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions when in slip tab */}
        {activeTab === 'slip' && (
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 44, padding: '0 16px' }}
              onClick={() => setActiveTab('manage')}
            >
              <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
              <span>กลับไปหน้าจัดการ</span>
            </button>

            <button
              type="button"
              className="btn-checkout"
              style={{ height: 44, padding: '0 24px', background: 'var(--primary-gradient)' }}
              onClick={() => window.print()}
            >
              <Printer size={18} />
              <span>พิมพ์ใบปิดกะ (Print Z-Report)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
