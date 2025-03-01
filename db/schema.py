from configparser import ConfigParser

def get_connection_config(args):
    config = {
        "host": args.host,
        "user": args.user,
        "password": args.password,
        "database": args.database,
        "port": args.port,
    }
    if not all([config["host"], config["user"], config["password"], config["database"]]):
        file_config = ConfigParser()
        file_config.read(args.config)
        if "mysql" in file_config:
            mysql_config = file_config["mysql"]
            config = {
                "host": args.host or mysql_config.get("host", "localhost"),
                "user": args.user or mysql_config.get("user"),
                "password": args.password or mysql_config.get("password"),
                "database": args.database or mysql_config.get("database"),
                "port": args.port or mysql_config.getint("port", 3306),
            }
    return config

def get_tables_and_columns(connection):
    tables = {}
    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")
    table_names = [row[0] for row in cursor.fetchall()]
    print(f"Found tables: {table_names}")
    for table in table_names:
        cursor.execute(f"DESCRIBE `{table}`")
        tables[table] = [row for row in cursor.fetchall()]
    cursor.close()
    return tables

