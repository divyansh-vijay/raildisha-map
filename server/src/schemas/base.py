from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Position(BaseModel):
    lat: float
    lng: float

class FloorBase(BaseModel):
    name: str
    level: int
    map_data: Dict[str, Any]  # Store all map data as JSON

class FloorCreate(FloorBase):
    pass

class Floor(FloorBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MarkerBase(BaseModel):
    name: str
    description: Optional[str] = None
    position: Position
    type: str

class MarkerCreate(MarkerBase):
    floor_id: int

class Marker(MarkerBase):
    id: int
    floor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PathBase(BaseModel):
    name: str
    description: Optional[str] = None
    points: List[Position]
    type: str

class PathCreate(PathBase):
    floor_id: int

class Path(PathBase):
    id: int
    floor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BoundaryBase(BaseModel):
    name: str
    description: Optional[str] = None
    points: List[Position]
    type: str

class BoundaryCreate(BoundaryBase):
    floor_id: int

class Boundary(BoundaryBase):
    id: int
    floor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 