"""Regras do canal em tempo real: confirmar cada leitura do gateway e avisar os painéis.

Uma leitura percorre: tempo_real recebe do gateway -> posicoes valida -> (areas, alertas) -> tempo_real
avisa os painéis. Só as pontas de tempo_real e posicoes existem hoje.
"""

from collections import OrderedDict

from pydantic import ValidationError

from app.modulos.posicoes import service as posicoes
from app.modulos.posicoes.schemas import Telemetria
from app.modulos.tempo_real.hub import Hub
from app.modulos.tempo_real.schemas import Ack, Erro


class Duplicados:
    """Lembra os últimos `seq` de cada dispositivo: a mesh pode entregar o mesmo pacote duas vezes.

    Em memória, por processo. A garantia definitiva é a chave única (dispositivo, seq) do banco.
    """

    def __init__(self, por_dispositivo: int = 1000) -> None:
        self._limite = por_dispositivo
        self._vistos: dict[str, OrderedDict[int, None]] = {}

    def ja_vista(self, dispositivo: str, seq: int) -> bool:
        vistos = self._vistos.setdefault(dispositivo, OrderedDict())
        if seq in vistos:
            return True
        vistos[seq] = None
        if len(vistos) > self._limite:
            vistos.popitem(last=False)
        return False


async def tratar_mensagem_do_gateway(texto: str, hub: Hub, duplicados: Duplicados) -> dict:
    """Devolve o que responder ao gateway: `ack` (inclusive para duplicada) ou `erro`."""
    try:
        leitura = Telemetria.model_validate_json(texto)
    except ValidationError:
        return Erro(motivo="mensagem_invalida").model_dump()

    # Duplicada também recebe ack, senão o gateway reenviaria para sempre.
    if not duplicados.ja_vista(leitura.id, leitura.seq):
        leitura = posicoes.ingerir(leitura)
        await hub.transmitir(
            {"tipo": "posicao", "id": leitura.id, "seq": leitura.seq, "ts": leitura.ts.isoformat(),
             "lat": leitura.lat, "lon": leitura.lon}
        )
    return Ack(id=leitura.id, seq=leitura.seq).model_dump()
