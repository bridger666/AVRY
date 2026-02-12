"""Configuration module for Aivory application"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server configuration
    app_name: str = "Aivory AI Readiness Platform"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8081
    
    # LLM configuration
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistralai/Mistral-7B-Instruct"
    llm_timeout: float = 5.0
    llm_max_tokens: int = 500
    llm_temperature: float = 0.7
    
    # CORS configuration
    cors_origins: list[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
