import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import type { User, UserRole } from '../types/pos';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShoppingCart, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Check, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser } = usePOS();
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CASHIER'>('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'CASHIER' as UserRole,
    pin: '',
    password: '',
    avatar: '🛒',
    isActive: true
  });
  
  const [showPins, setShowPins] = useState<{ [id: string]: boolean }>({});
  const [formError, setFormError] = useState('');

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const cashierCount = users.filter(u => u.role === 'CASHIER').length;

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      role: 'CASHIER',
      pin: '',
      password: '',
      avatar: '🛒',
      isActive: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      pin: user.pin || '',
      password: user.password || '',
      avatar: user.avatar || (user.role === 'ADMIN' ? '👑' : '🛒'),
      isActive: user.isActive
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!formData.username.trim()) {
      setFormError('กรุณากรอกชื่อผู้ใช้งาน (Username)');
      return;
    }
    if (!/^\d{4}$/.test(formData.pin)) {
      setFormError('รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น');
      return;
    }

    if (editingUser) {
      const res = updateUser(editingUser.id, {
        name: formData.name.trim(),
        username: formData.username.trim(),
        role: formData.role,
        pin: formData.pin,
        password: formData.password || undefined,
        avatar: formData.role === 'ADMIN' ? '👑' : '🛒',
        isActive: formData.isActive
      });

      if (!res.success) {
        setFormError(res.message || 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้');
        return;
      }
    } else {
      const res = addUser({
        name: formData.name.trim(),
        username: formData.username.trim(),
        role: formData.role,
        pin: formData.pin,
        password: formData.password || '1234',
        avatar: formData.role === 'ADMIN' ? '👑' : '🛒',
        isActive: formData.isActive
      });

      if (!res.success) {
        setFormError(res.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้');
        return;
      }
    }

    handleCloseModal();
  };

  const handleDelete = (user: User) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${user.name}" (${user.username})?`)) {
      const res = deleteUser(user.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const togglePinVisibility = (id: string) => {
    setShowPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">👥 จัดการผู้ใช้งานระบบ (User Management)</h2>
          <p className="view-subtitle">
            กำหนดสิทธิ์ผู้ใช้งาน เพิ่ม ลบ แก้ไข บัญชีแอดมินและพนักงานขาย
          </p>
        </div>

        <button 
          className="btn-checkout" 
          style={{ height: 42, padding: '0 20px' }}
          onClick={handleOpenAddModal}
        >
          <UserPlus size={18} />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">
            <Users size={18} color="var(--primary)" />
            <span>ผู้ใช้งานทั้งหมดในระบบ</span>
          </div>
          <div className="stat-value">{users.length} <span style={{ fontSize: '1rem', fontWeight: 500 }}>คน</span></div>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <ShieldCheck size={18} color="#8b5cf6" />
            <span>ผู้ดูแลระบบ (Admin)</span>
          </div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>
            {adminCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>คน</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            มีสิทธิ์ดูและจัดการข้อมูลได้ทุกอย่างในโปรแกรม
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <ShoppingCart size={18} color="#10b981" />
            <span>พนักงานขาย (User / Cashier)</span>
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {cashierCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>คน</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            มีหน้าที่ขายสินค้าหน้าร้านอย่างเดียว (เข้าถึงเฉพาะ POS)
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="inventory-search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="barcode-input"
            style={{ height: 42 }}
            placeholder="ค้นหาชื่อผู้ใช้ หรือชื่อ-นามสกุล..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn-secondary ${roleFilter === 'ALL' ? 'active' : ''}`}
            style={{ height: 42, padding: '0 16px' }}
            onClick={() => setRoleFilter('ALL')}
          >
            ทั้งหมด ({users.length})
          </button>
          <button
            className={`btn-secondary ${roleFilter === 'ADMIN' ? 'active' : ''}`}
            style={{ height: 42, padding: '0 16px' }}
            onClick={() => setRoleFilter('ADMIN')}
          >
            👑 แอดมิน ({adminCount})
          </button>
          <button
            className={`btn-secondary ${roleFilter === 'CASHIER' ? 'active' : ''}`}
            style={{ height: 42, padding: '0 16px' }}
            onClick={() => setRoleFilter('CASHIER')}
          >
            🛒 พนักงานขาย ({cashierCount})
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="data-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ผู้ใช้</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ชื่อผู้ใช้ (Username)</th>
              <th>บทบาท / สิทธิ์การใช้งาน</th>
              <th>รหัส PIN (4 หลัก)</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหา
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const isCurrent = currentUser?.id === user.id;
                const isPinVisible = showPins[user.id];

                return (
                  <tr key={user.id} style={{ background: isCurrent ? 'rgba(99, 102, 241, 0.04)' : undefined }}>
                    <td>
                      <div className="user-table-avatar">
                        {user.avatar || (user.role === 'ADMIN' ? '👑' : '🛒')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{user.name}</span>
                        {isCurrent && (
                          <span className="current-user-tag">
                            คุณ (Current)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        @{user.username}
                      </code>
                    </td>
                    <td>
                      {user.role === 'ADMIN' ? (
                        <div className="role-badge-admin">
                          <ShieldCheck size={14} />
                          <span>แอดมิน (เข้าได้ทุกส่วน)</span>
                        </div>
                      ) : (
                        <div className="role-badge-cashier">
                          <ShoppingCart size={14} />
                          <span>พนักงานขาย (ขายอย่างเดียว)</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '1px' }}>
                          {isPinVisible ? (user.pin || '🔒 เข้ารหัสแล้ว') : '••••'}
                        </code>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: 28, height: 28 }}
                          onClick={() => togglePinVisibility(user.id)}
                          title={isPinVisible ? 'ซ่อน PIN' : 'ดู PIN'}
                        >
                          {isPinVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      {user.isActive ? (
                        <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></span>
                          เปิดใช้งาน
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>
                          ระงับการใช้งาน
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="icon-btn"
                          onClick={() => handleOpenEditModal(user)}
                          title="แก้ไขข้อมูลผู้ใช้"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDelete(user)}
                          disabled={isCurrent}
                          title={isCurrent ? 'ไม่สามารถลบบัญชีตัวเองได้' : 'ลบบัญชีนี้'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">
                <Users size={20} color="var(--primary)" />
                <span>{editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</span>
              </div>
              <button className="icon-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {formError && (
                  <div className="login-error-alert">
                    <AlertTriangle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Role Selection Cards */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                    บทบาทและสิทธิ์การใช้งาน (User Role) *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div
                      className={`role-select-box ${formData.role === 'ADMIN' ? 'selected admin-selected' : ''}`}
                      onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.25rem' }}>👑</span>
                          <strong style={{ fontSize: '0.92rem' }}>ผู้ดูแลระบบ (Admin)</strong>
                        </div>
                        <div className={`role-radio-circle ${formData.role === 'ADMIN' ? 'checked' : ''}`} />
                      </div>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        เข้าถึงได้ทุกส่วน: ขายหน้าร้าน, คลังสินค้า, รายงานยอดขาย, จัดการผู้ใช้, ตั้งค่าระบบ
                      </p>
                    </div>

                    <div
                      className={`role-select-box ${formData.role === 'CASHIER' ? 'selected cashier-selected' : ''}`}
                      onClick={() => setFormData({ ...formData, role: 'CASHIER' })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.25rem' }}>🛒</span>
                          <strong style={{ fontSize: '0.92rem' }}>พนักงานขาย (User)</strong>
                        </div>
                        <div className={`role-radio-circle ${formData.role === 'CASHIER' ? 'checked' : ''}`} />
                      </div>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        มีหน้าที่ขายสินค้าหน้าร้านอย่างเดียว ซ่อนแท็บอื่นทั้งหมด ป้องกันการเข้าถึงข้อมูลหลังบ้าน
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    ชื่อ-นามสกุล ที่แสดงในระบบ *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น สมชาย มั่นคง หรือ ผู้จัดการร้าน"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    ชื่อผู้ใช้งาน (Username สำหรับเข้าสู่ระบบ) *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    placeholder="เช่น cashier1 หรือ manager"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* PIN */}
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      รหัส PIN 4 หลัก (สำหรับจิ้มล็อกอินด่วน) *
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      className="form-input"
                      style={{ 
                        textAlign: 'center', 
                        fontSize: '1.1rem', 
                        fontFamily: formData.pin ? 'var(--font-mono)' : 'inherit',
                        letterSpacing: formData.pin ? '6px' : 'normal'
                      }}
                      placeholder="ตัวเลข 4 หลัก เช่น 1234"
                      value={formData.pin}
                      onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      รหัสผ่าน (Password)
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="กำหนดรหัสผ่าน (ถ้ามี)"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                {/* Active Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label htmlFor="isActiveCheck" style={{ fontSize: '0.88rem', cursor: 'pointer' }}>
                    เปิดใช้งานบัญชีนี้ (สามารถเข้าสู่ระบบเพื่อใช้งาน POS ได้)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ height: 44, padding: '0 20px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
                  onClick={handleCloseModal}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn-checkout" 
                  style={{ height: 44, padding: '0 24px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
                >
                  <Check size={18} />
                  <span>{editingUser ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้งาน'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
