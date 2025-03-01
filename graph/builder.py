import re
import networkx as nx

def analyze_schema(tables):
    known_tables = {t.lower() for t in tables.keys()}
    relationships = []
    table_info = {}
    pattern = re.compile(r"(.+)_id$", re.IGNORECASE)
    for table, cols in tables.items():
        primary_keys = {c[0] for c in cols if c[3] == "PRI"}
        col_htmls = []
        ambiguous_cols = []
        for c in cols:
            col_name, col_type = c[0], c[1]
            snippet = f"{col_name} ({col_type})"
            if col_name in primary_keys:
                col_htmls.append(snippet)
                continue
            match = pattern.match(col_name)
            if match:
                ref = match.group(1).lower()
                if ref in known_tables and ref != table.lower():
                    relationships.append((table, ref, col_name))
                    col_htmls.append(snippet)
                else:
                    ambiguous_cols.append((col_name, col_type))
                    snippet = f"<span style='background-color:yellow'>{snippet}</span>"
                    col_htmls.append(snippet)
            else:
                col_htmls.append(snippet)
        table_info[table] = {
            "columns_html": "<br>".join(col_htmls),
            "ambiguous_cols": ambiguous_cols,
            "is_ambiguous": (len(ambiguous_cols) > 0)
        }
    return relationships, table_info

def build_graph(relationships, table_info):
    G = nx.DiGraph()
    for table, info in table_info.items():
        G.add_node(
            table,
            info=info["columns_html"],
            ambiguous=info["is_ambiguous"],
            ambiguousCols=info["ambiguous_cols"],
            wasAmbiguous=info["is_ambiguous"]
        )
    for (child, parent, col_name) in relationships:
        G.add_edge(parent, child, column=col_name, manual=False)
    return G

def graph_to_json(G):
    nodes = []
    for node, data in G.nodes(data=True):
        nodes.append({
            "id": node,
            "info": data.get("info", ""),
            "ambiguous": data.get("ambiguous", False),
            "ambiguousCols": data.get("ambiguousCols", []),
            "wasAmbiguous": data.get("wasAmbiguous", False),
            "x": data.get("x", None),
            "y": data.get("y", None),
            "vx": data.get("vx", None),
            "vy": data.get("vy", None)
        })
    links = []
    for src, tgt, data in G.edges(data=True):
        links.append({
            "source": src,
            "target": tgt,
            "column": data.get("column", ""),
            "manual": data.get("manual", False)
        })
    return {"nodes": nodes, "links": links}

