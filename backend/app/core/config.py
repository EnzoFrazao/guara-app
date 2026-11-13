"""Configuração lida do ambiente (.env no servidor; só .env.example vai para o Git)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://guara_app:guara_app@localhost:5432/guara"
    jwt_secret: str = "desenvolvimento-nao-use-em-producao"
    jwt_minutos: int = 15
    # {"id-do-gateway": "token"}: um token por gateway, revogável.
    gateway_tokens: dict[str, str] = {}
    # {"id-do-controlador": "token"}
    rele_tokens: dict[str, str] = {}


@lru_cache
def get_settings() -> Settings:
    return Settings()
