# MySQL Schema Visualizer

## Demo
<img width="1030" alt="Screenshot 2025-03-03 at 4 02 10 AM" src="https://github.com/user-attachments/assets/393d8cac-1a43-44c4-a316-e7af524fb1d0" />
<img width="1282" alt="Screenshot 2025-03-03 at 4 02 52 AM" src="https://github.com/user-attachments/assets/5eab4d9d-bd28-4002-b4ed-dac7a4e15255" />

## Quick Database Setup with Docker (Optional)

If you don't have an existing MySQL database, you can use the provided setup script to create a sample schema for demonstration purposes.

### 1. Make `setup.sh` Executable

```sh
chmod +x setup.sh
```

### 2. Run the `setup.sh` Script

```sh
./setup.sh
```

This script will set up a MySQL database in Docker for quick testing and automatically create the `config.ini` file with the required database credentials.

## Setup

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/mysql-schema-visualizer.git
cd mysql-schema-visualizer
```

### 2. Set Up the Python Environment

```sh
python -m venv venv
source venv/bin/activate  # On Windows use 'venv\Scripts\activate'
pip install -r requirements.txt
```

### 3. Install Node.js Dependencies

```sh
npm install
```

## Configuration

### 1. Set Connection Details in `config.ini`

- Create a `config.ini` file in the project root with the following content:

```ini
[mysql]
host = your_host
user = your_user
password = your_password
database = your_database
port = your_port
```

## Build

### 1. Build the Project

```sh
npm run build
```

## Run

### 1. Run the Script

```sh
python main.py
```

### 2. Alternatively, Provide Connection Details via Command-Line Arguments

```sh
python main.py --host <host> --user <user> --password <password> --database <database> --port <port>
```
