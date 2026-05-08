from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from enum import Enum


class RuleType(str, Enum):
    """Types of rules that can be applied."""
    REGEX = "regex"
    PREFIX = "prefix"
    SUFFIX = "suffix"
    CONTAINS = "contains"
    EXACT = "exact"
    EXTENSION = "extension"


class MoveFileRule(BaseModel):
    """Rule for moving files between folders."""
    
    source_container: str = Field(..., description="Source container name")
    source_folder: str = Field("", description="Source folder path (empty for root)")
    destination_container: str = Field(..., description="Destination container name")
    destination_folder: str = Field("", description="Destination folder path")
    rule_type: RuleType = Field(RuleType.CONTAINS, description="Type of matching rule")
    pattern: str = Field(..., description="Pattern to match files")
    overwrite: bool = Field(False, description="Overwrite existing files")
    delete_source: bool = Field(True, description="Delete source file after copy")


class RenameFileRule(BaseModel):
    """Rule for renaming files."""
    
    container: str = Field(..., description="Container name")
    folder: str = Field("", description="Folder path (empty for root)")
    rule_type: RuleType = Field(RuleType.REGEX, description="Type of matching rule")
    match_pattern: str = Field(..., description="Pattern to match in filename")
    replace_pattern: str = Field(..., description="Replacement pattern")
    apply_to_extension: bool = Field(False, description="Apply rule to file extension")


class RenameFolderRule(BaseModel):
    """Rule for renaming folders (virtual directories in blob storage)."""
    
    container: str = Field(..., description="Container name")
    source_folder: str = Field(..., description="Source folder path to rename")
    destination_folder: str = Field(..., description="New folder name/path")
    recursive: bool = Field(True, description="Include all nested files/folders")


class BulkMoveRequest(BaseModel):
    """Request model for bulk move operations."""
    
    rules: List[MoveFileRule] = Field(..., description="List of move rules to apply")
    dry_run: bool = Field(False, description="Preview changes without applying")


class BulkRenameFileRequest(BaseModel):
    """Request model for bulk file rename operations."""
    
    rules: List[RenameFileRule] = Field(..., description="List of rename rules to apply")
    dry_run: bool = Field(False, description="Preview changes without applying")


class BulkRenameFolderRequest(BaseModel):
    """Request model for bulk folder rename operations."""
    
    rules: List[RenameFolderRule] = Field(..., description="List of folder rename rules")
    dry_run: bool = Field(False, description="Preview changes without applying")


class OperationResult(BaseModel):
    """Result of a single operation."""
    
    success: bool
    source: str
    destination: Optional[str] = None
    message: str


class BulkOperationResponse(BaseModel):
    """Response model for bulk operations."""
    
    total_processed: int
    successful: int
    failed: int
    dry_run: bool
    results: List[OperationResult]


class BlobInfo(BaseModel):
    """Information about a blob."""
    
    name: str
    size: int
    last_modified: str
    content_type: Optional[str] = None


class ContainerInfo(BaseModel):
    """Information about a container."""
    
    name: str
    blobs: List[BlobInfo]
    total_count: int


class OrchestrationRequest(BaseModel):
    """
    Request model for orchestrated operations.
    Allows combining multiple operation types in a single request.
    """
    
    rename_file_rules: List[RenameFileRule] = Field(default=[], description="Rules for renaming files")
    rename_folder_rules: List[RenameFolderRule] = Field(default=[], description="Rules for renaming folders")
    move_file_rules: List[MoveFileRule] = Field(default=[], description="Rules for moving files")
    dry_run: bool = Field(False, description="Preview changes without applying")
    stop_on_error: bool = Field(False, description="Stop processing if an error occurs")


class OrchestrationResponse(BaseModel):
    """Response model for orchestrated operations."""
    
    total_processed: int
    successful: int
    failed: int
    dry_run: bool
    rename_file_results: List[OperationResult] = Field(default=[], description="Results from file rename operations")
    rename_folder_results: List[OperationResult] = Field(default=[], description="Results from folder rename operations")
    move_file_results: List[OperationResult] = Field(default=[], description="Results from file move operations")


# ============ Folder Structure Based Orchestration Models ============

class FileInfo(BaseModel):
    """Information about a file in the folder structure."""
    
    found: str = Field(..., description="Status: 'true', 'false', or 'High Confidence Match'")
    actual_file_name: Optional[str] = Field(None, description="Current actual filename in storage")
    
    def should_rename(self) -> bool:
        """Check if file should be renamed based on 'found' value."""
        return self.found.lower() == "high confidence match"


class FolderInfo(BaseModel):
    """Information about a folder in the structure."""
    
    found: str = Field(..., description="Status: 'true', 'false', or 'High Confidence Match'")
    actual_folder_name: Optional[str] = Field(None, description="Current actual folder name in storage")
    files: Dict[str, FileInfo] = Field(default={}, description="Files within this folder (key=target name)")
    
    def should_rename(self) -> bool:
        """Check if folder should be renamed based on 'found' value."""
        return self.found.lower() == "high confidence match"


class FolderStructureOrchestrationRequest(BaseModel):
    """
    Request model for folder structure based orchestration.
    
    This model accepts a folder structure that describes the current state 
    and desired naming of folders and files. The orchestration will:
    1. Rename folders from actual_folder_name to the target name (dict key) when found="High Confidence Match"
    2. Rename files from actual_file_name to the target name (dict key) when found="High Confidence Match"
    
    Container is always "landingzone" by default.
    
    Example:
    ```json
    {
        "base_path": "",
        "_folder_structure": {
            "Underwriter Doc Folder": {
                "found": "true",
                "actual_folder_name": "2025-2026",
                "files": {
                    "UW File Quote": {
                        "found": "false",
                        "actual_file_name": null
                    },
                    "UW Rater": {
                        "found": "true",
                        "actual_file_name": "Rater.txt"
                    }
                }
            },
            "Policy Folder": {
                "found": "High Confidence Match",
                "actual_folder_name": "Policy",
                "files": {
                    "Policy Document": {
                        "found": "High Confidence Match",
                        "actual_file_name": "Pol - 2025.3.13 - YWCA Alaska.pdf"
                    },
                    "Policy PO App": {
                        "found": "false",
                        "actual_file_name": null
                    }
                }
            }
        },
        "dry_run": true
    }
    ```
    """
    
    container: str = Field(default="landingzone", description="Container name (default: landingzone)")
    base_path: str = Field(default="", description="Base path/prefix for all operations")
    folder_structure: Dict[str, FolderInfo] = Field(..., alias="_folder_structure", description="Folder structure with target names as keys")
    rename_folders: bool = Field(default=True, description="Whether to rename folders to target names")
    rename_files: bool = Field(default=True, description="Whether to rename files to target names")
    preserve_extension: bool = Field(default=True, description="Preserve original file extension when renaming")
    dry_run: bool = Field(default=False, description="Preview changes without applying")
    stop_on_error: bool = Field(default=False, description="Stop processing if an error occurs")
    
    model_config = {"populate_by_name": True}


class FolderStructureOrchestrationResponse(BaseModel):
    """Response model for folder structure based orchestration."""
    
    total_processed: int
    successful: int
    failed: int
    skipped: int
    dry_run: bool
    folder_rename_results: List[OperationResult] = Field(default=[], description="Results from folder rename operations")
    file_rename_results: List[OperationResult] = Field(default=[], description="Results from file rename operations")
