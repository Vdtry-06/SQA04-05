import React, { useState, useRef, useEffect } from 'react';

export default function ChatFloating() {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Track expanded state
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef();

  useEffect(() => {
    function onOutside(e) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs })
      });
      const j = await res.json();
      if (!res.ok || !j.success) {
        throw new Error(j?.message || 'Chat request failed');
      }
      const assistant = j.data?.assistant;
      const content = assistant?.content || assistant?.message?.content || j.data?.raw?.choices?.[0]?.message?.content || 'No response';
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi: ' + (err.message || '') }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 150, zIndex: 9999 }}>
      <div 
        ref={panelRef} 
        style={{ 
          display: open ? 'block' : 'none', 
          width: isExpanded ? '90vw' : 360,
          height: isExpanded ? '90vh' : 480,
          maxWidth: isExpanded ? 'none' : 360,
          maxHeight: isExpanded ? 'none' : 480,
          boxShadow: '0 6px 24px rgba(0,0,0,0.2)', 
          borderRadius: 12, 
          overflow: 'hidden', 
          background:'#fff', 
          marginBottom: 12,
          position: isExpanded ? 'fixed' : 'relative',
          top: isExpanded ? '5vh' : 'auto',
          left: isExpanded ? '5vw' : 'auto',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between', background: '#f8f9fa' }}>
          <strong>Chatbot Hỗ Trợ</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
              style={{ border: 'none', background:'transparent', cursor:'pointer', fontSize: 12, padding: '4px 8px', color: '#666', fontWeight: 500 }}>
              {isExpanded ? 'Thu nhỏ' : '⛶ Phóng to'}
            </button>
            <button 
              onClick={() => setOpen(false)} 
              style={{ border: 'none', background:'transparent', cursor:'pointer' }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ 
          padding: 12, 
          height: isExpanded ? 'calc(90vh - 100px)' : 360, 
          overflowY: 'auto', 
          background:'#fafafa' 
        }}>
          {messages.length === 0 && <div style={{ color:'#666' }}>Xin chào! Gõ câu hỏi và nhấn Enter hoặc Send.</div>}
          {messages.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ maxWidth: isExpanded ? '70%' : '78%', padding: 8, borderRadius: 8, background: m.role === 'user' ? '#e6ffe6' : '#fff', border: m.role === 'assistant' ? '1px solid #eee' : 'none' }}>
                <div style={{ whiteSpace:'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid #eee', display:'flex', gap:8 }}>
          <input
            aria-label="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            style={{ flex:1, padding:8, borderRadius:6, border:'1px solid #ddd' }}
            placeholder="Gõ tin nhắn..."
          />
          <button onClick={send} disabled={loading} style={{ padding: '8px 12px', borderRadius:6, background:'#10b981', color:'#fff', border:'none', cursor:'pointer' }}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      <button
        onClick={() => setOpen(v => !v)}
        title="Chatbot Hỗ Trợ"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
      >
        🤖
      </button>
    </div>
  );
}