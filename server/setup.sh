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
EOL

# Initialize the database
python3 src/init_db.py

echo "Setup complete! You can now start the server with: python3 src/main.py" 