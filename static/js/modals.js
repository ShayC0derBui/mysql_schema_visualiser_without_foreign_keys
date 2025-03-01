// modals.js

/**
 * Opens a modal to fix ambiguous columns for a given node.
 * Expects openTargetModal to be passed as a callback.
 */
export function openAmbiguousModal(nodeData, openTargetModal) {
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
    .on("click", (event, col) => {
      openTargetModal(nodeData, col, modal);
    });
  modal
    .append("div")
    .attr("class", "close-btn")
    .text("Close")
    .on("click", () => modal.remove());
}

/**
 * Opens a modal that allows selecting a new connection for a given ambiguous column.
 */
export function openTargetModal(
  nodeData,
  col,
  parentModal,
  graph,
  refreshGraph
) {
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
      .on("click", (event, chosen) => {
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

/**
 * Exports the graph JSON as a downloadable file.
 */
export function exportToFile(jsonString) {
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

/**
 * Opens a modal to export the graph state.
 */
export function openExportModal(graph) {
  d3.selectAll(".modal").remove();
  let modal = d3.select("body").append("div").attr("class", "modal");
  modal.append("h3").text("Export Graph State");
  let textArea = modal
    .append("textarea")
    .style("width", "100%")
    .style("height", "200px")
    .text(JSON.stringify(graph, null, 2));
  modal
    .append("button")
    .text("Copy to Clipboard")
    .on("click", function () {
      textArea.node().select();
      document.execCommand("copy");
      alert("Graph state copied to clipboard.");
    });
  modal
    .append("button")
    .text("Export to .json File")
    .on("click", function () {
      exportToFile(JSON.stringify(graph, null, 2));
    });
  modal
    .append("div")
    .attr("class", "close-btn")
    .text("Close")
    .on("click", () => modal.remove());
}

/**
 * Opens a modal to import a graph state from pasted JSON or a .json file.
 */
export function openImportModal(graph, rehydrateGraph, refreshGraph) {
  d3.selectAll(".modal").remove();
  let modal = d3.select("body").append("div").attr("class", "modal");
  modal.append("h3").text("Import Graph State");
  let textArea = modal
    .append("textarea")
    .style("width", "100%")
    .style("height", "200px")
    .attr("placeholder", "Paste graph JSON here...");
  modal
    .append("button")
    .text("Import")
    .on("click", function () {
      try {
        let importedGraph = JSON.parse(textArea.node().value);
        // Replace current graph
        graph.nodes = importedGraph.nodes;
        graph.links = importedGraph.links;
        rehydrateGraph(graph);
        refreshGraph();
        alert("Graph imported successfully.");
        modal.remove();
      } catch (e) {
        alert("Invalid JSON. Please check your input.");
      }
    });
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
          graph.nodes = importedGraph.nodes;
          graph.links = importedGraph.links;
          rehydrateGraph(graph);
          refreshGraph();
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

/**
 * Opens a modal to set the graph layout.
 */
export function openForceSettingsModal(simulation) {
  // Remove any existing modals
  d3.selectAll(".modal").remove();

  // Create the modal container
  const modal = d3.select("body").append("div").attr("class", "modal");

  modal.append("h3").text("Force Settings");

  // We'll store the current charge/link/collision in variables so we can show them initially
  let currentCharge = simulation.force("charge").strength();
  // The link distance can be read from the link force's .distance() if it's a function or a numeric
  let currentLinkDistance = simulation.force("link").distance();
  let currentCollision = simulation.force("collide").radius();

  // If they're stored as functions, you may need to store a default or keep track in global variables

  // Create a container for each slider + label
  // 1) Charge
  const chargeDiv = modal.append("div");
  chargeDiv.append("label").text("Charge: ");
  chargeDiv.append("span").attr("id", "charge-value").text(currentCharge);

  chargeDiv
    .append("input")
    .attr("type", "range")
    .attr("min", -2000)
    .attr("max", 0)
    .attr("step", 50)
    .attr("value", currentCharge)
    .on("input", function () {
      const newVal = +this.value;
      d3.select("#charge-value").text(newVal);
      simulation.force("charge").strength(newVal);
      simulation.alpha(1).restart();
    });

  // 2) Link Distance
  const linkDistDiv = modal.append("div");
  linkDistDiv.append("label").text("Link Distance: ");
  linkDistDiv
    .append("span")
    .attr("id", "linkdist-value")
    .text(currentLinkDistance);

  linkDistDiv
    .append("input")
    .attr("type", "range")
    .attr("min", 50)
    .attr("max", 300)
    .attr("step", 10)
    .attr("value", currentLinkDistance)
    .on("input", function () {
      const newVal = +this.value;
      d3.select("#linkdist-value").text(newVal);
      simulation.force("link").distance(newVal);
      simulation.alpha(1).restart();
    });

  // 3) Collision Radius
  const collideDiv = modal.append("div");
  collideDiv.append("label").text("Collision Radius: ");
  collideDiv.append("span").attr("id", "collide-value").text(currentCollision);

  collideDiv
    .append("input")
    .attr("type", "range")
    .attr("min", 10)
    .attr("max", 100)
    .attr("step", 5)
    .attr("value", currentCollision)
    .on("input", function () {
      const newVal = +this.value;
      d3.select("#collide-value").text(newVal);
      simulation.force("collide").radius(newVal);
      simulation.alpha(1).restart();
    });

  // Close button
  modal
    .append("div")
    .attr("class", "close-btn")
    .text("Close")
    .on("click", () => modal.remove());
}
