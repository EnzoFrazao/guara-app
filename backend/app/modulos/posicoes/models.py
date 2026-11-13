"""Tabelas `leitura_posicao` (todas as leituras) e `posicao_atual` (a última de cada pessoa).

`leitura_posicao` cresce rápido (~144 mil linhas por dia com 50 pessoas a cada 30 s): o plano é
particioná-la por mês. O particionamento e o prazo de retenção (LGPD) ficam para a migração inicial
e para a decisão com a Vale (ver `documentos/specs/open-decisions.md`).
"""

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LeituraPosicao(Base):
    __tablename__ = "leitura_posicao"
    # Impede gravar duas vezes o pacote que a mesh entregou duplicado.
    __table_args__ = (UniqueConstraint("dispositivo_id", "seq", name="uq_leitura_dispositivo_seq"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    dispositivo_id: Mapped[int] = mapped_column(ForeignKey("dispositivo.id"))
    pessoa_id: Mapped[int | None] = mapped_column(ForeignKey("pessoa.id"))
    seq: Mapped[int] = mapped_column(Integer)
    hora_gps: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    hora_chegada: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ponto: Mapped[object] = mapped_column(Geometry("POINT", srid=4326))
    velocidade: Mapped[float | None] = mapped_column(Float)
    satelites: Mapped[int | None] = mapped_column(Integer)
    hdop: Mapped[float | None] = mapped_column(Float)
    bateria: Mapped[int | None] = mapped_column(Integer)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("area.id"))


class PosicaoAtual(Base):
    __tablename__ = "posicao_atual"

    pessoa_id: Mapped[int] = mapped_column(ForeignKey("pessoa.id"), primary_key=True)
    ponto: Mapped[object] = mapped_column(Geometry("POINT", srid=4326))
    area_id: Mapped[int | None] = mapped_column(ForeignKey("area.id"))
    estado: Mapped[str] = mapped_column(String(20))  # parado | deslocando | embarcado
    atualizado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
