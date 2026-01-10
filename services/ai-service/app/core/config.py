"""Application configuration."""

from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "ai-service"
    APP_ENV: str = "development"
    DEBUG: bool = False
    PORT: int = 8006

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/hirehub_ai"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # vLLM (QWEN3 for PII)
    VLLM_URL: str = "http://localhost:8000"
    QWEN3_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"

    # AWS Bedrock
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    BEDROCK_EMBEDDING_MODEL: str = "amazon.titan-embed-text-v1"
    BEDROCK_ANALYSIS_MODEL: str = "anthropic.claude-3-sonnet-20240229-v1:0"

    # AgentCore
    AGENTCORE_AGENT_ID: Optional[str] = None
    AGENTCORE_ALIAS_ID: Optional[str] = None
    USE_AGENTCORE: bool = True  # Use AgentCore for matching when configured; falls back to invoke_model if False or unconfigured

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_AI_TASKS: str = "ai-tasks"
    KAFKA_CONSUMER_GROUP: str = "ai-service-group"

    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379/0"

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
