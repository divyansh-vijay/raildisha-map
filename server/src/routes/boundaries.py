from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.base import Floor

router = APIRouter()

@router.get("/")
def get_boundaries(
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
    
    boundaries = floor.map_data.get("boundaries", [])
    return boundaries[skip:skip + limit]

@router.post("/")
def create_boundary(boundary: Dict[str, Any], floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    # Add boundary to floor's map_data
    if "boundaries" not in floor.map_data:
        floor.map_data["boundaries"] = []
    
    floor.map_data["boundaries"].append(boundary)
    db.commit()
    return boundary

@router.delete("/{boundary_id}")
def delete_boundary(boundary_id: str, floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    # Remove boundary from floor's map_data
    if "boundaries" in floor.map_data:
        floor.map_data["boundaries"] = [
            boundary for boundary in floor.map_data["boundaries"]
            if boundary.get("id") != boundary_id
        ]
        db.commit()
    
    return {"message": "Boundary deleted successfully"} 