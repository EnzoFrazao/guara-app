"""Tabelas `alerta` e `bloqueio`."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Alerta(Base):
    __tablename__ = "alerta"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String(30))  # pessoa_isolada | queda | sem_sinal | area_de_risco
    pessoa_id: Mapped[int | None] = mapped_column(ForeignKey("pessoa.id"))
    area_id: Mapped[int | None] = mapped_column(ForeignKey("area.id"))
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reconhecido_por: Mapped[int | None] = mapped_column(ForeignKey("usuario.id"))
    reconhecido_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Bloqueio(Base):
    __tablename__ = "bloqueio"

    id: Mapped[int] = mapped_column(primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("area.id"))
    pessoa_id: Mapped[int | None] = mapped_column(ForeignKey("pessoa.id"))
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    liberado_por: Mapped[int | None] = mapped_column(ForeignKey("usuario.id"))
    liberado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
