import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import 'react-quill/dist/quill.bubble.css'; // Import bubble theme for reading
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css'; // Modern dark theme for code
import './QuillEditor.css'; // Custom styles

// Configure highlight.js for Quill
// This must be done before any Quill instance is created
if (window.hljs === undefined) {
  window.hljs = hljs;
}

/**
 * A rich text editor component using React-Quill with syntax highlighting and custom styling
 */
const QuillEditor = ({ value, onChange, readOnly = false, height = '400px' }) => {
  const quillRef = useRef(null);
  
  // To prevent editor disappearing, we track the content internally
  const [internalValue, setInternalValue] = useState(value || '');
  
  // Update internal value when prop changes (but not during typing)
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || '');
    }
  }, [value]);
  
  
  // Function to handle image insertion
  const insertImage = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      if (!quillRef.current || !input.files?.length) return;
      
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        
        // Insert the image at cursor position
        quill.insertEmbed(range.index, 'image', reader.result);
        
        // Move cursor after the inserted image
        quill.setSelection(range.index + 1);
      };
      
      reader.readAsDataURL(file);
    };
  };
  
  // Initialize highlight.js
  useEffect(() => {
    hljs.configure({
      languages: ['javascript', 'typescript', 'python', 'java', 'csharp', 'html', 'css', 'sql', 'bash']
    });
  }, []);
  

  
  // Apply syntax highlighting after content updates
  useEffect(() => {
    if (document) {
      setTimeout(() => {
        // Apply syntax highlighting
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }, 200);
    }
  }, [internalValue, readOnly]);
  
  // Handle clipboard pasting events for images
  useEffect(() => {
    if (!quillRef.current || readOnly) return;
    
    const handlePaste = (e) => {
      const clipboardData = e.clipboardData;
      if (clipboardData && clipboardData.items) {
        const items = clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            
            const file = items[i].getAsFile();
            const reader = new FileReader();
            
            reader.onload = function(event) {
              const imageData = event.target.result;
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection(true);
              
              // Insert the image at cursor position
              quill.insertEmbed(range.index, 'image', imageData);
              
              // Move cursor after the inserted image
              quill.setSelection(range.index + 1);
            };
            
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    };
    
    const quillEditor = quillRef.current.getEditor();
    quillEditor.root.addEventListener('paste', handlePaste);
    
    return () => {
      quillEditor.root.removeEventListener('paste', handlePaste);
    };
  }, [readOnly]);
  
  // Handle content change without losing focus
  const handleChange = (content) => {
    setInternalValue(content);
    if (onChange) {
      onChange(content);
    }
  };
  
  // Enhanced modules and formats configuration for the editor
  // Use useMemo to prevent recreation on each render
  const modules = useMemo(() => ({
    syntax: {
      highlight: (text) => hljs.highlightAuto(text).value
    },
    toolbar: {
      container: [
        // Headers
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        
        // Text formatting
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        
        // Text alignment
        [{ 'align': [] }],
        
        // Lists and indentation
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        
        // Special blocks
        ['blockquote', 'code-block'],
        
        // Links and media
        ['link', 'image'],
        
        // Clean formatting
        ['clean'],
        
        // Custom dropdown for code languages
        [{ 'codeLanguage': [
          'javascript', 'python', 'java', 'csharp', 
          'html', 'css', 'sql', 'bash'
        ] }]
      ],
      handlers: {
        'image': insertImage
      }
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link',
    'image'
  ];

  // For both editor types, we need consistent syntax highlighting
  const commonModules = useMemo(() => ({
    syntax: {
      highlight: (text) => hljs.highlightAuto(text).value
    }
  }), []);
  
  // If readOnly, use a different theme or configuration
  if (readOnly) {
    return (
      <div className="quill-reader" style={{ height }}>
        <ReactQuill 
          value={internalValue || ''} 
          readOnly={true} 
          theme="bubble" 
          modules={{
            ...commonModules,
            toolbar: false 
          }}
        />
      </div>
    );
  }

  return (
    <div className="quill-editor-container" style={{ height }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={internalValue || ''}
        onChange={handleChange}
        modules={{
          ...commonModules,
          ...modules
        }}
        formats={formats}
        className="custom-quill-editor"
        style={{ height: 'calc(100% - 42px)' }} // Adjust for toolbar height
      />
    </div>
  );
};

export default QuillEditor;
