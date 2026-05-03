"""
Helpers - Utility functions
"""
import hashlib
import re
from typing import Any, Dict, List


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to remove invalid characters
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove invalid characters
    invalid_chars = r'[<>:"/\\|?*]'
    sanitized = re.sub(invalid_chars, '_', filename)
    
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip('. ')
    
    return sanitized


def calculate_file_hash(file_path: str, algorithm: str = 'md5') -> str:
    """
    Calculate hash of a file for integrity checking
    
    Args:
        file_path: Path to file
        algorithm: Hash algorithm (md5, sha256, etc.)
        
    Returns:
        Hex digest of hash
    """
    hash_func = hashlib.new(algorithm)
    
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_func.update(chunk)
    
    return hash_func.hexdigest()


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format
    
    Args:
        size_bytes: File size in bytes
        
    Returns:
        Formatted file size string
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    
    return f"{size_bytes:.2f} PB"


def extract_policy_number(filename: str) -> str | None:
    """
    Extract policy number from filename
    
    Args:
        filename: Filename to parse
        
    Returns:
        Extracted policy number or None
    """
    # Pattern for common policy number formats
    # Adjust regex based on actual policy number format
    pattern = r'(\d{8,10}|[A-Z]{2}\d{6,8})'
    match = re.search(pattern, filename.upper())
    
    return match.group(1) if match else None


def extract_insured_name(filename: str) -> str | None:
    """
    Extract insured name from filename
    
    Args:
        filename: Filename to parse
        
    Returns:
        Extracted insured name or None
    """
    # Remove common file extensions and separators
    name = re.sub(r'\.[^.]+$', '', filename)  # Remove extension
    name = re.sub(r'[_-]', ' ', name)  # Replace separators with spaces
    
    # Remove leading numbers and dates
    name = re.sub(r'^[\d\-\s]+', '', name).strip()
    
    return name if name else None


def merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively merge two dictionaries
    
    Args:
        dict1: Base dictionary
        dict2: Dictionary to merge in
        
    Returns:
        Merged dictionary
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    
    return result


def filter_dict(data: Dict[str, Any], keys: List[str]) -> Dict[str, Any]:
    """
    Filter dictionary to only include specified keys
    
    Args:
        data: Original dictionary
        keys: Keys to include
        
    Returns:
        Filtered dictionary
    """
    return {k: v for k, v in data.items() if k in keys}
