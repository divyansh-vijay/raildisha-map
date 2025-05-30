from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.base import Floor
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class MapData(BaseModel):
    objects: List[dict] = []
    routes: List[dict] = []
    boundaries: List[dict] = []
    innerBoundaries: List[dict] = []

class FloorBase(BaseModel):
    name: str
    level: int
    map_data: MapData

class FloorCreate(FloorBase):
    pass

class FloorResponse(FloorBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=FloorResponse)
def create_floor(floor: FloorCreate, db: Session = Depends(get_db)):
    db_floor = Floor(**floor.model_dump())
    db.add(db_floor)
    db.commit()
    db.refresh(db_floor)
    return db_floor

@router.get("/", response_model=List[FloorResponse])
def get_floors(db: Session = Depends(get_db)):
    floors = db.query(Floor).all()
    return floors

@router.get("/{floor_id}", response_model=FloorResponse)
def get_floor(floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if floor is None:
        raise HTTPException(status_code=404, detail="Floor not found")
    return floor

@router.put("/{floor_id}", response_model=FloorResponse)
def update_floor(floor_id: int, floor: FloorCreate, db: Session = Depends(get_db)):
    db_floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if db_floor is None:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    for key, value in floor.model_dump().items():
        setattr(db_floor, key, value)
    
    db.commit()
    db.refresh(db_floor)
    return db_floor

@router.delete("/{floor_id}")
def delete_floor(floor_id: int, db: Session = Depends(get_db)):
    db_floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if db_floor is None:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    db.delete(db_floor)
    db.commit()
    return {"message": "Floor deleted successfully"} 