"""Tabela `area`: trechos entre os "X", áreas nomeadas e cercas de risco."""

from geoalchemy2 import Geometry
from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Area(Base):
    __tablename__ = "area"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(80))
    tipo: Mapped[str] = mapped_column(String(20))  # trecho | area | cerca_risco
    poligono: Mapped[object] = mapped_column(Geometry("POLYGON", srid=4326))
    margem_m: Mapped[float] = mapped_column(Float, default=0)
