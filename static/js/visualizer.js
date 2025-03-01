// Save the graph state before the window unloads.
window.addEventListener("beforeunload", updateStorage);

// Load graph state: if localStorage has it, use that; otherwise, use the injected GRAPH_DATA.
let graph;
const storedState = localStorage.getItem("graphState");
if (storedState) {
  graph = JSON.parse(storedState);
} else {
  graph = GRAPH_DATA;
}
console.log("Initial graph:", graph);

// Make a deep copy of the default state for reset purposes.
const defaultGraph = JSON.parse(JSON.stringify(GRAPH_DATA));

// Rehydrate links: assign source/target to matching node objects.
function rehydrateGraph(g) {
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
rehydrateGraph(graph);
console.log("Graph after rehydration:", graph);

// Calculate dimensions accounting for header height.
const headerHeight = document.getElementById("header").offsetHeight;
const width = window.innerWidth;
const height = window.innerHeight - headerHeight;

// Create the SVG container with zoom/pan.
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
      .on("zoom", function (event) {
        g.attr("transform", event.transform);
      })
  );
const g = svg.append("g");

// Add a drop-shadow filter.
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

// Create the tooltip element.
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("display", "none");

// Setup the force simulation.
const simulation = d3
  .forceSimulation(graph.nodes)
  .force(
    "link",
    d3
      .forceLink(graph.links)
      .id((d) => d.id)
      .distance(150)
  )
  .force("charge", d3.forceManyBody().strength(-500))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("x", d3.forceX(width / 2).strength(0.05))
  .force("y", d3.forceY(height / 2).strength(0.05))
  .force("collide", d3.forceCollide(30));

// Selections for links and nodes.
let link = g.append("g").selectAll(".link-group");
let node = g.append("g").selectAll("g");

// Update localStorage.
function updateStorage() {
  localStorage.setItem("graphState", JSON.stringify(graph));
  console.log("Graph state updated in localStorage");
}

/* Remove connection handler.
   - For both manual (red) and non-manual (black) connections, we revert the target node's state.
   - For manual links, we expect ambiguousData.
   - For non-manual links, we fabricate ambiguousData as [column, "unknown"].
   - Additionally, for non-ambiguous connections, we mark targetNode.wasAmbiguous as true.
*/
function removeLink(event, d) {
  if (
    confirm(
      `Remove connection from ${d.source.id} to ${d.target.id} (${d.column})?`
    )
  ) {
    let targetNode = graph.nodes.find((n) => n.id === d.target.id);
    if (targetNode) {
      targetNode.wasAmbiguous = true;
      let ambiguousData;
      if (d.manual && d.ambiguousData) {
        ambiguousData = d.ambiguousData;
      } else {
        ambiguousData = [d.column, "unknown"];
      }
      let exists = targetNode.ambiguousCols.some(
        (x) => x[0] === ambiguousData[0]
      );
      if (!exists) {
        targetNode.ambiguousCols.push(ambiguousData);
      }
      targetNode.ambiguous = true;
    }
    graph.links = graph.links.filter((l) => l !== d);
    refreshGraph();
  }
  event.stopPropagation();
}

// Functions to apply and remove hover effect with dynamic drop-shadow.
function applyHoverEffect(linkGroup, d) {
  const zoomScale = d3.zoomTransform(svg.node()).k;
  svg
    .select("#dropShadow feDropShadow")
    .attr("dx", 2 * zoomScale)
    .attr("dy", 2 * zoomScale)
    .attr("stdDeviation", 1 * zoomScale);
  d3.select(linkGroup)
    .select("line.link-visible")
    .style("stroke", d.manual ? "#ff6666" : "#666")
    .style("filter", "url(#dropShadow)");
}
function removeHoverEffect(linkGroup, d) {
  d3.select(linkGroup)
    .select("line.link-visible")
    .style("stroke", d.manual ? "red" : "#999")
    .style("filter", null);
}

