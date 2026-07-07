from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    serper_api_key: str = ""
    crew_llm: str = "gemini/gemini-2.5-flash"
    polish_model: str = "gemini-2.5-flash"
    allowed_origins: str = "http://localhost:3000"
    max_crew_workers: int = 4
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def require_gemini_api_key(self) -> "Settings":
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required. Set it in backend/.env or the environment.")
        return self


settings = Settings()
