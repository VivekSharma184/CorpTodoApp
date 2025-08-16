import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Import specific languages for syntax highlighting
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'; // for HTML

// Register the languages you want to use
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('xml', markup);
SyntaxHighlighter.registerLanguage('csharp', javascript); // Using JS for C# for now
SyntaxHighlighter.registerLanguage('java', javascript); // Using JS for Java for now

// Add these styles to ensure proper code block rendering
import './markdown-styles.css';

const MarkdownEditor = ({ value, onChange, readOnly = false, height = '400px' }) => {
  // Local state for preview mode and code dropdown
  const [previewMode, setPreviewMode] = useState(false);
  const [codeDropdownOpen, setCodeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Code languages available in the dropdown
  const codeLanguages = [
    { name: 'JavaScript', value: 'javascript', icon: 'fab fa-js' },
    { name: 'HTML', value: 'html', icon: 'fab fa-html5' },
    { name: 'CSS', value: 'css', icon: 'fab fa-css3' },
    { name: 'C#', value: 'csharp', icon: 'fas fa-code' },
    { name: 'SQL', value: 'sql', icon: 'fas fa-database' },
    { name: 'Java', value: 'java', icon: 'fab fa-java' },
    { name: 'Python', value: 'python', icon: 'fab fa-python' },
    { name: 'JSON', value: 'json', icon: 'fas fa-brackets-curly' },
    { name: 'Bash', value: 'bash', icon: 'fas fa-terminal' }
  ];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCodeDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Simplified toolbar buttons
  const insertText = (before, after, defaultText = '') => {
    const textArea = document.getElementById('markdown-textarea');
    if (!textArea) return;
    
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const selectedText = textArea.value.substring(start, end) || defaultText;
    
    const newText = 
      textArea.value.substring(0, start) + 
      before + selectedText + after + 
      textArea.value.substring(end);
    
    // Update the value
    onChange(newText);
    
    // Set focus back after state update
    setTimeout(() => {
      textArea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Process content to properly handle line breaks
  const processContent = (text) => {
    if (!text) return '';
    
    // For tables, we need to ensure they have proper markdown formatting
    let processed = text;
    
    // Check if there might be a table (has | character)
    if (processed.includes('|')) {
      // Split into lines
      const lines = processed.split('\n');
      const processedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        processedLines.push(line);
        
        // If this line looks like a table header (has | characters)
        // and the next line doesn't look like a table separator
        if (line.includes('|') && 
            i < lines.length - 1 && 
            !lines[i+1].includes('---') && 
            !lines[i+1].includes('|---')) {
          // Add a separator line after header if missing
          const columnCount = (line.match(/\|/g) || []).length - 1;
          if (columnCount > 0) {
            processedLines.push('| ' + '--- | '.repeat(columnCount) + ' |');
          }
        }
      }
      
      processed = processedLines.join('\n');
    }
    
    // Add two spaces to the end of each line to create Markdown line breaks
    // This makes normal Enter key presses create line breaks in the output
    return processed.replace(/([^\n])\n(?!\n)/g, '$1  \n');
  };
  
  // Component for rendering markdown with syntax highlighting
  const MarkdownRenderer = ({ content }) => (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        code({node, inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              className="code-block"
              showLineNumbers={true}
              wrapLines={true}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        },
        // Handle paragraphs and line breaks
        p: ({node, children, ...props}) => {
          return <p style={{marginTop: '0.5em', marginBottom: '0.5em', lineHeight: '1.5'}} {...props}>{children}</p>;
        },
        // Force line breaks to render properly
        br: ({...props}) => <br style={{display: 'block', margin: '0.2em 0'}} {...props} />,
        // Make tables look better
        table: ({node, ...props}) => <table style={{borderCollapse: 'collapse', width: '100%', marginBottom: '1em'}} {...props} />,
        th: ({node, ...props}) => <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left', background: '#f2f2f2'}} {...props} />,
        td: ({node, ...props}) => <td style={{border: '1px solid #ddd', padding: '8px'}} {...props} />
      }}
      >
        {processContent(content)}
      </ReactMarkdown>
    </div>
  );

  // If in read-only mode, just render the markdown
  if (readOnly) {
    return (
      <div className="markdown-preview p-4 prose prose-slate max-w-none" style={{ height, overflow: 'auto' }}>
        <MarkdownRenderer content={value} />
      </div>
    );
  }

  // Format toolbar buttons with Font Awesome icons and clear labels
  const toolbarButtons = [
    { name: 'Bold', icon: 'fas fa-bold', before: '**', after: '**', defaultText: 'bold text' },
    { name: 'Italic', icon: 'fas fa-italic', before: '*', after: '*', defaultText: 'italic text' },
    { name: 'Heading', icon: 'fas fa-heading', before: '## ', after: '', defaultText: 'Heading' },
    { name: 'Link', icon: 'fas fa-link', before: '[', after: '](url)', defaultText: 'link text' },
    { name: 'List', icon: 'fas fa-list-ul', before: '- ', after: '', defaultText: 'list item' },
    { name: 'Quote', icon: 'fas fa-quote-right', before: '> ', after: '', defaultText: 'quote' },
    { name: 'Table', icon: 'fas fa-table', before: '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n', after: '', defaultText: '' }
  ];

  // Editor mode with a simple toolbar and textarea
  return (
    <div className="markdown-editor border rounded" style={{ height }}>
      {/* Enhanced toolbar */}
      <div className="p-2 border-b flex flex-wrap gap-2 bg-gray-50">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.name}
            type="button"
            className="p-1.5 px-2 rounded hover:bg-gray-200 flex items-center min-w-[70px]"
            title={`Insert ${btn.name}`}
            onClick={() => insertText(btn.before, btn.after, btn.defaultText)}
          >
            <i className={`${btn.icon} mr-1`}></i>
            <span className="text-xs">{btn.name}</span>
          </button>
        ))}
        
        {/* Code Language Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="p-1.5 px-2 rounded hover:bg-gray-200 flex items-center min-w-[70px]"
            title="Insert Code Block"
            onClick={() => setCodeDropdownOpen(!codeDropdownOpen)}
          >
            <i className="fas fa-code mr-1"></i>
            <span className="text-xs">Code</span>
            <i className="fas fa-caret-down ml-1 text-xs"></i>
          </button>
          
          {codeDropdownOpen && (
            <div className="absolute z-10 mt-1 bg-white rounded shadow-lg border border-gray-200 py-1 w-40">
              {codeLanguages.map((lang) => (
                <button
                  key={lang.value}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    insertText(
                      `\`\`\`${lang.value}\n`, 
                      '\n```', 
                      `// ${lang.name} code here`
                    );
                    setCodeDropdownOpen(false);
                  }}
                >
                  <i className={`${lang.icon} mr-2 w-4 text-center`}></i>
                  <span className="text-sm">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="mx-2 border-r"></div>
        <button
          type="button"
          className={`p-1.5 rounded hover:bg-gray-200 ${previewMode ? 'bg-gray-200' : ''} flex items-center`}
          title="Toggle Preview"
          onClick={() => setPreviewMode(!previewMode)}
        >
          <i className="fas fa-eye mr-1"></i>
          <span className="text-xs">Preview</span>
        </button>
      </div>
      
      {/* Editor area */}
      <div style={{ height: 'calc(100% - 54px)', overflow: 'hidden' }}>
        {previewMode ? (
          <div className="p-4 overflow-auto" style={{ height: '100%' }}>
            <MarkdownRenderer content={value} />
          </div>
        ) : (
          <textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full p-3 focus:outline-none font-mono text-sm"
            style={{ resize: 'none', height: '100%' }}
            placeholder="Write your content here... Each line break will show in the preview."
          />
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
