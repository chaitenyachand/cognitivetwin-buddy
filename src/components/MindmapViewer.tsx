import { useEffect, useRef } from "react";

interface Node {
  id: string;
  label: string;
  level: number;
  color?: string;
}

interface Edge {
  source: string;
  target: string;
  color?: string;
}

interface MindmapViewerProps {
  nodes: Node[];
  edges: Edge[];
}

const MindmapViewer = ({ nodes, edges }: MindmapViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate positions for nodes
    const centerX = width / 2;
    const centerY = height / 2;
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Position central node
    const centralNode = nodes.find(n => n.level === 0);
    if (centralNode) {
      nodePositions.set(centralNode.id, { x: centerX, y: centerY });
    }

    // Position level 1 nodes in a circle
    const level1Nodes = nodes.filter(n => n.level === 1);
    const angleStep = (2 * Math.PI) / level1Nodes.length;
    level1Nodes.forEach((node, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const radius = 200;
      nodePositions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });

    // Position level 2+ nodes around their parents
    const level2PlusNodes = nodes.filter(n => n.level >= 2);
    level2PlusNodes.forEach(node => {
      const parentEdge = edges.find(e => e.target === node.id);
      if (parentEdge) {
        const parentPos = nodePositions.get(parentEdge.source);
        if (parentPos) {
          const childrenOfParent = edges.filter(e => e.source === parentEdge.source);
          const childIndex = childrenOfParent.findIndex(e => e.target === node.id);
          const totalChildren = childrenOfParent.length;
          
          const angle = (Math.atan2(parentPos.y - centerY, parentPos.x - centerX) + 
                        (childIndex - totalChildren / 2) * 0.5);
          const radius = 100;
          
          nodePositions.set(node.id, {
            x: parentPos.x + radius * Math.cos(angle),
            y: parentPos.y + radius * Math.sin(angle)
          });
        }
      }
    });

    // Color map
    const colorMap: Record<string, string> = {
      primary: "hsl(var(--primary))",
      blue: "#3b82f6",
      purple: "#a855f7",
      pink: "#ec4899",
      red: "#ef4444",
      green: "#10b981"
    };

    // Draw edges with curves
    edges.forEach(edge => {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);
      
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.strokeStyle = colorMap[edge.color || "primary"] || "#94a3b8";
        ctx.lineWidth = 2;
        
        // Calculate control point for curve
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const controlX = midX - dy * 0.2;
        const controlY = midY + dx * 0.2;
        
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.quadraticCurveTo(controlX, controlY, targetPos.x, targetPos.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const text = node.label;
      ctx.font = node.level === 0 ? "bold 16px sans-serif" : "14px sans-serif";
      const metrics = ctx.measureText(text);
      const padding = 16;
      const boxWidth = metrics.width + padding * 2;
      const boxHeight = 40;

      // Draw rounded rectangle
      const radius = 8;
      const x = pos.x - boxWidth / 2;
      const y = pos.y - boxHeight / 2;

      ctx.fillStyle = colorMap[node.color || "primary"] || "#6366f1";
      if (node.level === 0) {
        ctx.fillStyle = "#334155";
      }
      
      ctx.beginPath();
      ctx.roundRect(x, y, boxWidth, boxHeight, radius);
      ctx.fill();

      // Draw text
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, pos.x, pos.y);
    });
  }, [nodes, edges]);

  return (
    <div className="w-full overflow-auto bg-muted/20 rounded-lg p-4">
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={700}
        className="mx-auto"
      />
    </div>
  );
};

export default MindmapViewer;
