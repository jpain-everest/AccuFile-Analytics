# Azure Blob File Update API

A FastAPI application for managing Azure Blob Storage files with rule-based operations for moving files, renaming files, and renaming folders.

## Features

- **Move Files**: Move files between containers/folders based on pattern matching rules
- **Rename Files**: Rename files using regex, prefix, suffix, or other pattern types
- **Rename Folders**: Rename virtual directories by moving all contained blobs
- **Dry Run Mode**: Preview changes without applying them
- **Bulk Operations**: Process multiple rules in a single request

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
copy .env.example .env
# Edit .env with your Azure Storage credentials
```

## Configuration

Set one of the following in your `.env` file:

### Option 1: Connection String
```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

### Option 2: Account Name and Key
```
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_account_key
```

## Running the API

```bash
python run.py
```

Or with uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### List Operations

- `GET /blobs/containers` - List all containers
- `GET /blobs/containers/{container_name}/blobs` - List blobs with optional filtering

### Move Files

- `POST /blobs/move` - Bulk move files based on rules
- `POST /blobs/move/single` - Move a single file

### Rename Files

- `POST /blobs/rename-files` - Bulk rename files based on rules
- `POST /blobs/rename-files/single` - Rename a single file

### Rename Folders

- `POST /blobs/rename-folders` - Bulk rename folders based on rules

## Rule Types

| Type | Description | Example Pattern |
|------|-------------|-----------------|
| `regex` | Regular expression matching | `^report_\d{4}` |
| `prefix` | Match files starting with | `backup_` |
| `suffix` | Match files ending with | `_final` |
| `contains` | Match files containing | `draft` |
| `exact` | Exact filename match | `config.json` |
| `extension` | Match file extension | `pdf` |

## Example Requests

### Move Files by Extension

Move all PDF files from one container to another:

```json
POST /blobs/move
{
    "rules": [
        {
            "source_container": "documents",
            "source_folder": "inbox",
            "destination_container": "archive",
            "destination_folder": "pdfs/2024",
            "rule_type": "extension",
            "pattern": "pdf",
            "overwrite": false,
            "delete_source": true
        }
    ],
    "dry_run": false
}
```

### Rename Files with Regex

Replace dates in filenames:

```json
POST /blobs/rename-files
{
    "rules": [
        {
            "container": "reports",
            "folder": "monthly",
            "rule_type": "regex",
            "match_pattern": "(\\d{2})-(\\d{2})-(\\d{4})",
            "replace_pattern": "\\3-\\1-\\2",
            "apply_to_extension": false
        }
    ],
    "dry_run": true
}
```

### Rename a Folder

Move all files from one virtual directory to another:

```json
POST /blobs/rename-folders
{
    "rules": [
        {
            "container": "data",
            "source_folder": "temp/processing",
            "destination_folder": "archive/processed",
            "recursive": true
        }
    ],
    "dry_run": false
}
```

### Add Prefix to Files

Add a timestamp prefix to all files:

```json
POST /blobs/rename-files
{
    "rules": [
        {
            "container": "uploads",
            "folder": "",
            "rule_type": "regex",
            "match_pattern": "^(.+)$",
            "replace_pattern": "2024_\\1",
            "apply_to_extension": false
        }
    ],
    "dry_run": true
}
```

## Response Format

All bulk operations return a `BulkOperationResponse`:

```json
{
    "total_processed": 10,
    "successful": 8,
    "failed": 2,
    "dry_run": false,
    "results": [
        {
            "success": true,
            "source": "container/path/file.txt",
            "destination": "container/newpath/file.txt",
            "message": "File moved successfully"
        },
        {
            "success": false,
            "source": "container/path/other.txt",
            "destination": null,
            "message": "Error: Destination file already exists"
        }
    ]
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (invalid parameters)
- `404` - Container not found
- `500` - Server error (Azure connection issues, etc.)

## License

MIT
