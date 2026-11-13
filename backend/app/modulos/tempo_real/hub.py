"""Hub de conexões: guarda os painéis abertos e empurra cada evento a todos eles."""

from fastapi import WebSocket


class Hub:
    def __init__(self) -> None:
        self._paineis: set[WebSocket] = set()

    def entrar(self, painel: WebSocket) -> None:
        self._paineis.add(painel)

    def sair(self, painel: WebSocket) -> None:
        self._paineis.discard(painel)

    @property
    def total(self) -> int:
        return len(self._paineis)

    async def transmitir(self, evento: dict) -> None:
        # Painel que caiu no meio do envio sai da lista; os outros seguem recebendo.
        for painel in list(self._paineis):
            try:
                await painel.send_json(evento)
            except Exception:
                self.sair(painel)


hub = Hub()
