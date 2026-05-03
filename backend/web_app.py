"""
A&H AccuFile - FastAPI Backend Application
"""
import os
import sys
from pathlib import Path

# Ensure backend directory is on the Python path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn

from src.agents.orchestrator import FileReviewOrchestrator
from src.utils.config_loader import ConfigLoader

app = FastAPI(
    title="A&H AccuFile",
    description="Agentic Workflow for UW File Review",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------- API Routes ---------------

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "A&H AccuFile Backend"}


@app.post("/api/run-workflow")
async def run_workflow():
    """
    Runs the main file review workflow.
    """
    try:
        config_loader = ConfigLoader(config_dir=str(BACKEND_DIR / "config"))
        config = config_loader.load_config()
        config["_backend_dir"] = str(BACKEND_DIR)
        # Re-initialize orchestrator for each run to ensure fresh state
        orchestrator = FileReviewOrchestrator(config)
        result = orchestrator.run()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/logs")
async def get_logs():
    """Retrieve application logs"""
    log_file = BACKEND_DIR / "logs" / "application.log"
    if log_file.exists():
        logs = log_file.read_text()
        return {"status": "success", "logs": logs}
    return {"status": "error", "message": "Log file not found."}


@app.get("/api/reports")
async def get_reports():
    """List available reports"""
    reports_dir = BACKEND_DIR / "reports"
    if reports_dir.exists():
        reports = [f.name for f in reports_dir.iterdir() if f.is_file()]
        return {"status": "success", "reports": reports}
    return {"status": "error", "message": "No reports found."}


@app.get("/api/files/{policy_number}/{file_path:path}")
async def get_file(policy_number: str, file_path: str):
    """Serve a file from a policy folder"""
    try:
        # Load config to get shared drive path
        config_loader = ConfigLoader(config_dir=str(BACKEND_DIR / "config"))
        config = config_loader.load_config()
        shared_drive = Path(config["storage"]["shared_drive_path"])
        
        # Find the policy folder
        policy_folder = None
        for folder in shared_drive.iterdir():
            if folder.is_dir() and policy_number in folder.name:
                policy_folder = folder
                break
        
        if not policy_folder:
            raise HTTPException(status_code=404, detail=f"Policy folder not found: {policy_number}")
        
        # Construct the full file path
        full_path = policy_folder / file_path
        
        # Security check: ensure the file is within the policy folder
        if not full_path.resolve().is_relative_to(policy_folder.resolve()):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Return the file
        return FileResponse(
            path=str(full_path),
            filename=full_path.name,
            media_type='application/octet-stream'
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "web_app:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        reload_dirs=[str(BACKEND_DIR)],
    )