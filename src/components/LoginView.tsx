import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { 
  Zap, 
  KeyRound, 
  User, 
  Lock, 
  ArrowRight, 
  Delete, 
  ShieldCheck, 
  ShoppingCart,
  AlertCircle,
  Database,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { settings, users, login, quickLoginAs, dbConnected, dbName } = usePOS();
  const [mode, setMode] = useState<'pin' | 'password'>('pin');
  
  // PIN Mode state
  const [pin, setPin] = useState<string>('');
  
  // Password Mode state
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle PIN input digit
  const handleDigit = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMessage('');
      
      // Auto-submit when 4 digits reached
      if (nextPin.length === 4) {
        setTimeout(async () => {
          const res = await login(nextPin);
          if (!res.success) {
            setErrorMessage(res.message || 'รหัส PIN ไม่ถูกต้อง');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  // Handle keyboard typing for PIN mode
  useEffect(() => {
    if (mode !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, pin]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    const res = await login(username, password);
    if (!res.success) {
      setErrorMessage(res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-split-card">
        {/* Left Hero Side - Brand Showcase (Green & Gold Executive Theme) */}
        <div className="login-hero-side">
          <div>
            {/* Top pill badge */}
            <div className="login-hero-badge">
              <Sparkles size={14} className="gold-icon" />
              <span>NEXUS POS • Enterprise Terminal</span>
            </div>

            {/* Brand Logo & Name */}
            <div className="login-hero-brand">
              <div className="login-hero-logo-box">
                <Zap size={34} fill="#d4a017" color="#d4a017" />
              </div>
              <div>
                <h1 className="login-hero-title">{settings.storeName}</h1>
                <p className="login-hero-subtitle">{settings.branchName}</p>
              </div>
            </div>

            <p className="login-hero-desc">
              ระบบขายหน้าร้านอัจฉริยะ แม่นยำ รวดเร็ว และเชื่อมต่อฐานข้อมูล PostgreSQL แบบ Real-time
            </p>

            {/* Feature Highlights List */}
            <div className="login-hero-features">
              <div className="login-hero-feature-item">
                <CheckCircle2 size={18} className="gold-icon" />
                <span>คิดเงินรวดเร็ว สแกนบาร์โค้ด และออกใบเสร็จด่วน</span>
              </div>
              <div className="login-hero-feature-item">
                <CheckCircle2 size={18} className="gold-icon" />
                <span>เชื่อมต่อฐานข้อมูล PostgreSQL แบบถาวรและปลอดภัย</span>
              </div>
              <div className="login-hero-feature-item">
                <CheckCircle2 size={18} className="gold-icon" />
                <span>สรุปยอดขาย กำไรขั้นต้น และประวัติบิลเรียลไทม์</span>
              </div>
              <div className="login-hero-feature-item">
                <CheckCircle2 size={18} className="gold-icon" />
                <span>แยกสิทธิ์ผู้ใช้งานชัดเจน (แอดมิน และพนักงานขาย)</span>
              </div>
            </div>
          </div>

          {/* Bottom System & Database Status */}
          <div className="login-hero-footer">
            <div className="login-db-status">
              <div className={`status-dot ${dbConnected ? 'online' : 'offline'}`} />
              <Database size={14} />
              <span>
                {dbConnected ? `PostgreSQL: ${dbName}` : 'Database: Offline'}
              </span>
            </div>
            <div className="login-version-tag">
              v2.5 Production
            </div>
          </div>
        </div>

        {/* Right Form Side - Auth & Keypad */}
        <div className="login-form-side">
          <div className="login-form-header">
            <h2 className="login-form-title">เข้าสู่ระบบ</h2>
            <p className="login-form-subtitle">เลือกรหัส PIN หรือชื่อผู้ใช้เพื่อเริ่มการขาย</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab-btn ${mode === 'pin' ? 'active' : ''}`}
              onClick={() => {
                setMode('pin');
                setErrorMessage('');
                setPin('');
              }}
            >
              <KeyRound size={16} />
              <span>รหัส PIN 4 หลัก</span>
            </button>

            <button
              type="button"
              className={`login-tab-btn ${mode === 'password' ? 'active' : ''}`}
              onClick={() => {
                setMode('password');
                setErrorMessage('');
              }}
            >
              <User size={16} />
              <span>ชื่อผู้ใช้ & รหัสผ่าน</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PIN Pad Mode */}
          {mode === 'pin' && (
            <div className="pin-login-container">
              {/* PIN Dots Indicator */}
              <div className="pin-dots-row">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`pin-dot ${pin.length > idx ? 'filled' : ''}`}
                  />
                ))}
              </div>

              <div className="pin-hint">
                กดตัวเลข 4 หลักจากหน้าจอ หรือพิมพ์จากแป้นพิมพ์คีย์บอร์ด
              </div>

              {/* Numeric Keypad Grid */}
              <div className="pin-keypad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    className="pin-key-btn"
                    onClick={() => handleDigit(num)}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  className="pin-key-btn pin-action-key pin-clear-btn"
                  onClick={handleClear}
                  title="ล้างทั้งหมด [Esc]"
                >
                  C
                </button>

                <button
                  type="button"
                  className="pin-key-btn"
                  onClick={() => handleDigit('0')}
                >
                  0
                </button>

                <button
                  type="button"
                  className="pin-key-btn pin-action-key pin-backspace-btn"
                  onClick={handleBackspace}
                  title="ลบตัวเลขล่าสุด [Backspace]"
                >
                  <Delete size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Username & Password Mode */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="password-login-form">
              <div className="form-group">
                <label>ชื่อผู้ใช้งาน (Username)</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="barcode-input"
                    style={{ height: 46, paddingLeft: 40 }}
                    placeholder="เช่น admin หรือ cashier1"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label>รหัสผ่าน (Password)</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    className="barcode-input"
                    style={{ height: 46, paddingLeft: 40 }}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-checkout" style={{ height: 46, width: '100%', justifyContent: 'center' }}>
                <span>เข้าสู่ระบบ</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Quick Demo Accounts Selection */}
          <div className="quick-login-section">
            <div className="quick-login-header">
              ⚡ บัญชีทดสอบด่วน (คลิกเข้าใช้งานได้ทันที):
            </div>
            <div className="quick-login-grid">
              {users.map(u => {
                const demoPins: Record<string, string> = {
                  admin: '1234',
                  cashier1: '0000',
                  cashier2: '1111'
                };
                const userPin = demoPins[u.username] || '••••';
                return (
                  <button
                    key={u.id}
                    type="button"
                    className="quick-user-card"
                    onClick={() => quickLoginAs(u)}
                    title={`เข้าสู่ระบบเป็น ${u.name} (PIN: ${userPin})`}
                  >
                    <div className="quick-user-avatar">
                      {u.avatar || (u.role === 'ADMIN' ? '👑' : '🛒')}
                    </div>
                    <div className="quick-user-info">
                      <div className="quick-user-name">{u.name}</div>
                      <div className="quick-user-meta">
                        {u.role === 'ADMIN' ? (
                          <span className="role-chip admin">
                            <ShieldCheck size={11} /> แอดมิน (เข้าได้ทุกหน้า)
                          </span>
                        ) : (
                          <span className="role-chip cashier">
                            <ShoppingCart size={11} /> พนักงาน (ขายอย่างเดียว)
                          </span>
                        )}
                        <span className="quick-user-pin">PIN: {userPin}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
