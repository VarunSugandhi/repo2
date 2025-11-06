import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

interface MindMapVisualizationProps {
  data: MindMapNode;
  onReady?: (svgEl: SVGSVGElement) => void;
}

const MindMapVisualization = ({ data, onReady }: MindMapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();

    // Responsive width
    const parent = (svgRef.current.parentElement as HTMLElement) || document.body;
    const width = Math.max(800, parent.clientWidth - 40);
    const height = 600;

    const svg = svgEl
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background", "#111318");

    // Root-centered group for zoom/pan
    const g = svg.append("g");
    const centerX = width / 2;
    const centerY = height / 2;
    g.attr("transform", `translate(${centerX},${centerY})`);

    // Zoom behavior
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 2.5])
        .on("zoom", (event) => {
          g.attr("transform", `${event.transform.translate(centerX, centerY)}`);
        })
    );

    // Helpers for layout measurements
    const estimateTextWidth = (label: string, fontSize: number) => {
      const avg = fontSize * 0.6; // average glyph width approximation
      return Math.max(40, Math.min(360, label.length * avg + 28));
    };

    // Split children left/right for mind map style
    const rootData: MindMapNode = data;
    const children = rootData.children || [];
    const mid = Math.ceil(children.length / 2);
    const rightChildren = children.slice(0, mid);
    const leftChildren = children.slice(mid);

    // Build two trees sharing the same root label
    const rightRoot = d3.hierarchy<MindMapNode>({ name: rootData.name, children: rightChildren });
    const leftRoot = d3.hierarchy<MindMapNode>({ name: rootData.name, children: leftChildren });

    // Layouts with custom separation to reduce overlaps
    const nodeGapY = 120; // base horizontal distance per step (we'll scale by depth)
    const nodeGapX = 56;  // vertical spacing baseline
    const separation = (a: any, b: any) => {
      const depthBias = a.depth === 0 || b.depth === 0 ? 2.0 : a.parent === b.parent ? 1.2 : 1.6;
      const aW = estimateTextWidth(a.data.name || "", a.depth === 0 ? 16 : 13);
      const bW = estimateTextWidth(b.data.name || "", b.depth === 0 ? 16 : 13);
      return depthBias + (aW + bW) / 700; // spread more for long labels
    };
    const treeRight = d3.tree<MindMapNode>().nodeSize([nodeGapX, nodeGapY]).separation(separation);
    const treeLeft = d3.tree<MindMapNode>().nodeSize([nodeGapX, nodeGapY]).separation(separation);

    const rightTree = treeRight(rightRoot);
    const leftTree = treeLeft(leftRoot);

    // Depth-based horizontal spacing for hierarchy clarity
    const depthSpacing = [0, 220, 180, 140, 120];
    rightTree.each((n: any) => { n.y = depthSpacing[Math.min(n.depth, depthSpacing.length - 1)]; });
    leftTree.each((n: any) => { n.y = -depthSpacing[Math.min(n.depth, depthSpacing.length - 1)]; });

    // Combine nodes/links, but skip duplicate extra roots when drawing
    const nodes = [...rightTree.descendants(), ...leftTree.descendants().filter((n) => n.depth > 0)];
    const links = [...rightTree.links(), ...leftTree.links()];

    // Gradients for links and node strokes
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "edgeGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#6ea8fe").attr("stop-opacity", 0.9);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#8b5cf6").attr("stop-opacity", 0.9);

    // Links (curved)
    const linkGen = (d: any) => {
      const src = d.source;
      const tgt = d.target;
      const isLeft = tgt.y < src.y;
      const fontSource = src.depth === 0 ? 16 : 13;
      const fontTarget = tgt.depth === 0 ? 16 : 13;
      const sourcePad = estimateTextWidth(src.data.name || "", fontSource) / 2 + 12;
      const targetPad = estimateTextWidth(tgt.data.name || "", fontTarget) / 2 + 12;
      const sx = src.y + (isLeft ? -sourcePad : sourcePad);
      const tx = tgt.y + (isLeft ? targetPad * -1 : targetPad);
      const sy = src.x;
      const ty = tgt.x;
      return d3.linkHorizontal<any, any>()
        .x((p: any) => p === d.source ? sx : tx)
        .y((p: any) => p === d.source ? sy : ty)({ source: d.source, target: d.target });
    };

    g.selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d: any) => linkGen({ source: d.source, target: d.target }))
      .attr("fill", "none")
      .attr("stroke", "url(#edgeGradient)")
      .attr("stroke-width", 3)
      .attr("opacity", 0.9)
      .attr("filter", "drop-shadow(0 0 2px rgba(0,0,0,0.3))");

    // Node groups
    const nodeGroup = g.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    // Pill boxes
    const paddingX = 14;
    const paddingY = 8;

    nodeGroup.each(function (d: any) {
      const group = d3.select(this);
      const label = d.data.name || "";
      const fontSize = d.depth === 0 ? 16 : 13;

      // Estimate text width to avoid pre-render overlaps
      const w = estimateTextWidth(label, fontSize) + paddingX;
      const h = (fontSize + 6) + paddingY;

      group
        .append("rect")
        .attr("x", -w / 2)
        .attr("y", -h / 2)
        .attr("rx", h / 2)
        .attr("ry", h / 2)
        .attr("width", w)
        .attr("height", h)
        .attr("fill", d.depth === 0 ? "#273047" : "#2a2f3a")
        .attr("stroke", "url(#edgeGradient)")
        .attr("stroke-width", d.depth === 0 ? 2.5 : 1.5)
        .attr("opacity", 0.98);

      group
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#e5e7eb")
        .attr("font-size", fontSize)
        .style("font-weight", d.depth === 0 ? 700 : 500)
        .text(label);
    });

    // Notify parent that SVG is ready
    if (svgRef.current && onReady) {
      onReady(svgRef.current);
    }

  }, [data]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border">
      <svg ref={svgRef} className="block w-full h-[600px]" />
    </div>
  );
};

export default MindMapVisualization;
