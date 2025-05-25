from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.base import Marker
from ..schemas.base import MarkerCreate, Marker as MarkerSchema

router = APIRouter()

@router.post("/", response_model=MarkerSchema)
def create_marker(marker: MarkerCreate, db: Session = Depends(get_db)):
    db_marker = Marker(**marker.model_dump())
    db.add(db_marker)
    db.commit()
    db.refresh(db_marker)
    return db_marker

@router.get("/", response_model=List[MarkerSchema])
def get_markers(
    floor_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Marker)
    if floor_id is not None:
        query = query.filter(Marker.floor_id == floor_id)
    markers = query.offset(skip).limit(limit).all()
    return markers

@router.get("/{marker_id}", response_model=MarkerSchema)
def get_marker(marker_id: int, db: Session = Depends(get_db)):
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if marker is None:
        raise HTTPException(status_code=404, detail="Marker not found")
    return marker

@router.put("/{marker_id}", response_model=MarkerSchema)
def update_marker(marker_id: int, marker: MarkerCreate, db: Session = Depends(get_db)):
    db_marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if db_marker is None:
        raise HTTPException(status_code=404, detail="Marker not found")
    
    for key, value in marker.model_dump().items():
        setattr(db_marker, key, value)
    
    db.commit()
    db.refresh(db_marker)
    return db_marker

@router.delete("/{marker_id}")
def delete_marker(marker_id: int, db: Session = Depends(get_db)):
    db_marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if db_marker is None:
        raise HTTPException(status_code=404, detail="Marker not found")
    
    db.delete(db_marker)
    db.commit()
    return {"message": "Marker deleted successfully"} 