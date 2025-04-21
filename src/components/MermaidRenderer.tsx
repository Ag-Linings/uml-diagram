
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
  }, []);

  useEffect(() => {
    setRendering(true);
    setError(null);

    if (chart && mermaidRef.current) {
      // Clean the chart string by removing commas from entity names
      const cleanedChart = cleanMermaidSyntax(chart);
      
      const renderChart = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          
          // Generate a unique ID for this render
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          
          const { svg } = await mermaid.render(id, cleanedChart);
          
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (e) {
          console.error('Failed to render Mermaid chart:', e);
          setError(`Failed to render diagram: ${(e as Error).message || 'Unknown error'}`);
        } finally {
          setRendering(false);
        }
      };
      
      renderChart();
    } else {
      setRendering(false);
    }
  }, [chart]);

  // Helper function to clean mermaid syntax
  const cleanMermaidSyntax = (mermaidCode: string): string => {
    // Remove commas from class names and relationship definitions
    let cleanedCode = mermaidCode.replace(/class\s+([^{]+),\s*{/g, 'class $1 {');
    
    // Also fix relationship sources and targets with commas
    const relationRegex = /(\w+),\s+(-+[^>]*>|-+\|>|<\|?-+|o-+|<o-+|-+o|--o)\s+(\w+),/g;
    cleanedCode = cleanedCode.replace(relationRegex, '$1 $2 $3');
    
    // Fix any remaining commas in relationships
    cleanedCode = cleanedCode.replace(/(\w+),\s+(-+[^>]*>|-+\|>|<\|?-+|o-+|<o-+|-+o|--o)\s+(\w+)/g, '$1 $2 $3');
    cleanedCode = cleanedCode.replace(/(\w+)\s+(-+[^>]*>|-+\|>|<\|?-+|o-+|<o-+|-+o|--o)\s+(\w+),/g, '$1 $2 $3');
    
    return cleanedCode;
  };

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded bg-red-50 text-red-700">
        <p className="font-semibold mb-2">Error in diagram syntax:</p>
        <pre className="whitespace-pre-wrap overflow-x-auto text-sm">{error}</pre>
        <div className="mt-3 p-2 bg-white rounded border border-red-200">
          <p className="text-sm">Diagram source (for debugging):</p>
          <pre className="whitespace-pre-wrap overflow-x-auto text-xs mt-2 p-2 bg-gray-100">{chart}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto bg-white rounded-md shadow-sm">
      {rendering && (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse text-gray-500">Rendering diagram...</div>
        </div>
      )}
      <div ref={mermaidRef} className="mermaid-diagram" />
    </div>
  );
};

export default MermaidRenderer;
