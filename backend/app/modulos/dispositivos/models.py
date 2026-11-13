"""Tabelas `dispositivo` (cada Heltec V4 e gateway) e `vinculo` (qual pessoa usa qual dispositivo, e quando)."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Dispositivo(Base):
    __tablename__ = "dispositivo"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True)  # ESP32-0A1B
    tipo: Mapped[str] = mapped_column(String(20))  # operador | gateway
    ultimo_contato: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="offline")


class Vinculo(Base):
    __tablename__ = "vinculo"
    # Um dispositivo só pode estar em um vínculo aberto (fim nulo) por vez; o mesmo vale para a pessoa.
    __table_args__ = (
        Index("uq_vinculo_dispositivo_aberto", "dispositivo_id", unique=True, postgresql_where=text("fim IS NULL")),
        Index("uq_vinculo_pessoa_aberto", "pessoa_id", unique=True, postgresql_where=text("fim IS NULL")),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    pessoa_id: Mapped[int] = mapped_column(ForeignKey("pessoa.id"))
    dispositivo_id: Mapped[int] = mapped_column(ForeignKey("dispositivo.id"))
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    fim: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
