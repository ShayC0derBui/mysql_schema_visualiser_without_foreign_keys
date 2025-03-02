// main.js
import {
  loadGraph,
  updateStorage,
  rehydrateGraph,
  graph,
  defaultGraph,
} from "./state.js";
import {
  createSimulation,
  dragstarted,
  dragged,
  dragended,
} from "./simulation.js";
import {
  refreshGraph,
  applyHoverEffect,
  removeHoverEffect,
  removeLink,
} from "./graph.js";
import {
  openAmbiguousModal,
  openTargetModal,
  openExportModal,
  openImportModal,
  openForceSettingsModal,
} from "./modals.js";

// Assume GRAPH_DATA is injected as a global variable in the HTML
// You can either import it or use window.GRAPH_DATA.
const defaultData = window.GRAPH_DATA;

// Load graph state.
loadGraph(defaultData);
rehydrateGraph(graph);
console.log("Loaded graph:", graph);

// Calculate dimensions.
const headerHeight = document.getElementById("header").offsetHeight;
const width = window.innerWidth;
const height = window.innerHeight - headerHeight;

// Create SVG container.
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("border-top", "1px solid #ccc")
  .call(
    d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
  );
const g = svg.append("g");

// Add drop-shadow filter.
const defs = svg.append("defs");
const dropShadowFilter = defs
  .append("filter")
  .attr("id", "dropShadow")
  .attr("filterUnits", "userSpaceOnUse")
  .attr("height", "130%");
dropShadowFilter
  .append("feDropShadow")
  .attr("dx", 2)
  .attr("dy", 2)
  .attr("stdDeviation", 1)
  .attr("flood-color", "#000")
  .attr("flood-opacity", 0.5);

// Add arrowhead marker.
defs
  .append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "-0 -5 10 10")
  .attr("refX", 30)
  .attr("refY", 0)
  .attr("orient", "auto")
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("xoverflow", "visible")
  .append("svg:path")
  .attr("d", "M 0,-5 L 10 ,0 L 0,5")
  .attr("fill", "#999")
  .style("stroke", "none");

// Create tooltip.
d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("display", "none");

// Setup simulation.
const simulation = createSimulation(graph.nodes, graph.links, width, height);

// Define drag handlers that call simulation functions.
const nodeDragHandlers = {
  dragstarted: (event, d) => dragstarted(event, d, simulation),
  dragged: (event, d) => dragged(event, d),
  dragended: (event, d) => dragended(event, d, simulation),
  handler: (event, d) => {
    // For ambiguous node clicks.
    if (d.ambiguousCols && d.ambiguousCols.length > 0) {
      openAmbiguousModal(d, (nodeData, col, parentModal) =>
        openTargetModal(nodeData, col, parentModal, graph, () => {
          refreshGraph(
            svg,
            g,
            simulation,
            graph,
            nodeDragHandlers,
            (e, d) => removeLink(e, d, graph),
            applyHoverEffect,
            removeHoverEffect
          );
        })
      );
    }
  },
};

// Initial refresh.
refreshGraph(
  svg,
  g,
  simulation,
  graph,
  nodeDragHandlers,
  (e, d) =>
    removeLink(e, d, graph, () =>
      refreshGraph(
        svg,
        g,
        simulation,
        graph,
        nodeDragHandlers,
        (e, d) => removeLink(e, d, graph),
        applyHoverEffect,
        removeHoverEffect
      )
    ),
  applyHoverEffect,
  removeHoverEffect
);

// Simulation tick handler.
simulation.on("tick", function () {
  g.selectAll(".link-group")
    .selectAll("line")
    .attr("x1", (d) => d.target.x)
    .attr("y1", (d) => d.target.y)
    .attr("x2", (d) => d.source.x)
    .attr("y2", (d) => d.source.y);
  g.selectAll(".node").attr(
    "transform",
    (d) => "translate(" + d.x + "," + d.y + ")"
  );
});

// Attach header button event listeners.
document
  .getElementById("export-btn")
  .addEventListener("click", () => openExportModal(graph));
document
  .getElementById("import-btn")
  .addEventListener("click", () =>
    openImportModal(graph, rehydrateGraph, () =>
      refreshGraph(
        svg,
        g,
        simulation,
        graph,
        nodeDragHandlers,
        (e, d) => removeLink(e, d, graph),
        applyHoverEffect,
        removeHoverEffect
      )
    )
  );
document.getElementById("reset-btn").addEventListener("click", function () {
  if (confirm("Reset graph to default state?")) {
    // Update graph's nodes and links instead of reassigning graph
    graph.nodes = JSON.parse(JSON.stringify(defaultGraph.nodes));
    graph.links = JSON.parse(JSON.stringify(defaultGraph.links));
    rehydrateGraph(graph);
    refreshGraph(
      svg,
      g,
      simulation,
      graph,
      nodeDragHandlers,
      (e, d) => removeLink(e, d, graph),
      applyHoverEffect,
      removeHoverEffect
    );
    updateStorage();
    setTimeout(() => window.location.reload(), 100);
  }
});

document.getElementById("force-settings-btn").addEventListener("click", () => {
  openForceSettingsModal(simulation, graph, width, height);
});
