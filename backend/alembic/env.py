"""Ambiente do Alembic: lê DATABASE_URL e enxerga as tabelas de todos os módulos.

Ainda não há migração gerada: criá-la exige um PostgreSQL com PostGIS (`alembic revision --autogenerate`).
Lembrar de ligar a extensão (`CREATE EXTENSION postgis`) e de particionar `leitura_posicao` por mês.
"""

from logging.config import fileConfig

from sqlalchemy import create_engine

from alembic import context
from app.core.config import get_settings
from app.db.base import Base

# Importar os models registra as tabelas em Base.metadata.
from app.modulos.acionamentos import models as _acionamentos  # noqa: F401
from app.modulos.alertas import models as _alertas  # noqa: F401
from app.modulos.areas import models as _areas  # noqa: F401
from app.modulos.auth import models as _auth  # noqa: F401
from app.modulos.dispositivos import models as _dispositivos  # noqa: F401
from app.modulos.pessoas import models as _pessoas  # noqa: F401
from app.modulos.posicoes import models as _posicoes  # noqa: F401

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(url=get_settings().database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(get_settings().database_url)
    with engine.connect() as conexao:
        context.configure(connection=conexao, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
