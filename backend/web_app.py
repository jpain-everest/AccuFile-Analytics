"""
A&H AccuFile - FastAPI Backend Application
"""
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent

print(BACKEND_DIR)

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import traceback
from dotenv import load_dotenv
from app.api_routes import router

# Load environment variables (first file found wins; load_dotenv won't override)
load_dotenv(BACKEND_DIR / "config" / ".env")          # local dev
load_dotenv(BACKEND_DIR / ".env")                      # local dev alt
load_dotenv(BACKEND_DIR / "config" / ".env.docker")    # Docker container
load_dotenv("/app/backend/config/.env.docker")         # Docker absolute fallback

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

app.include_router(router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    print(f"[ERROR] {request.method} {request.url}", flush=True)
    print("".join(tb), flush=True)
    status = exc.status_code if isinstance(exc, HTTPException) else 500
    detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
    return JSONResponse(status_code=status, content={"detail": detail})


if __name__ == "__main__":
    uvicorn.run(
        "web_app:app",
        port=8001,
        reload=True,
        reload_dirs=[str(BACKEND_DIR)],
    )