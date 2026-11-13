"""Tabela `pessoa`: maquinistas e manobristas."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Pessoa(Base):
    __tablename__ = "pessoa"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    matricula: Mapped[str] = mapped_column(String(6), unique=True)
    funcao: Mapped[str] = mapped_column(String(20))  # maquinista | manobrista
    turno: Mapped[str] = mapped_column(String(1))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
