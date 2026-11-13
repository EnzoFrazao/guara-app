"""Mensagens do servidor para o gateway."""

from typing import Literal

from pydantic import BaseModel


class Ack(BaseModel):
    """Confirma a leitura; sem ack, o gateway reenvia (10 s na proposta)."""

    tipo: Literal["ack"] = "ack"
    id: str
    seq: int


class Erro(BaseModel):
    tipo: Literal["erro"] = "erro"
    motivo: str
