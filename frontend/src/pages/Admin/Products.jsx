import React, { useEffect, useState, useRef } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';
import MarkdownEditor from '../../components/MarkdownEditor';
import { uploadToCloudinary } from '../../services/cloudinary';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // edit modal state
  const [editing, setEditing] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addingImages, setAddingImages] = useState(false);
  const imagesInputRef = useRef(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => { 
    loadCategories();
    loadSuppliers();
    load(); 
  }, []);

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories/');
      const j = await res.json();
      if (j.success && j.data) {
        setCategories(j.data);
      }
    } catch (err) {
      console.error('Load categories error:', err);
    }
  }

  async function loadSuppliers() {
    try {
      const res = await fetch('/api/suppliers/all');
      const j = await res.json();
      if (j.success && j.data) {
        setSuppliers(j.data);
      }
    } catch (err) {
      console.error('Load suppliers error:', err);
    }
  }

  function mapProduct(p) {
    let imgs = [];
    try { imgs = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []; } catch { imgs = []; }
    const variants = (p.variants && typeof p.variants === 'string') ? JSON.parse(p.variants) : (p.variants || []);
    const category_raw = p.category_id ?? p.categoryId ?? (p.category && (p.category.id ?? p.category.category_id));
    const supplier_raw = p.supplier_id ?? p.supplierId ?? (p.supplier && (p.supplier.id ?? p.supplier.supplier_id));
    const category_id = (category_raw != null && category_raw !== '') ? Number(category_raw) : null;
    const supplier_id = (supplier_raw != null && supplier_raw !== '') ? Number(supplier_raw) : null;
    return { ...p, imagesArray: imgs, variants, category_id, supplier_id };
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/products/getAllProducts');
      const j = await res.json();
      const rows = (j.data || []).map(mapProduct);
      setProducts(rows);
    } catch (err) {
      console.error(err);
      alert('Không thể tải products');
    } finally {
      setLoading(false);
    }
  }

  // NEW: handler cho search từ AdminHeader
  async function handleSearch(query) {
    if (!query) { await load(); return; }
    setLoading(true);
    try {
      if (/^\d+$/.test(query)) {
        // tìm theo id
        const res = await fetch(`/api/products/detailProduct/${query}`);
        const j = await res.json().catch(()=>null);
        if (res.ok && j && j.success && j.data) {
          setProducts([mapProduct(j.data)]);
        } else {
          setProducts([]);
        }
      } else {
        // tìm theo tên (sử dụng endpoint productByName đã có trong backend)
        const res = await fetch('/api/products/productByName', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: query })
        });
        const j = await res.json().catch(()=>null);
        if (res.ok && j && j.success) {
          const rows = (j.data || []).map(mapProduct);
          setProducts(rows);
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      console.error('Search error', err);
      alert('Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  }

  function statusLabel(code) {
    if (!code) return '-';
    const c = String(code).toLowerCase();
    if (c === 'active') return 'Còn hàng';
    if (c === 'inactive') return 'Tạm ngừng kinh doanh';
    return code;
  }

  async function onDelete(id) {
    if (!confirm('Xoá sản phẩm?')) return;
    try {
      const res = await fetch(`/api/products/deleteProduct/${id}`, { method: 'POST' });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j || !j.success) {
        console.error('Delete failed', j);
        alert('Xoá thất bại trên server');
        return;
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Xoá thất bại');
    }
  }

  function openEdit(product) {
    const copy = {
      id: product.id,
      avatar: product.avatar || '',
      name: product.name || '',
      origin: product.origin || '',
      status: product.status || '',
      description: product.description || '',
      category_id: (product.category_id ?? product.categoryId ?? (product.category && (product.category.id ?? product.category.category_id))) != null
        ? Number(product.category_id ?? product.categoryId ?? (product.category && (product.category.id ?? product.category.category_id)))
        : null,
      supplier_id: (product.supplier_id ?? product.supplierId ?? (product.supplier && (product.supplier.id ?? product.supplier.supplier_id))) != null
        ? Number(product.supplier_id ?? product.supplierId ?? (product.supplier && (product.supplier.id ?? product.supplier.supplier_id)))
        : null,
      expiry_date: product.expiry_date ? (product.expiry_date.split ? product.expiry_date.split('T')[0] : product.expiry_date) : '',
      images: Array.isArray(product.imagesArray) ? [...product.imagesArray] : [],
      variants: Array.isArray(product.variants) ? product.variants.map(v => ({ ...v })) : []
    };
    console.log('openEdit: product.id=', product.id, 'supplier_id=', copy.supplier_id, 'category_id=', copy.category_id);
    setEditing(copy);
    setAvatarFile(null);
    setPreviewUrl(copy.avatar || copy.images[0] || '');
  }

  function closeEdit() {
    setEditing(null);
    setAvatarFile(null);
    setPreviewUrl(null);
    setSaving(false);
    setAddingImages(false);
    setAvatarUrlInput('');
    setImageUrlInput('');
  }

  function onFieldChange(field, value) {
    setEditing(prev => ({ ...prev, [field]: value }));
  }

  function onSelectAvatar(file) {
    if (!file) return;
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function onAddImagesFiles(files) {
    if (!files || !files.length) return;
    if (!editing) return;
    setAddingImages(true);
    try {
      const uploaded = [];
      for (const f of files) {
        try {
          const json = await uploadToCloudinary(f);
          uploaded.push(json.secure_url);
        } catch (err) {
          console.error(`Lỗi upload ${f.name}:`, err.message);
          alert(`Lỗi upload ${f.name}:\n${err.message}`);
          throw err;
        }
      }
      setEditing(prev => ({ ...prev, images: [...(prev.images || []), ...uploaded] }));
      alert(`Upload ${uploaded.length} ảnh thành công`);
    } catch (err) {
      console.error('Upload images thất bại:', err);
      // Error đã được hiển thị ở trên
    } finally {
      setAddingImages(false);
      // Reset input so you can select the same file again
      if (imagesInputRef.current) {
        imagesInputRef.current.value = '';
      }
    }
  }

  function onRemoveImage(url) {
    if (!editing) return;
    setEditing(prev => ({ ...prev, images: (prev.images || []).filter(u => u !== url) }));
  }

  function onAddAvatarUrl() {
    if (!avatarUrlInput.trim()) { alert('Nhập URL ảnh'); return; }
    setPreviewUrl(avatarUrlInput);
    setEditing(prev => ({ ...prev, avatar: avatarUrlInput }));
    setAvatarUrlInput('');
  }

  function onAddImageUrl() {
    if (!imageUrlInput.trim()) { alert('Nhập URL ảnh'); return; }
    setEditing(prev => ({ ...prev, images: [...(prev.images || []), imageUrlInput] }));
    setImageUrlInput('');
  }

  function onVariantChange(index, field, value) {
    setEditing(prev => {
      const next = { ...prev };
      next.variants = next.variants.map((v, i) => i === index ? { ...v, [field]: value } : v);
      return next;
    });
  }

  function onAddVariant() {
    setEditing(prev => {
      const next = { ...prev };
      next.variants = [...(next.variants || []), { id: null, name: '', unit: '', price_list: 0, price_sale: 0, stock: 0 }];
      return next;
    });
  }

 async function onRemoveVariant(index) {
    if (!editing) return;
    const v = editing.variants && editing.variants[index];
    if (!v) return;

    // persisted variant -> call backend DELETE
    if (v && v.id) {
      if (!confirm('Xóa variant này vĩnh viễn?')) return;
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/products/deleteVariant/${v.id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        let j = null;
        try { j = await res.json(); } catch (e) { /* ignore parse error */ }

        if (!res.ok) {
          console.error('Delete variant failed', j);
          alert(j?.message || 'Xóa variant thất bại (server).');
          return;
        }

        // remove from local state
        setEditing(prev => ({ ...prev, variants: (prev.variants || []).filter((_, i) => i !== index) }));
      } catch (err) {
        console.error('Delete variant error', err);
        alert('Xóa variant thất bại (network).');
      }
    } else {
      // not yet saved -> just remove locally
      setEditing(prev => ({ ...prev, variants: (prev.variants || []).filter((_, i) => i !== index) }));
    }
  }

  function openCreate() {
    const empty = {
      id: null,
      avatar: '',
      name: '',
      origin: '',
      status: 'active',
      description: '',
      category_id: categories.length > 0 ? categories[0].id : null,
      supplier_id: suppliers.length > 0 ? suppliers[0].id : null,
      expiry_date: '',
      images: [],
      variants: []
    };
    setEditing(empty);
    setAvatarFile(null);
    setPreviewUrl('/placeholder.png');
  }

  async function onSave() {
    if (!editing) return;
    setSaving(true);
    try {
      let avatarUrl = editing.avatar || '';

      if (avatarFile) {
        try {
          console.log('Đang upload avatar...');
          const json = await uploadToCloudinary(avatarFile);
          avatarUrl = json.secure_url;
          console.log('Upload avatar thành công');
        } catch (err) {
          console.error('Lỗi upload avatar:', err.message);
          alert(`Lỗi upload avatar:\n${err.message}`);
          setSaving(false);
          return;
        }
      }

      const normalizedVariants = (editing.variants || [])
        .filter(v => !v._delete)
        .map(v => ({
          id: v.id || null,
          name: v.name || '',
          unit: v.unit || '',
          price_list: (typeof v.price_list !== 'undefined') ? Number(v.price_list) : (v.price_list ?? 0),
          price_sale: (typeof v.price_sale !== 'undefined') ? Number(v.price_sale) : (v.price_sale ?? 0),
          stock: (typeof v.stock !== 'undefined') ? Number(v.stock) : (v.stock ?? 0)
        }));

      const payload = {
        avatar: avatarUrl || null,
        name: editing.name || null,
        origin: editing.origin || null,
        status: editing.status || null,
        description: editing.description || null,
        expiry_date: editing.expiry_date || null,
        images: editing.images || [],
        category_id: editing.category_id ? Number(editing.category_id) : null,
        supplier_id: editing.supplier_id ? Number(editing.supplier_id) : null,
        variants: normalizedVariants
      };

      let res, j;
      if (editing && editing.id) {
        // update existing
        console.log('PUT payload', payload);
        res = await fetch(`/api/products/updateProduct/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        j = await res.json();
        if (!res.ok || !j || !j.success) {
          console.error('Update response:', j);
          throw new Error(j?.message || 'Update failed');
        }
      } else {
        // create new
        console.log('POST payload (create)', payload);
        res = await fetch('/api/products/createProduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        j = await res.json();
        if (!res.ok || !j || !j.success) {
          console.error('Create response:', j);
          throw new Error(j?.message || 'Create failed');
        }
      }   
      await load();
      closeEdit();
    } catch (err) {
      console.error(err);
      alert('Lưu thất bại: ' + (err.message || ''));
      setSaving(false);
    }
  }

  return (
    <div className="admin-root">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader title="Quản lý sản phẩm" onSearch={handleSearch} onCreate={openCreate} />
        {loading ? <div>Loading...</div> :
          <>
            {products.length === 0 ? (
              <div className="card" style={{ padding: 24 }}>Chưa có sản phẩm nào</div>
            ) : (
              <table className="admin-table" style={{tableLayout: 'fixed', width: '100%'}}>
                <thead>
                  <tr>
                    <th style={{width:'5%'}}>STT</th>
                    <th style={{width:'11%'}}>Hình ảnh</th>
                    <th style={{width:'18%', overflow:'hidden'}}>Tên</th>
                    <th style={{width:'12%'}}>Xuất xứ</th>
                    <th style={{width:'12%'}}>Trạng thái</th>
                    <th style={{width:'12%'}}>Hạn sử dụng</th>
                    <th style={{width:'20%'}}>Trọng lượng</th>
                    <th style={{width:'10%'}}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={p.id}>
                      <td style={{fontWeight:700, width:'5%'}}>{idx + 1}</td>
                      <td style={{width:'6%'}}>
                        <img className="thumb" src={p.avatar || (p.imagesArray && p.imagesArray[0]) || '/placeholder.png'} alt={p.name || ''} />
                      </td>
                      <td style={{width:'18%', maxWidth:'18%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.name || '-'}</td>
                      <td style={{width:'12%'}}>{p.origin || '-'}</td>
                      <td style={{width:'12%'}}>{statusLabel(p.status)}</td>
                      <td style={{width:'12%'}}>{p.expiry_date ? (p.expiry_date.split ? p.expiry_date.split('T')[0] : p.expiry_date) : '-'}</td>
                      <td style={{width:'28%', verticalAlign:'top'}}>
                        {(p.variants || []).map(v => (
                          <div key={v.id || v.variant_id || JSON.stringify(v)} style={{padding:'8px 10px', borderRadius:8, background:'#fbfff7', marginBottom:8, border:'1px solid #ecf6ed', overflow:'hidden'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                              <div style={{fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'85%'}}>{v.name || '-'}</div>
                            </div>
                            <div style={{marginTop:6, fontSize:13, color:'#556b56', overflow:'hidden', textOverflow:'ellipsis'}}>
                              Giá: <strong style={{color:'#2f9e44'}}>{v.price_sale || v.price_list}</strong> • Tồn kho: {v.stock || 0}
                            </div>
                          </div>
                        ))}
                      </td>
                      <td style={{width:'7%'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch'}}>
                          <button
                            className="btn btn-edit"
                            style={{width: '100%'}}
                            onClick={() => openEdit(p)}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            className="btn btn-delete"
                            style={{width: '100%'}}
                            onClick={() => onDelete(p.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        }

        {/* Edit Modal */}
        {editing && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
          }}>
            <div style={{ width: 1000, maxWidth: '98%', background: '#fff', borderRadius: 12, padding: 20, maxHeight: '90vh', overflow: 'auto' }}>
              <h3 style={{marginTop:0}}>{editing.id ? 'Chỉnh sửa' : 'Tạo sản phẩm mới'}</h3>

              <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:16, alignItems:'start'}}>
                <div>
                  <div style={{width:240, height:160, borderRadius:8, overflow:'hidden', border:'1px solid #e6efe6'}}>
                    <img src={previewUrl || '/placeholder.png'} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  </div>
                  <div style={{marginTop:8}}>
                    <label style={{display:'block',marginBottom:4, fontSize:12}}>Upload file:</label>
                    <input type="file" accept="image/*" onChange={e => onSelectAvatar(e.target.files && e.target.files[0])} />
                  </div>
                  <div style={{marginTop:8, display:'flex', gap:6}}>
                    <input 
                      className="search-input"
                      value={avatarUrlInput} 
                      onChange={e => setAvatarUrlInput(e.target.value)} 
                      placeholder="URL ảnh avatar"
                      style={{flex:1, minWidth:0, fontSize:12, padding:'6px 8px'}}
                    />
                    <button 
                      onClick={onAddAvatarUrl}
                      style={{padding:'6px 10px', background:'#4CAF50', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}
                    >
                      Thêm URL
                    </button>
                  </div>

                  <div style={{marginTop:12}}>
                    <label style={{display:'block',marginBottom:6}}>Hình ảnh</label>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
                      {(editing.images || []).map(u => (
                        <div key={u} style={{position:'relative'}}>
                          <img src={u} alt="" style={{width:84,height:64,objectFit:'cover',borderRadius:6,border:'1px solid #eef8ee'}} />
                          <button onClick={() => onRemoveImage(u)} style={{position:'absolute', right:4, top:4, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', borderRadius:4, padding:'2px 6px', cursor:'pointer'}}>x</button>
                        </div>
                      ))}
                      <label style={{display:'inline-block', width:84, height:64, border:'1px dashed #e6efe6', borderRadius:6, textAlign:'center', paddingTop:18, cursor:'pointer', background: addingImages ? '#f0f0f0' : '#fff'}}>
                        <input 
                          ref={imagesInputRef}
                          type="file" 
                          accept="image/*" 
                          multiple 
                          style={{display:'none'}} 
                          onChange={e => e.target.files && onAddImagesFiles(Array.from(e.target.files))}
                          disabled={addingImages}
                        />
                        {addingImages ? 'Uploading...' : 'Add'}
                      </label>
                    </div>
                    <div style={{display:'flex', gap:6}}>
                      <input 
                        className="search-input"
                        value={imageUrlInput} 
                        onChange={e => setImageUrlInput(e.target.value)} 
                        placeholder="URL ảnh sản phẩm"
                        style={{flex:1, minWidth:0, fontSize:12, padding:'6px 8px'}}
                      />
                      <button 
                        onClick={onAddImageUrl}
                        style={{padding:'6px 10px', background:'#4CAF50', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, whiteSpace:'nowrap'}}
                      >
                        Thêm URL
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                    <div>
                      <label style={{display:'block',marginBottom:6}}>Tên sản phẩm *</label>
                      <input className="search-input" style={{minWidth:0}} value={editing.name} onChange={e => onFieldChange('name', e.target.value)} placeholder="Tên sản phẩm" />
                    </div>
                    <div>
                      <label style={{display:'block',marginBottom:6}}>Xuất xứ</label>
                      <input className="search-input" style={{minWidth:0}} value={editing.origin} onChange={e => onFieldChange('origin', e.target.value)} placeholder="Xuất xứ" />
                    </div>
                  </div>

                  <div style={{height:12}} />

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                    <div>
                      <label style={{display:'block',marginBottom:6}}>Loại sản phẩm *</label>
                      <select className="search-input" style={{minWidth:0}} value={editing.category_id || ''} onChange={e => onFieldChange('category_id', e.target.value ? Number(e.target.value) : null)}>
                        <option value="">-- Chọn loại --</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',marginBottom:6}}>Nhà cung cấp *</label>
                      <select className="search-input" style={{minWidth:0}} value={editing.supplier_id || ''} onChange={e => onFieldChange('supplier_id', e.target.value ? Number(e.target.value) : null)}>
                        <option value="">-- Chọn nhà cung cấp --</option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{height:12}} />

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                    <div style={{gridColumn: '1 / -1'}}>
                      <label style={{display:'block',marginBottom:6}}>Mô tả</label>
                      <div style={{height: '300px', border: '1px solid #ddd', borderRadius: '4px'}}>
                        <MarkdownEditor
                          value={editing.description || ''}
                          onChange={(desc) => onFieldChange('description', desc)}
                          placeholder="Mô tả sản phẩm (Hỗ trợ Markdown)..."
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{height:12}} />

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                    <div>
                      <label style={{display:'block',marginBottom:6}}>Trạng thái</label>
                      <select className="search-input" style={{minWidth:0}} value={editing.status} onChange={e => onFieldChange('status', e.target.value)}>
                        <option value="active">Còn hàng</option>
                        <option value="inactive">Tạm ngừng kinh doanh</option>
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',marginBottom:6}}>Hạn sử dụng</label>
                      <input type="date" className="search-input" style={{minWidth:0}} value={editing.expiry_date || ''} onChange={e => onFieldChange('expiry_date', e.target.value)} />
                    </div>
                  </div>

                  <div style={{height:16}} />

                  <label style={{display:'block',marginBottom:8}}>Các loại sản phẩm (Variants)</label>
                  <div style={{border:'1px solid #eef8ee', padding:8, borderRadius:8, maxHeight:300, overflow:'auto'}}>
                    {/* Header Row */}
                    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr auto', gap:8, alignItems:'center', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #e6efe6'}}>
                      <div style={{fontWeight:600, fontSize:'13px', color:'#666'}}>Tên Variant</div>
                      <div style={{fontWeight:600, fontSize:'13px', color:'#666'}}>Đơn Vị</div>
                      <div style={{fontWeight:600, fontSize:'13px', color:'#666'}}>Giá Gốc</div>
                      <div style={{fontWeight:600, fontSize:'13px', color:'#666'}}>Giá Bán</div>
                      <div style={{fontWeight:600, fontSize:'13px', color:'#666'}}>Tồn Kho</div>
                      <div style={{fontWeight:600, fontSize:'13px', color:'#666', textAlign:'center'}}>Hành Động</div>
                    </div>

                    {/* Data Rows */}
                    {(editing.variants || []).map((v, idx) => (
                      <div key={v.id || idx} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr auto', gap:8, alignItems:'center', marginBottom:8}}>
                        <input value={v.name || ''} onChange={e => onVariantChange(idx, 'name', e.target.value)} placeholder="Ví dụ: Phần 0.5kg" className="search-input" style={{minWidth:0}} />
                        <input value={v.unit || ''} onChange={e => onVariantChange(idx, 'unit', e.target.value)} placeholder="Ví dụ: kg" className="search-input" style={{minWidth:0}} />
                        <input type="number" value={v.price_list != null ? v.price_list : 0} onChange={e => onVariantChange(idx, 'price_list', e.target.value)} placeholder="0" className="search-input" style={{minWidth:0}} />
                        <input type="number" value={v.price_sale != null ? v.price_sale : 0} onChange={e => onVariantChange(idx, 'price_sale', e.target.value)} placeholder="0" className="search-input" style={{minWidth:0}} />
                        <input type="number" value={v.stock != null ? v.stock : 0} onChange={e => onVariantChange(idx, 'stock', e.target.value)} placeholder="0" className="search-input" style={{minWidth:0}} />
                        <div>
                          <button className="btn btn-ghost" onClick={() => onRemoveVariant(idx)}>{v.id ? 'Xóa' : 'Bỏ'}</button>
                        </div>
                      </div>
                    ))}
                    <div style={{textAlign:'center'}}>
                      <button className="btn btn-primary" onClick={onAddVariant}>+ Thêm loại</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:16}}>
                <button className="btn btn-ghost" onClick={closeEdit} disabled={saving}>Huỷ</button>
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}