"""
Blueprint storage service with file-based persistence and access control.
"""

import os
import json
import shutil
from typing import List, Optional, Dict
from datetime import datetime
from pathlib import Path

from app.models.blueprint import (
    BlueprintMetadata,
    StorageResult,
    BlueprintJSON
)


class BlueprintStorageService:
    """
    Manages Blueprint file storage with access control.
    
    Storage structure:
    blueprints/
      {user_id}/
        {blueprint_id}/
          v{version}/
            blueprint.json
            blueprint.pdf
    
    Metadata tracked in blueprints/metadata.json
    """
    
    def __init__(self, base_path: str = "blueprints"):
        """Initialize storage service."""
        self.base_path = Path(base_path)
        self.metadata_file = self.base_path / "metadata.json"
        self._ensure_storage_structure()
    
    def _ensure_storage_structure(self):
        """Create base storage directories if they don't exist."""
        self.base_path.mkdir(parents=True, exist_ok=True)
        if not self.metadata_file.exists():
            self._save_metadata({})
    
    def _load_metadata(self) -> Dict:
        """Load metadata from JSON file."""
        if not self.metadata_file.exists():
            return {}
        with open(self.metadata_file, 'r') as f:
            return json.load(f)
    
    def _save_metadata(self, metadata: Dict):
        """Save metadata to JSON file."""
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
    
    def _is_super_admin(self, user_id: str) -> bool:
        """Check if user is GrandMasterRCH super admin."""
        return user_id == "GrandMasterRCH"
    
    def _check_access(self, blueprint_id: str, user_id: str) -> bool:
        """
        Check if user has access to blueprint.
        
        Access granted if:
        - User owns the blueprint
        - User is super admin (GrandMasterRCH)
        """
        metadata = self._load_metadata()
        
        if blueprint_id not in metadata:
            return False
        
        blueprint_meta = metadata[blueprint_id]
        
        # Super admin has universal access
        if self._is_super_admin(user_id):
            return True
        
        # Owner has access
        return blueprint_meta.get("user_id") == user_id
    
    async def store_blueprint(
        self,
        user_id: str,
        blueprint_id: str,
        version: str,
        json_data: dict,
        pdf_bytes: bytes
    ) -> StorageResult:
        """
        Store Blueprint JSON and PDF files.
        
        Args:
            user_id: User identifier
            blueprint_id: Blueprint identifier
            version: Version string (e.g., "1.0")
            json_data: Blueprint JSON data
            pdf_bytes: PDF file bytes
            
        Returns:
            StorageResult with URLs
        """
        try:
            # Create directory structure
            blueprint_dir = self.base_path / user_id / blueprint_id / f"v{version}"
            blueprint_dir.mkdir(parents=True, exist_ok=True)
            
            # Write JSON file
            json_path = blueprint_dir / "blueprint.json"
            with open(json_path, 'w') as f:
                json.dump(json_data, f, indent=2, default=str)
            
            # Write PDF file
            pdf_path = blueprint_dir / "blueprint.pdf"
            with open(pdf_path, 'wb') as f:
                f.write(pdf_bytes)
            
            # Update metadata
            metadata = self._load_metadata()
            metadata[blueprint_id] = {
                "blueprint_id": blueprint_id,
                "user_id": user_id,
                "schema_version": json_data.get("schema_version", "aivory-v1"),
                "system_name": json_data.get("system_name", "Unknown System"),
                "created_at": datetime.utcnow().isoformat(),
                "version": version,
                "json_path": str(json_path),
                "pdf_path": str(pdf_path),
                "snapshot_id": json_data.get("snapshot_id", "")
            }
            self._save_metadata(metadata)
            
            # Generate URLs
            json_url = f"/api/v1/blueprint/{blueprint_id}/download/json"
            pdf_url = f"/api/v1/blueprint/{blueprint_id}/download/pdf"
            
            return StorageResult(
                success=True,
                blueprint_id=blueprint_id,
                json_url=json_url,
                pdf_url=pdf_url,
                message="Blueprint stored successfully"
            )
            
        except Exception as e:
            return StorageResult(
                success=False,
                blueprint_id=blueprint_id,
                json_url="",
                pdf_url="",
                message=f"Storage failed: {str(e)}"
            )
    
    async def retrieve_blueprint_json(
        self,
        blueprint_id: str,
        user_id: str
    ) -> Optional[dict]:
        """
        Retrieve Blueprint JSON with access control.
        
        Args:
            blueprint_id: Blueprint identifier
            user_id: Requesting user ID
            
        Returns:
            Blueprint JSON dict or None if access denied
        """
        if not self._check_access(blueprint_id, user_id):
            return None
        
        metadata = self._load_metadata()
        if blueprint_id not in metadata:
            return None
        
        json_path = Path(metadata[blueprint_id]["json_path"])
        if not json_path.exists():
            return None
        
        with open(json_path, 'r') as f:
            return json.load(f)
    
    async def retrieve_blueprint_pdf(
        self,
        blueprint_id: str,
        user_id: str
    ) -> Optional[bytes]:
        """
        Retrieve Blueprint PDF with access control.
        
        Args:
            blueprint_id: Blueprint identifier
            user_id: Requesting user ID
            
        Returns:
            PDF bytes or None if access denied
        """
        if not self._check_access(blueprint_id, user_id):
            return None
        
        metadata = self._load_metadata()
        if blueprint_id not in metadata:
            return None
        
        pdf_path = Path(metadata[blueprint_id]["pdf_path"])
        if not pdf_path.exists():
            return None
        
        with open(pdf_path, 'rb') as f:
            return f.read()
    
    async def list_user_blueprints(
        self,
        user_id: str
    ) -> List[BlueprintMetadata]:
        """
        List all blueprints for user.
        
        Super admin sees all blueprints.
        Regular users see only their own.
        
        Args:
            user_id: User identifier
            
        Returns:
            List of BlueprintMetadata
        """
        metadata = self._load_metadata()
        blueprints = []
        
        for blueprint_id, meta in metadata.items():
            # Super admin sees all
            if self._is_super_admin(user_id):
                blueprints.append(BlueprintMetadata(**meta))
            # Regular users see only their own
            elif meta.get("user_id") == user_id:
                blueprints.append(BlueprintMetadata(**meta))
        
        # Sort by creation date (newest first)
        blueprints.sort(key=lambda x: x.created_at, reverse=True)
        
        return blueprints
    
    async def get_blueprint_metadata(
        self,
        blueprint_id: str
    ) -> Optional[BlueprintMetadata]:
        """Get metadata for specific blueprint."""
        metadata = self._load_metadata()
        if blueprint_id not in metadata:
            return None
        return BlueprintMetadata(**metadata[blueprint_id])
    
    async def check_existing_version(
        self,
        snapshot_id: str,
        user_id: str
    ) -> Optional[str]:
        """
        Check if blueprint already exists for this snapshot.
        
        Returns:
            Latest version string if exists, None otherwise
        """
        metadata = self._load_metadata()
        
        # Find blueprints for this user and snapshot
        versions = []
        for blueprint_id, meta in metadata.items():
            if meta.get("user_id") == user_id and meta.get("snapshot_id") == snapshot_id:
                versions.append(meta.get("version", "1.0"))
        
        if not versions:
            return None
        
        # Return highest version
        versions.sort(reverse=True)
        return versions[0]
    
    async def increment_version(self, version: str) -> str:
        """
        Increment version number.
        
        Args:
            version: Current version (e.g., "1.0")
            
        Returns:
            Next version (e.g., "1.1")
        """
        try:
            major, minor = version.split(".")
            return f"{major}.{int(minor) + 1}"
        except:
            return "1.1"
