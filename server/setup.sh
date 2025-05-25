#!/bin/bash

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a new PostgreSQL user and database
sudo -u postgres psql -c "CREATE USER raildisha WITH PASSWORD 'raildisha123';"
sudo -u postgres psql -c "CREATE DATABASE raildisha;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE raildisha TO raildisha;"

# Grant schema privileges
sudo -u postgres psql -d raildisha -c "GRANT ALL ON SCHEMA public TO raildisha;"
sudo -u postgres psql -d raildisha -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO raildisha;"
sudo -u postgres psql -d raildisha -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO raildisha;"

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=raildisha
DB_USER=raildisha
DB_PASSWORD=raildisha123

# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=development
EOL

# Initialize the database
cd "$(dirname "$0")"  # Ensure we're in the server directory
python3 -m src.init_db

echo "Setup complete! You can now start the server with: python3 src/main.py" 