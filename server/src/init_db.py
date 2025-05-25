import os
import sys
import logging

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import create_tables, Base, engine
from src.models.base import Floor, Marker, Path, Boundary  # Import all models

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    try:
        # Drop all existing tables
        logger.info("Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables
        logger.info("Creating new tables...")
        create_tables()
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        logger.info("Database initialization completed successfully!")
        logger.info(f"Created tables: {', '.join(tables)}")
        
        # Show table structures
        for table in tables:
            logger.info(f"\nTable: {table}")
            columns = inspector.get_columns(table)
            for column in columns:
                logger.info(f"  - {column['name']}: {column['type']}")
                
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

if __name__ == "__main__":
    init_db() 