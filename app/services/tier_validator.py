"""
Tier Validator Service - Enforces tier-based feature restrictions
"""

import logging
from typing import Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TierValidator:
    """
    Validates tier permissions and enforces feature restrictions.
    """
    
    def __init__(self):
        # Rate limiting storage (in production, use Redis)
        self.rate_limits = {}
        
        # Tier configurations
        self.tier_config = {
            "builder": {
                "console_access": True,
                "workflow_generation": "suggestions_only",
                "log_introspection": False,
                "reasoning_panel": False,
                "document_indexing": False,
                "file_upload_limit": 1,
                "max_file_size": 10 * 1024 * 1024,  # 10MB
                "rate_limit": 10,  # requests per minute
                "credit_limit": 50
            },
            "operator": {
                "console_access": True,
                "workflow_generation": "full",
                "log_introspection": True,
                "reasoning_panel": True,
                "document_indexing": False,
                "file_upload_limit": 5,
                "max_file_size": 50 * 1024 * 1024,  # 50MB
                "rate_limit": 30,
                "credit_limit": 300
            },
            "enterprise": {
                "console_access": True,
                "workflow_generation": "complex",
                "log_introspection": True,
                "reasoning_panel": True,
                "document_indexing": True,
                "file_upload_limit": -1,  # unlimited
                "max_file_size": 100 * 1024 * 1024,  # 100MB
                "rate_limit": 100,
                "credit_limit": 2000
            }
        }
    
    def validate_console_access(self, tier: str) -> bool:
        """Check if tier has console access."""
        config = self.tier_config.get(tier, self.tier_config["builder"])
        return config.get("console_access", False)
    
    def validate_workflow_generation(self, tier: str) -> bool:
        """Check if tier can generate workflows."""
        config = self.tier_config.get(tier, self.tier_config["builder"])
        return config.get("workflow_generation") in ["full", "complex", "suggestions_only"]
    
    def validate_log_introspection(self, tier: str) -> bool:
        """Check if tier can analyze logs."""
        config = self.tier_config.get(tier, self.tier_config["builder"])
        return config.get("log_introspection", False)
    
    def get_max_file_size(self, tier: str) -> int:
        """Get maximum file size for tier."""
        config = self.tier_config.get(tier, self.tier_config["builder"])
        return config.get("max_file_size", 10 * 1024 * 1024)
    
    def get_file_upload_limit(self, tier: str) -> int:
        """Get file upload limit for tier."""
        config = self.tier_config.get(tier, self.tier_config["builder"])
        return config.get("file_upload_limit", 1)
    
    def get_credit_limit(self, tier: str) -> int:
        """Get credit limit for tier."""
        config = self.tier_config.get(tier, self.tier_config["builder"])
        return config.get("credit_limit", 50)
    
    def get_tier_features(self, tier: str) -> Dict[str, Any]:
        """Get all features for tier."""
        config = self.tier_config.get(tier, self.tier_config["builder"])
        return {
            "workflow_generation": config.get("workflow_generation") != "suggestions_only",
            "log_introspection": config.get("log_introspection", False),
            "reasoning_panel": config.get("reasoning_panel", False),
            "document_indexing": config.get("document_indexing", False)
        }
    
    def check_rate_limit(self, user_id: str, tier: str) -> bool:
        """
        Check if user has exceeded rate limit.
        
        Args:
            user_id: User identifier
            tier: User tier
            
        Returns:
            True if within limit, False if exceeded
        """
        config = self.tier_config.get(tier, self.tier_config["builder"])
        limit = config.get("rate_limit", 10)
        
        # Get current minute window
        now = datetime.utcnow()
        window_start = now.replace(second=0, microsecond=0)
        
        # Initialize or get rate limit data
        if user_id not in self.rate_limits:
            self.rate_limits[user_id] = {"window": window_start, "count": 0}
        
        user_limit = self.rate_limits[user_id]
        
        # Reset if new window
        if user_limit["window"] < window_start:
            user_limit["window"] = window_start
            user_limit["count"] = 0
        
        # Check limit
        if user_limit["count"] >= limit:
            logger.warning(f"Rate limit exceeded for {user_id} (tier: {tier})")
            return False
        
        # Increment count
        user_limit["count"] += 1
        return True
    
    def get_rate_limit_reset_time(self, user_id: str) -> datetime:
        """Get time when rate limit resets."""
        if user_id not in self.rate_limits:
            return datetime.utcnow()
        
        window = self.rate_limits[user_id]["window"]
        return window + timedelta(minutes=1)
