# MySQL Schema Visualizer

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

