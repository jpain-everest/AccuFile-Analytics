import json
import os
from datetime import datetime, timezone

from azure.core.exceptions import ResourceNotFoundError
from fastapi import APIRouter, HTTPException

from app.utilities.utils import build_blob_service_client, extract_records, _FALLBACK_CONTAINER


router = APIRouter()


def _parse_run_date(value):
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)

    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)

    try:
        raw = str(value).strip()
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        parsed = datetime.fromisoformat(raw)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.min.replace(tzinfo=timezone.utc)


def _load_analytics_records():
    container_name = os.getenv("AZURE_STORAGE_CONTAINER") or _FALLBACK_CONTAINER

    blob_service = build_blob_service_client()
    container_client = blob_service.get_container_client(container_name)

    blob_prefix = (os.getenv("AZURE_STORAGE_BLOB_PREFIX") or "").strip()
    if blob_prefix and not blob_prefix.endswith("/"):
        blob_prefix = f"{blob_prefix}/"

    candidate_blob_names = []
    if blob_prefix:
        candidate_blob_names.append(f"{blob_prefix}analytics.json")
    candidate_blob_names.append("analytics.json")

    source_blob_name = None
    blob_data = None
    for blob_name in candidate_blob_names:
        try:
            blob_data = container_client.download_blob(blob_name).readall().decode("utf-8")
            source_blob_name = blob_name
            break
        except ResourceNotFoundError:
            continue

    if blob_data is None or source_blob_name is None:
        raise HTTPException(
            status_code=404,
            detail=f"analytics.json not found in container '{container_name}'",
        )

    payload = json.loads(blob_data)
    records = extract_records(payload)
    return records, source_blob_name


@router.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "A&H AccuFile Backend"}


