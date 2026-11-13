import pytest
from starlette.websockets import WebSocketDisconnect

from app.modulos.tempo_real import router as rotas
from app.modulos.tempo_real.service import Duplicados
from tests.conftest import token_de


@pytest.fixture(autouse=True)
def zerar_duplicados():
    rotas._duplicados = Duplicados()


def test_gateway_sem_token_e_recusado(cliente):
    with pytest.raises(WebSocketDisconnect) as erro, cliente.websocket_connect("/ws/gateway"):
        pass
    assert erro.value.code == 1008


def test_gateway_com_token_errado_e_recusado(cliente):
    with pytest.raises(WebSocketDisconnect), cliente.websocket_connect(
        "/ws/gateway", headers={"Authorization": "Bearer errado"}
    ):
        pass


def test_gateway_confirma_com_ack(cliente, cabecalho_gateway, telemetria):
    with cliente.websocket_connect("/ws/gateway", headers=cabecalho_gateway) as ws:
        ws.send_json(telemetria)
        assert ws.receive_json() == {"tipo": "ack", "id": "ESP32-0A1B", "seq": 1842}


def test_gateway_mensagem_invalida_recebe_erro_e_a_conexao_segue(cliente, cabecalho_gateway, telemetria):
    with cliente.websocket_connect("/ws/gateway", headers=cabecalho_gateway) as ws:
        ws.send_text("isso não é json")
        assert ws.receive_json() == {"tipo": "erro", "motivo": "mensagem_invalida"}
        ws.send_json({**telemetria, "lat": 999})
        assert ws.receive_json()["tipo"] == "erro"
        ws.send_json(telemetria)
        assert ws.receive_json()["tipo"] == "ack"


def test_duplicada_tambem_recebe_ack_mas_nao_vai_ao_painel(cliente, cabecalho_gateway, telemetria):
    # O painel usa ?token= (o navegador não envia cabeçalho no WebSocket).
    with cliente.websocket_connect(f"/ws/painel?token={token_de('analista')}") as p, cliente.websocket_connect(
        "/ws/gateway", headers=cabecalho_gateway
    ) as g:
        g.send_json(telemetria)
        assert g.receive_json()["tipo"] == "ack"
        evento = p.receive_json()
        assert evento["tipo"] == "posicao" and evento["id"] == "ESP32-0A1B" and evento["seq"] == 1842

        g.send_json(telemetria)  # a mesh entregou de novo
        assert g.receive_json() == {"tipo": "ack", "id": "ESP32-0A1B", "seq": 1842}
        g.send_json({**telemetria, "seq": 1843})
        g.receive_json()
        assert p.receive_json()["seq"] == 1843  # a próxima mensagem do painel é a 1843, não a repetida


def test_painel_sem_jwt_valido_e_recusado(cliente):
    with pytest.raises(WebSocketDisconnect), cliente.websocket_connect("/ws/painel?token=lixo"):
        pass
    with pytest.raises(WebSocketDisconnect), cliente.websocket_connect("/ws/painel"):
        pass


def test_rele_exige_o_proprio_token(cliente):
    with pytest.raises(WebSocketDisconnect), cliente.websocket_connect(
        "/ws/rele", headers={"Authorization": "Bearer token-do-gateway"}
    ):
        pass
    with cliente.websocket_connect("/ws/rele", headers={"Authorization": "Bearer token-do-rele"}) as ws:
        ws.send_text("vivo")  # aceitou e segue aberta


def test_duplicados_descarta_os_mais_antigos():
    d = Duplicados(por_dispositivo=2)
    assert not d.ja_vista("ESP32-0A1B", 1)
    assert not d.ja_vista("ESP32-0A1B", 2)
    assert not d.ja_vista("ESP32-0A1B", 3)  # empurra o 1 para fora
    assert d.ja_vista("ESP32-0A1B", 3)
    assert not d.ja_vista("ESP32-0A1B", 1)  # esqueceu: limite de memória por dispositivo
