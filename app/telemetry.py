"""
OpenTelemetry configuration for Dynatrace-compatible tracing.

Dynatrace OneAgent in Azure will automatically collect logs.
This module ensures logs contain trace_id and span_id in the correct format.
"""

import logging
import os
from typing import Optional

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositePropagator
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.baggage.propagation import W3CBaggagePropagator


class DynatraceLogFormatter(logging.Formatter):
    """
    Custom log formatter that includes trace context in Dynatrace-compatible format.
    
    Format: [dt.trace_id=<32-char-hex>] [dt.span_id=<16-char-hex>] <log message>
    
    Dynatrace expects W3C trace context format:
    - trace_id: 32 lowercase hexadecimal characters
    - span_id: 16 lowercase hexadecimal characters
    """
    
    def format(self, record: logging.LogRecord) -> str:
        # Get current span context
        span = trace.get_current_span()
        span_context = span.get_span_context()
        
        if span_context.is_valid:
            # Format trace_id as 32 hex chars (Dynatrace format)
            record.trace_id = format(span_context.trace_id, '032x')
            # Format span_id as 16 hex chars (Dynatrace format)
            record.span_id = format(span_context.span_id, '016x')
        else:
            record.trace_id = "00000000000000000000000000000000"
            record.span_id = "0000000000000000"
        
        return super().format(record)


def setup_telemetry(
    app,
    service_name: str = "acufile-api",
    service_version: str = "1.0.0",
    log_level: int = logging.INFO,
    **kwargs  # Accept but ignore unused params
) -> None:
    """
    Initialize OpenTelemetry with Dynatrace-compatible logging.
    
    Dynatrace OneAgent will automatically capture traces in Azure.
    This setup ensures logs contain proper trace context for correlation.
    """
    
    # Create resource with service information
    resource = Resource.create({
        SERVICE_NAME: service_name,
        SERVICE_VERSION: service_version,
        "service.namespace": "acufile",
        "deployment.environment": os.getenv("ENVIRONMENT", "development"),
    })
    
    # Create and set tracer provider
    tracer_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer_provider)
    
    # Set up W3C Trace Context propagation (required for Dynatrace)
    propagator = CompositePropagator([
        TraceContextTextMapPropagator(),
        W3CBaggagePropagator()
    ])
    set_global_textmap(propagator)
    
    # Configure logging with trace context
    _configure_logging(log_level)
    
    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)
    
    logging.info(f"OpenTelemetry initialized for service: {service_name}")


def _configure_logging(log_level: int) -> None:
    """
    Configure logging with Dynatrace-compatible format including trace context.
    
    Uses dt.trace_id and dt.span_id prefixes for Dynatrace auto-detection.
    """
    
    # Dynatrace-compatible log format with trace context
    log_format = (
        "%(asctime)s | %(levelname)-8s | "
        "dt.trace_id=%(trace_id)s dt.span_id=%(span_id)s | "
        "%(name)s:%(funcName)s:%(lineno)d | %(message)s"
    )
    
    # Create formatter
    formatter = DynatraceLogFormatter(
        fmt=log_format,
        datefmt="%Y-%m-%dT%H:%M:%S%z"
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers from root logger only
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add new console handler with our formatter
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Configure uvicorn loggers to use our formatter (but don't remove their handlers)
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
        uv_logger = logging.getLogger(logger_name)
        uv_logger.propagate = True  # Let them propagate to root logger


def get_tracer(name: str = __name__) -> trace.Tracer:
    """Get a tracer instance for creating custom spans."""
    return trace.get_tracer(name)


def get_current_trace_context() -> dict:
    """
    Get the current trace context for including in API responses.
    
    Returns:
        Dictionary with trace_id and span_id in Dynatrace format
    """
    span = trace.get_current_span()
    span_context = span.get_span_context()
    
    if span_context.is_valid:
        return {
            "trace_id": format(span_context.trace_id, '032x'),
            "span_id": format(span_context.span_id, '016x'),
        }
    
    return {
        "trace_id": "00000000000000000000000000000000",
        "span_id": "0000000000000000",
    }