// Refresh (redraw) the graph.
function refreshGraph() {
  link = link.data(
    graph.links,
    (d) => d.source.id + "-" + d.target.id + "-" + d.column
  );
  link.exit().remove();
  let linkEnter = link.enter().append("g").attr("class", "link-group");

  linkEnter
    .append("line")
    .attr("class", "link-hit")
    .attr("vector-effect", "non-scaling-stroke")
    .style("stroke-width", 10)
    .style("stroke", "transparent")
    .style("pointer-events", "stroke")
    .on("click", removeLink)
    .on("mouseover", function (event, d) {
      applyHoverEffect(this.parentNode, d);
    })
    .on("mouseout", function (event, d) {
      removeHoverEffect(this.parentNode, d);
    });

  linkEnter
    .append("line")
    .attr("class", "link-visible")
    .style("stroke-width", 2)
    .style("stroke", (d) => (d.manual ? "red" : "#999"))
    .on("click", removeLink)
    .on("mouseover", function (event, d) {
      applyHoverEffect(this.parentNode, d);
    })
    .on("mouseout", function (event, d) {
      removeHoverEffect(this.parentNode, d);
    });

  link = linkEnter.merge(link);

  node = node.data(graph.nodes, (d) => d.id);
  node.exit().remove();
  let nodeEnter = node
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );
  nodeEnter.append("circle").attr("r", 20);
  nodeEnter.append("text").attr("dx", 25).attr("dy", ".35em");
  node = nodeEnter.merge(node);

  node.select("circle").attr("fill", function (d) {
    if (d.wasAmbiguous && (!d.ambiguousCols || d.ambiguousCols.length === 0))
      return "green";
    if (d.ambiguousCols && d.ambiguousCols.length > 0) return "yellow";
    return "#1E90FF";
  });
  node.select("text").text((d) => d.id);

  node
    .on("mouseover", function (event, d) {
      tooltip.html(d.info).style("display", "block");
    })
    .on("mousemove", function (event, d) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
    });

  node.on("click", null);
  node
    .filter((d) => d.ambiguousCols && d.ambiguousCols.length > 0)
    .on("click", function (event, d) {
      openAmbiguousModal(d);
    });

  simulation.force("link").links(graph.links);
  simulation.alpha(1).restart();
  updateStorage();
}
refreshGraph();

// Simulation tick handler.
simulation.on("tick", function () {
  link
    .selectAll("line")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);
  node.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");
});

// Drag event handlers.
function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}
function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}
function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// Modal functions for ambiguous fix logic.
function openAmbiguousModal(nodeData) {
  d3.selectAll(".modal").remove();
  let modal = d3.select("body").append("div").attr("class", "modal");
  modal.append("h3").text("Fix Ambiguous Columns for " + nodeData.id);
  if (!nodeData.ambiguousCols || nodeData.ambiguousCols.length === 0) {
    modal.append("div").text("No ambiguous columns left!");
    modal
      .append("div")
      .attr("class", "close-btn")
      .text("Close")
      .on("click", () => modal.remove());
    return;
  }
  modal.append("div").attr("class", "section-title").text("Ambiguous Columns:");
  let list = modal.append("ul");
  list
    .selectAll("li")
    .data(nodeData.ambiguousCols)
    .enter()
    .append("li")
    .text((d) => d[0] + " (" + d[1] + ")")
    .style("cursor", "pointer")
    .on("click", function (event, col) {
      openTargetModal(nodeData, col, modal);
    });
  modal
    .append("div")
    .attr("class", "close-btn")
    .text("Close")
    .on("click", () => modal.remove());
}

function openTargetModal(nodeData, col, parentModal) {
  d3.selectAll(".sub-modal").remove();
  let subModal = d3
    .select("body")
    .append("div")
    .attr("class", "modal sub-modal");
  subModal.append("h3").text("Select a real table for " + col[0]);
  subModal.append("div").attr("class", "section-title").text("Search Table:");
  let input = subModal
    .append("input")
    .attr("type", "text")
    .attr("placeholder", "Search table...");
  let candidateList = subModal.append("ul");
  let candidates = graph.nodes.filter((n) => n.id !== nodeData.id);
  function updateCandidateList(filterText) {
    let filtered = candidates.filter((n) =>
      n.id.toLowerCase().includes(filterText.toLowerCase())
    );
    let items = candidateList.selectAll("li").data(filtered, (d) => d.id);
    items.exit().remove();
    items
      .enter()
      .append("li")
      .merge(items)
      .text((d) => d.id)
      .on("click", function (event, chosen) {
        graph.links.push({
          source: chosen.id,
          target: nodeData.id,
          column: col[0],
          manual: true,
          ambiguousData: col,
        });
        let idx = nodeData.ambiguousCols.findIndex((x) => x[0] === col[0]);
        if (idx >= 0) nodeData.ambiguousCols.splice(idx, 1);
        if (nodeData.ambiguousCols.length === 0) {
          nodeData.ambiguous = false;
        }
        refreshGraph();
        subModal.remove();
        parentModal.remove();
      });
  }
  updateCandidateList("");
  input.on("input", function () {
    updateCandidateList(this.value);
  });
  subModal
    .append("div")
    .attr("class", "close-btn")
    .text("Close")
    .on("click", () => subModal.remove());
}

