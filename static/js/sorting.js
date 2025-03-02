// sorting.js

import * as dagre from "dagre";

// Comment out or remove the old iterative approach if you like:
// -------------------------------------------------------------
// function computeHierarchicalLevels(graph) { ... }
// export function applyHierarchicalLayout(graph, width, height) { ... }

/**
 * Applies a Sugiyama-style hierarchical layout using the dagre library.
 * Dagre automatically handles cycle-breaking internally.
 *
 * @param {Object} graph - The graph object with { nodes, links }.
 * @param {number} width - The width of the SVG or drawing area.
 * @param {number} height - The height of the SVG or drawing area.
 */
export function applyHierarchicalLayout(graph, width, height) {
  // 1) Create a new directed graph for dagre
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: "TB", // "TB" (top to bottom), or "LR" (left to right), etc.
    ranksep: 10, // Vertical separation between ranks
    nodesep: 10, // Horizontal separation between nodes
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 2) Add each node to dagre with an approximate bounding box (width/height).
  //    You can tweak node width/height as needed for better spacing.
  graph.nodes.forEach((node) => {
    // Use a small bounding box for each node; you can increase if needed
    g.setNode(node.id, { width: 30, height: 20 });
  });

  // 3) Add edges. Dagre will figure out the layering.
  graph.links.forEach((link) => {
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;
    // We just add a simple directed edge from source to target
    g.setEdge(sourceId, targetId);
  });

  // 4) Run dagre's layout
  dagre.layout(g);

  // 5) Now map dagre’s computed x/y back into your D3 node positions.
  //    We also do a quick pass to figure out min/max x and y for scaling.
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  g.nodes().forEach((nodeId) => {
    const { x, y } = g.node(nodeId);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  // 6) Compute a scale factor so the dagre layout fits nicely in your width/height.
  //    Add a small buffer so nodes aren’t flush with the edges.
  const padding = 50;
  const layoutWidth = maxX - minX || 1;
  const layoutHeight = maxY - minY || 1;
  const scaleX = (width - 2 * padding) / layoutWidth;
  const scaleY = (height - 2 * padding) / layoutHeight;
  const scale = Math.min(scaleX, scaleY);

  // 7) Assign fx, fy for each node
  g.nodes().forEach((nodeId) => {
    const { x, y } = g.node(nodeId);
    const foundNode = graph.nodes.find((n) => n.id === nodeId);
    if (foundNode) {
      foundNode.fx = (x - minX) * scale + padding;
      foundNode.fy = (y - minY) * scale + padding;
    }
  });
}
