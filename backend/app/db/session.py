"""Conexão e sessão. Trocar o banco pelo da Vale é mudar DATABASE_URL (e só mexe aqui e nos repository)."""

from collections.abc import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

# pool_pre_ping: reabre sozinho conexão que o servidor derrubou. Não conecta até o primeiro uso.
# connect_timeout: com o banco fora do ar o /health tem de responder 503 logo, e não ficar pendurado.
engine = create_engine(get_settings().database_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    with SessionLocal() as sessao:
        yield sessao


def banco_responde() -> bool:
    try:
        with engine.connect() as conexao:
            conexao.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
