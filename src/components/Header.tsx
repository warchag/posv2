import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Clock, 
  PauseCircle, 
  Zap, 
  Sun, 
  Moon, 
  Menu,
  LogOut,
  Monitor,
  Database
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    shift, 
    heldBills, 
    resumeHeldBill,
    setIsShortcutsOpen,
    setActiveTab,
    theme,
    toggleTheme,
    toggleNavSidebar,
    currentUser,
    logout,
    setIsCustomerDisplayOpen,
    dbConnected,
    dbName
  } = usePOS();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showHeldDropdown, setShowHeldDropdown] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('th-TH', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }) + ' ' + 
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

  return (
    <header className="pos-header">
      {/* Brand & Store Name */}
      <div className="brand-section">
        {/* Left Sidebar Menu Toggle Button */}
        <button
          className="sidebar-toggle-btn"
          onClick={toggleNavSidebar}
          title="เปิดเมนูระบบ (Sidebar ด้านซ้าย) [Esc]"
        >
          <Menu size={18} />
          <span>เมนูระบบ</span>
        </button>

        <div className="brand-logo">
          <Zap size={22} fill="currentColor" />
        </div>
        <div className="brand-text">
          <h1>{settings.storeName}</h1>
          <span>{settings.branchName} • {currentUser ? currentUser.name : shift.cashierName}</span>
        </div>
      </div>



      {/* Header Right Utilities */}
      <div className="header-right">
        {/* Held Bills Quick Indicator */}
        {heldBills.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              style={{ 
                width: 'auto', 
                padding: '0 12px', 
                background: 'rgba(245, 158, 11, 0.15)', 
                borderColor: 'rgba(245, 158, 11, 0.4)',
                color: '#f59e0b'
              }}
              onClick={() => setShowHeldDropdown(!showHeldDropdown)}
            >
              <PauseCircle size={16} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, marginLeft: 6 }}>
                พักบิล ({heldBills.length})
              </span>
            </button>

            {showHeldDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '280px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '8px',
                  zIndex: 50
                }}
              >
                <div style={{ padding: '6px 8px', fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                  รายการบิลที่พักไว้ (คลิกเพื่อดึงกลับมาคิดเงิน)
                </div>
                {heldBills.map(bill => (
                  <div
                    key={bill.id}
                    onClick={() => {
                      resumeHeldBill(bill.id);
                      setShowHeldDropdown(false);
                      setActiveTab('terminal');
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{bill.note}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>เวลา {bill.timestamp}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>
                      ฿{bill.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PostgreSQL Database Status Badge */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem',
            fontWeight: 600,
            background: dbConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: dbConnected ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${dbConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}
          title={dbConnected ? `เชื่อมต่อฐานข้อมูล ${dbName} ผ่าน Local Server สำเร็จ (Port 5001)` : 'กำลังเชื่อมต่อฐานข้อมูล PostgreSQL...'}
        >
          <Database size={13} />
          <span>{dbConnected ? 'PostgreSQL (Local DB)' : 'ออฟไลน์ (LocalStorage)'}</span>
        </div>

        {/* Live Shift Status */}
        <div className="shift-badge">
          <span className="shift-dot"></span>
          <span>เปิดกะปกติ</span>
        </div>

        {/* Real-time Clock */}
        <div className="clock-display">
          <Clock size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
          {currentTime || 'กำลังโหลด...'}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'เปลี่ยนเป็นธีมมืด (Dark Mode)' : 'เปลี่ยนเป็นธีมสว่าง (Light Mode)'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} color="#f59e0b" />}
        </button>

        {/* Sound Toggle */}
        <button
          className="icon-btn"
          onClick={() => updateSettings({ enableSound: !settings.enableSound })}
          title={settings.enableSound ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
        >
          {settings.enableSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Customer Display Button in Header */}
        <button
          className="header-customer-btn"
          onClick={() => setIsCustomerDisplayOpen(true)}
          title="เปิดจอแสดงยอดเงินสำหรับลูกค้า (Customer Display / จอที่ 2)"
        >
          <Monitor size={16} />
          <span>จอลูกค้า</span>
        </button>

        {/* Keyboard Shortcuts Guide */}
        <button
          className="icon-btn"
          onClick={() => setIsShortcutsOpen(true)}
          title="คู่มือคีย์ลัด (Hotkeys)"
        >
          <Keyboard size={18} />
        </button>

        {/* Current User Pill & Logout */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4, paddingLeft: 8, borderLeft: '1px solid var(--border-subtle)' }}>
            <div className="header-user-badge">
              <span style={{ fontSize: '0.9rem' }}>{currentUser.avatar || (currentUser.role === 'ADMIN' ? '👑' : '🛒')}</span>
              <span className="header-user-name">{currentUser.name}</span>
              <span className={`role-chip ${currentUser.role === 'ADMIN' ? 'admin' : 'cashier'}`}>
                {currentUser.role === 'ADMIN' ? 'แอดมิน' : 'พนักงาน'}
              </span>
            </div>

            <button
              className="icon-btn"
              onClick={logout}
              title="ออกจากระบบ (Logout)"
              style={{ color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
