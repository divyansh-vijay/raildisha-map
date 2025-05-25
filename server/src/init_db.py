import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def init_db():
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")

    # Create engine
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Drop existing tables
        logger.info("Dropping existing tables...")
        session.execute(text("DROP TABLE IF EXISTS floors CASCADE"))
        session.commit()

        # Create tables
        logger.info("Creating tables...")
        from src.models.base import Base
        Base.metadata.create_all(engine)
        session.commit()

        # Create initial floor if none exists
        from src.models.base import Floor
        if not session.query(Floor).first():
            logger.info("Creating initial floor...")
            initial_floor = Floor(
                name="Ground Floor",
                level=1,
                map_data={
                    "objects": [],
                    "routes": [],
                    "boundaries": [],
                    "innerBoundaries": []
                }
            )
            session.add(initial_floor)
            session.commit()
            logger.info("Initial floor created successfully!")

        logger.info("Database initialized successfully!")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_db() 