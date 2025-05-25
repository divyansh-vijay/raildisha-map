from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, Any
from .database import engine, get_db
from .models.base import Base, MapData
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/api/maps")
def get_map_data(db: Session = Depends(get_db)):
    """Get the latest map data"""
    try:
        # Get the latest map data
        map_data = db.query(MapData).order_by(MapData.id.desc()).first()
        logger.info(f"Retrieved map data: {map_data}")
        
        if map_data:
            # Ensure the response has the expected structure
            data = map_data.data
            logger.info(f"Raw data from database: {data}")
            
            if not isinstance(data, dict):
                logger.warning(f"Data is not a dictionary: {type(data)}")
                data = {"floors": [], "floorData": {}, "selectedFloor": None}
            
            if "floors" not in data:
                logger.warning("floors field missing, adding empty array")
                data["floors"] = []
            if "floorData" not in data:
                logger.warning("floorData field missing, adding empty object")
                data["floorData"] = {}
            if "selectedFloor" not in data:
                logger.warning("selectedFloor field missing, adding null")
                data["selectedFloor"] = None
                
            logger.info(f"Returning processed data: {data}")
            return data
            
        # Return empty data structure if no data exists
        logger.info("No data found in database, returning empty structure")
        return {
            "floors": [],
            "floorData": {},
            "selectedFloor": None
        }
    except Exception as e:
        logger.error(f"Error in get_map_data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/maps")
def save_map_data(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Save map data"""
    try:
        logger.info(f"Received data to save: {data}")
        
        # Delete all existing data
        db.query(MapData).delete()
        db.commit()
        logger.info("Deleted existing data")
        
        # Create new map data entry
        new_map_data = MapData(data=data)
        db.add(new_map_data)
        db.commit()
        db.refresh(new_map_data)
        logger.info(f"Saved new data: {new_map_data.data}")
        
        return {"message": "Map data saved successfully", "data": new_map_data.data}
    except Exception as e:
        logger.error(f"Error in save_map_data: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 