import os
import webbrowser
import argparse
import logging
import json
from jinja2 import Environment, FileSystemLoader
from db.schema import get_connection_config, get_tables_and_columns
from graph.builder import analyze_schema, build_graph, graph_to_json

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def parse_arguments():
    parser = argparse.ArgumentParser(
        description="MySQL Schema Visualizer (D3) with Persistent State"
    )
    parser.add_argument("--config", type=str, default="config.ini", help="Path to config file")
    parser.add_argument("--host", type=str, help="MySQL host")
    parser.add_argument("--user", type=str, help="MySQL user")
    parser.add_argument("--password", type=str, help="MySQL password")
    parser.add_argument("--database", type=str, help="MySQL database name")
    parser.add_argument("--port", type=int, default=3306, help="MySQL port")
    return parser.parse_args()

def render_template(graph_data, output_file):
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("schema_visualizer.html")
    rendered_html = template.render(graph_data=graph_data)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(rendered_html)

def main():
    args = parse_arguments()
    config = get_connection_config(args)
    connection = None
    try:
        import pymysql  # Imported here to ensure it's installed.
        connection = pymysql.connect(
            host=config["host"],
            user=config["user"],
            password=config["password"],
            database=config["database"],
            port=config["port"]
        )
        logging.info(f"Connected to database: {config['database']}")
        tables = get_tables_and_columns(connection)
        relationships, table_info = analyze_schema(tables)
        G = build_graph(relationships, table_info)
        graph_data = graph_to_json(G)
        # Render template using our graph data (passed as a JSON string)
        out_file = "index.html"
        render_template(graph_data=json.dumps(graph_data), output_file=out_file)
        logging.info(f"Visualization saved to {out_file}")
        full_path = os.path.abspath(out_file)
        webbrowser.open("file://" + full_path)
    except Exception as e:
        logging.error(f"Error: {e}", exc_info=True)
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    main()

