import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import maps
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="RailDisha Map API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Import and include routers
from .routes import markers, paths, boundaries

app.include_router(maps.router, prefix="/api/maps", tags=["maps"])
app.include_router(markers.router, prefix="/api/markers", tags=["markers"])
app.include_router(paths.router, prefix="/api/paths", tags=["paths"])
app.include_router(boundaries.router, prefix="/api/boundaries", tags=["boundaries"])

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host=host, port=port) 