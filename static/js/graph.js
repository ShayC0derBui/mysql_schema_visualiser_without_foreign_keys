// graph.js
import { updateStorage } from "./state.js";

/**
 * Applies a static drop-shadow hover effect to the visible link.
 */
export function applyHoverEffect(linkGroup, d, svg) {
  svg
    .select("#dropShadow feDropShadow")
    .attr("dx", 2) // Fixed horizontal offset
    .attr("dy", 2) // Fixed vertical offset
    .attr("stdDeviation", 1); // Fixed blur radius
  d3.select(linkGroup)
    .select("line.link-visible")
    .style("stroke", d.manual ? "#ff6666" : "#666")
    .style("filter", "url(#dropShadow)");
}

/**
 * Removes the hover effect.
 */
export function removeHoverEffect(linkGroup, d) {
  d3.select(linkGroup)
    .select("line.link-visible")
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
      let exists = targetNode.ambiguousCols.some(
        (x) => x[0] === ambiguousData[0]
      );
      if (!exists) {
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
 *  - onNodeClick: handler for node clicks.
 *  - onLinkClick: handler for link clicks.
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

  // Invisible hit area.
  linkEnter
    .append("line")
    .attr("class", "link-hit")
    .attr("vector-effect", "non-scaling-stroke")
    .style("stroke-width", 20)
    .style("stroke", "transparent")
    .style("pointer-events", "stroke")
    .on("click", (event, d) => onLinkClick(event, d))
    .on("mouseover", function (event, d) {
      onHoverEffect(this.parentNode, d, svg);
    })
    .on("mouseout", function (event, d) {
      onRemoveHoverEffect(this.parentNode, d);
    });
  // Visible line.
  linkEnter
    .append("line")
    .attr("class", "link-visible")
    .style("stroke-width", 2)
    .style("stroke", (d) => (d.manual ? "red" : "#999"))
    .on("click", (event, d) => onLinkClick(event, d))
    .on("mouseover", function (event, d) {
      onHoverEffect(this.parentNode, d, svg);
    })
    .on("mouseout", function (event, d) {
      onRemoveHoverEffect(this.parentNode, d);
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
  node.select("circle").attr("fill", (d) => {
    if (d.wasAmbiguous && (!d.ambiguousCols || d.ambiguousCols.length === 0))
      return "green";
    if (d.ambiguousCols && d.ambiguousCols.length > 0) return "yellow";
    return "#1E90FF";
  });
  node.select("text").text((d) => d.id);
  node
    .on("mouseover", function (event, d) {
      d3.select(".tooltip").html(d.info).style("display", "block");
    })
    .on("mousemove", function (event, d) {
      d3.select(".tooltip")
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      d3.select(".tooltip").style("display", "none");
    });
  node.on("click", onNodeClick.handler);

  simulation.force("link").links(graph.links);
  simulation.alpha(1).restart();
  updateStorage();
}
