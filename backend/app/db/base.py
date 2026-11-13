"""Classe base das tabelas. Cada módulo declara as suas em `models.py`."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
