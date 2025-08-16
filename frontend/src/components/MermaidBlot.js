import Quill from 'quill';
import mermaid from 'mermaid';

// We'll initialize mermaid only when needed and in browser environment
let mermaidInitialized = false;

const initMermaid = () => {
  if (!mermaidInitialized && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      mermaid.initialize({
        startOnLoad: false, // Important: we'll handle rendering manually
        theme: 'neutral',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: false }
      });
      mermaidInitialized = true;
    } catch (error) {
      console.error('Failed to initialize mermaid:', error);
    }
  }
};

const BlockEmbed = Quill.import('blots/block/embed');

class MermaidBlot extends BlockEmbed {
  static create(value) {
    // Ensure mermaid is initialized
    initMermaid();
    
    const node = super.create();
    node.setAttribute('class', 'mermaid-diagram');
    node.setAttribute('data-diagram', value);
    
    // Create a unique ID for this diagram
    const diagramId = `mermaid-diagram-${Date.now()}`;
    node.setAttribute('id', diagramId);
    
    // First, just store the text content - don't render immediately
    const preElement = document.createElement('pre');
    preElement.textContent = value;
    node.appendChild(preElement);
    
    // We'll render the diagrams later through a separate render call
    // This avoids DOM creation issues during Quill operations
    
    return node;
  }
  
  static value(node) {
    return node.getAttribute('data-diagram');
  }
}

MermaidBlot.blotName = 'mermaid';
MermaidBlot.tagName = 'div';

// Safe method to render all mermaid diagrams in the document
const renderAllMermaidDiagrams = () => {
  if (typeof document === 'undefined') return;
  
  // Ensure mermaid is initialized
  initMermaid();
  
  // Find all mermaid diagrams that need rendering (those with pre elements)
  const diagrams = document.querySelectorAll('.mermaid-diagram pre');
  if (!diagrams.length) return;
  
  // Process each diagram
  diagrams.forEach(preElement => {
    const diagramNode = preElement.parentNode;
    const diagramId = diagramNode.getAttribute('id');
    const diagramValue = diagramNode.getAttribute('data-diagram');
    
    if (!diagramId || !diagramValue) return;
    
    try {
      // Clear the inner content first
      while (diagramNode.firstChild) {
        diagramNode.removeChild(diagramNode.firstChild);
      }
      
      // Use mermaid's async render to avoid DOM issues
      mermaid.render(diagramId, diagramValue)
        .then(({ svg }) => {
          // Insert the rendered SVG
          diagramNode.innerHTML = svg;
        })
        .catch(error => {
          console.error('Failed to render mermaid diagram:', error);
          const preElement = document.createElement('pre');
          preElement.textContent = diagramValue;
          diagramNode.appendChild(preElement);
        });
    } catch (error) {
      console.error('Error during mermaid diagram rendering:', error);
      // If error, restore the text content
      const preElement = document.createElement('pre');
      preElement.textContent = diagramValue;
      diagramNode.innerHTML = '';
      diagramNode.appendChild(preElement);
    }
  });
};

export { MermaidBlot as default, renderAllMermaidDiagrams, initMermaid };
