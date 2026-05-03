"""
Configuration Loader - Load and manage configuration
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict

import yaml

logger = logging.getLogger(__name__)


class ConfigLoader:
    """Load configuration from files"""

    def __init__(self, config_dir: str | None = None):
        """
        Initialize config loader
        
        Args:
            config_dir: Configuration directory path
        """
        self.config_dir = Path(config_dir or "config")
        self.config_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"ConfigLoader initialized with directory: {self.config_dir}")

    def load_config(self) -> Dict[str, Any]:
        """
        Load all configuration files
        
        Returns:
            Complete configuration dictionary
        """
        config = {}
        
        logger.info("Loading configuration files...")
        
        # Load Peak configuration
        peak_config = self._load_yaml_config("peak_config.yml")
        config["peak"] = peak_config
        
        # Load storage configuration
        storage_config = self._load_yaml_config("storage_config.yml")
        config["storage"] = storage_config
        
        # Load validation rules
        validation_config = self._load_yaml_config("validation_rules.yml")
        config["validation"] = validation_config
        
        # Load reporting configuration
        reporting_config = self._load_yaml_config("reporting_config.yml")
        config["reporting"] = reporting_config
        
        # Load environment-specific overrides
        env_config = self._load_env_overrides()
        config.update(env_config)
        
        logger.info("Configuration loading complete")
        return config

    def _load_yaml_config(self, filename: str) -> Dict[str, Any]:
        """
        Load YAML configuration file
        
        Args:
            filename: Configuration filename
            
        Returns:
            Configuration dictionary
        """
        filepath = self.config_dir / filename
        
        if not filepath.exists():
            logger.warning(f"Configuration file not found: {filepath}")
            return {}
        
        try:
            with open(filepath, 'r') as f:
                config = yaml.safe_load(f) or {}
            logger.debug(f"Loaded configuration from: {filepath}")
            return config
        except Exception as e:
            logger.error(f"Error loading YAML config {filepath}: {str(e)}")
            return {}

    def _load_env_overrides(self) -> Dict[str, Any]:
        """
        Load environment variable overrides
        
        Returns:
            Configuration overrides from environment
        """
        from dotenv import dotenv_values
        
        env_file = self.config_dir / ".env"
        
        if not env_file.exists():
            logger.debug("No .env file found for overrides")
            return {}
        
        try:
            env_vars = dotenv_values(env_file)
            logger.debug(f"Loaded {len(env_vars)} environment overrides")
            return {"env": env_vars}
        except Exception as e:
            logger.error(f"Error loading environment overrides: {str(e)}")
            return {}

    def save_config(self, config: Dict[str, Any], filename: str) -> bool:
        """
        Save configuration to file
        
        Args:
            config: Configuration dictionary
            filename: Target filename
            
        Returns:
            True if successful
        """
        filepath = self.config_dir / filename
        
        try:
            with open(filepath, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
            logger.info(f"Configuration saved to: {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error saving configuration: {str(e)}")
            return False
