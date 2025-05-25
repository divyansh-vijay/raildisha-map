from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from src.database import get_db
from src.models.base import Floor
from src.schemas.base import FloorCreate, FloorUpdate, FloorResponse

router = APIRouter()

@router.get("/")
def get_floors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    floors = db.query(Floor).offset(skip).limit(limit).all()
    return [floor.to_dict() for floor in floors]

@router.get("/{floor_id}")
def get_floor(floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    return floor.to_dict()

@router.post("/")
def create_floor(floor: FloorCreate, db: Session = Depends(get_db)):
    db_floor = Floor(**floor.dict())
    db.add(db_floor)
    db.commit()
    db.refresh(db_floor)
    return db_floor.to_dict()

@router.put("/{floor_id}")
def update_floor(floor_id: int, floor: FloorUpdate, db: Session = Depends(get_db)):
    db_floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not db_floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    for key, value in floor.dict(exclude_unset=True).items():
        setattr(db_floor, key, value)
    
    db.commit()
    db.refresh(db_floor)
    return db_floor.to_dict()

@router.delete("/{floor_id}")
def delete_floor(floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    db.delete(floor)
    db.commit()
    return {"message": "Floor deleted successfully"}

@router.get("/api/maps")
def get_map_data(db: Session = Depends(get_db)):
    """
    Get all map data in the format matching localStorage structure.
    Returns:
    {
        "floors": [
            { id: "floor_1", name: "Floor 1" },
            ...
        ],
        "floorData": {
            "floor_1": {
                objects: [...],
                routes: [...],
                boundaries: [...],
                innerBoundaries: [...]
            },
            ...
        },
        "selectedFloor": "floor_1"
    }
    """
    try:
        # Get all floors ordered by level
        floors = db.query(Floor).order_by(Floor.level).all()
        
        # Format floors list
        floors_list = [
            {
                "id": f"floor_{floor.level}",
                "name": floor.name
            }
            for floor in floors
        ]
        
        # Format floor data
        floor_data = {
            f"floor_{floor.level}": floor.map_data
            for floor in floors
        }
        
        # Return data in localStorage format
        return {
            "floors": floors_list,
            "floorData": floor_data,
            "selectedFloor": floors_list[0]["id"] if floors_list else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/maps")
def save_map_data(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Save map data in the format matching localStorage structure.
    Expected format:
    {
        "floors": [
            { id: "floor_1", name: "Floor 1" },
            ...
        ],
        "floorData": {
            "floor_1": {
                objects: [...],
                routes: [...],
                boundaries: [...],
                innerBoundaries: [...]
            },
            ...
        }
    }
    """
    try:
        # Delete all existing floors
        db.query(Floor).delete()
        db.commit()

        # Create new floors with their data
        for floor in data["floors"]:
            # Extract level from floor id (e.g., "floor_1" -> 1)
            level = int(floor["id"].split("_")[1])
            floor_data = data["floorData"][floor["id"]]
            
            new_floor = Floor(
                name=floor["name"],
                level=level,
                map_data=floor_data
            )
            db.add(new_floor)
        
        db.commit()
        return {"message": "Map data saved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 