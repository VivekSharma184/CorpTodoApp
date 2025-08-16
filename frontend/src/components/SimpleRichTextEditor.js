import React, { useState, useRef } from 'react';
import './SimpleRichTextEditor.css';

/**
 * A simple rich text editor component with basic formatting options
 * @param {Object} props
 * @param {string} props.value - The HTML content of the editor
 * @param {function} props.onChange - Callback function when content changes
 * @param {boolean} props.readOnly - Whether the editor is read-only
 * @param {string} props.height - Height of the editor
 */
const SimpleRichTextEditor = ({ value, onChange, readOnly = false, height = '400px' }) => {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef(null);
  
  // Execute a document command for formatting
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    
    // Focus back on editor
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Get the updated content and call onChange
      if (onChange) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };
  
  // Handle content changes
  const handleContentChange = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Insert a code block
  const insertCodeBlock = (language = 'javascript') => {
    const selection = window.getSelection();
    let selectedText = '';
    
    if (selection.rangeCount > 0) {
      selectedText = selection.toString();
    }
    
    const preElement = document.createElement('pre');
    preElement.className = `language-${language}`;
    preElement.style.backgroundColor = '#f6f8fa';
    preElement.style.padding = '1em';
    preElement.style.borderRadius = '5px';
    preElement.style.overflow = 'auto';
    preElement.style.fontFamily = 'monospace';
    preElement.style.fontSize = '0.9em';
    preElement.style.marginBottom = '1em';
    preElement.contentEditable = 'true';
    
    const codeContent = selectedText || 'Your code here...';
    preElement.textContent = codeContent;
    
    // Insert at cursor position
    document.execCommand('insertHTML', false, preElement.outerHTML);
    
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Insert a table with specified rows and columns
  const insertTable = (rows = 2, cols = 2) => {
    let tableHtml = '<table style="width:100%; border-collapse:collapse; margin-bottom:1em;">';
    
    // Add header row
    tableHtml += '<thead><tr>';
    for (let i = 0; i < cols; i++) {
      tableHtml += '<th style="border:1px solid #ddd; padding:8px; text-align:left; background-color:#f2f2f2;">Header ' + (i + 1) + '</th>';
    }
    tableHtml += '</tr></thead><tbody>';
    
    // Add data rows
    for (let i = 0; i < rows - 1; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHtml += '<td style="border:1px solid #ddd; padding:8px;">Cell ' + (i + 1) + '-' + (j + 1) + '</td>';
      }
      tableHtml += '</tr>';
    }
    
    tableHtml += '</tbody></table>';
    
    // Insert at cursor position
    document.execCommand('insertHTML', false, tableHtml);
    
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Toolbar buttons configuration
  const toolbarButtons = [
    { name: 'Bold', icon: 'fas fa-bold', action: () => execCommand('bold') },
    { name: 'Italic', icon: 'fas fa-italic', action: () => execCommand('italic') },
    { name: 'Heading', icon: 'fas fa-heading', action: () => execCommand('formatBlock', '<h2>') },
    { name: 'Link', icon: 'fas fa-link', action: () => {
      const url = prompt('Enter URL:', 'http://');
      if (url) execCommand('createLink', url);
    }},
    { name: 'List', icon: 'fas fa-list-ul', action: () => execCommand('insertUnorderedList') },
    { name: 'Quote', icon: 'fas fa-quote-right', action: () => execCommand('formatBlock', '<blockquote>') },
    { name: 'Code', icon: 'fas fa-code', action: () => insertCodeBlock() },
    { name: 'Table', icon: 'fas fa-table', action: () => insertTable(3, 3) }
  ];

  // If in read-only mode, just render the content
  if (readOnly) {
    return (
      <div 
        className="simple-rich-text-viewer"
        style={{ height, overflow: 'auto', padding: '1rem' }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <div className="simple-rich-text-editor" style={{ height }}>
      {/* Toolbar */}
      <div className="editor-toolbar">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.name}
            type="button"
            className="toolbar-button"
            title={btn.name}
            onClick={btn.action}
          >
            <i className={btn.icon}></i>
            <span>{btn.name}</span>
          </button>
        ))}
        
        <div className="toolbar-divider"></div>
        
        <button
          type="button"
          className={`toolbar-button ${isPreview ? 'active' : ''}`}
          title="Toggle Preview"
          onClick={() => setIsPreview(!isPreview)}
        >
          <i className="fas fa-eye"></i>
          <span>Preview</span>
        </button>
      </div>
      
      {/* Editor area */}
      <div className="editor-content-area">
        {isPreview ? (
          <div 
            className="editor-preview"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            className="editor-content"
            contentEditable={true}
            onInput={handleContentChange}
            onBlur={handleContentChange}
            dangerouslySetInnerHTML={{ __html: value }}
            placeholder="Start writing here..."
          />
        )}
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;
