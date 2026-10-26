import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import type { Product } from '../types/pos';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  Edit2, 
  Trash2, 
  X,
  TrendingUp,
  Boxes,
  Tags,
  FolderPlus,
  Upload,
  Link as LinkIcon
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { 
    products, 
    categories, 
    addCategory, 
    deleteCategory, 
    addProduct, 
    updateProduct, 
    adjustStock, 
    deleteProduct 
  } = usePOS();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: categories[0] || 'ของใช้ทั่วไป',
    costPrice: '',
    sellPrice: '',
    stock: '',
    minStock: '10',
    unit: 'ชิ้น',
    emoji: '📦',
    image: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพไม่ควรเกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const categoryFilterList = ['ALL', ...categories];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    return matchCat && matchSearch;
  });

  // Inventory Totals
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const totalCostValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalSellValue = products.reduce((acc, p) => acc + p.stock * p.sellPrice, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      barcode: '885' + Math.floor(100000000 + Math.random() * 900000000),
      name: '',
      category: categories[0] || 'ของใช้ทั่วไป',
      costPrice: '',
      sellPrice: '',
      stock: '20',
      minStock: '10',
      unit: 'ชิ้น',
      emoji: '🏷️',
      image: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      barcode: p.barcode,
      name: p.name,
      category: p.category,
      costPrice: p.costPrice.toString(),
      sellPrice: p.sellPrice.toString(),
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      unit: p.unit,
      emoji: p.emoji,
      image: p.image || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.barcode.trim()) {
      alert('กรุณากรอกชื่อสินค้าและรหัสบาร์โค้ด');
      return;
    }

    const costPrice = parseFloat(formData.costPrice) || 0;
    const sellPrice = parseFloat(formData.sellPrice) || 0;
    const stock = parseInt(formData.stock, 10) || 0;
    const minStock = parseInt(formData.minStock, 10) || 5;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        barcode: formData.barcode,
        name: formData.name,
        category: formData.category,
        costPrice,
        sellPrice,
        stock,
        minStock,
        unit: formData.unit,
        emoji: formData.emoji,
        image: formData.image ? formData.image : undefined
      });
    } else {
      addProduct({
        barcode: formData.barcode,
        name: formData.name,
        category: formData.category,
        costPrice,
        sellPrice,
        stock,
        minStock,
        unit: formData.unit,
        emoji: formData.emoji,
        image: formData.image ? formData.image : undefined
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">📦 จัดการสินค้าและคลังสต็อก (Inventory)</h2>
          <p className="view-subtitle">ดูยอดสินค้าคงเหลือ ปรับสต็อก และเพิ่มสินค้าเข้าระบบ</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            style={{ height: 42, padding: '0 16px', fontSize: '0.9rem' }}
            onClick={() => setIsCategoryModalOpen(true)}
            title="จัดการหมวดหมู่สินค้า เพิ่ม/ลบ"
          >
            <Tags size={16} />
            <span>จัดการหมวดหมู่ ({categories.length})</span>
          </button>

          <button
            className="btn-checkout"
            style={{ height: 42, padding: '0 18px', fontSize: '0.9rem' }}
            onClick={handleOpenAdd}
          >
            <Plus size={18} />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Inventory Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">
            <Boxes size={16} /> รายการสินค้าทั้งหมด
          </div>
          <div className="stat-value">{products.length} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>รายการ</span></div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            รวมทั้งหมด {totalStockCount.toLocaleString()} ชิ้น
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <AlertTriangle size={16} color="var(--warning)" /> สินค้าใกล้หมด / หมด
          </div>
          <div className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {lowStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>รายการ</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            ต้องสั่งซื้อเพิ่มเร็วๆ นี้
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">
            <TrendingUp size={16} /> มูลค่าสต็อกรวม (ตามราคาทุน)
          </div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>
            ฿{totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            มูลค่าตามราคาขาย ฿{totalSellValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่อสินค้า หรือรหัสบาร์โค้ด..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 44,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              paddingLeft: 42,
              paddingRight: 14,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        <div className="categories-bar" style={{ flexShrink: 0, paddingBottom: 0 }}>
          {categoryFilterList.map(cat => (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'ALL' ? 'ทั้งหมด' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="data-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>บาร์โค้ด</th>
              <th>หมวดหมู่</th>
              <th style={{ textAlign: 'right' }}>ราคาทุน</th>
              <th style={{ textAlign: 'right' }}>ราคาขาย</th>
              <th style={{ textAlign: 'center' }}>สต็อกคงเหลือ</th>
              <th style={{ textAlign: 'center' }}>ปรับสต็อกด่วน</th>
              <th style={{ textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const isLow = p.stock <= p.minStock;
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            border: '1px solid var(--border-subtle)',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.4rem' }}>{p.emoji}</span>
                      )}
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {p.barcode}
                  </td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', fontSize: '0.78rem' }}>
                      {p.category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    ฿{p.costPrice.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    ฿{p.sellPrice.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: isLow ? 'var(--warning-surface)' : 'rgba(16, 185, 129, 0.1)',
                        color: isLow ? 'var(--warning)' : 'var(--success)'
                      }}
                    >
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28 }}
                        title="ลดสต็อก 1"
                        onClick={() => adjustStock(p.id, -1)}
                      >
                        <MinusCircle size={15} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28 }}
                        title="เพิ่มสต็อก 5"
                        onClick={() => adjustStock(p.id, 5)}
                      >
                        <PlusCircle size={15} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28, color: 'var(--cyan)' }}
                        title="เพิ่มสต็อก 10"
                        onClick={() => adjustStock(p.id, 10)}
                      >
                        +10
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30 }}
                        title="แก้ไขสินค้า"
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30, color: 'var(--danger)' }}
                        title="ลบสินค้า"
                        onClick={() => {
                          if (confirm(`คุณต้องการลบ "${p.name}" ออกจากระบบใช่หรือไม่?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Package size={20} color="var(--primary)" />
                <span>{editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</span>
              </div>
              <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ gap: 14 }}>
                {/* Product Image Selection & Upload */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    รูปภาพสินค้า (อัปโหลดจากเครื่อง หรือระบุ URL)
                  </label>
                  
                  <div className="image-upload-container">
                    <div className="image-preview-thumbnail">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" />
                      ) : (
                        <span style={{ fontSize: '1.8rem' }}>{formData.emoji || '📦'}</span>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ height: 36, padding: '0 12px', fontSize: '0.82rem' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload size={14} />
                          <span>เลือกไฟล์จากเครื่อง...</span>
                        </button>

                        {formData.image && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: 36, padding: '0 10px', fontSize: '0.82rem', color: 'var(--danger)' }}
                            onClick={() => setFormData({ ...formData, image: '' })}
                          >
                            <Trash2 size={14} />
                            <span>ลบรูป</span>
                          </button>
                        )}
                      </div>

                      <div style={{ position: 'relative' }}>
                        <LinkIcon size={13} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="barcode-input"
                          style={{ height: 36, paddingLeft: 30, paddingRight: 10, fontSize: '0.82rem' }}
                          placeholder="หรือวาง URL รูปภาพ เช่น https://..."
                          value={formData.image}
                          onChange={e => setFormData({ ...formData, image: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ไอคอน</label>
                    <input
                      type="text"
                      className="barcode-input"
                      style={{ height: 42, textAlign: 'center', fontSize: '1.4rem', padding: 0 }}
                      value={formData.emoji}
                      onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ชื่อสินค้า *</label>
                    <input
                      type="text"
                      className="barcode-input"
                      style={{ height: 42, padding: '0 12px' }}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น น้ำแร่ธรรมชาติ 500 มล."
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>รหัสบาร์โค้ด *</label>
                    <input
                      type="text"
                      className="barcode-input"
                      style={{ height: 42, padding: '0 12px', fontFamily: 'var(--font-mono)' }}
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>หมวดหมู่</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        className="barcode-input"
                        style={{ height: 42, padding: '0 12px', flex: 1 }}
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 42, height: 42, flexShrink: 0 }}
                        title="พิมพ์เพิ่มหมวดหมู่ใหม่ทันที"
                        onClick={() => {
                          const name = prompt('พิมพ์ชื่อหมวดหมู่สินค้าใหม่:');
                          if (name && name.trim()) {
                            const ok = addCategory(name.trim());
                            if (ok) {
                              setFormData({ ...formData, category: name.trim() });
                            } else {
                              alert('หมวดหมู่นี้มีอยู่ในระบบแล้วหรือชื่อไม่ถูกต้อง');
                            }
                          }
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ราคาทุน (บาท)</label>
                    <input
                      type="number"
                      step="any"
                      className="barcode-input"
                      style={{ height: 42, padding: '0 12px', fontFamily: 'var(--font-mono)' }}
                      value={formData.costPrice}
                      onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ราคาขาย (บาท) *</label>
                    <input
                      type="number"
                      step="any"
                      className="barcode-input"
                      style={{ height: 42, padding: '0 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      value={formData.sellPrice}
                      onChange={e => setFormData({ ...formData, sellPrice: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>สต็อกเริ่มต้น</label>
                    <input
                      type="number"
                      className="barcode-input"
                      style={{ height: 42, padding: '0 12px', fontFamily: 'var(--font-mono)' }}
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>เตือนสต็อกต่ำกว่า</label>
                    <input
                      type="number"
                      className="barcode-input"
                      style={{ height: 42, padding: '0 12px', fontFamily: 'var(--font-mono)' }}
                      value={formData.minStock}
                      onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>หน่วยนับ</label>
                    <input
                      type="text"
                      className="barcode-input"
                      style={{ height: 42, padding: '0 12px' }}
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="ชิ้น / ขวด"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" style={{ height: 42, padding: '0 16px' }} onClick={() => setIsAddModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn-checkout" style={{ height: 42, padding: '0 20px', fontSize: '0.9rem' }}>
                  <span>{editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <Tags size={20} color="var(--primary)" />
                <span>จัดการหมวดหมู่สินค้า</span>
              </div>
              <button className="icon-btn" onClick={() => setIsCategoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ gap: 16 }}>
              {/* Add New Category Form */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!newCatInput.trim()) return;
                  const ok = addCategory(newCatInput.trim());
                  if (ok) {
                    setNewCatInput('');
                  } else {
                    alert('หมวดหมู่นี้มีอยู่ในระบบแล้วหรือชื่อไม่ถูกต้อง');
                  }
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  type="text"
                  className="barcode-input"
                  style={{ height: 42, padding: '0 14px', flex: 1 }}
                  placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น เบเกอรี่, เครื่องดื่มชูกำลัง..."
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-checkout"
                  style={{ height: 42, padding: '0 18px', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
                >
                  <FolderPlus size={16} />
                  <span>เพิ่มหมวดหมู่</span>
                </button>
              </form>

              {/* Existing Categories List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  หมวดหมู่ทั้งหมดในระบบ ({categories.length} รายการ):
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {categories.map(cat => {
                    const count = products.filter(p => p.category === cat).length;
                    return (
                      <div key={cat} className="category-item-row">
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{cat}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                            ({count} สินค้า)
                          </span>
                        </div>

                        <button
                          className="icon-btn"
                          style={{ width: 28, height: 28, color: count > 0 ? 'var(--text-muted)' : 'var(--danger)' }}
                          title={count > 0 ? `มีสินค้า ${count} รายการใช้งานหมวดหมู่นี้อยู่ ไม่สามารถลบได้` : 'ลบหมวดหมู่'}
                          onClick={() => {
                            if (count > 0) {
                              alert(`ไม่สามารถลบหมวดหมู่ "${cat}" ได้ เนื่องจากยังมีสินค้า ${count} รายการใช้งานหมวดนี้อยู่ (กรุณาเปลี่ยนหมวดหมู่สินค้าก่อนลบ)`);
                              return;
                            }
                            if (confirm(`คุณต้องการลบหมวดหมู่ "${cat}" ใช่หรือไม่?`)) {
                              deleteCategory(cat);
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-checkout"
                style={{ height: 40, padding: '0 22px', fontSize: '0.9rem' }}
                onClick={() => setIsCategoryModalOpen(false)}
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
