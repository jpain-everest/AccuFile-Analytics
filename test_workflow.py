"""Direct workflow test - bypasses the web server"""
import sys
import json
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from src.utils.config_loader import ConfigLoader
from src.agents.orchestrator import FileReviewOrchestrator
from src.utils.logging_config import setup_logging

setup_logging()

print("\n" + "=" * 60)
print("A&H AccuFile - Direct Workflow Test")
print("=" * 60)

# Load config
config_loader = ConfigLoader(config_dir=str(BACKEND_DIR / "config"))
config = config_loader.load_config()
config["_backend_dir"] = str(BACKEND_DIR)

# Run workflow
orchestrator = FileReviewOrchestrator(config)
results = orchestrator.run()

print("\n" + "=" * 60)
print("WORKFLOW RESULTS")
print("=" * 60)
print(json.dumps(results, indent=2, default=str))
