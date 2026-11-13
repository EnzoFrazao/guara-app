"""WebSockets: /ws/gateway (leituras), /ws/painel (eventos ao vivo) e /ws/rele (bloqueio).

Os três passam pela porta 443, a mesma do site. Recusa-se a conexão antes de aceitá-la quando o token
não confere.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.config import get_settings
from app.core.security import identificar_por_token, ler_token_acesso
from app.modulos.tempo_real.hub import hub
from app.modulos.tempo_real.service import Duplicados, tratar_mensagem_do_gateway

router = APIRouter(tags=["tempo_real"])

_duplicados = Duplicados()


def _bearer(ws: WebSocket) -> str | None:
    """Token de máquina no cabeçalho `Authorization: Bearer <token>` (o esp_websocket_client envia cabeçalhos)."""
    valor = ws.headers.get("authorization", "")
    return valor[7:] if valor.lower().startswith("bearer ") else None


@router.websocket("/ws/gateway")
async def ws_gateway(ws: WebSocket):
    if identificar_por_token(_bearer(ws), get_settings().gateway_tokens) is None:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    try:
        while True:
            resposta = await tratar_mensagem_do_gateway(await ws.receive_text(), hub, _duplicados)
            await ws.send_json(resposta)
    except WebSocketDisconnect:
        pass


@router.websocket("/ws/painel")
async def ws_painel(ws: WebSocket):
    # O navegador não envia cabeçalho no WebSocket: o JWT de login vai em ?token=. Como passar o token
    # ao abrir a conexão é decisão em aberto (open-decisions.md); hoje vale a query string.
    if ler_token_acesso(ws.query_params.get("token", "")) is None:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    hub.entrar(ws)
    try:
        while True:
            await ws.receive_text()  # o painel só ouve; ler mantém a conexão e percebe a queda
    except WebSocketDisconnect:
        pass
    finally:
        hub.sair(ws)


@router.websocket("/ws/rele")
async def ws_rele(ws: WebSocket):
    if identificar_por_token(_bearer(ws), get_settings().rele_tokens) is None:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    # Pendente: enviar bloquear/liberar e o sinal de vida (o relé abre se ficar 15 s sem sinal).
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
