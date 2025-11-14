import { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Color map
    const colorMap: Record<string, string> = {
      primary: "#8b5cf6",
      blue: "#3b82f6",
      purple: "#a855f7",
      pink: "#ec4899",
      red: "#ef4444",
      green: "#10b981",
      orange: "#f97316",
      yellow: "#eab308"
    };

    // Convert nodes to vis-network format
    const visNodes = new DataSet(
      nodes.map((node) => ({
        id: node.id,
        label: node.label,
        color: {
          background: colorMap[node.color || "primary"] || "#8b5cf6",
          border: colorMap[node.color || "primary"] || "#8b5cf6",
          highlight: {
            background: colorMap[node.color || "primary"] || "#8b5cf6",
            border: "#ffffff",
          },
        },
        font: {
          color: "#ffffff",
          size: node.level === 0 ? 18 : 14,
          face: "Inter, sans-serif",
        },
        shape: "box",
        borderWidth: 2,
        borderWidthSelected: 4,
        level: node.level,
      }))
    );

    // Convert edges to vis-network format
    const visEdges = new DataSet(
      edges.map((edge, index) => ({
        id: `edge-${index}`,
        from: edge.source,
        to: edge.target,
        color: {
          color: colorMap[edge.color || "primary"] || "#8b5cf6",
          highlight: colorMap[edge.color || "primary"] || "#8b5cf6",
          opacity: 0.8,
        },
        width: 2,
        smooth: {
          enabled: true,
          type: "curvedCW",
          roundness: 0.2,
        },
      }))
    );

    // Network options
    const options = {
      nodes: {
        shape: "box" as const,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        widthConstraint: {
          maximum: 200,
        },
      },
      edges: {
        smooth: {
          enabled: true,
          type: "curvedCW",
          roundness: 0.2,
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5,
          },
        },
      },
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD",
          sortMethod: "directed",
          nodeSpacing: 150,
          levelSeparation: 150,
        },
      },
      physics: {
        enabled: true,
        hierarchicalRepulsion: {
          nodeDistance: 150,
          centralGravity: 0.0,
          springLength: 150,
          springConstant: 0.01,
          damping: 0.09,
        },
        solver: "hierarchicalRepulsion",
        stabilization: {
          iterations: 100,
        },
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        navigationButtons: true,
        keyboard: {
          enabled: true,
        },
      },
    };

    // Create network
    const network = new Network(
      containerRef.current,
      { nodes: visNodes, edges: visEdges },
      options
    );

    networkRef.current = network;

    // Highlight connected nodes on selection
    let highlightActive = false;
    const allNodes = visNodes.get({ returnType: "Object" });
    const nodeColors: Record<string, any> = {};

    // Store original colors
    Object.keys(allNodes).forEach((nodeId) => {
      nodeColors[nodeId] = allNodes[nodeId].color;
    });

    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        highlightActive = true;
        const selectedNode = params.nodes[0];

        // Fade all nodes
        const updates = Object.keys(allNodes).map((nodeId) => ({
          id: nodeId,
          color: {
            background: "rgba(200,200,200,0.5)",
            border: "rgba(200,200,200,0.5)",
          },
          font: { color: "rgba(100,100,100,0.5)" },
        }));

        // Get connected nodes
        const connectedNodes = network.getConnectedNodes(selectedNode) as string[];

        // Restore color for connected nodes
        connectedNodes.forEach((nodeId) => {
          const index = updates.findIndex((u) => u.id === nodeId);
          if (index !== -1) {
            updates[index] = {
              id: nodeId,
              color: nodeColors[nodeId],
              font: { color: "#ffffff" },
            };
          }
        });

        // Restore color for selected node
        const selectedIndex = updates.findIndex((u) => u.id === selectedNode);
        if (selectedIndex !== -1) {
          updates[selectedIndex] = {
            id: selectedNode,
            color: nodeColors[selectedNode],
            font: { color: "#ffffff" },
          };
        }

        visNodes.update(updates);
      } else if (highlightActive) {
        // Reset all nodes
        highlightActive = false;
        const updates = Object.keys(allNodes).map((nodeId) => ({
          id: nodeId,
          color: nodeColors[nodeId],
          font: { color: "#ffffff" },
        }));
        visNodes.update(updates);
      }
    });

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] border border-border rounded-lg bg-background"
      style={{ backgroundColor: "hsl(var(--background))" }}
    />
  );
};

export default MindmapViewer;
