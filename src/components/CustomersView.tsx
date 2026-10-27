import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import type { Customer } from '../types/pos';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  CreditCard, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  ShoppingCart,
  AlertCircle,
  Star
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    selectCustomer, 
    setActiveTab 
  } = usePOS();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    memberCode: '',
    firstName: '',
    lastName: '',
    phone: '',
    points: 0
  });

  const [formError, setFormError] = useState('');

  // Filter members by search term
  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      c.memberCode.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    // Auto suggest next member code
    const nextNum = (customers.length + 1).toString().padStart(3, '0');
    setFormData({
      memberCode: `MB-${nextNum}`,
      firstName: '',
      lastName: '',
      phone: '',
      points: 0
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      memberCode: cust.memberCode,
      firstName: cust.firstName,
      lastName: cust.lastName,
      phone: cust.phone,
      points: cust.points || 0
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.memberCode.trim()) {
      setFormError('กรุณากรอกรหัสลูกค้า');
      return;
    }
    if (!formData.firstName.trim()) {
      setFormError('กรุณากรอกชื่อลูกค้า');
      return;
    }

    const numPoints = Math.max(0, parseInt(formData.points as any, 10) || 0);

    if (editingCustomer) {
      const res = updateCustomer(editingCustomer.id, {
        memberCode: formData.memberCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        points: numPoints
      });
      if (!res.success) {
        setFormError(res.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
        return;
      }
    } else {
      const res = addCustomer({
        memberCode: formData.memberCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        points: numPoints
      });
      if (!res.success) {
        setFormError(res.message || 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก');
        return;
      }
    }

    handleCloseModal();
  };

  const handleDelete = (cust: Customer) => {
    if (confirm(`คุณต้องการลบข้อมูลสมาชิก "${cust.firstName} ${cust.lastName}" (${cust.memberCode}) ใช่หรือไม่?`)) {
      const res = deleteCustomer(cust.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleSelectToSell = (cust: Customer) => {
    selectCustomer(cust);
    setActiveTab('terminal');
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">💳 ระบบสมาชิก (Customer Members)</h2>
          <p className="view-subtitle">
            จัดการข้อมูลสมาชิก รหัสลูกค้า และเบอร์โทรศัพท์สำหรับเลือกขายสินค้า
          </p>
        </div>

        <button 
          className="btn-checkout" 
          style={{ height: 42, padding: '0 20px' }}
          onClick={handleOpenAddModal}
        >
          <UserPlus size={18} />
          <span>เพิ่มสมาชิกใหม่</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-title">
            <Users size={18} color="var(--primary)" />
            <span>สมาชิกทั้งหมดในระบบ</span>
          </div>
          <div className="stat-value">{customers.length} <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>คน</span></div>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <CreditCard size={18} color="var(--warning)" />
            <span>รูปแบบรหัสสมาชิก</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            MB-001 ถึง MB-{customers.length.toString().padStart(3, '0')}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            สามารถค้นหาด้วยรหัส หรือเบอร์โทรศัพท์ขณะคิดเงินได้ทันที
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="inventory-search-box" style={{ flex: 1 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="barcode-input"
            style={{ height: 44 }}
            placeholder="ค้นหาด้วยชื่อ, นามสกุล, รหัสลูกค้า (MB-xxx) หรือเบอร์โทรศัพท์..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="data-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>รหัสลูกค้า</th>
              <th>ชื่อ - นามสกุล</th>
              <th>เบอร์ติดต่อ</th>
              <th>คะแนนสะสม (Points)</th>
              <th>ยอดซื้อสะสม</th>
              <th>วันที่ลงทะเบียน</th>
              <th style={{ textAlign: 'right' }}>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  ไม่พบข้อมูลสมาชิกตามที่ค้นหา
                </td>
              </tr>
            ) : (
              filteredCustomers.map(cust => (
                <tr key={cust.id}>
                  <td>
                    <span className="member-code-tag">
                      <CreditCard size={13} />
                      <strong>{cust.memberCode}</strong>
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {cust.firstName} {cust.lastName}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <Phone size={14} color="var(--primary)" />
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{cust.phone || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '3px 8px', borderRadius: 9999, fontSize: '0.82rem' }}>
                      <Star size={12} fill="#f59e0b" />
                      {cust.points || 0} แต้ม
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
                      ฿{Number(cust.totalSpent || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(cust.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ height: 34, padding: '0 12px', fontSize: '0.78rem', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.35)' }}
                        onClick={() => handleSelectToSell(cust)}
                        title="เลือกลูกค้ารายนี้แล้วไปหน้าขายสินค้า"
                      >
                        <ShoppingCart size={14} />
                        <span>คิดเงินให้ลูกค้านี้</span>
                      </button>

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleOpenEditModal(cust)}
                        title="แก้ไขข้อมูลสมาชิก"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-btn"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDelete(cust)}
                        title="ลบสมาชิกนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="modal-title">
                <CreditCard size={20} color="var(--primary)" />
                <span>{editingCustomer ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}</span>
              </div>
              <button className="icon-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {formError && (
                  <div className="login-error-alert">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Member Code */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    รหัสลูกค้า (Member Code) *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    placeholder="เช่น MB-001 หรือ CUST-101"
                    value={formData.memberCode}
                    onChange={e => setFormData({ ...formData, memberCode: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* First Name */}
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      ชื่อ *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น สมพร"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      นามสกุล
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น สุขดี"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    เบอร์ติดต่อ (เบอร์โทรศัพท์) *
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    placeholder="เช่น 081-234-5678"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    สามารถใช้เบอร์นี้ค้นหาชื่อลูกค้าตอนยิงขายสินค้าหน้าร้านได้ทันที
                  </span>
                </div>

                {/* Points */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    แต้มสะสมปัจจุบัน (Points)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, paddingLeft: 36 }}
                      value={formData.points}
                      onChange={e => setFormData({ ...formData, points: Math.max(0, parseInt(e.target.value) || 0) })}
                    />
                    <Star size={16} color="#f59e0b" fill="#f59e0b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    ระบบสะสมแต้มอัตโนมัติ 25 บาท = 1 แต้ม (10 แต้ม = ส่วนลด 1 บาท)
                  </span>
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
                  <span>{editingCustomer ? 'บันทึกการแก้ไข' : 'บันทึกสมาชิก'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
