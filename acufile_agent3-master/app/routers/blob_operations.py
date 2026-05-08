from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.models import (
    MoveFileRule,
    RenameFileRule,
    RenameFolderRule,
    BulkMoveRequest,
    BulkRenameFileRequest,
    BulkRenameFolderRequest,
    BulkOperationResponse,
    OperationResult,
    BlobInfo,
    ContainerInfo,
    RuleType,
    OrchestrationRequest,
    OrchestrationResponse,
    FolderStructureOrchestrationRequest,
    FolderStructureOrchestrationResponse,
)
import logging

logger = logging.getLogger(__name__)
from app.services.blob_service import AzureBlobService
from app.dependencies import get_blob_service

router = APIRouter(prefix="/blobs", tags=["Blob Operations"])


@router.get("/containers", response_model=List[str])
async def list_containers(
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """List all containers in the storage account."""
    try:
        return blob_service.list_containers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/containers/{container_name}/blobs", response_model=ContainerInfo)
async def list_blobs(
    container_name: str,
    folder: str = Query("", description="Folder path to list"),
    rule_type: Optional[RuleType] = Query(None, description="Filter rule type"),
    pattern: Optional[str] = Query(None, description="Filter pattern"),
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """List blobs in a container with optional filtering."""
    try:
        if not blob_service.container_exists(container_name):
            raise HTTPException(status_code=404, detail=f"Container '{container_name}' not found")
        
        blobs = list(blob_service.list_blobs(container_name, folder, rule_type, pattern))
        return ContainerInfo(
            name=container_name,
            blobs=blobs,
            total_count=len(blobs)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/move", response_model=BulkOperationResponse)
async def move_files(
    request: BulkMoveRequest,
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """
    Move files based on provided rules.
    
    Each rule specifies:
    - Source and destination containers/folders
    - Pattern matching rule (regex, prefix, suffix, contains, exact, extension)
    - Whether to overwrite existing files
    - Whether to delete source after copy
    
    Use dry_run=true to preview changes without applying them.
    """
    all_results: List[OperationResult] = []
    
    for rule in request.rules:
        try:
            # Validate containers exist
            if not blob_service.container_exists(rule.source_container):
                all_results.append(OperationResult(
                    success=False,
                    source=f"{rule.source_container}/{rule.source_folder}",
                    destination=None,
                    message=f"Source container '{rule.source_container}' not found"
                ))
                continue
                
            if not blob_service.container_exists(rule.destination_container):
                all_results.append(OperationResult(
                    success=False,
                    source=f"{rule.source_container}/{rule.source_folder}",
                    destination=f"{rule.destination_container}/{rule.destination_folder}",
                    message=f"Destination container '{rule.destination_container}' not found"
                ))
                continue
            
            results = blob_service.move_files(rule, request.dry_run)
            all_results.extend(results)
            
        except Exception as e:
            all_results.append(OperationResult(
                success=False,
                source=f"{rule.source_container}/{rule.source_folder}",
                destination=None,
                message=f"Error processing rule: {str(e)}"
            ))
    
    successful = sum(1 for r in all_results if r.success)
    
    return BulkOperationResponse(
        total_processed=len(all_results),
        successful=successful,
        failed=len(all_results) - successful,
        dry_run=request.dry_run,
        results=all_results
    )


@router.post("/rename-files", response_model=BulkOperationResponse)
async def rename_files(
    request: BulkRenameFileRequest,
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """
    Rename files based on provided rules.
    
    Each rule specifies:
    - Container and folder to search
    - Match pattern and replacement pattern
    - Rule type (regex, prefix, suffix, contains, exact, extension)
    - Whether to apply to file extension
    
    Use dry_run=true to preview changes without applying them.
    """
    all_results: List[OperationResult] = []
    
    for rule in request.rules:
        try:
            if not blob_service.container_exists(rule.container):
                all_results.append(OperationResult(
                    success=False,
                    source=f"{rule.container}/{rule.folder}",
                    destination=None,
                    message=f"Container '{rule.container}' not found"
                ))
                continue
            
            results = blob_service.rename_files(rule, request.dry_run)
            all_results.extend(results)
            
        except Exception as e:
            all_results.append(OperationResult(
                success=False,
                source=f"{rule.container}/{rule.folder}",
                destination=None,
                message=f"Error processing rule: {str(e)}"
            ))
    
    successful = sum(1 for r in all_results if r.success)
    
    return BulkOperationResponse(
        total_processed=len(all_results),
        successful=successful,
        failed=len(all_results) - successful,
        dry_run=request.dry_run,
        results=all_results
    )


@router.post("/rename-folders", response_model=BulkOperationResponse)
async def rename_folders(
    request: BulkRenameFolderRequest,
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """
    Rename folders (virtual directories) based on provided rules.
    
    In Azure Blob Storage, folders are virtual. This operation moves all blobs
    from the source prefix to the destination prefix.
    
    Each rule specifies:
    - Container name
    - Source folder path
    - Destination folder path
    
    Use dry_run=true to preview changes without applying them.
    """
    all_results: List[OperationResult] = []
    
    for rule in request.rules:
        try:
            if not blob_service.container_exists(rule.container):
                all_results.append(OperationResult(
                    success=False,
                    source=f"{rule.container}/{rule.source_folder}",
                    destination=None,
                    message=f"Container '{rule.container}' not found"
                ))
                continue
            
            results = blob_service.rename_folder(rule, request.dry_run)
            all_results.extend(results)
            
        except Exception as e:
            all_results.append(OperationResult(
                success=False,
                source=f"{rule.container}/{rule.source_folder}",
                destination=None,
                message=f"Error processing rule: {str(e)}"
            ))
    
    successful = sum(1 for r in all_results if r.success)
    
    return BulkOperationResponse(
        total_processed=len(all_results),
        successful=successful,
        failed=len(all_results) - successful,
        dry_run=request.dry_run,
        results=all_results
    )


@router.post("/move/single", response_model=OperationResult)
async def move_single_file(
    rule: MoveFileRule,
    blob_name: str = Query(..., description="Full blob name/path to move"),
    dry_run: bool = Query(False, description="Preview without applying"),
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """Move a single specific file."""
    try:
        if not blob_service.container_exists(rule.source_container):
            raise HTTPException(
                status_code=404,
                detail=f"Source container '{rule.source_container}' not found"
            )
        
        if not blob_service.container_exists(rule.destination_container):
            raise HTTPException(
                status_code=404,
                detail=f"Destination container '{rule.destination_container}' not found"
            )
        
        return blob_service.move_file(rule, blob_name, dry_run)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rename-files/single", response_model=OperationResult)
async def rename_single_file(
    rule: RenameFileRule,
    blob_name: str = Query(..., description="Full blob name/path to rename"),
    dry_run: bool = Query(False, description="Preview without applying"),
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """Rename a single specific file."""
    try:
        if not blob_service.container_exists(rule.container):
            raise HTTPException(
                status_code=404,
                detail=f"Container '{rule.container}' not found"
            )
        
        return blob_service.rename_file(rule, blob_name, dry_run)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orchestrate", response_model=OrchestrationResponse, tags=["Orchestration"])
async def orchestrate_operations(
    request: OrchestrationRequest,
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """
    Orchestrate multiple blob operations in a single request.
    
    This endpoint allows you to combine:
    - Rename files (based on pattern matching rules)
    - Rename folders (move all blobs from one prefix to another)
    - Move files (between containers/folders)
    
    Operations are executed in order:
    1. Rename files
    2. Rename folders  
    3. Move files
    
    Use `dry_run=true` to preview all changes without applying them.
    Use `stop_on_error=true` to halt processing if any operation fails.
    
    **Example Request:**
    ```json
    {
        "rename_file_rules": [
            {
                "container": "mycontainer",
                "folder": "documents",
                "rule_type": "regex",
                "match_pattern": "old_prefix_",
                "replace_pattern": "new_prefix_"
            }
        ],
        "rename_folder_rules": [
            {
                "container": "mycontainer",
                "source_folder": "temp/processing",
                "destination_folder": "archive/processed"
            }
        ],
        "move_file_rules": [
            {
                "source_container": "staging",
                "source_folder": "uploads",
                "destination_container": "production",
                "destination_folder": "data",
                "rule_type": "extension",
                "pattern": "csv"
            }
        ],
        "dry_run": true,
        "stop_on_error": false
    }
    ```
    """
    rename_file_results: List[OperationResult] = []
    rename_folder_results: List[OperationResult] = []
    move_file_results: List[OperationResult] = []
    has_error = False
    
    logger.info(f"Starting orchestration - dry_run={request.dry_run}, stop_on_error={request.stop_on_error}")
    logger.info(f"Rules: {len(request.rename_file_rules)} file renames, {len(request.rename_folder_rules)} folder renames, {len(request.move_file_rules)} file moves")
    
    # Step 1: Rename files
    for rule in request.rename_file_rules:
        if has_error and request.stop_on_error:
            break
        try:
            logger.info(f"Processing file rename rule: container={rule.container}, folder={rule.folder}, pattern={rule.match_pattern}")
            if not blob_service.container_exists(rule.container):
                result = OperationResult(
                    success=False,
                    source=f"{rule.container}/{rule.folder}",
                    destination=None,
                    message=f"Container '{rule.container}' not found"
                )
                rename_file_results.append(result)
                has_error = True
                logger.error(f"Container not found: {rule.container}")
                continue
            
            results = blob_service.rename_files(rule, request.dry_run)
            rename_file_results.extend(results)
            
            failed_count = sum(1 for r in results if not r.success)
            if failed_count > 0:
                has_error = True
                logger.warning(f"File rename completed with {failed_count} failures")
            else:
                logger.info(f"File rename completed successfully: {len(results)} files processed")
                
        except Exception as e:
            has_error = True
            logger.exception(f"Error processing file rename rule: {str(e)}")
            rename_file_results.append(OperationResult(
                success=False,
                source=f"{rule.container}/{rule.folder}",
                destination=None,
                message=f"Error: {str(e)}"
            ))
    
    # Step 2: Rename folders
    for rule in request.rename_folder_rules:
        if has_error and request.stop_on_error:
            break
        try:
            logger.info(f"Processing folder rename rule: container={rule.container}, {rule.source_folder} -> {rule.destination_folder}")
            if not blob_service.container_exists(rule.container):
                result = OperationResult(
                    success=False,
                    source=f"{rule.container}/{rule.source_folder}",
                    destination=None,
                    message=f"Container '{rule.container}' not found"
                )
                rename_folder_results.append(result)
                has_error = True
                logger.error(f"Container not found: {rule.container}")
                continue
            
            results = blob_service.rename_folder(rule, request.dry_run)
            rename_folder_results.extend(results)
            
            failed_count = sum(1 for r in results if not r.success)
            if failed_count > 0:
                has_error = True
                logger.warning(f"Folder rename completed with {failed_count} failures")
            else:
                logger.info(f"Folder rename completed successfully: {len(results)} blobs moved")
                
        except Exception as e:
            has_error = True
            logger.exception(f"Error processing folder rename rule: {str(e)}")
            rename_folder_results.append(OperationResult(
                success=False,
                source=f"{rule.container}/{rule.source_folder}",
                destination=None,
                message=f"Error: {str(e)}"
            ))
    
    # Step 3: Move files
    for rule in request.move_file_rules:
        if has_error and request.stop_on_error:
            break
        try:
            logger.info(f"Processing move rule: {rule.source_container}/{rule.source_folder} -> {rule.destination_container}/{rule.destination_folder}")
            if not blob_service.container_exists(rule.source_container):
                result = OperationResult(
                    success=False,
                    source=f"{rule.source_container}/{rule.source_folder}",
                    destination=None,
                    message=f"Source container '{rule.source_container}' not found"
                )
                move_file_results.append(result)
                has_error = True
                logger.error(f"Source container not found: {rule.source_container}")
                continue
            
            if not blob_service.container_exists(rule.destination_container):
                result = OperationResult(
                    success=False,
                    source=f"{rule.source_container}/{rule.source_folder}",
                    destination=f"{rule.destination_container}/{rule.destination_folder}",
                    message=f"Destination container '{rule.destination_container}' not found"
                )
                move_file_results.append(result)
                has_error = True
                logger.error(f"Destination container not found: {rule.destination_container}")
                continue
            
            results = blob_service.move_files(rule, request.dry_run)
            move_file_results.extend(results)
            
            failed_count = sum(1 for r in results if not r.success)
            if failed_count > 0:
                has_error = True
                logger.warning(f"File move completed with {failed_count} failures")
            else:
                logger.info(f"File move completed successfully: {len(results)} files moved")
                
        except Exception as e:
            has_error = True
            logger.exception(f"Error processing move rule: {str(e)}")
            move_file_results.append(OperationResult(
                success=False,
                source=f"{rule.source_container}/{rule.source_folder}",
                destination=None,
                message=f"Error: {str(e)}"
            ))
    
    # Calculate totals
    all_results = rename_file_results + rename_folder_results + move_file_results
    total_processed = len(all_results)
    successful = sum(1 for r in all_results if r.success)
    failed = total_processed - successful
    
    logger.info(f"Orchestration complete: {total_processed} total, {successful} successful, {failed} failed")
    
    return OrchestrationResponse(
        total_processed=total_processed,
        successful=successful,
        failed=failed,
        dry_run=request.dry_run,
        rename_file_results=rename_file_results,
        rename_folder_results=rename_folder_results,
        move_file_results=move_file_results
    )


@router.post("/orchestrate/folder-structure", response_model=FolderStructureOrchestrationResponse, tags=["Orchestration"])
async def orchestrate_folder_structure(
    request: FolderStructureOrchestrationRequest,
    blob_service: AzureBlobService = Depends(get_blob_service)
):
    """
    Orchestrate file and folder renaming based on a folder structure definition.
    
    This endpoint processes a folder structure and renames folders/files when 
    `found` = "High Confidence Match" (case-insensitive).
    
    **Renaming Logic:**
    - Container is always "landingzone" by default
    - Only items with `found: "High Confidence Match"` will be renamed
    - Folders are renamed from `actual_folder_name` to the parent key name
    - Files are renamed from `actual_file_name` to the parent key name
    - Items with `found: "true"` or `found: "false"` will be skipped
    
    Use `dry_run=true` to preview all changes without applying them.
    
    **Example Request:**
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
    
    In this example:
    - "Policy" folder will be renamed to "Policy Folder" (found="High Confidence Match")
    - "Pol - 2025.3.13 - YWCA Alaska.pdf" will be renamed to "Policy Document.pdf" (found="High Confidence Match")
    - "2025-2026" folder will NOT be renamed (found="true", not "High Confidence Match")
    - "Rater.txt" will NOT be renamed (found="true", not "High Confidence Match")
    """
    folder_rename_results: List[OperationResult] = []
    file_rename_results: List[OperationResult] = []
    skipped = 0
    has_error = False
    
    # Get folder structure from the aliased field
    folder_structure = request.folder_structure
    
    logger.info(f"Starting folder structure orchestration - container={request.container}, base_path={request.base_path}, dry_run={request.dry_run}")
    logger.info(f"Processing {len(folder_structure)} folders")
    
    # Validate container exists
    if not blob_service.container_exists(request.container):
        raise HTTPException(
            status_code=404,
            detail=f"Container '{request.container}' not found"
        )
    
    # Build base path
    base_path = request.base_path.rstrip("/") if request.base_path else ""
    
    # Process each folder in the structure
    for target_folder_name, folder_info in folder_structure.items():
        if has_error and request.stop_on_error:
            break
        
        actual_folder_name = folder_info.actual_folder_name
        
        # Check if folder should be processed (needs actual_folder_name to locate it)
        if not actual_folder_name:
            logger.info(f"Skipping folder '{target_folder_name}' - no actual_folder_name provided")
            skipped += 1
            continue
        
        # Build current and target folder paths
        if base_path:
            current_folder_path = f"{base_path}/{actual_folder_name}"
            target_folder_path = f"{base_path}/{target_folder_name}"
        else:
            current_folder_path = actual_folder_name
            target_folder_path = target_folder_name
        
        # Step 1: Rename files within the folder FIRST (before folder rename)
        if request.rename_files and folder_info.files:
            for target_file_name, file_info in folder_info.files.items():
                if has_error and request.stop_on_error:
                    break
                
                actual_file_name = file_info.actual_file_name
                
                # Skip if no actual file name provided
                if not actual_file_name:
                    logger.info(f"Skipping file '{target_file_name}' - no actual_file_name provided")
                    skipped += 1
                    continue
                
                # Only rename if found = "High Confidence"
                if not file_info.should_rename():
                    logger.info(f"Skipping file '{actual_file_name}' - found is not 'High Confidence' (found={file_info.found})")
                    skipped += 1
                    continue
                
                # Skip if names are already the same
                if actual_file_name == target_file_name:
                    logger.info(f"File '{actual_file_name}' already has target name, skipping")
                    skipped += 1
                    continue
                
                # Determine the new filename
                new_file_name = target_file_name
                if request.preserve_extension and "." in actual_file_name:
                    # Get extension from actual file
                    ext = actual_file_name.rsplit(".", 1)[-1]
                    # Only add extension if target doesn't already have one
                    if "." not in target_file_name:
                        new_file_name = f"{target_file_name}.{ext}"
                
                # Build full blob paths
                current_blob_path = f"{current_folder_path}/{actual_file_name}"
                new_blob_path = f"{current_folder_path}/{new_file_name}"
                
                try:
                    logger.info(f"Renaming file: {current_blob_path} -> {new_blob_path}")
                    
                    if request.dry_run:
                        file_rename_results.append(OperationResult(
                            success=True,
                            source=f"{request.container}/{current_blob_path}",
                            destination=f"{request.container}/{new_blob_path}",
                            message="[DRY RUN] Would rename file"
                        ))
                    else:
                        result = blob_service.rename_blob(
                            request.container,
                            current_blob_path,
                            new_blob_path
                        )
                        file_rename_results.append(result)
                        if not result.success:
                            has_error = True
                            
                except Exception as e:
                    has_error = True
                    logger.exception(f"Error renaming file {current_blob_path}: {str(e)}")
                    file_rename_results.append(OperationResult(
                        success=False,
                        source=f"{request.container}/{current_blob_path}",
                        destination=f"{request.container}/{new_blob_path}",
                        message=f"Error: {str(e)}"
                    ))
        
        # Step 2: Rename folder only if found = "High Confidence" and names differ
        if request.rename_folders and folder_info.should_rename() and actual_folder_name != target_folder_name:
            try:
                logger.info(f"Renaming folder: {current_folder_path} -> {target_folder_path}")
                
                if request.dry_run:
                    # Count blobs that would be moved
                    blobs = list(blob_service.list_blobs(request.container, current_folder_path))
                    folder_rename_results.append(OperationResult(
                        success=True,
                        source=f"{request.container}/{current_folder_path}",
                        destination=f"{request.container}/{target_folder_path}",
                        message=f"[DRY RUN] Would rename folder ({len(blobs)} files)"
                    ))
                else:
                    from app.models import RenameFolderRule
                    rule = RenameFolderRule(
                        container=request.container,
                        source_folder=current_folder_path,
                        destination_folder=target_folder_path,
                        recursive=True
                    )
                    results = blob_service.rename_folder(rule, dry_run=False)
                    folder_rename_results.extend(results)
                    
                    failed_count = sum(1 for r in results if not r.success)
                    if failed_count > 0:
                        has_error = True
                        
            except Exception as e:
                has_error = True
                logger.exception(f"Error renaming folder {current_folder_path}: {str(e)}")
                folder_rename_results.append(OperationResult(
                    success=False,
                    source=f"{request.container}/{current_folder_path}",
                    destination=f"{request.container}/{target_folder_path}",
                    message=f"Error: {str(e)}"
                ))
        elif not folder_info.should_rename():
            logger.info(f"Skipping folder '{actual_folder_name}' rename - found is not 'High Confidence' (found={folder_info.found})")
        elif actual_folder_name == target_folder_name:
            logger.info(f"Folder '{actual_folder_name}' already has target name, skipping rename")
    
    # Calculate totals
    all_results = folder_rename_results + file_rename_results
    total_processed = len(all_results)
    successful = sum(1 for r in all_results if r.success)
    failed = total_processed - successful
    
    logger.info(f"Folder structure orchestration complete: {total_processed} processed, {successful} successful, {failed} failed, {skipped} skipped")
    
    return FolderStructureOrchestrationResponse(
        total_processed=total_processed,
        successful=successful,
        failed=failed,
        skipped=skipped,
        dry_run=request.dry_run,
        folder_rename_results=folder_rename_results,
        file_rename_results=file_rename_results
    )
