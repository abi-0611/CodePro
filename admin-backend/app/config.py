from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent.parent / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:4322"]
    APP_ENV: str = "development"

    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8")


settings = Settings()
