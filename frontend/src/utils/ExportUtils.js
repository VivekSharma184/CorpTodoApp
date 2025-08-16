import html2pdf from 'html2pdf.js';

/**
 * Utility functions for exporting content in different formats
 */

/**
 * Export content as HTML file
 * @param {Object} entry - The knowledge entry to export
 * @param {string} entry.title - The title of the entry
 * @param {string} entry.content - The HTML content of the entry
 * @param {Array} entry.tags - Array of tags associated with the entry
 */
export const exportAsHtml = (entry) => {
  // Create a complete HTML document with styling
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${entry.title}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Base styles */
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.6; 
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }
          h1 { 
            color: #2563eb; 
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          h2 { 
            color: #4b5563; 
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          h3 { 
            color: #4b5563; 
            margin-top: 1.5rem;
          }
          
          /* Code block styling */
          pre {
            background-color: #1e1e1e;
            color: #d4d4d4;
            padding: 1rem;
            border-radius: 0.375rem;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            margin: 1.5rem 0;
          }
          code {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
          }
          
          /* Table styling */
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
          }
          th {
            background-color: #f3f4f6;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            font-weight: bold;
          }
          td {
            padding: 0.5rem;
            border: 1px solid #d1d5db;
          }
          
          /* Tag styling */
          .tags {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }
          .tag {
            display: inline-block;
            background-color: #e5e7eb;
            color: #4b5563;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
          }
          
          /* Link styling */
          a {
            color: #2563eb;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          
          /* List styling */
          ul, ol {
            padding-left: 1.5rem;
            margin: 1rem 0;
          }
        </style>
      </head>
      <body>
        <h1>${entry.title}</h1>
        <div class="content">
          ${entry.content}
        </div>
        ${entry.tags && entry.tags.length > 0 ? `
        <div class="tags">
          <strong>Tags:</strong> 
          ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
        </div>
        ` : ''}
        <div class="footer">
          <p><small>Exported from MyTodoApp Knowledge Base on ${new Date().toLocaleDateString()}</small></p>
        </div>
      </body>
    </html>
  `;
  
  // Create a download link
  const blob = new Blob([htmlContent], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entry.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Export content as PDF file
 * @param {Object} entry - The knowledge entry to export
 * @param {string} entry.title - The title of the entry
 * @param {string} entry.content - The HTML content of the entry
 * @param {Array} entry.tags - Array of tags associated with the entry
 */
export const exportAsPdf = (entry) => {
  // Create a temporary container for the content
  const container = document.createElement('div');
  container.innerHTML = `
    <h1 style="color: #2563eb; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;">
      ${entry.title}
    </h1>
    <div class="content">
      ${entry.content}
    </div>
    ${entry.tags && entry.tags.length > 0 ? `
    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
      <strong>Tags:</strong> 
      ${entry.tags.map(tag => `<span style="display: inline-block; background-color: #e5e7eb; color: #4b5563; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; margin-right: 0.5rem; margin-bottom: 0.5rem;">${tag}</span>`).join(' ')}
    </div>
    ` : ''}
    <div style="margin-top: 2rem; font-size: 0.75rem; color: #6b7280;">
      <p>Exported from MyTodoApp Knowledge Base on ${new Date().toLocaleDateString()}</p>
    </div>
  `;
  
  // Style the container for PDF
  container.style.padding = '20px';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.lineHeight = '1.6';
  container.style.color = '#333';
  container.style.maxWidth = '800px';
  container.style.margin = '0 auto';
  
  // Add to document temporarily
  document.body.appendChild(container);
  
  // Configure PDF options
  const options = {
    margin: [15, 15, 15, 15],
    filename: `${entry.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Generate PDF
  html2pdf()
    .from(container)
    .set(options)
    .save()
    .then(() => {
      // Remove the temporary element after PDF generation
      document.body.removeChild(container);
    });
};
