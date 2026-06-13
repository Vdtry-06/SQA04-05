import React, { useState } from 'react';
import { marked } from 'marked';
import '../styles/markdownEditor.css';

export default function MarkdownEditor({ value, onChange, placeholder = 'Nhập nội dung (Markdown)...' }) {
  const [showPreview, setShowPreview] = useState(true);

  // Configure marked
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const htmlPreview = marked(value || '');

  const insertMarkdown = (before, after = '') => {
    const textarea = document.getElementById('markdown-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'text';
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  return (
    <div className="markdown-editor">
      {/* Toolbar */}
      <div className="markdown-toolbar">
        <div className="toolbar-buttons">
          <button title="Đậm" onClick={() => insertMarkdown('**', '**')} className="btn-tool">Bold</button>
          <button title="Nghiêng" onClick={() => insertMarkdown('_', '_')} className="btn-tool">Italic</button>
          <span className="separator">|</span>
          <button title="Tiêu đề 1" onClick={() => insertMarkdown('# ', '')} className="btn-tool">H1</button>
          <button title="Tiêu đề 2" onClick={() => insertMarkdown('## ', '')} className="btn-tool">H2</button>
          <button title="Tiêu đề 3" onClick={() => insertMarkdown('### ', '')} className="btn-tool">H3</button>
          <span className="separator">|</span>
          <button title="Danh sách" onClick={() => insertMarkdown('- ', '')} className="btn-tool">List</button>
          <button title="Preview" onClick={() => setShowPreview(!showPreview)} className={`btn-tool ${showPreview ? 'active' : ''}`}>
            {showPreview ? '✓ Preview' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="markdown-main">
        {/* Editor */}
        <div className={`markdown-editor-panel ${showPreview ? 'half-width' : 'full-width'}`}>
          <textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="markdown-input"
            spellCheck="true"
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="markdown-preview-panel">
            <div className="markdown-preview-header">Preview</div>
            <div 
              className="markdown-preview"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
