from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.base import Floor

router = APIRouter()

@router.get("/")
def get_markers(
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
    
    markers = floor.map_data.get("objects", [])
    return markers[skip:skip + limit]

@router.post("/")
def create_marker(marker: Dict[str, Any], floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    # Add marker to floor's map_data
    if "objects" not in floor.map_data:
        floor.map_data["objects"] = []
    
    floor.map_data["objects"].append(marker)
    db.commit()
    return marker

@router.delete("/{marker_id}")
def delete_marker(marker_id: str, floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    # Remove marker from floor's map_data
    if "objects" in floor.map_data:
        floor.map_data["objects"] = [
            obj for obj in floor.map_data["objects"]
            if obj.get("id") != marker_id
        ]
        db.commit()
    
    return {"message": "Marker deleted successfully"} 