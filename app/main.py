import logging
import json
import time
from typing import Callable
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.concurrency import iterate_in_threadpool

from app.config import get_settings
from app.routers import policy_reviews
from app.telemetry import setup_telemetry, get_tracer, get_current_trace_context


class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for comprehensive request/response logging with trace context.
    Logs: API triggered, request details, response details, timing.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get logger
        logger = logging.getLogger("api.access")
        
        # Start timing
        start_time = time.time()
        
        # Get trace context
        trace_context = get_current_trace_context()
        trace_id = trace_context["trace_id"]
        span_id = trace_context["span_id"]
        
        # Build traceparent header
        traceparent = f"00-{trace_id}-{span_id}-01"
        
        # Extract request details
        method = request.method
        url = str(request.url)
        path = request.url.path
        query_params = dict(request.query_params)
        headers = dict(request.headers)
        client_ip = request.client.host if request.client else "unknown"
        
        # Remove sensitive headers from logging
        safe_headers = {k: v for k, v in headers.items() 
                       if k.lower() not in ["authorization", "cookie", "x-api-key"]}
        
        # Log request received
        logger.info(f">>> REQUEST RECEIVED | {method} {path}")
        logger.info(f"    Client IP: {client_ip}")
        logger.info(f"    Full URL: {url}")
        
        if query_params:
            logger.info(f"    Query Params: {json.dumps(query_params)}")
        
        logger.debug(f"    Headers: {json.dumps(safe_headers, indent=2)}")
        
        # Read and log request body (for POST/PUT/PATCH)
        request_body = None
        if method in ["POST", "PUT", "PATCH"]:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    try:
                        request_body = json.loads(body_bytes)
                        logger.info(f"    Request Body: {json.dumps(request_body, indent=2)}")
                    except json.JSONDecodeError:
                        logger.info(f"    Request Body (raw): {body_bytes.decode('utf-8', errors='replace')[:500]}")
            except Exception as e:
                logger.warning(f"    Could not read request body: {e}")
        
        logger.info(f"    Processing request...")
        
        # Process the request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Read response body
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
            
            # Log response details
            status_code = response.status_code
            content_type = response.headers.get("content-type", "")
            
            logger.info(f"<<< RESPONSE SENT | {method} {path} | Status: {status_code} | Duration: {duration_ms:.2f}ms")
            
            # Log response body (if JSON and not too large)
            if "application/json" in content_type and len(response_body) < 50000:
                try:
                    response_json = json.loads(response_body)
                    # For large arrays, log count and first 2 items
                    if isinstance(response_json, list):
                        logger.info(f"    Response Body: Array with {len(response_json)} items")
                        if len(response_json) > 0:
                            logger.info(f"    Sample Item [0]: {json.dumps(response_json[0])}")
                        if len(response_json) > 1:
                            logger.info(f"    Sample Item [1]: {json.dumps(response_json[1])}")
                    else:
                        # For objects, log the full response
                        logger.info(f"    Response Body: {json.dumps(response_json)}")
                except json.JSONDecodeError:
                    logger.info(f"    Response Body (raw): {response_body.decode('utf-8', errors='replace')[:1000]}")
            elif len(response_body) >= 50000:
                logger.info(f"    Response Body: <{len(response_body)} bytes - too large to log>")
            
            # Add trace headers to response
            headers = dict(response.headers)
            headers["traceparent"] = traceparent
            headers["x-trace-id"] = trace_id
            headers["x-span-id"] = span_id
            headers["x-response-time-ms"] = str(round(duration_ms, 2))
            
            # Return new response with body and updated headers
            return Response(
                content=response_body,
                status_code=status_code,
                headers=headers,
                media_type=response.media_type
            )
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"!!! REQUEST FAILED | {method} {path} | Error: {str(e)} | Duration: {duration_ms:.2f}ms")
            raise

# Get settings
settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AcuFile Backend API - Fetches policy reviews from Azure Blob Storage",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup OpenTelemetry with Dynatrace-compatible tracing
# Dynatrace OneAgent in Azure will automatically collect logs with trace context
setup_telemetry(
    app=app,
    service_name="acufile-api",
    service_version="1.0.0",
    log_level=logging.DEBUG if settings.debug else logging.INFO
)

# Get logger for this module
logger = logging.getLogger(__name__)

# Add request/response logging middleware (includes trace headers)
app.add_middleware(RequestResponseLoggingMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(policy_reviews.router, prefix="/api/v1")


@app.get("/")
def root():
    """Root endpoint."""
    logger.info("Root endpoint accessed")
    return {
        "message": "Welcome to AcuFile API",
        "docs": "/docs",
        "health": "/health",
        "data_source": "Azure Blob Storage"
    }


@app.get("/health")
def health_check():
    """Health check endpoint with trace context."""
    trace_context = get_current_trace_context()
    logger.info("Health check performed")
    return {
        "status": "healthy",
        "trace_id": trace_context["trace_id"],
        "span_id": trace_context["span_id"]
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Handle favicon requests."""
    return {"status": "no favicon"}
