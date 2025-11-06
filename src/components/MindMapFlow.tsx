import React, { useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

interface MindMapFlowProps {
  data: MindMapNode;
}

type RFNode = Node<{ label: string; parentId?: string; childrenIds?: string[]; }>;
type RFEdge = Edge;

const estimateWidth = (label?: string, fontSize = 14) => {
  const text = (label ?? "").toString();
  const avg = fontSize * 0.6;
  return Math.max(110, Math.min(340, text.length * avg + 32));
};

function buildFlow(data: MindMapNode) {
  const nodes: RFNode[] = [];
  const edges: RFEdge[] = [];

  // layout parameters
  const levelGapX = [0, 300, 240, 200, 170];
  const nodeHeights = [36, 34, 30, 28, 26];
  const minGaps = [18, 20, 18, 16, 14];

  const children = Array.isArray(data.children) ? data.children : [];
  const mid = Math.ceil(children.length / 2);
  const right = children.slice(0, mid);
  const left = children.slice(mid);

  const rootId = "n-0";
  const rootWidth = estimateWidth(data.name || "Root", 16);
  nodes.push({
    id: rootId,
    position: { x: 0, y: 0 },
    data: { label: data.name || "Root", parentId: undefined, childrenIds: [] },
    style: {
      background: "#273047",
      color: "#e5e7eb",
      border: "1.5px solid #7aa2f7",
      borderRadius: 9999,
      padding: "10px 14px",
      fontWeight: 700,
      width: rootWidth,
      textAlign: "center",
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: false,
    selectable: false,
  });

  let idCounter = 1;

  const measure = (node: MindMapNode | null | undefined, depth: number): number => {
    const d = Math.min(depth, nodeHeights.length - 1);
    const own = nodeHeights[d];
    if (!node || typeof node !== 'object') return own;
    const kidsRaw = Array.isArray((node as any).children) ? (node as any).children : [];
    const kids: MindMapNode[] = kidsRaw.filter((k: any) => k && typeof k === 'object');
    if (kids.length === 0) return own;
    const gap = minGaps[d];
    const sum = kids.map((c) => measure(c, depth + 1)).reduce((a, b) => a + b, 0);
    return Math.max(own, sum + gap * (kids.length - 1));
  };

  const place = (
    node: MindMapNode,
    parentId: string,
    centerX: number,
    centerY: number,
    side: "left" | "right",
    depth: number
  ) => {
    if (!node || typeof node !== 'object') return parentId;
    const d = Math.min(depth, nodeHeights.length - 1);
    const dir = side === "right" ? 1 : -1;
    const width = estimateWidth(node.name || "");
    const id = `n-${idCounter++}`;
    const x = centerX + dir * levelGapX[d];
    const y = centerY;

    const childrenIds: string[] = [];
    nodes.push({
      id,
      position: { x, y },
      data: { label: node.name || "", parentId, childrenIds },
      style: {
        background: depth === 1 ? "#2a2f3a" : depth === 2 ? "#20242d" : "#1b1f27",
        color: "#e5e7eb",
        border: `1px solid rgba(125, 90, 250, ${depth === 1 ? 0.6 : depth === 2 ? 0.45 : 0.35})`,
        borderRadius: 9999,
        padding: "6px 10px",
        width,
        textAlign: "center",
        fontWeight: 500,
        fontSize: depth >= 3 ? 12 : 14,
      },
      sourcePosition: side === "right" ? Position.Right : Position.Left,
      targetPosition: side === "right" ? Position.Left : Position.Right,
    });

    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      animated: false,
      style: { stroke: "#7aa2f7", strokeWidth: depth === 1 ? 2 : 1.6 },
    });

    const kids = Array.isArray(node.children) ? node.children.filter((k) => k && typeof k === 'object') : [];
    if (kids.length === 0) return;
    const gap = minGaps[d];
    const heights = kids.map((c) => measure(c, depth + 1));
    const total = heights.reduce((a, b) => a + b, 0) + gap * (kids.length - 1);
    let currentY = y - total / 2;
    kids.forEach((c, i) => {
      const h = heights[i];
      const cy = currentY + h / 2;
      const childId = place(c, id, x, cy, side, depth + 1) as unknown as string;
      childrenIds.push(childId as string);
      currentY += h + gap;
    });

    return id;
  };

  // place right side blocks
  const rHeights = right.map((c) => measure(c, 1));
  const rTotal = rHeights.reduce((a, b) => a + b, 0) + (right.length - 1) * 24;
  let rY = -rTotal / 2;
  right.forEach((c, i) => {
    const h = rHeights[i];
    const cy = rY + h / 2;
    place(c, rootId, 0, cy, "right", 1);
    rY += h + 24;
  });

  // place left side blocks
  const lHeights = left.map((c) => measure(c, 1));
  const lTotal = lHeights.reduce((a, b) => a + b, 0) + (left.length - 1) * 24;
  let lY = -lTotal / 2;
  left.forEach((c, i) => {
    const h = lHeights[i];
    const cy = lY + h / 2;
    place(c, rootId, 0, cy, "left", 1);
    lY += h + 24;
  });

  return { nodes, edges };
}

const MindMapFlow: React.FC<MindMapFlowProps> = ({ data }) => {
  const full = useMemo(() => buildFlow(data), [data]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const parentMap = useMemo(() => new Map(full.nodes.map((n) => [n.id, (n.data as any)?.parentId])), [full.nodes]);

  const isVisible = useCallback((id: string) => {
    // A node is visible if none of its ANCESTORS are collapsed (the node itself can be collapsed, hiding only its children)
    let cur: string | undefined = parentMap.get(id);
    while (cur) {
      if (collapsed.has(cur)) return false;
      cur = parentMap.get(cur);
    }
    return true;
  }, [collapsed, parentMap]);

  // Initialize with full set; we'll toggle hidden to preserve user positions
  const [nodes, setNodes, onNodesChange] = useNodesState(full.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(full.edges);

  // When data changes (new map), reset to new full graph
  React.useEffect(() => {
    setNodes(full.nodes);
    setEdges(full.edges);
  }, [full.nodes, full.edges, setNodes, setEdges]);

  // Apply visibility using hidden flags without resetting positions
  React.useEffect(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, hidden: !isVisible(n.id) })));
    const visibleIds = new Set(full.nodes.filter((n) => isVisible(n.id)).map((n) => n.id));
    setEdges((eds) => eds.map((e) => ({ ...e, hidden: !(visibleIds.has(e.source) && visibleIds.has(e.target)) })));
  }, [isVisible, setNodes, setEdges, full.nodes]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    // keep root fixed and non-collapsible
    if ((node.data as any)?.parentId === undefined) return;
    // toggle collapse for this node (affects its descendants)
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
      return next;
    });
  }, []);

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    if ((node.data as any)?.parentId === undefined) return; // don't rename root
    const current = (node.data as any)?.label || "";
    const next = window.prompt("Rename node", current);
    if (next == null) return;
    setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...(n.data as any), label: next }, style: { ...n.style, width: estimateWidth(next) } } : n));
  }, [setNodes]);

  return (
    <div style={{ width: "100%", height: 600 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnScroll
        zoomOnScroll
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="#2f3542" gap={24} />
        <MiniMap pannable zoomable nodeColor={() => "#2a2f3a"} maskColor="#0b0e1380" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default MindMapFlow;