// --- New Export/Import Functions ---

// Export to a .json file using a Blob download.
function exportToFile(jsonString) {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graph_state.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export modal: shows textarea with JSON, copy button, and a new button to download as .json file.
function openExportModal() {
  d3.selectAll(".modal").remove();
  let modal = d3.select("body").append("div").attr("class", "modal");
  modal.append("h3").text("Export Graph State");

  let textArea = modal
    .append("textarea")
    .style("width", "100%")
    .style("height", "200px")
    .text(JSON.stringify(graph, null, 2));

  let copyBtn = modal
    .append("button")
    .text("Copy to Clipboard")
    .on("click", function () {
      textArea.node().select();
      document.execCommand("copy");
      alert("Graph state copied to clipboard.");
    });

  // New button: Export to .json file
  let fileExportBtn = modal
    .append("button")
    .text("Export to .json File")
    .on("click", function () {
      let jsonString = JSON.stringify(graph, null, 2);
      exportToFile(jsonString);
    });

  modal
    .append("div")
    .attr("class", "close-btn")
    .text("Close")
    .on("click", () => modal.remove());
}

// Import modal: shows textarea for manual paste and a file input for choosing a .json file.
function openImportModal() {
  d3.selectAll(".modal").remove();
  let modal = d3.select("body").append("div").attr("class", "modal");
  modal.append("h3").text("Import Graph State");

  let textArea = modal
    .append("textarea")
    .style("width", "100%")
    .style("height", "200px")
    .attr("placeholder", "Paste graph JSON here...");

  let importBtn = modal
    .append("button")
    .text("Import")
    .on("click", function () {
      try {
        let importedGraph = JSON.parse(textArea.node().value);
        graph = importedGraph;
        rehydrateGraph(graph);
        refreshGraph();
        updateStorage();
        setTimeout(() => window.location.reload(), 100);
        alert("Graph imported successfully.");
        modal.remove();
      } catch (e) {
        alert("Invalid JSON. Please check your input.");
      }
    });

  // New: File input for importing from a .json file.
  let fileInput = modal
    .append("input")
    .attr("type", "file")
    .attr("accept", ".json")
    .style("display", "block")
    .style("margin-top", "10px");

  fileInput.on("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          let importedGraph = JSON.parse(e.target.result);
          graph = importedGraph;
          rehydrateGraph(graph);
          refreshGraph();
          updateStorage();
          setTimeout(() => window.location.reload(), 100);
          alert("Graph imported successfully from file.");
          modal.remove();
        } catch (err) {
          alert("Invalid JSON in file.");
        }
      };
      reader.readAsText(file);
    }
  });

  modal
    .append("div")
    .attr("class", "close-btn")
    .text("Close")
    .on("click", () => modal.remove());
}

// Attach event listeners for export and import buttons.
document
  .getElementById("export-btn")
  .addEventListener("click", openExportModal);
document
  .getElementById("import-btn")
  .addEventListener("click", openImportModal);

// Reset graph to default state when the reset button is pressed.
document.getElementById("reset-btn").addEventListener("click", function () {
  if (confirm("Reset graph to default state?")) {
    graph = JSON.parse(JSON.stringify(defaultGraph));
    rehydrateGraph(graph);
    refreshGraph();
    updateStorage();
    setTimeout(() => window.location.reload(), 100);
  }
});
