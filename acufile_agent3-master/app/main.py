import logging
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import blob_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("api.log", mode="a")
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Azure Blob File Update API",
    description="""
    A FastAPI application for managing Azure Blob Storage files with rule-based operations.
    
    ## Features
    
    - **Move Files**: Move files between containers/folders based on pattern matching rules
    - **Rename Files**: Rename files using regex, prefix, suffix, or other pattern types
    - **Rename Folders**: Rename virtual directories by moving all contained blobs
    
    ## Rule Types
    
    - `regex`: Use regular expressions for matching
    - `prefix`: Match files starting with a pattern
    - `suffix`: Match files ending with a pattern
    - `contains`: Match files containing a pattern
    - `exact`: Match exact filename
    - `extension`: Match file extension
    
    ## Dry Run Mode
    
    All operations support a `dry_run` parameter to preview changes without applying them.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(blob_router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {e}", exc_info=True)
        raise


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Azure Blob File Update API",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "checks": {
            "api": "operational"
        }
    }
