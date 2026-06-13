import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/users/getAllUsers');
      const j = await res.json();
      setUsers(j.data || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Tìm kiếm người dùng
  async function handleSearch(query) {
    if (!query) { load(); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j && j.success) {
        setUsers(j.data || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Search error', err);
      alert('Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing({
      id: null,
      name: '',
      email: '',
      password: '',
      phone: ''
    });
  }

  function closeEdit() {
    setEditing(null);
    setSaving(false);
  }

  function onFieldChange(field, value) {
    setEditing(prev => ({ ...prev, [field]: value }));
  }

  async function onSave() {
    if (!editing) return;
    if (!editing.name || !editing.email || !editing.password) {
      alert('Vui lòng điền đầy đủ: Tên, Email, Mật khẩu');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: editing.name,
          email: editing.email,
          password: editing.password,
          phone: editing.phone || null
        })
      });
      const j = await res.json();
      if (!res.ok || !j.success) {
        console.error('Create failed', j);
        alert(j?.message || 'Tạo người dùng thất bại');
        setSaving(false);
        return;
      }
      await load();
      closeEdit();
    } catch (err) {
      console.error(err);
      alert('Lưu thất bại: ' + err.message);
      setSaving(false);
    }
  }

  return (
    <div className="admin-root">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader title="Quản lý người dùng" onSearch={handleSearch} onCreate={openCreate} />
        {loading ? <div>Loading...</div> :
          <table className="admin-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id}>
                  <td>{idx + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }

        {/* Create User Modal */}
        {editing && editing.id === null && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
          }}>
            <div style={{ width: 500, maxWidth: '98%', background: '#fff', borderRadius: 12, padding: 20 }}>
              <h3 style={{marginTop:0}}>Tạo người dùng mới</h3>

              <div style={{display:'grid', gap:12}}>
                <div>
                  <label style={{display:'block',marginBottom:6}}>Tên *</label>
                  <input className="search-input" style={{minWidth:0, width:'100%'}} value={editing.name} onChange={e => onFieldChange('name', e.target.value)} placeholder="Tên đầy đủ" />
                </div>
                <div>
                  <label style={{display:'block',marginBottom:6}}>Email *</label>
                  <input className="search-input" type="email" style={{minWidth:0, width:'100%'}} value={editing.email} onChange={e => onFieldChange('email', e.target.value)} placeholder="Email" />
                </div>
                <div>
                  <label style={{display:'block',marginBottom:6}}>Mật khẩu *</label>
                  <input className="search-input" type="password" style={{minWidth:0, width:'100%'}} value={editing.password} onChange={e => onFieldChange('password', e.target.value)} placeholder="Mật khẩu" />
                </div>
                <div>
                  <label style={{display:'block',marginBottom:6}}>Điện thoại</label>
                  <input className="search-input" style={{minWidth:0, width:'100%'}} value={editing.phone} onChange={e => onFieldChange('phone', e.target.value)} placeholder="Số điện thoại" />
                </div>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:16}}>
                <button className="btn btn-ghost" onClick={closeEdit} disabled={saving}>Huỷ</button>
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Tạo mới'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}