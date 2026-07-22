from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


EMBEDDING_DIMENSION = 1024
SUPPORTED_GEMINI_MODELS = ("gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite")


def validate_gemini_model(model: str | None) -> str | None:
    if model is None:
        return None
    model = model.strip()
    if not model:
        return None
    if model not in SUPPORTED_GEMINI_MODELS:
        supported = ", ".join(SUPPORTED_GEMINI_MODELS)
        raise ValueError(f"Unsupported Gemini model '{model}'. Supported models: {supported}")
    return model


class Settings(BaseSettings):
    gemini_api_key: str = ""
    serper_api_key: str = ""
    crew_llm: str = "gemini/gemini-2.5-flash"
    polish_model: str = "gemini-3.5-flash"
    chat_model: str = "gemini-3.5-flash"
    allowed_origins: str = "http://localhost:3000"
    max_crew_workers: int = 4
    log_level: str = "INFO"
    trusted_proxy_ips: str = ""
    rate_limit_max_keys: int = 10000
    redis_url: str = ""

    database_url: str = "postgresql+psycopg://smart_briefing:smart_briefing@localhost:5432/smart_briefing"
    voyage_api_key: str = ""
    voyage_embedding_model: str = "voyage-4"
    voyage_embedding_dimension: int = EMBEDDING_DIMENSION
    rag_top_k: int = 6
    rag_chunk_size: int = 1800
    rag_chunk_overlap: int = 240

    session_cookie_name: str = "smart_briefing_session"
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    session_expire_days: int = 30

    object_storage_endpoint: str = "http://localhost:9000"
    object_storage_public_url: str = "http://localhost:9000"
    object_storage_bucket: str = "profile-photos"
    object_storage_access_key: str = "minioadmin"
    object_storage_secret_key: str = "minioadmin"
    object_storage_region: str = "us-east-1"
    profile_upload_max_bytes: int = 5 * 1024 * 1024

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    billing_success_url: str = "http://localhost:3000/settings/billing?checkout=success"
    billing_cancel_url: str = "http://localhost:3000/settings/billing?checkout=cancelled"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def trusted_proxy_ip_list(self) -> list[str]:
        return [proxy.strip() for proxy in self.trusted_proxy_ips.split(",") if proxy.strip()]

    @model_validator(mode="after")
    def require_api_keys(self) -> "Settings":
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required. Set it in backend/.env or the environment.")
        if not self.voyage_api_key:
            raise ValueError("VOYAGE_API_KEY is required. Set it in backend/.env or the environment.")
        if self.rate_limit_max_keys < 1:
            raise ValueError("RATE_LIMIT_MAX_KEYS must be at least 1")
        validate_gemini_model(self.polish_model)
        validate_gemini_model(self.chat_model)

        self.session_cookie_samesite = self.session_cookie_samesite.lower()
        if self.session_cookie_samesite not in {"lax", "strict", "none"}:
            raise ValueError("SESSION_COOKIE_SAMESITE must be one of: lax, strict, none")
        if self.session_cookie_samesite == "none" and not self.session_cookie_secure:
            raise ValueError("SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAMESITE=none")
        if "*" in self.allowed_origin_list:
            raise ValueError("ALLOWED_ORIGINS cannot include '*' when credentialed CORS is enabled")
        if self.voyage_embedding_dimension != EMBEDDING_DIMENSION:
            raise ValueError(f"VOYAGE_EMBEDDING_DIMENSION must be {EMBEDDING_DIMENSION} to match the database schema")
        if self.rag_chunk_overlap >= self.rag_chunk_size:
            raise ValueError("RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE")
        if self.profile_upload_max_bytes < 1:
            raise ValueError("PROFILE_UPLOAD_MAX_BYTES must be at least 1")
        return self


settings = Settings()
