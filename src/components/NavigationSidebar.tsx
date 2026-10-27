import React, { useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Settings, 
  X, 
  Zap, 
  ChevronRight,
  ShieldCheck, 
  Users,
  LogOut,
  ShoppingCart,
  CreditCard,
  Coins
} from 'lucide-react';

export const NavigationSidebar: React.FC = () => {
  const { 
    isNavSidebarOpen, 
    setIsNavSidebarOpen, 
    activeTab, 
    setActiveTab, 
    settings,
    currentUser,
    logout,
    setIsShiftModalOpen
  } = usePOS();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNavSidebarOpen) {
        setIsNavSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavSidebarOpen, setIsNavSidebarOpen]);

  const navItems = [
    {
      id: 'terminal' as const,
      name: 'ขายหน้าร้าน (POS)',
      subtitle: 'คิดเงิน สแกนบาร์โค้ด และออกใบเสร็จ',
      icon: ShoppingBag,
      hotkey: 'F1',
      color: '#2f6b3c',
      adminOnly: false
    },
    {
      id: 'customers' as const,
      name: 'ระบบสมาชิก',
      subtitle: 'รายชื่อลูกค้า รหัสสมาชิก และเบอร์ติดต่อ',
      icon: CreditCard,
      hotkey: '',
      color: '#f59e0b',
      adminOnly: false
    },
    {
      id: 'inventory' as const,
      name: 'คลังสินค้า & สต็อก',
      subtitle: 'จัดการรายการสินค้า ปรับสต็อก เตือนสต็อกต่ำ',
      icon: Package,
      hotkey: '',
      color: '#06b6d4',
      adminOnly: true
    },
    {
      id: 'analytics' as const,
      name: 'รายงานยอดขาย',
      subtitle: 'สถิติรายได้ กำไรขั้นต้น และประวัติบิล',
      icon: BarChart3,
      hotkey: '',
      color: '#10b981',
      adminOnly: true
    },
    {
      id: 'users' as const,
      name: 'จัดการผู้ใช้งาน',
      subtitle: 'เพิ่ม ลบ แก้ไข บัญชีแอดมินและพนักงานขาย',
      icon: Users,
      hotkey: '',
      color: '#ec4899',
      adminOnly: true
    },
    {
      id: 'settings' as const,
      name: 'ตั้งค่าระบบ',
      subtitle: 'ข้อมูลร้านค้า พร้อมเพย์ และใบกำกับภาษี',
      icon: Settings,
      hotkey: '',
      color: '#8b5cf6',
      adminOnly: true
    }
  ];

  // Role-based visibility: Cashier can ONLY see terminal
  const visibleNavItems = navItems.filter(item => {
    if (currentUser?.role === 'ADMIN') return true;
    return !item.adminOnly;
  });

  return (
    <>
      {/* Backdrop Overlay */}
      {isNavSidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setIsNavSidebarOpen(false)}
        />
      )}

      {/* Slide-over Drawer on the Left */}
      <aside className={`nav-left-sidebar ${isNavSidebarOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-logo" style={{ width: 32, height: 32 }}>
              <Zap size={18} fill="currentColor" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
                เมนูระบบ
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {settings.storeName}
              </div>
            </div>
          </div>

          <button 
            className="icon-btn"
            onClick={() => setIsNavSidebarOpen(false)}
            title="ปิดเมนู [Esc]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="sidebar-nav-list">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0 8px 6px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between' }}>
            <span>เลือกหน้าที่ต้องการใช้งาน</span>
            {currentUser?.role === 'CASHIER' && (
              <span style={{ color: '#10b981', textTransform: 'none' }}>สิทธิ์พนักงานขาย</span>
            )}
          </div>

          {currentUser?.role === 'CASHIER' && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              borderRadius: 'var(--radius-md)', 
              padding: '10px 12px', 
              marginBottom: 6,
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}>
              💡 <strong>โหมดพนักงานขาย:</strong> คุณมีสิทธิ์เข้าถึงเฉพาะหน้าขายสินค้าหน้าร้าน (POS) เท่านั้น
            </div>
          )}

          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsNavSidebarOpen(false);
                }}
              >
                <div 
                  className="sidebar-nav-icon-box"
                  style={{ 
                    background: isActive ? item.color : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#ffffff' : item.color
                  }}
                >
                  <Icon size={20} />
                </div>

                <div className="sidebar-nav-text">
                  <div className="sidebar-nav-title-row">
                    <span className="sidebar-nav-title">{item.name}</span>
                    {item.hotkey && (
                      <span className="sidebar-nav-hotkey">{item.hotkey}</span>
                    )}
                  </div>
                  <span className="sidebar-nav-subtitle">{item.subtitle}</span>
                </div>

                <ChevronRight 
                  size={16} 
                  className="sidebar-nav-arrow"
                  style={{ opacity: isActive ? 1 : 0.4 }} 
                />
              </button>
            );
          })}
        </div>

        {/* Drawer Bottom Info */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-secondary"
            style={{
              width: '100%',
              height: 40,
              justifyContent: 'center',
              gap: 8,
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--primary)',
              borderColor: 'rgba(99, 102, 241, 0.4)',
              background: 'rgba(99, 102, 241, 0.08)',
              marginBottom: 10,
              borderRadius: 'var(--radius-md)'
            }}
            onClick={() => {
              setIsNavSidebarOpen(false);
              setIsShiftModalOpen(true);
            }}
            title="เปิดหน้าต่างจัดการรอบกะ และพิมพ์ใบสรุปปิดกะ Z-Report"
          >
            <Coins size={16} />
            <span>จัดการรอบกะ / ปิดกะ (Shift Z-Report)</span>
          </button>

          <div className="sidebar-user-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: currentUser?.role === 'ADMIN' ? 'linear-gradient(135deg, #d4a017, #b8860b)' : 'linear-gradient(135deg, #2e7d32, #1b5e20)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1rem'
                }}>
                  {currentUser?.avatar || (currentUser?.role === 'ADMIN' ? '👑' : '🛒')}
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                    {currentUser ? currentUser.name : 'ผู้ใช้งาน'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    @{currentUser?.username || 'user'}
                  </div>
                </div>
              </div>

              {currentUser?.role === 'ADMIN' ? (
                <span className="role-chip admin" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  <ShieldCheck size={11} /> แอดมิน
                </span>
              ) : (
                <span className="role-chip cashier" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  <ShoppingCart size={11} /> พนักงาน
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', height: 36, justifyContent: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              onClick={logout}
              title="ออกจากระบบ"
            >
              <LogOut size={14} />
              <span>ออกจากระบบ (Logout)</span>
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            NEXUS POS • ผู้ใช้งาน: {currentUser?.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'พนักงานขาย (User)'}
          </div>
        </div>
      </aside>
    </>
  );
};
