import React, { useState, useRef } from 'react';
import './BasicEditor.css';

/**
 * A simple minimal editor with basic formatting
 */
const BasicEditor = ({ value, onChange, readOnly = false, height = '400px' }) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);
  
  // Insert text at cursor position
  const insertAtCursor = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = textarea.value.substring(0, start) + 
                  before + selectedText + after + 
                  textarea.value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };
  
  // Format code block
  const formatCodeBlock = () => {
    const prefix = '```\n';
    const suffix = '\n```';
    insertAtCursor(prefix, suffix);
  };
  
  // Format headings
  const formatHeading = (level) => {
    const prefix = '#'.repeat(level) + ' ';
    insertAtCursor(prefix);
  };
  
  // Format the content for display
  const formatContent = (content) => {
    if (!content) return '';
    
    // Replace code blocks with styled pre elements
    let formatted = content.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="code-block">${code}</pre>`;
    });
    
    // Format headings (up to h3)
    formatted = formatted.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    formatted = formatted.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    
    return formatted;
  };
  
  // If in read-only mode, just render the formatted content
  if (readOnly) {
    return (
      <div 
        className="basic-editor-viewer"
        style={{ height, overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: formatContent(value) }}
      />
    );
  }

  return (
    <div className="basic-editor" style={{ height }}>
      {/* Simple toolbar */}
      <div className="basic-editor-toolbar">
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={() => formatHeading(1)}
          title="Heading 1"
        >
          H1
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={() => formatHeading(2)}
          title="Heading 2"
        >
          H2
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={() => formatHeading(3)}
          title="Heading 3"
        >
          H3
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatCodeBlock}
          title="Code Block"
        >
          Code
        </button>
        <button 
          type="button" 
          className={`toolbar-button ${showPreview ? 'active' : ''}`} 
          onClick={() => setShowPreview(!showPreview)}
          title="Toggle Preview"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      
      {/* Content area */}
      {showPreview ? (
        <div 
          className="basic-editor-preview"
          dangerouslySetInnerHTML={{ __html: formatContent(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="basic-editor-textarea"
          placeholder="Enter your content here...\n\nUse H1/H2/H3 buttons for headings\nUse Code button for code blocks"
        />
      )}
    </div>
  );
};

export default BasicEditor;
