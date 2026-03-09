"""Configuration module for Aivory application"""
import os
import sys
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, ValidationError
from dotenv import load_dotenv

# Load .env.local first (takes precedence), then .env
load_dotenv(".env.local")
load_dotenv(".env")


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server configuration
    app_name: str = "Aivory AI Readiness Platform"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8081
    
    # LLM configuration (Ollama - legacy)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistralai/Mistral-7B-Instruct"
    llm_timeout: float = 5.0
    llm_max_tokens: int = 500
    llm_temperature: float = 0.7
    
    # OpenRouter AI configuration (PRIMARY)
    openrouter_api_key: Optional[str] = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    # n8n Integration configuration
    n8n_base_url: str = "http://43.156.108.96:5678"
    n8n_timeout: float = 10.0
    n8n_max_retries: int = 3
    
    # CORS configuration
    cors_origins: list[str] = ["*"]
    
    def validate_paid_tier_config(self) -> None:
        """
        Validate that required configuration for paid tiers is present.
        This should be called before processing any paid diagnostic requests.
        """
        if not self.openrouter_api_key or not self.openrouter_api_key.strip():
            raise ValueError(
                "OPENROUTER_API_KEY is required for paid diagnostic tiers. "
                "Please set it in .env.local file."
            )
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
try:
    settings = Settings()
    print(f"✓ Configuration loaded successfully")
    print(f"  - App: {settings.app_name} v{settings.app_version}")
    print(f"  - OpenRouter API: {'Configured' if settings.openrouter_api_key else 'Not configured'}")
except ValidationError as e:
    print(f"✗ Configuration validation failed:")
    for error in e.errors():
        field = '.'.join(str(loc) for loc in error['loc'])
        print(f"  - {field}: {error['msg']}")
    print("\nPlease check your .env.local file and ensure all required variables are set correctly.")
    sys.exit(1)
except Exception as e:
    print(f"✗ Failed to load configuration: {str(e)}")
    sys.exit(1)
