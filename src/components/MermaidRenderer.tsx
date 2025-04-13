
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
      const renderChart = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          
          // Generate a unique ID for this render
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          
          const { svg } = await mermaid.render(id, chart);
          
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

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded bg-red-50 text-red-700">
        {error}
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
