"""
Main entry point for A&H AccuFile application
"""
import logging
from datetime import datetime
from pathlib import Path

from src.agents.orchestrator import FileReviewOrchestrator
from src.utils.config_loader import ConfigLoader
from src.utils.logging_config import setup_logging

# Resolve the backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent

logger = logging.getLogger(__name__)


def main():
    """Main entry point for A&H AccuFile workflow"""
    # Setup logging
    setup_logging()
    logger.info("="*80)
    logger.info(f"A&H AccuFile Workflow Started - {datetime.now().isoformat()}")
    logger.info("="*80)

    try:
        # Load configuration
        config_loader = ConfigLoader(config_dir=str(BACKEND_DIR / "config"))
        config = config_loader.load_config()
        config["_backend_dir"] = str(BACKEND_DIR)
        logger.info(f"Configuration loaded from: {config_loader.config_dir}")

        # Initialize orchestrator
        orchestrator = FileReviewOrchestrator(config)
        
        # Run the complete workflow
        results = orchestrator.run()
        
        logger.info("="*80)
        logger.info(f"A&H AccuFile Workflow Completed - {datetime.now().isoformat()}")
        logger.info(f"Results: {results}")
        logger.info("="*80)
        
        return results

    except Exception as e:
        logger.error(f"Workflow failed with error: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
