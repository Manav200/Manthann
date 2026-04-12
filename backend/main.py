"""
Manthan AI Career Decision Engine – FastAPI Backend
Provides endpoints for AI-powered career profiling, simulations, and roadmaps.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.profiling import router as profiling_router
from routes.simulation import router as simulation_router
from routes.roadmap import router as roadmap_router

app = FastAPI(
    title="Manthan – AI Career Decision Engine",
    description="From Confusion → Clarity → Execution",
    version="1.0.0",
)

# CORS – allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(profiling_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(roadmap_router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "Manthan AI Career Decision Engine",
        "version": "1.0.0",
        "status": "running",
    }
