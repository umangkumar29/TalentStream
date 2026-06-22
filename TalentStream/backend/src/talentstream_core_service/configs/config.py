from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    PROJECT_NAME: str = "TalentStream AI"
    API_VERSION: str = "v1"

    # Database & RabbitMQ
    DATABASE_URL: str
    RABBITMQ_URL: str = "amqp://tsuser:tspassword@rabbitmq:5672/"

    # ── Auth feature flag ──────────────────────────────────────────────────────
    AUTH_ENABLED: bool = False  # Set to True to enforce Keycloak JWT validation

    # ── Keycloak ──────────────────────────────────────────────────────────────
    KEYCLOAK_URL: str = "http://localhost:8180"
    KEYCLOAK_REALM: str = "talentstream"
    KEYCLOAK_CLIENT_ID: str = "talentstream-backend"
    KEYCLOAK_CLIENT_SECRET: str = ""

    # ── Local Auth (Standard JWT & Password hash) ─────────────────────────────
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480 # 8 hours

    # ── OpenAI ────────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""  # e.g. https://openrouter.ai/api/v1 — leave empty for default OpenAI
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_DIMENSION: int = 1536

    # ── Azure Blob ────────────────────────────────────────────────────────────
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_CONTAINER_NAME: str = "resumes"

    # ── Hasura / Security ─────────────────────────────────────────────────────
    HASURA_GRAPHQL_ADMIN_SECRET: str = ""
    FASTAPI_INTERNAL_SECRET: str = "changeme"

    # ── RAG Config ────────────────────────────────────────────────────────────
    RAG_TOP_K: int = 5

    @property
    def keycloak_jwks_url(self) -> str:
        return (
            f"{self.KEYCLOAK_URL}/realms/{self.KEYCLOAK_REALM}"
            f"/protocol/openid-connect/certs"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
