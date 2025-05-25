from src.database import SessionLocal
from src.models.base import Floor, Marker, Path, Boundary
import logging
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def format_datetime(dt):
    if dt:
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return None

def check_data():
    try:
        db = SessionLocal()
        
        # Check Floors
        floors = db.query(Floor).all()
        logger.info(f"\nFound {len(floors)} floors:")
        for floor in floors:
            logger.info(f"\nFloor: {floor.name} (Level {floor.level})")
            logger.info(f"ID: {floor.id}")
            logger.info(f"Created: {format_datetime(floor.created_at)}")
            logger.info(f"Updated: {format_datetime(floor.updated_at)}")
            
            # Check map data
            if floor.map_data:
                logger.info("\nMap Data:")
                logger.info(f"  Objects: {len(floor.map_data.get('objects', []))}")
                logger.info(f"  Routes: {len(floor.map_data.get('routes', []))}")
                logger.info(f"  Boundaries: {len(floor.map_data.get('boundaries', []))}")
                
                # Show sample of objects
                if floor.map_data.get('objects'):
                    logger.info("\nSample Objects:")
                    for obj in floor.map_data['objects'][:3]:  # Show first 3 objects
                        logger.info(f"  - {obj.get('name')} ({obj.get('type')})")
                        logger.info(f"    Position: {obj.get('position')}")
                        if obj.get('description'):
                            logger.info(f"    Description: {obj.get('description')}")
                
                # Show sample of routes
                if floor.map_data.get('routes'):
                    logger.info("\nSample Routes:")
                    for route in floor.map_data['routes'][:3]:  # Show first 3 routes
                        logger.info(f"  - {route.get('name')} ({route.get('type')})")
                        logger.info(f"    Points: {len(route.get('points', []))} points")
                        if route.get('description'):
                            logger.info(f"    Description: {route.get('description')}")
                
                # Show sample of boundaries
                if floor.map_data.get('boundaries'):
                    logger.info("\nSample Boundaries:")
                    for boundary in floor.map_data['boundaries'][:3]:  # Show first 3 boundaries
                        logger.info(f"  - {boundary.get('name')} ({boundary.get('type')})")
                        logger.info(f"    Points: {len(boundary.get('points', []))} points")
                        if boundary.get('description'):
                            logger.info(f"    Description: {boundary.get('description')}")
            
            # Check related data (these will be empty since we're using JSON storage)
            markers = db.query(Marker).filter(Marker.floor_id == floor.id).all()
            paths = db.query(Path).filter(Path.floor_id == floor.id).all()
            boundaries = db.query(Boundary).filter(Boundary.floor_id == floor.id).all()
            
            logger.info(f"\nRelated Data (from separate tables - should be empty):")
            logger.info(f"  Markers: {len(markers)}")
            logger.info(f"  Paths: {len(paths)}")
            logger.info(f"  Boundaries: {len(boundaries)}")
            
    except Exception as e:
        logger.error(f"Error checking data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    check_data() 