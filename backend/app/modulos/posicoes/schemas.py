"""Contrato da leitura do dispositivo (mensagem `telemetria` do gateway)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Telemetria(BaseModel):
    """Uma leitura por mensagem, com o código do dispositivo (ver exemplo no documento de arquitetura)."""

    tipo: Literal["telemetria"]
    v: int = 1
    id: str = Field(pattern=r"^ESP32-[0-9A-F]{4}$", description="Código do dispositivo, ex.: ESP32-0A1B")
    seq: int = Field(ge=0, description="Número de sequência; serve de chave de confirmação e de duplicidade")
    ts: datetime = Field(description="Hora UTC do GPS")
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    vel: float = Field(ge=0, description="Velocidade")
    alt: float | None = None
    sats: int = Field(ge=0)
    hdop: float = Field(ge=0)
    bat: int | None = Field(default=None, ge=0, le=100)
    gw: str
    rssi: int | None = None
