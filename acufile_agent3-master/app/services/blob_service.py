import re
import logging
from typing import List, Optional, Generator
from azure.storage.blob import BlobServiceClient, ContainerClient, BlobClient
from app.models import (
    RuleType,
    MoveFileRule,
    RenameFileRule,
    RenameFolderRule,
    OperationResult,
    BlobInfo,
)

logger = logging.getLogger(__name__)


class AzureBlobService:
    """Service for Azure Blob Storage operations."""

    def __init__(self, connection_string: str = None, account_name: str = None, account_key: str = None):
        """Initialize the Azure Blob Service client."""
        logger.info("Initializing Azure Blob Service client")
        try:
            if connection_string:
                logger.debug(f"Using connection string (length: {len(connection_string)})")
                self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
                logger.info("Successfully created BlobServiceClient from connection string")
            elif account_name and account_key:
                account_url = f"https://{account_name}.blob.core.windows.net"
                logger.debug(f"Using account URL: {account_url}")
                self.blob_service_client = BlobServiceClient(
                    account_url=account_url,
                    credential=account_key
                )
                logger.info("Successfully created BlobServiceClient from account credentials")
            else:
                logger.error("No valid credentials provided")
                raise ValueError("Either connection_string or account_name and account_key must be provided")
        except Exception as e:
            logger.error(f"Failed to initialize BlobServiceClient: {e}", exc_info=True)
            raise

    def _get_container_client(self, container_name: str) -> ContainerClient:
        """Get a container client."""
        return self.blob_service_client.get_container_client(container_name)

    def _get_blob_client(self, container_name: str, blob_name: str) -> BlobClient:
        """Get a blob client."""
        return self.blob_service_client.get_blob_client(container_name, blob_name)

    def _matches_pattern(self, filename: str, rule_type: RuleType, pattern: str) -> bool:
        """Check if a filename matches the given pattern based on rule type."""
        if rule_type == RuleType.REGEX:
            return bool(re.search(pattern, filename))
        elif rule_type == RuleType.PREFIX:
            return filename.startswith(pattern)
        elif rule_type == RuleType.SUFFIX:
            return filename.endswith(pattern)
        elif rule_type == RuleType.CONTAINS:
            return pattern in filename
        elif rule_type == RuleType.EXACT:
            return filename == pattern
        elif rule_type == RuleType.EXTENSION:
            return filename.endswith(f".{pattern.lstrip('.')}")
        return False

    def _apply_rename_pattern(
        self, 
        filename: str, 
        rule_type: RuleType, 
        match_pattern: str, 
        replace_pattern: str,
        apply_to_extension: bool = False
    ) -> str:
        """Apply rename pattern to a filename."""
        if apply_to_extension:
            name_part = filename
            ext_part = ""
        else:
            # Split filename and extension
            if "." in filename:
                parts = filename.rsplit(".", 1)
                name_part = parts[0]
                ext_part = f".{parts[1]}"
            else:
                name_part = filename
                ext_part = ""

        if rule_type == RuleType.REGEX:
            new_name = re.sub(match_pattern, replace_pattern, name_part)
        elif rule_type == RuleType.PREFIX:
            if name_part.startswith(match_pattern):
                new_name = replace_pattern + name_part[len(match_pattern):]
            else:
                new_name = name_part
        elif rule_type == RuleType.SUFFIX:
            if name_part.endswith(match_pattern):
                new_name = name_part[:-len(match_pattern)] + replace_pattern
            else:
                new_name = name_part
        elif rule_type == RuleType.CONTAINS:
            new_name = name_part.replace(match_pattern, replace_pattern)
        elif rule_type == RuleType.EXACT:
            new_name = replace_pattern if name_part == match_pattern else name_part
        elif rule_type == RuleType.EXTENSION:
            if ext_part.lstrip(".") == match_pattern.lstrip("."):
                return name_part + f".{replace_pattern.lstrip('.')}"
            return filename
        else:
            new_name = name_part

        return new_name + ext_part

    def list_blobs(
        self, 
        container_name: str, 
        folder: str = "", 
        rule_type: Optional[RuleType] = None,
        pattern: Optional[str] = None
    ) -> Generator[BlobInfo, None, None]:
        """List blobs in a container with optional filtering."""
        container_client = self._get_container_client(container_name)
        prefix = f"{folder}/" if folder and not folder.endswith("/") else folder
        
        for blob in container_client.list_blobs(name_starts_with=prefix if prefix else None):
            # Get just the filename without the folder path
            blob_name = blob.name
            filename = blob_name.split("/")[-1] if "/" in blob_name else blob_name
            
            # Skip "folder" blobs (empty blobs ending with /)
            if blob_name.endswith("/"):
                continue
                
            # Apply filter if provided
            if rule_type and pattern:
                if not self._matches_pattern(filename, rule_type, pattern):
                    continue
            
            yield BlobInfo(
                name=blob.name,
                size=blob.size,
                last_modified=blob.last_modified.isoformat() if blob.last_modified else "",
                content_type=blob.content_settings.content_type if blob.content_settings else None
            )

    def move_file(self, rule: MoveFileRule, blob_name: str, dry_run: bool = False) -> OperationResult:
        """Move a single file based on the rule."""
        try:
            # Calculate source and destination paths
            source_path = blob_name
            
            # Get just the filename
            filename = blob_name.split("/")[-1] if "/" in blob_name else blob_name
            
            # Build destination path
            if rule.destination_folder:
                dest_folder = rule.destination_folder.rstrip("/")
                dest_path = f"{dest_folder}/{filename}"
            else:
                dest_path = filename

            if dry_run:
                return OperationResult(
                    success=True,
                    source=f"{rule.source_container}/{source_path}",
                    destination=f"{rule.destination_container}/{dest_path}",
                    message="[DRY RUN] Would move file"
                )

            # Get source and destination clients
            source_blob = self._get_blob_client(rule.source_container, source_path)
            dest_blob = self._get_blob_client(rule.destination_container, dest_path)

            # Check if destination exists
            if not rule.overwrite and dest_blob.exists():
                return OperationResult(
                    success=False,
                    source=f"{rule.source_container}/{source_path}",
                    destination=f"{rule.destination_container}/{dest_path}",
                    message="Destination file already exists and overwrite is disabled"
                )

            # Copy the blob
            dest_blob.start_copy_from_url(source_blob.url)

            # Delete source if requested
            if rule.delete_source:
                source_blob.delete_blob()

            return OperationResult(
                success=True,
                source=f"{rule.source_container}/{source_path}",
                destination=f"{rule.destination_container}/{dest_path}",
                message="File moved successfully"
            )

        except Exception as e:
            return OperationResult(
                success=False,
                source=f"{rule.source_container}/{blob_name}",
                destination=None,
                message=f"Error: {str(e)}"
            )

    def move_files(self, rule: MoveFileRule, dry_run: bool = False) -> List[OperationResult]:
        """Move files based on a rule."""
        results = []
        
        # List matching blobs
        for blob_info in self.list_blobs(
            rule.source_container,
            rule.source_folder,
            rule.rule_type,
            rule.pattern
        ):
            result = self.move_file(rule, blob_info.name, dry_run)
            results.append(result)
        
        return results

    def rename_blob(
        self,
        container_name: str,
        source_blob_path: str,
        destination_blob_path: str,
        overwrite: bool = True
    ) -> OperationResult:
        """
        Rename a blob by copying to new name and deleting original.
        
        Args:
            container_name: Name of the container
            source_blob_path: Full path of the source blob
            destination_blob_path: Full path for the renamed blob
            overwrite: Whether to overwrite if destination exists
            
        Returns:
            OperationResult with success status and details
        """
        try:
            logger.info(f"Renaming blob: {source_blob_path} -> {destination_blob_path}")
            
            source_blob = self._get_blob_client(container_name, source_blob_path)
            dest_blob = self._get_blob_client(container_name, destination_blob_path)
            
            # Check if source exists
            if not source_blob.exists():
                logger.warning(f"Source blob does not exist: {source_blob_path}")
                return OperationResult(
                    success=False,
                    source=f"{container_name}/{source_blob_path}",
                    destination=f"{container_name}/{destination_blob_path}",
                    message="Source blob does not exist"
                )
            
            # Check if destination already exists
            if not overwrite and dest_blob.exists():
                logger.warning(f"Destination blob already exists: {destination_blob_path}")
                return OperationResult(
                    success=False,
                    source=f"{container_name}/{source_blob_path}",
                    destination=f"{container_name}/{destination_blob_path}",
                    message="Destination blob already exists and overwrite is disabled"
                )
            
            # Copy to new location
            dest_blob.start_copy_from_url(source_blob.url)
            
            # Delete original
            source_blob.delete_blob()
            
            logger.info(f"Successfully renamed blob: {source_blob_path} -> {destination_blob_path}")
            return OperationResult(
                success=True,
                source=f"{container_name}/{source_blob_path}",
                destination=f"{container_name}/{destination_blob_path}",
                message="Blob renamed successfully"
            )
            
        except Exception as e:
            logger.exception(f"Error renaming blob {source_blob_path}: {str(e)}")
            return OperationResult(
                success=False,
                source=f"{container_name}/{source_blob_path}",
                destination=f"{container_name}/{destination_blob_path}",
                message=f"Error: {str(e)}"
            )

    def rename_file(
        self, 
        rule: RenameFileRule, 
        blob_name: str, 
        dry_run: bool = False
    ) -> OperationResult:
        """Rename a single file based on the rule."""
        try:
            # Get the folder path and filename
            if "/" in blob_name:
                folder_path = "/".join(blob_name.split("/")[:-1])
                filename = blob_name.split("/")[-1]
            else:
                folder_path = ""
                filename = blob_name

            # Apply the rename pattern
            new_filename = self._apply_rename_pattern(
                filename,
                rule.rule_type,
                rule.match_pattern,
                rule.replace_pattern,
                rule.apply_to_extension
            )

            # Skip if no change
            if new_filename == filename:
                return OperationResult(
                    success=True,
                    source=f"{rule.container}/{blob_name}",
                    destination=None,
                    message="No change required"
                )

            # Build new path
            if folder_path:
                new_path = f"{folder_path}/{new_filename}"
            else:
                new_path = new_filename

            if dry_run:
                return OperationResult(
                    success=True,
                    source=f"{rule.container}/{blob_name}",
                    destination=f"{rule.container}/{new_path}",
                    message="[DRY RUN] Would rename file"
                )

            # Get blob clients
            source_blob = self._get_blob_client(rule.container, blob_name)
            dest_blob = self._get_blob_client(rule.container, new_path)

            # Copy and delete (rename)
            dest_blob.start_copy_from_url(source_blob.url)
            source_blob.delete_blob()

            return OperationResult(
                success=True,
                source=f"{rule.container}/{blob_name}",
                destination=f"{rule.container}/{new_path}",
                message="File renamed successfully"
            )

        except Exception as e:
            return OperationResult(
                success=False,
                source=f"{rule.container}/{blob_name}",
                destination=None,
                message=f"Error: {str(e)}"
            )

    def rename_files(self, rule: RenameFileRule, dry_run: bool = False) -> List[OperationResult]:
        """Rename files based on a rule."""
        results = []
        
        # List all blobs in the folder
        for blob_info in self.list_blobs(rule.container, rule.folder):
            # Get just the filename
            filename = blob_info.name.split("/")[-1] if "/" in blob_info.name else blob_info.name
            
            # Check if pattern matches
            if self._matches_pattern(filename, rule.rule_type, rule.match_pattern):
                result = self.rename_file(rule, blob_info.name, dry_run)
                results.append(result)
        
        return results

    def rename_folder(self, rule: RenameFolderRule, dry_run: bool = False) -> List[OperationResult]:
        """
        Rename a folder (virtual directory) by moving all blobs.
        In Azure Blob Storage, folders are virtual, so we rename by copying all blobs
        to a new prefix and deleting the originals.
        """
        results = []
        container_client = self._get_container_client(rule.container)
        
        source_prefix = rule.source_folder.rstrip("/") + "/"
        dest_prefix = rule.destination_folder.rstrip("/") + "/"
        
        # List all blobs with the source prefix
        blobs_to_move = list(container_client.list_blobs(name_starts_with=source_prefix))
        
        for blob in blobs_to_move:
            try:
                # Calculate new path
                relative_path = blob.name[len(source_prefix):]
                new_path = dest_prefix + relative_path
                
                if dry_run:
                    results.append(OperationResult(
                        success=True,
                        source=f"{rule.container}/{blob.name}",
                        destination=f"{rule.container}/{new_path}",
                        message="[DRY RUN] Would rename/move blob"
                    ))
                    continue

                # Get blob clients
                source_blob = self._get_blob_client(rule.container, blob.name)
                dest_blob = self._get_blob_client(rule.container, new_path)

                # Copy and delete
                dest_blob.start_copy_from_url(source_blob.url)
                source_blob.delete_blob()

                results.append(OperationResult(
                    success=True,
                    source=f"{rule.container}/{blob.name}",
                    destination=f"{rule.container}/{new_path}",
                    message="Blob moved successfully"
                ))

            except Exception as e:
                results.append(OperationResult(
                    success=False,
                    source=f"{rule.container}/{blob.name}",
                    destination=None,
                    message=f"Error: {str(e)}"
                ))

        return results

    def list_containers(self) -> List[str]:
        """List all containers in the storage account."""
        logger.info("Listing all containers")
        try:
            containers = [c.name for c in self.blob_service_client.list_containers()]
            logger.info(f"Found {len(containers)} containers: {containers}")
            return containers
        except Exception as e:
            logger.error(f"Failed to list containers: {e}", exc_info=True)
            raise

    def container_exists(self, container_name: str) -> bool:
        """Check if a container exists."""
        logger.debug(f"Checking if container exists: {container_name}")
        try:
            container_client = self._get_container_client(container_name)
            exists = container_client.exists()
            logger.debug(f"Container '{container_name}' exists: {exists}")
            return exists
        except Exception as e:
            logger.error(f"Failed to check container existence: {e}", exc_info=True)
            raise
