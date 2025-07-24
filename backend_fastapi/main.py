from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from api.chat_api import router as chat_router
from api.agent_api import router as agent_router
from api.mcp_api import router as mcp_router
from api.file_extractor_api import router as file_extractor_router
import uvicorn
import os

app = FastAPI(
    title="产业集群智能体 FastAPI Backend",
    description="Advanced AI-powered industrial cluster management system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(agent_router, prefix="/api/agent", tags=["agent"])
app.include_router(mcp_router, prefix="/api/mcp", tags=["mcp"])
app.include_router(file_extractor_router, prefix="/api/file-extractor", tags=["file-extractor"])

# Mount static files for downloads
os.makedirs("outputs", exist_ok=True)
app.mount("/download", StaticFiles(directory="outputs"), name="download")

@app.get("/")
async def root():
    return {"message": "产业集群智能体 FastAPI Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fastapi-backend"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )