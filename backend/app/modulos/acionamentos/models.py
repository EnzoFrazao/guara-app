"""Tabelas `demanda`, `acionamento` e `tempo_deslocamento`."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Demanda(Base):
    """Frente que pediu alguém."""

    __tablename__ = "demanda"

    id: Mapped[int] = mapped_column(primary_key=True)
    frente_area_id: Mapped[int] = mapped_column(ForeignKey("area.id"))
    funcao: Mapped[str] = mapped_column(String(20))
    aberta_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Acionamento(Base):
    """Quem foi acionado para a demanda, com a chegada prevista e a real."""

    __tablename__ = "acionamento"

    id: Mapped[int] = mapped_column(primary_key=True)
    demanda_id: Mapped[int] = mapped_column(ForeignKey("demanda.id"))
    pessoa_id: Mapped[int] = mapped_column(ForeignKey("pessoa.id"))
    previsto_s: Mapped[int | None] = mapped_column(Integer)
    acionado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    chegou_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TempoDeslocamento(Base):
    """Tempo típico entre dois trechos, recalculado por um job noturno."""

    __tablename__ = "tempo_deslocamento"

    id: Mapped[int] = mapped_column(primary_key=True)
    origem_area_id: Mapped[int] = mapped_column(ForeignKey("area.id"))
    destino_area_id: Mapped[int] = mapped_column(ForeignKey("area.id"))
    modo: Mapped[str] = mapped_column(String(20))  # a_pe | carro
    mediana_s: Mapped[float] = mapped_column(Float)
    p90_s: Mapped[float] = mapped_column(Float)
    amostras: Mapped[int] = mapped_column(Integer)
