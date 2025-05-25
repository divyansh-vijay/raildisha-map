from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.base import Floor

router = APIRouter()

@router.get("/")
def get_paths(
    floor_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    if floor_id is None:
        raise HTTPException(status_code=400, detail="floor_id is required")
    
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    paths = floor.map_data.get("routes", [])
    return paths[skip:skip + limit]

@router.post("/")
def create_path(path: Dict[str, Any], floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    # Add path to floor's map_data
    if "routes" not in floor.map_data:
        floor.map_data["routes"] = []
    
    floor.map_data["routes"].append(path)
    db.commit()
    return path

@router.delete("/{path_id}")
def delete_path(path_id: str, floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    # Remove path from floor's map_data
    if "routes" in floor.map_data:
        floor.map_data["routes"] = [
            route for route in floor.map_data["routes"]
            if route.get("id") != path_id
        ]
        db.commit()
    
    return {"message": "Path deleted successfully"} 