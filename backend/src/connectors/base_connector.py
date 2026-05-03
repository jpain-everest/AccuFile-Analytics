"""
Base Connector - Abstract base for all connectors
"""
from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseConnector(ABC):
    """Abstract base class for all system connectors"""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize connector with configuration
        
        Args:
            config: Connector-specific configuration
        """
        self.config = config

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to external system"""
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """Close connection to external system"""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Check if currently connected"""
        pass
