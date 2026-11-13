"""Regras da ingestão de leituras.

Pendente (sem contrato fechado): descartar leitura ruim (menos de 4 satélites ou HDOP alto, limite a
definir), achar a pessoa vinculada ao dispositivo naquela hora, achar o trecho/área (PostGIS) e gravar
`leitura_posicao` + `posicao_atual`. Hoje a leitura só é validada e devolvida.
"""

from app.modulos.posicoes.schemas import Telemetria


def ingerir(leitura: Telemetria) -> Telemetria:
    return leitura
