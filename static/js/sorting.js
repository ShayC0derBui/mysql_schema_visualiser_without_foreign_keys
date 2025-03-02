// sorting.js

// Use an iterative approach to assign levels even if there are cycles.
function computeHierarchicalLevels(graph) {
  let levels = {};
  // Start all nodes at level 0
  graph.nodes.forEach((node) => {
    levels[node.id] = 0;
  });

  let changed = true;
  let iteration = 0;
  // Limit iterations to avoid infinite loops in pathological cases.
  while (changed && iteration < 100) {
    changed = false;
    graph.links.forEach((link) => {
      // Extract ids whether link.source and link.target are objects or strings.
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;
      // If parent's level + 1 is greater than child's current level, update it.
      let proposedLevel = levels[sourceId] + 1;
      if (proposedLevel > levels[targetId]) {
        levels[targetId] = proposedLevel;
        changed = true;
      }
    });
    iteration++;
  }
  return levels;
}

// Then use the levels to apply a hierarchical layout.
export function applyHierarchicalLayout(graph, width, height) {
  const levels = computeHierarchicalLevels(graph);
  // Determine the maximum level for spacing.
  const maxLevel = Math.max(...Object.values(levels));
  // Group nodes by their level.
  const nodesByLevel = {};
  graph.nodes.forEach((node) => {
    const level = levels[node.id] || 0;
    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(node);
  });
  // Assign positions: vertical position (y) by level, horizontal (x) evenly spaced.
  Object.keys(nodesByLevel).forEach((level) => {
    const rowNodes = nodesByLevel[level];
    const y = (Number(level) / (maxLevel + 1)) * height;
    const spacing = width / (rowNodes.length + 1);
    rowNodes.forEach((node, i) => {
      node.fx = spacing * (i + 1);
      node.fy = y;
    });
  });
}
