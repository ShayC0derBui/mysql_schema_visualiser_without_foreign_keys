import { updateStorage } from "./state.js";

/**
 * A small helper to generate path data ("d" attribute) for each link.
 * If it's a self-link, draw a small loop. Otherwise, draw a straight line
 * from target -> source (as in your original code).
 */
export function generatePath(d) {
  const sx = d.source.x,
    sy = d.source.y,
    tx = d.target.x,
    ty = d.target.y;

  // Check if it's a self-link
  if (sx === tx && sy === ty) {
    // We'll draw a small cubic Bézier curve that loops around the node.
    // Adjust r for the loop size.
    const r = 50;
    return `
      M${sx},${sy}
      C${sx - r},${sy - r} ${sx + r},${sy - r} ${sx},${sy}
    `;
  } else {
    // Normal straight line from (target.x, target.y) to (source.x, source.y)
    // to match your existing direction
    return `M${tx},${ty} L${sx},${sy}`;
  }
}

/**
 * Helper: get the ".link-visible" sibling if event fired on ".link-hit"
 */
function getVisiblePathElement(element) {
  // If the hovered element is the visible path, return it
  if (d3.select(element).classed("link-visible")) {
    return element;
  }
  // Otherwise, find the sibling path with .link-visible
  return element.parentNode.querySelector(".link-visible");
}

/**
 * Applies a static drop-shadow hover effect to the visible link.
 */
export function applyHoverEffect(linkElement, d, svg) {
  const visiblePath = getVisiblePathElement(linkElement);

  // Configure the drop shadow if needed
  svg
    .select("#dropShadow feDropShadow")
    .attr("dx", 2)
    .attr("dy", 2)
    .attr("stdDeviation", 1);

  // Apply styles to the visible path
  d3.select(visiblePath)
    .style("stroke", d.manual ? "#ff6666" : "#666")
    .style("filter", "url(#dropShadow)");
}

/**
 * Removes the hover effect.
 */
export function removeHoverEffect(linkElement, d) {
  const visiblePath = getVisiblePathElement(linkElement);

  d3.select(visiblePath)
    .style("stroke", d.manual ? "red" : "#999")
    .style("filter", null);
}

/**
 * Handles link removal.
 * For both manual and non-manual links, reverts the target node to ambiguous.
 */
export function removeLink(event, d, graph, refreshGraphCallback) {
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
      let exists = targetNode.ambiguousCols?.some(
        (x) => x[0] === ambiguousData[0]
      );
      if (!exists) {
        targetNode.ambiguousCols = targetNode.ambiguousCols || [];
        targetNode.ambiguousCols.push(ambiguousData);
      }
      targetNode.ambiguous = true;
    }
    graph.links = graph.links.filter((l) => l !== d);
    refreshGraphCallback();
  }
  event.stopPropagation();
}

/**
 * Refreshes the graph (nodes and links) on the SVG.
 * Expects parameters:
 *  - svg, g: D3 selections for the SVG and a container group.
 *  - simulation: the force simulation instance.
 *  - graph: current graph state.
 *  - onNodeClick: handler for node drag/click.
 *  - onLinkClick: handler for link clicks (removal).
 *  - onHoverEffect / onRemoveHoverEffect: functions for hover effects.
 */
export function refreshGraph(
  svg,
  g,
  simulation,
  graph,
  onNodeClick,
  onLinkClick,
  onHoverEffect,
  onRemoveHoverEffect
) {
  // LINKS:
  let link = g
    .selectAll(".link-group")
    .data(graph.links, (d) => d.source.id + "-" + d.target.id + "-" + d.column);
  link.exit().remove();

  let linkEnter = link.enter().append("g").attr("class", "link-group");

  // Invisible hit area (path)
  linkEnter
    .append("path")
    .attr("class", "link-hit")
    .style("fill", "none")
    .style("stroke", "transparent")
    .style("stroke-width", 20)
    .style("pointer-events", "stroke")
    .on("click", (event, d) => onLinkClick(event, d))
    .on("mouseover", function (event, d) {
      // Pass `this` (the path) instead of `this.parentNode`
      onHoverEffect(this, d, svg);
    })
    .on("mouseout", function (event, d) {
      onRemoveHoverEffect(this, d);
    });

  // Visible path with arrow marker
  linkEnter
    .append("path")
    .attr("class", "link-visible")
    .style("fill", "none")
    .style("stroke-width", 2)
    .style("stroke", (d) => (d.manual ? "red" : "#999"))
    .attr("marker-end", "url(#arrowhead)")
    .on("click", (event, d) => onLinkClick(event, d))
    .on("mouseover", function (event, d) {
      onHoverEffect(this, d, svg);
    })
    .on("mouseout", function (event, d) {
      onRemoveHoverEffect(this, d);
    });

  link = linkEnter.merge(link);

  // NODES:
  let node = g.selectAll(".node").data(graph.nodes, (d) => d.id);
  node.exit().remove();

  let nodeEnter = node
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", (event, d) => onNodeClick.dragstarted(event, d))
        .on("drag", (event, d) => onNodeClick.dragged(event, d))
        .on("end", (event, d) => onNodeClick.dragended(event, d))
    );

  nodeEnter.append("circle").attr("r", 20);
  nodeEnter.append("text").attr("dx", 25).attr("dy", ".35em");

  node = nodeEnter.merge(node);

  // Fill color logic
  node.select("circle").attr("fill", (d) => {
    if (d.wasAmbiguous && (!d.ambiguousCols || d.ambiguousCols.length === 0))
      return "green";
    if (d.ambiguousCols && d.ambiguousCols.length > 0) return "yellow";
    return "#1E90FF";
  });

  // Node text
  node.select("text").text((d) => d.id);

  // Tooltip events
  node
    .on("mouseover", function (event, d) {
      d3.select(".tooltip")
        .html(d.info || d.id)
        .style("display", "block");
    })
    .on("mousemove", function (event, d) {
      d3.select(".tooltip")
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      d3.select(".tooltip").style("display", "none");
    });

  // Node click
  node.on("click", onNodeClick.handler);

  // Update simulation
  simulation.force("link").links(graph.links);
  simulation.alpha(1).restart();

  // Save state
  updateStorage();
}
