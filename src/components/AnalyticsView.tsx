import React, { useState, useEffect, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import type { Order } from '../types/pos';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Printer, 
  Banknote, 
  QrCode, 
  CreditCard,
  Percent,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Maximize2,
  Minimize2,
  Download,
  Ban,
  AlertTriangle,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

const getPageNumbers = (current: number, total: number): (number | string)[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [];
  pages.push(1);
  if (current > 3) {
    pages.push('...');
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push('...');
  }
  pages.push(total);
  return pages;
};

export const AnalyticsView: React.FC = () => {
  const { orders, setActiveReceiptOrder, refreshData, dbConnected, voidOrder } = usePOS();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'PROMPTPAY' | 'CREDIT_CARD'>('ALL');
  const [layoutMode, setLayoutMode] = useState<'split' | 'full'>('split');

  // Void / Refund Modal State
  const [targetVoidOrder, setTargetVoidOrder] = useState<Order | null>(null);
  const [voidType, setVoidType] = useState<'VOID' | 'REFUND'>('VOID');
  const [voidReason, setVoidReason] = useState<string>('พนักงานคิดเงินผิดพลาด');
  const [customReason, setCustomReason] = useState<string>('');
  const [voidAdminPin, setVoidAdminPin] = useState<string>('');
  const [voidError, setVoidError] = useState<string>('');
  const [isVoidSubmitting, setIsVoidSubmitting] = useState(false);

  useEffect(() => {
    refreshData().catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Calculations: Separate active orders from voided/refunded orders
  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'VOIDED' && o.status !== 'REFUNDED'), [orders]);
  const voidedOrders = useMemo(() => orders.filter(o => o.status === 'VOIDED' || o.status === 'REFUNDED'), [orders]);

  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
  const totalOrders = activeOrders.length;
  const voidedTotal = voidedOrders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
  const voidedCount = voidedOrders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Total Cost of goods sold & Gross Profit (only for valid completed orders)
  let totalCOGS = 0;
  activeOrders.forEach(order => {
    order.items?.forEach(item => {
      totalCOGS += (item.costPrice || 0) * (item.quantity || 1);
    });
  });
  const grossProfit = Math.max(0, totalRevenue - totalCOGS);
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Payment Breakdown
  const cashTotal = activeOrders
    .filter(o => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + (o.netTotal || 0), 0);

  const promptPayTotal = activeOrders
    .filter(o => o.paymentMethod === 'PROMPTPAY')
    .reduce((sum, o) => sum + (o.netTotal || 0), 0);

  const cardTotal = activeOrders
    .filter(o => o.paymentMethod === 'CREDIT_CARD' || o.paymentMethod === 'TRANSFER')
    .reduce((sum, o) => sum + (o.netTotal || 0), 0);

  // Top Selling Products Calculation (active orders only)
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  activeOrders.forEach(order => {
    order.items?.forEach(item => {
      const pId = item.productId || item.name;
      if (!productSalesMap[pId]) {
        productSalesMap[pId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[pId].qty += (item.quantity || 1);
      productSalesMap[pId].revenue += (item.subtotal || 0);
    });
  });

  // Handle Export to CSV (UTF-8 BOM for Microsoft Excel Thai compatibility)
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('ไม่มีข้อมูลบิลสำหรับส่งออก');
      return;
    }

    const headers = [
      'เลขที่บิล',
      'วันที่',
      'เวลา',
      'สถานะบิล',
      'แคชเชียร์',
      'รหัสสมาชิก',
      'ชื่อลูกค้า',
      'เบอร์โทรศัพท์',
      'จำนวนชิ้น',
      'ยอดรวมก่อนลด (฿)',
      'ส่วนลด (฿)',
      'ภาษี VAT 7% (฿)',
      'ยอดสุทธิ (฿)',
      'ช่องทางชำระเงิน',
      'แต้มที่ได้รับ',
      'แต้มที่ใช้แลก',
      'เหตุผลยกเลิก/คืนเงิน',
      'ผู้อนุมัติยกเลิก'
    ];

    const rows = filteredOrders.map(order => {
      const dateObj = new Date(order.timestamp);
      const dateStr = dateObj.toLocaleDateString('th-TH');
      const timeStr = dateObj.toLocaleTimeString('th-TH');
      const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
      const statusText = order.status === 'VOIDED' ? 'ยกเลิก (Void)' : order.status === 'REFUNDED' ? 'คืนเงิน (Refund)' : 'ปกติ (Completed)';
      const paymentText = order.paymentMethod === 'CASH' ? 'เงินสด' : order.paymentMethod === 'PROMPTPAY' ? 'พร้อมเพย์' : 'บัตรเครดิต';

      return [
        `"${order.orderNumber || ''}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${statusText}"`,
        `"${order.cashierName || ''}"`,
        `"${order.customer?.memberCode || '-'}"`,
        `"${order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'ลูกค้าทั่วไป'}"`,
        `"${order.customer?.phone || '-'}"`,
        totalQty,
        (order.subtotal || 0).toFixed(2),
        (order.discount || 0).toFixed(2),
        (order.tax || 0).toFixed(2),
        (order.netTotal || 0).toFixed(2),
        `"${paymentText}"`,
        order.pointsEarned || 0,
        order.pointsRedeemed || 0,
        `"${order.voidReason || ''}"`,
        `"${order.voidedBy || ''}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `nexus_pos_sales_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Confirm Void / Refund
  const handleConfirmVoid = async () => {
    if (!targetVoidOrder) return;
    setVoidError('');

    if (!voidAdminPin.trim()) {
      setVoidError('กรุณากรอกรหัส PIN ของแอดมิน');
      return;
    }

    const finalReason = voidReason === 'อื่นๆ' ? customReason.trim() : voidReason;
    if (!finalReason) {
      setVoidError('กรุณาระบุเหตุผลในการทำรายการ');
      return;
    }

    setIsVoidSubmitting(true);
    try {
      const res = await voidOrder(targetVoidOrder.id, finalReason, voidAdminPin, voidType);
      if (res.success) {
        setTargetVoidOrder(null);
        setVoidAdminPin('');
        setCustomReason('');
        setVoidError('');
      } else {
        setVoidError(res.message || 'ไม่สามารถทำรายการได้');
      }
    } finally {
      setIsVoidSubmitting(false);
    }
  };

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxSoldQty = topProducts.length > 0 ? topProducts[0].qty : 1;

  // Filtered orders for table
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (paymentFilter !== 'ALL' && order.paymentMethod !== paymentFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const orderNum = (order.orderNumber || '').toLowerCase();
        const cashier = (order.cashierName || '').toLowerCase();
        const custName = order.customer
          ? `${order.customer.firstName || ''} ${order.customer.lastName || ''} ${order.customer.memberCode || ''} ${order.customer.phone || ''}`.toLowerCase()
          : 'ทั่วไป';
        if (!orderNum.includes(term) && !cashier.includes(term) && !custName.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, paymentFilter, searchTerm]);

  const totalFiltered = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Auto reset page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  // Helper widget: Payment Channels & Top Selling Products
  const renderSummaryWidgets = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Payment Channels Card */}
      <div className="stat-card" style={{ padding: '16px 18px', gap: 10 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={17} color="var(--primary)" />
          <span>ช่องทางการรับชำระเงิน</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Banknote size={15} color="var(--success)" />
              <span style={{ fontSize: '0.85rem' }}>เงินสด (Cash)</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              ฿{cashTotal.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={15} color="var(--cyan)" />
              <span style={{ fontSize: '0.85rem' }}>สแกน พร้อมเพย์</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              ฿{promptPayTotal.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem' }}>บัตร / โอนเงิน</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              ฿{cardTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Card */}
      <div className="stat-card" style={{ padding: '16px 18px', gap: 10 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={17} color="var(--primary)" />
          <span>สินค้าขายดี 5 อันดับแรก</span>
        </div>

        {topProducts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '12px 0', textAlign: 'center' }}>
            ยังไม่มีประวัติการขายสินค้าในระบบ
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {topProducts.map((tp, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {idx + 1}. {tp.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: '0.8rem' }}>
                    {tp.qty} ชิ้น (฿{tp.revenue.toFixed(2)})
                  </span>
                </div>
                <div style={{ height: 5, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(tp.qty / maxSoldQty) * 100}%`,
                      background: 'var(--primary-gradient)',
                      borderRadius: 3
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Helper widget: Recent Orders Table Card
  const renderOrdersTableCard = () => (
    <div className="data-table-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Card Header & Controls */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>ประวัติการทำรายการล่าสุด</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                แสดงสูงสุด {pageSize} รายการต่อหน้า (จากทั้งหมด {orders.length} บิลในระบบ)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Layout Toggle Button */}
            <button
              type="button"
              className="btn-secondary"
              style={{ height: 30, padding: '0 10px', fontSize: '0.76rem', gap: 4 }}
              onClick={() => setLayoutMode(m => m === 'split' ? 'full' : 'split')}
              title={layoutMode === 'split' ? 'ขยายตารางเต็มความกว้าง' : 'จัดเป็นมุมมองคู่กับสรุปยอด (Full HD Dashboard)'}
            >
              {layoutMode === 'split' ? (
                <>
                  <Maximize2 size={13} />
                  <span>ขยายเต็มจอ</span>
                </>
              ) : (
                <>
                  <Minimize2 size={13} />
                  <span>มุมมองแยกข้าง</span>
                </>
              )}
            </button>

            {/* Quick Payment Filter Pills */}
            {(['ALL', 'CASH', 'PROMPTPAY', 'CREDIT_CARD'] as const).map((method) => {
              const label = method === 'ALL' ? 'ทั้งหมด' : method === 'CASH' ? 'เงินสด' : method === 'PROMPTPAY' ? 'พร้อมเพย์' : 'บัตร';
              const isActive = paymentFilter === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentFilter(method);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Box */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="inventory-search-box" style={{ flex: 1, position: 'relative' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="barcode-input"
              style={{ height: 34, fontSize: '0.82rem' }}
              placeholder="ค้นหาเลขที่บิล (POS-xxx), แคชเชียร์, หรือชื่อ/รหัสลูกค้า..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="ล้างคำค้นหา"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Body with Sticky Header & Scroll container */}
      {orders.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          ยังไม่มีบิลที่คิดเงินเสร็จสิ้น เริ่มต้นคิดเงินได้ที่แท็บ "ขายหน้าร้าน (POS)"
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>ไม่พบบิลที่ตรงกับเงื่อนไขการค้นหา "{searchTerm}"</p>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 10, height: 32, padding: '0 12px', fontSize: '0.8rem' }}
            onClick={() => {
              setSearchTerm('');
              setPaymentFilter('ALL');
              setCurrentPage(1);
            }}
          >
            ล้างการค้นหาและตัวกรอง
          </button>
        </div>
      ) : (
        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 135 }}>เลขที่บิล</th>
                <th style={{ width: 145 }}>วันที่ / เวลา</th>
                <th>ลูกค้าสมาชิก</th>
                <th style={{ textAlign: 'center', width: 90 }}>สถานะ</th>
                <th>แคชเชียร์</th>
                <th style={{ textAlign: 'center' }}>รายการ</th>
                <th>ช่องทาง</th>
                <th style={{ textAlign: 'right' }}>ยอดสุทธิ</th>
                <th style={{ textAlign: 'center', width: 75 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, idx) => (
                <tr 
                  key={`${order.id || order.orderNumber || 'order'}-${idx}`}
                  style={{ opacity: (order.status === 'VOIDED' || order.status === 'REFUNDED') ? 0.65 : 1 }}
                >
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                    <div style={{ textDecoration: order.status === 'VOIDED' ? 'line-through' : 'none' }}>
                      {order.orderNumber || '-'}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {order.timestamp ? new Date(order.timestamp).toLocaleString('th-TH') : '-'}
                  </td>
                  <td>
                    {order.customer ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                          {order.customer.firstName} {order.customer.lastName}
                        </div>
                        <div style={{ marginTop: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span className="member-code-tag" style={{ fontSize: '0.72rem', padding: '1px 6px' }}>
                            {order.customer.memberCode}
                          </span>
                          {(order.pointsEarned ?? 0) > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--cyan)' }}>
                              +{order.pointsEarned} แต้ม
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ทั่วไป</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {order.status === 'VOIDED' ? (
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: 'var(--danger)',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}
                        title={`เหตุผล: ${order.voidReason || '-'}\nผู้อนุมัติ: ${order.voidedBy || '-'}`}
                      >
                        <Ban size={11} />
                        <span>ยกเลิก</span>
                      </span>
                    ) : order.status === 'REFUNDED' ? (
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}
                        title={`เหตุผล: ${order.voidReason || '-'}\nผู้อนุมัติ: ${order.voidedBy || '-'}`}
                      >
                        <RotateCcw size={11} />
                        <span>คืนเงิน</span>
                      </span>
                    ) : (
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: 'var(--success)'
                        }}
                      >
                        <span>ปกติ</span>
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{order.cashierName || 'พนักงาน'}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                    {(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} ชิ้น
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          order.paymentMethod === 'CASH'
                            ? 'var(--success-surface)'
                            : order.paymentMethod === 'PROMPTPAY'
                            ? 'var(--cyan-surface)'
                            : 'rgba(99, 102, 241, 0.15)',
                        color:
                          order.paymentMethod === 'CASH'
                            ? 'var(--success)'
                            : order.paymentMethod === 'PROMPTPAY'
                            ? 'var(--cyan)'
                            : '#a5b4fc'
                      }}
                    >
                      {order.paymentMethod === 'CASH'
                        ? 'เงินสด'
                        : order.paymentMethod === 'PROMPTPAY'
                        ? 'พร้อมเพย์'
                        : 'บัตรเครดิต'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: (order.status === 'VOIDED' || order.status === 'REFUNDED') ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '0.86rem' }}>
                    ฿{Number(order.netTotal ?? 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28 }}
                        title="ดูและพิมพ์ใบเสร็จซ้ำ"
                        onClick={() => setActiveReceiptOrder(order)}
                      >
                        <Printer size={13} />
                      </button>
                      {order.status !== 'VOIDED' && order.status !== 'REFUNDED' && (
                        <button
                          className="icon-btn"
                          style={{ width: 28, height: 28, color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="ยกเลิกบิล / คืนเงิน (ต้องใช้ PIN แอดมิน)"
                          onClick={() => {
                            setTargetVoidOrder(order);
                            setVoidType('VOID');
                            setVoidReason('พนักงานคิดเงินผิดพลาด');
                            setCustomReason('');
                            setVoidAdminPin('');
                            setVoidError('');
                          }}
                        >
                          <Ban size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredOrders.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255, 255, 255, 0.01)'
          }}
        >
          {/* Left Info */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            แสดง <strong style={{ color: 'var(--text-primary)' }}>{startIndex + 1}</strong> -{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {Math.min(startIndex + pageSize, totalFiltered)}
            </strong>{' '}
            จาก <strong style={{ color: 'var(--text-primary)' }}>{totalFiltered}</strong> รายการ
            {totalFiltered !== orders.length && (
              <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                (ทั้งหมด {orders.length} บิล)
              </span>
            )}
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Page Size Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>แถวละ:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="input-field"
                style={{
                  height: 28,
                  padding: '0 6px',
                  fontSize: '0.78rem',
                  width: 65,
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Navigation Pagination Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                type="button"
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="หน้าแรกสุด"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 28, padding: '0 8px', fontSize: '0.76rem', gap: 2 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={13} />
                <span>ก่อน</span>
              </button>

              {/* Page Number Buttons */}
              <div style={{ display: 'flex', gap: 3, margin: '0 2px' }}>
                {getPageNumbers(currentPage, totalPages).map((p, pIdx) => (
                  p === '...' ? (
                    <span key={`ellipsis-${pIdx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', lineHeight: '28px', fontSize: '0.78rem' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      type="button"
                      style={{
                        minWidth: 28,
                        height: 28,
                        padding: '0 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: currentPage === p ? 700 : 500,
                        background: currentPage === p ? 'var(--primary)' : 'transparent',
                        color: currentPage === p ? '#fff' : 'var(--text-secondary)',
                        border: currentPage === p ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => setCurrentPage(Number(p))}
                    >
                      {p}
                    </button>
                  )
                ))}
              </div>

              <button
                type="button"
                className="btn-secondary"
                style={{ height: 28, padding: '0 8px', fontSize: '0.76rem', gap: 2 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <span>ถัดไป</span>
                <ChevronRight size={13} />
              </button>
              <button
                type="button"
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="หน้าสุดท้าย"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="view-container" style={{ gap: 14 }}>
      {/* Header */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="view-title" style={{ fontSize: '1.35rem' }}>📊 สรุปยอดขายและผลการดำเนินงาน (Analytics)</h2>
          <p className="view-subtitle" style={{ fontSize: '0.8rem' }}>
            สถิติยอดขาย กำไรขั้นต้น และรายงานประวัติการขายรายบิล
            {dbConnected && (
              <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                • 🟢 PostgreSQL Connected
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn-primary"
            style={{ height: 34, padding: '0 14px', fontSize: '0.82rem', gap: 6, background: 'var(--primary-gradient)' }}
            onClick={handleExportCSV}
            title="ส่งออกประวัติการขายทั้งหมดเป็นไฟล์ Excel CSV (รองรับภาษาไทย)"
          >
            <Download size={15} />
            <span>ส่งออก Excel</span>
          </button>
          <button
            className="btn-secondary"
            style={{ height: 34, padding: '0 14px', fontSize: '0.82rem' }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="ดึงข้อมูลบิลขายล่าสุดจากฐานข้อมูล PostgreSQL"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
            <span>{isRefreshing ? 'กำลังซิงค์...' : 'รีเฟรช'}</span>
          </button>
          <button
            className="btn-secondary"
            style={{ height: 34, padding: '0 14px', fontSize: '0.82rem' }}
            onClick={() => window.print()}
            title="พิมพ์รายงานสรุปผลการดำเนินงาน"
          >
            <Printer size={15} />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* 1. Compact KPI Stat Cards Strip (Height ~75px) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', 
          gap: 12 
        }}
      >
        <div className="stat-card" style={{ padding: '10px 14px', gap: 2 }}>
          <div className="stat-title" style={{ fontSize: '0.78rem' }}>
            <DollarSign size={15} color="var(--success)" /> ยอดขายสุทธิ
          </div>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: '1.4rem' }}>
            ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            คำสั่งซื้อสำเร็จ {totalOrders} บิล
          </div>
        </div>

        <div className="stat-card" style={{ padding: '10px 14px', gap: 2 }}>
          <div className="stat-title" style={{ fontSize: '0.78rem' }}>
            <TrendingUp size={15} color="var(--cyan)" /> กำไรขั้นต้น (Gross Profit)
          </div>
          <div className="stat-value" style={{ color: 'var(--cyan)', fontSize: '1.4rem' }}>
            ฿{grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            อัตรากำไรขั้นต้น {profitMargin.toFixed(1)}%
          </div>
        </div>

        <div className="stat-card" style={{ padding: '10px 14px', gap: 2 }}>
          <div className="stat-title" style={{ fontSize: '0.78rem' }}>
            <ShoppingBag size={15} color="var(--primary)" /> จำนวนบิลสำเร็จ
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>
            {totalOrders} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>บิล</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            เฉลี่ย ฿{avgTicket.toFixed(2)} / บิล
          </div>
        </div>

        <div className="stat-card" style={{ padding: '10px 14px', gap: 2 }}>
          <div className="stat-title" style={{ fontSize: '0.78rem' }}>
            <Percent size={15} color="var(--warning)" /> ต้นทุนขายรวม (COGS)
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)', fontSize: '1.4rem' }}>
            ฿{totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            ต้นทุนสินค้าตัดจากสต็อก
          </div>
        </div>

        <div className="stat-card" style={{ padding: '10px 14px', gap: 2 }}>
          <div className="stat-title" style={{ fontSize: '0.78rem' }}>
            <Ban size={15} color={voidedCount > 0 ? "var(--danger)" : "var(--text-muted)"} /> บิลยกเลิก/คืนเงิน
          </div>
          <div className="stat-value" style={{ color: voidedCount > 0 ? "var(--danger)" : "var(--text-muted)", fontSize: '1.4rem' }}>
            ฿{voidedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {voidedCount} บิล ({voidedCount > 0 ? 'คืนสต็อกแล้ว' : 'ไม่มี'})
          </div>
        </div>
      </div>

      {/* 2. Main Analytics Workspace Optimized for Full HD */}
      {layoutMode === 'split' ? (
        <div className="analytics-main-grid">
          {/* Left Column: Recent Orders Table Card (Dominant View) */}
          {renderOrdersTableCard()}

          {/* Right Column: Payment & Top Products Widgets */}
          {renderSummaryWidgets()}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full Width Table Card */}
          {renderOrdersTableCard()}

          {/* Widgets Grid Below */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {renderSummaryWidgets()}
          </div>
        </div>
      )}

      {/* 3. Void / Refund Order Modal */}
      {targetVoidOrder && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: 480 }}>
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
                <ShieldAlert size={20} />
                <span>ยืนยันการยกเลิกบิล / คืนเงิน (Admin Approval)</span>
              </div>
              <button 
                className="icon-btn" 
                onClick={() => setTargetVoidOrder(null)}
                disabled={isVoidSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Target Order Summary */}
              <div 
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>เลขที่บิล: <strong style={{ fontFamily: 'var(--font-mono)' }}>{targetVoidOrder.orderNumber}</strong></span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.95rem' }}>
                    ฿{Number(targetVoidOrder.netTotal).toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  แคชเชียร์: {targetVoidOrder.cashierName} • {targetVoidOrder.items?.length || 0} รายการ ({(targetVoidOrder.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} ชิ้น)
                </div>
                {targetVoidOrder.customer && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--cyan)', marginTop: 2 }}>
                    ลูกค้า: {targetVoidOrder.customer.firstName} {targetVoidOrder.customer.lastName} ({targetVoidOrder.customer.memberCode})
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  ประเภทการทำรายการ
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setVoidType('VOID')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: voidType === 'VOID' ? '2px solid var(--danger)' : '1px solid var(--border-medium)',
                      background: voidType === 'VOID' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
                      color: voidType === 'VOID' ? 'var(--danger)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    🚫 ยกเลิกบิล (Void)
                    <div style={{ fontSize: '0.7rem', fontWeight: 400, marginTop: 2 }}>คิดเงินผิด / ยกเลิกทันที</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoidType('REFUND')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: voidType === 'REFUND' ? '2px solid #f59e0b' : '1px solid var(--border-medium)',
                      background: voidType === 'REFUND' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
                      color: voidType === 'REFUND' ? '#f59e0b' : 'var(--text-secondary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    ↩️ คืนเงิน (Refund)
                    <div style={{ fontSize: '0.7rem', fontWeight: 400, marginTop: 2 }}>ลูกค้านำสินค้ามาคืน</div>
                  </button>
                </div>
              </div>

              {/* Reason Selection */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  เหตุผลในการยกเลิก / คืนเงิน
                </label>
                <select
                  className="barcode-input"
                  style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                >
                  <option value="พนักงานคิดเงินผิดพลาด">พนักงานคิดเงินผิดพลาด / สแกนเบิ้ล</option>
                  <option value="ลูกค้าเปลี่ยนใจขอคืนสินค้า">ลูกค้าเปลี่ยนใจขอคืนสินค้า</option>
                  <option value="สินค้าชำรุด / เสียหาย / มีตำหนิ">สินค้าชำรุด / เสียหาย / มีตำหนิ</option>
                  <option value="ลูกค้าชำระเงินผิดช่องทาง">ลูกค้าชำระเงินผิดช่องทาง</option>
                  <option value="อื่นๆ">อื่นๆ (ระบุเพิ่มเติมด้านล่าง)</option>
                </select>

                {voidReason === 'อื่นๆ' && (
                  <input
                    type="text"
                    className="barcode-input"
                    style={{ width: '100%', height: 36, marginTop: 6, fontSize: '0.82rem' }}
                    placeholder="พิมพ์ระบุเหตุผล..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                  />
                )}
              </div>

              {/* Admin PIN Verification (Crucial Security Check) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--warning)' }}>
                  🔑 ใส่รหัส PIN ของผู้ดูแลระบบ (Admin PIN) เพื่ออนุมัติ
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  className="barcode-input"
                  style={{ width: '100%', height: 42, fontSize: '1.2rem', textAlign: 'center', letterSpacing: 6 }}
                  placeholder="••••"
                  value={voidAdminPin}
                  onChange={e => setVoidAdminPin(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmVoid();
                  }}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  * บังคับใช้ PIN แอดมินเพื่อป้องกันพนักงานทุจริต (Demo PIN: 1234)
                </p>
              </div>

              {/* Automatic Stock Restoration Notice */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '8px 12px', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  color: '#60a5fa'
                }}
              >
                <AlertTriangle size={16} />
                <span>ระบบจะคืนสต็อกสินค้าทั้งหมด {(targetVoidOrder.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} ชิ้น กลับเข้าคลังสินค้าอัตโนมัติ</span>
              </div>

              {voidError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                  ⚠️ {voidError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ height: 40 }}
                onClick={() => setTargetVoidOrder(null)}
                disabled={isVoidSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{ height: 40, padding: '0 20px', fontWeight: 700 }}
                onClick={handleConfirmVoid}
                disabled={isVoidSubmitting}
              >
                {isVoidSubmitting ? 'กำลังดำเนินการ...' : `ยืนยัน${voidType === 'REFUND' ? 'คืนเงิน' : 'ยกเลิกบิล'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
