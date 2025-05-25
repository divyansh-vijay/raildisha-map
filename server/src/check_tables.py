from sqlalchemy import inspect
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_tables():
    try:
        # Create an inspector
        inspector = inspect(engine)
        
        # Get all table names
        tables = inspector.get_table_names()
        
        logger.info("Connected to database successfully!")
        logger.info(f"Found {len(tables)} tables:")
        
        # Print each table and its columns
        for table in tables:
            logger.info(f"\nTable: {table}")
            columns = inspector.get_columns(table)
            for column in columns:
                logger.info(f"  - {column['name']}: {column['type']}")
                
    except Exception as e:
        logger.error(f"Error checking tables: {e}")
        raise

if __name__ == "__main__":
    check_tables() 