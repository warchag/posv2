import React, { useState, useEffect, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
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
  Minimize2
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
  const { orders, setActiveReceiptOrder, refreshData, dbConnected } = usePOS();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'PROMPTPAY' | 'CREDIT_CARD'>('ALL');
  const [layoutMode, setLayoutMode] = useState<'split' | 'full'>('split');

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

  // Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Total Cost of goods sold & Gross Profit
  let totalCOGS = 0;
  orders.forEach(order => {
    order.items?.forEach(item => {
      totalCOGS += (item.costPrice || 0) * (item.quantity || 1);
    });
  });
  const grossProfit = Math.max(0, totalRevenue - totalCOGS);
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Payment Breakdown
  const cashTotal = orders
    .filter(o => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + (o.netTotal || 0), 0);

  const promptPayTotal = orders
    .filter(o => o.paymentMethod === 'PROMPTPAY')
    .reduce((sum, o) => sum + (o.netTotal || 0), 0);

  const cardTotal = orders
    .filter(o => o.paymentMethod === 'CREDIT_CARD' || o.paymentMethod === 'TRANSFER')
    .reduce((sum, o) => sum + (o.netTotal || 0), 0);

  // Top Selling Products Calculation
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      const pId = item.productId || item.name;
      if (!productSalesMap[pId]) {
        productSalesMap[pId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[pId].qty += (item.quantity || 1);
      productSalesMap[pId].revenue += (item.subtotal || 0);
    });
  });

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
                <th style={{ width: 145 }}>เลขที่บิล</th>
                <th style={{ width: 165 }}>วันที่ / เวลา</th>
                <th>ลูกค้าสมาชิก</th>
                <th>แคชเชียร์</th>
                <th style={{ textAlign: 'center' }}>รายการ</th>
                <th>ช่องทาง</th>
                <th style={{ textAlign: 'right' }}>ยอดสุทธิ</th>
                <th style={{ textAlign: 'center', width: 65 }}>พิมพ์</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, idx) => (
                <tr key={`${order.id || order.orderNumber || 'order'}-${idx}`}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                    {order.orderNumber || '-'}
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
                        <div style={{ marginTop: 2 }}>
                          <span className="member-code-tag" style={{ fontSize: '0.72rem', padding: '1px 6px' }}>
                            {order.customer.memberCode}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ทั่วไป</span>
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
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                    ฿{Number(order.netTotal ?? 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="icon-btn"
                      style={{ margin: '0 auto', width: 28, height: 28 }}
                      title="ดูและพิมพ์ใบเสร็จซ้ำ"
                      onClick={() => setActiveReceiptOrder(order)}
                    >
                      <Printer size={14} />
                    </button>
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
            className="btn-secondary"
            style={{ height: 34, padding: '0 14px', fontSize: '0.82rem' }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="ดึงข้อมูลบิลขายล่าสุดจากฐานข้อมูล PostgreSQL"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
            <span>{isRefreshing ? 'กำลังซิงค์...' : 'รีเฟรชข้อมูล'}</span>
          </button>
          <button
            className="btn-secondary"
            style={{ height: 34, padding: '0 14px', fontSize: '0.82rem' }}
            onClick={() => window.print()}
            title="พิมพ์รายงานสรุปผลการดำเนินงาน"
          >
            <Printer size={15} />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* 1. Compact KPI Stat Cards Strip (Height ~75px) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
          gap: 12 
        }}
      >
        <div className="stat-card" style={{ padding: '10px 14px', gap: 2 }}>
          <div className="stat-title" style={{ fontSize: '0.78rem' }}>
            <DollarSign size={15} color="var(--success)" /> ยอดขายรวมทั้งหมด
          </div>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: '1.4rem' }}>
            ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            คำสั่งซื้อทั้งหมด {totalOrders} บิล
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
            <ShoppingBag size={15} color="var(--primary)" /> จำนวนบิล / คำสั่งซื้อ
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
    </div>
  );
};
