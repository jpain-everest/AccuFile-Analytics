"""
Storage Connector - Connection to Shared Drive and local storage
"""
import logging
from pathlib import Path
from typing import Any, Dict, List

from src.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)


class StorageConnector(BaseConnector):
    """Connector for file storage systems (Shared Drive, local storage)"""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Storage connector
        
        Args:
            config: Storage connection configuration
        """
        super().__init__(config)
        self.shared_drive_path = config.get("shared_drive_path", "")
        self.local_cache_path = config.get("local_cache_path", "data/cache")
        self.connected = False
        self.available_files = []
        logger.info(f"StorageConnector initialized for path: {self.shared_drive_path}")

    def connect(self) -> bool:
        """
        Establish connection to storage
        
        Returns:
            True if connection successful
        """
        try:
            logger.info(f"Connecting to storage: {self.shared_drive_path}")
            
            # Check if path is accessible
            path = Path(self.shared_drive_path)
            if not path.exists():
                raise FileNotFoundError(f"Storage path not found: {self.shared_drive_path}")
            
            self.connected = True
            logger.info("Successfully connected to storage")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to storage: {str(e)}")
            self.connected = False
            return False

    def disconnect(self) -> bool:
        """
        Close storage connection
        
        Returns:
            True if disconnection successful
        """
        try:
            logger.info("Disconnecting from storage...")
            self.connected = False
            logger.info("Successfully disconnected from storage")
            return True
        except Exception as e:
            logger.error(f"Error disconnecting from storage: {str(e)}")
            return False

    def is_connected(self) -> bool:
        """Check connection status"""
        return self.connected

    def list_files(self, pattern: str = "*") -> List[Path]:
        """
        List files in storage
        
        Args:
            pattern: File pattern to match
            
        Returns:
            List of file paths
        """
        if not self.connected:
            raise ConnectionError("Not connected to storage")
        
        logger.info(f"Listing files with pattern: {pattern}")
        
        files = []
        try:
            path = Path(self.shared_drive_path)
            files = list(path.rglob(pattern))
            logger.debug(f"Found {len(files)} files matching pattern")
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
        
        return files

    def get_file(self, file_path: str) -> bytes | None:
        """
        Read file from storage
        
        Args:
            file_path: Path to file
            
        Returns:
            File contents as bytes
        """
        if not self.connected:
            raise ConnectionError("Not connected to storage")
        
        try:
            path = Path(file_path)
            if path.exists() and path.is_file():
                with open(path, 'rb') as f:
                    return f.read()
            else:
                logger.warning(f"File not found: {file_path}")
                return None
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return None

    def put_file(self, file_path: str, contents: bytes) -> bool:
        """
        Write file to storage
        
        Args:
            file_path: Destination path
            contents: File contents as bytes
            
        Returns:
            True if successful
        """
        if not self.connected:
            raise ConnectionError("Not connected to storage")
        
        try:
            path = Path(file_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, 'wb') as f:
                f.write(contents)
            logger.info(f"File written: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error writing file: {str(e)}")
            return False
