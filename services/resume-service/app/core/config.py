"""Application configuration settings."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "resume-service"
    debug: bool = False
    environment: str = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8003

    # Database
    database_host: str = "localhost"
    database_port: int = 5432
    database_user: str = "postgres"
    database_password: str = "postgres"
    database_name: str = "resume_db"

    # AWS
    aws_region: str = "ap-northeast-2"
    s3_bucket_name: str = "hirehub-resumes"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    @property
    def database_url(self) -> str:
        """Get async database URL."""
        return (
            f"postgresql+asyncpg://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )

    @property
    def sync_database_url(self) -> str:
        """Get sync database URL for Alembic."""
        return (
            f"postgresql://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
