// state.js
export let graph;
export let defaultGraph;

/**
 * Loads the graph from localStorage if available; otherwise returns the provided defaultData.
 * Also stores a deep copy of the default for reset.
 */
export function loadGraph(defaultData) {
  const storedState = localStorage.getItem("graphState");
  if (storedState) {
    graph = JSON.parse(storedState);
  } else {
    graph = defaultData;
  }
  // Save a deep copy for resets.
  defaultGraph = JSON.parse(JSON.stringify(defaultData));
  return graph;
}

/**
 * Saves the current graph state to localStorage.
 */
export function updateStorage() {
  localStorage.setItem("graphState", JSON.stringify(graph));
  console.log("Graph state updated in localStorage");
}

/**
 * Rehydrates link objects so that each link’s source and target reference the proper node objects.
 */
export function rehydrateGraph(g) {
  const nodeMap = new Map(g.nodes.map((n) => [n.id, n]));
  g.links.forEach((link) => {
    let sourceId =
      typeof link.source === "object" && link.source !== null
        ? link.source.id
        : link.source;
    let targetId =
      typeof link.target === "object" && link.target !== null
        ? link.target.id
        : link.target;
    link.source = nodeMap.get(sourceId);
    link.target = nodeMap.get(targetId);
  });
}