@router.post("/api/filereview")
async def run_workflow():
    """
    Loads latest JSON file from Azure Blob Storage and returns UI-ready payload.
    """
    try:
        container_name = os.getenv("AZURE_STORAGE_CONTAINER") or _FALLBACK_CONTAINER

        blob_prefix = (
            os.getenv("AZURE_STORAGE_BLOB_PREFIX")
            or ""
        ).strip()
        if blob_prefix and not blob_prefix.endswith("/"):
            blob_prefix = f"{blob_prefix}/"

        blob_extension = os.getenv("AZURE_STORAGE_BLOB_EXTENSION", ".json")

        blob_service = build_blob_service_client()
        container_client = blob_service.get_container_client(container_name)

        blob_items = list(container_client.list_blobs(name_starts_with=blob_prefix))
        json_blobs = [b for b in blob_items if b.name.lower().endswith(blob_extension.lower())]

        if not json_blobs:
            raise HTTPException(
                status_code=404,
                detail=f"No JSON blob files found in container '{container_name}' with prefix '{blob_prefix}'",
            )

        latest_blob = max(json_blobs, key=lambda b: b.last_modified)
        blob_data = container_client.download_blob(latest_blob.name).readall().decode("utf-8")
        payload = json.loads(blob_data)
        raw_records = extract_records(payload)

        sample_keys = list(raw_records[0].keys()) if raw_records else []
        print(
            f"[run-workflow] source_blob={latest_blob.name} records={len(raw_records)} sample_keys={sample_keys[:30]}",
            flush=True,
        )

        records = raw_records

        return {
            "policies_reviewed": records,
            "validation_results": {},
            "llm_insights": None,
            "file_structure": [],
            "logs": f"Loaded {len(records)} records from blob: {latest_blob.name}",
            "source_blob": latest_blob.name,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/summary/total")
async def get_summary_total():
    """Returns all records from analytics.json (without blob prefix filtering)."""
    try:
        records, source_blob = _load_analytics_records()
        return {
            "source_blob": source_blob,
            "count": len(records),
            "records": records,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/summary/latest")
async def get_summary_latest():
    """Returns the latest record from analytics.json based on run_date/_run_date."""
    try:
        records, source_blob = _load_analytics_records()

        if not records:
            raise HTTPException(status_code=404, detail="analytics.json has no records")

        latest_record = max(
            records,
            key=lambda r: _parse_run_date((r or {}).get("run_date") or (r or {}).get("_run_date")),
        )

        return {
            "source_blob": source_blob,
            "record": latest_record,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/fix-confidence-matches")
async def fix_confidence_matches(body: dict):
    """
    After a successful 'Fix for Me' call (successful > 0), update the latest JSON
    in blob container. For all files in _folder_structure where found == 'High Confidence Match',
    set found to 'true' and actual_file_name to null.
    """
    try:
        insured_folder_name = body.get("base_path", "")
        if not insured_folder_name:
            raise HTTPException(status_code=400, detail="base_path is required")

        container_name = os.getenv("AZURE_STORAGE_CONTAINER") or _FALLBACK_CONTAINER
        blob_prefix = (os.getenv("AZURE_STORAGE_BLOB_PREFIX") or "output/").strip()
        if blob_prefix and not blob_prefix.endswith("/"):
            blob_prefix = f"{blob_prefix}/"
        blob_extension = os.getenv("AZURE_STORAGE_BLOB_EXTENSION", ".json")

        blob_service = build_blob_service_client()
        container_client = blob_service.get_container_client(container_name)

        # Find the latest JSON blob under output/
        blob_items = list(container_client.list_blobs(name_starts_with=blob_prefix))
        json_blobs = [b for b in blob_items if b.name.lower().endswith(blob_extension.lower())]
        if not json_blobs:
            raise HTTPException(status_code=404, detail="No JSON blobs found")

        latest_blob = max(json_blobs, key=lambda b: b.last_modified)
        blob_data = container_client.download_blob(latest_blob.name).readall().decode("utf-8")
        payload = json.loads(blob_data)

        # The blob can be a top-level list or a dict with a named array
        if isinstance(payload, list):
            risk_scores = payload
        else:
            risk_scores = None
            for key in ["policy_risk_scores", "policies_reviewed", "data"]:
                if key in payload and isinstance(payload[key], list):
                    risk_scores = payload[key]
                    break

        if risk_scores is None:
            raise HTTPException(status_code=404, detail="No policy_risk_scores found in blob")

        # Update High Confidence Match entries for the matching insured folder
        updated_count = 0
        for record in risk_scores:
            folder_name = record.get("_insured_folder_name", "") or record.get("Policy Holder Name", "")
            if folder_name.lower() != insured_folder_name.lower():
                continue

            folder_structure = record.get("_folder_structure")
            if not folder_structure or not isinstance(folder_structure, dict):
                continue

            for folder_key, folder_data in folder_structure.items():
                if not isinstance(folder_data, dict):
                    continue
                # Check folder-level found
                if str(folder_data.get("found", "")).lower().strip() == "high confidence match":
                    folder_data["found"] = "true"
                    folder_data["actual_folder_name"] = None
                    updated_count += 1

                files = folder_data.get("files")
                if not files or not isinstance(files, dict):
                    continue
                for file_key, file_data in files.items():
                    if not isinstance(file_data, dict):
                        continue
                    if str(file_data.get("found", "")).lower().strip() == "high confidence match":
                        file_data["found"] = "true"
                        file_data["actual_file_name"] = None
                        updated_count += 1

        if updated_count == 0:
            return {
                "status": "no_changes",
                "message": f"No High Confidence Match entries found for '{insured_folder_name}'",
                "blob": latest_blob.name,
                "updated_count": 0,
            }

        # Write updated JSON back to the blob
        updated_blob_data = json.dumps(payload, indent=2, default=str)
        container_client.upload_blob(
            latest_blob.name,
            updated_blob_data,
            overwrite=True,
        )

        print(
            f"[fix-confidence] blob={latest_blob.name} insured={insured_folder_name} updated={updated_count}",
            flush=True,
        )

        return {
            "status": "updated",
            "blob": latest_blob.name,
            "insured_folder": insured_folder_name,
            "updated_count": updated_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
