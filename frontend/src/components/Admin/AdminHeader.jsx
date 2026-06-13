import React, { useState } from 'react';

export default function AdminHeader({ title, children, onSearch, onCreate }) {
  const [q, setQ] = useState('');

  function doSearch() {
    if (typeof onSearch === 'function') onSearch(q && q.trim() ? q.trim() : '');
  }

  return (
    <header className="admin-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:16}}>
      <div style={{display:'flex', flexDirection:'column'}}>
        <h2 style={{margin:0, color:'#145214'}}>{title}</h2>
        <small style={{color:'#6b8f6b'}}>Trang quản lý cửa hàng</small>
      </div>

      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <div style={{display:'flex', alignItems:'center', border:'1px solid #e6efe6', borderRadius:6, overflow:'hidden'}}>
          <input
            className="search-input"
            placeholder="Tìm kiếm..."
            aria-label="admin-search"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
            style={{border:'none', padding:'8px 12px', outline:'none', minWidth:240}}
          />
          <button className="search-btn" aria-label="search-button" onClick={doSearch} style={{background:'#fff', border:'none', padding:8, cursor:'pointer'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35" stroke="#145214" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10.5" cy="10.5" r="5.5" stroke="#145214" strokeWidth="1.6" /></svg>
          </button>
        </div>

        <div style={{display:'flex', gap:8}}>
          {typeof onCreate === 'function' && (
            <button className="btn btn-primary" onClick={() => onCreate()}>
              + Tạo mới
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>
            Tải lại
          </button>
        </div>
      </div>

      {children}
    </header>
  );
}