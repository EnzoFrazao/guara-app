import os

# Antes de importar o app: o Settings lê o ambiente na primeira chamada.
os.environ["JWT_SECRET"] = "segredo-de-teste-com-mais-de-32-caracteres"
os.environ["GATEWAY_TOKENS"] = '{"gw-01": "token-do-gateway"}'
os.environ["RELE_TOKENS"] = '{"rele-01": "token-do-rele"}'

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.security import criar_token_acesso  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def cliente():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def cabecalho_gateway():
    return {"Authorization": "Bearer token-do-gateway"}


def token_de(perfil: str) -> str:
    return criar_token_acesso("1", perfil)


@pytest.fixture
def telemetria():
    return {
        "tipo": "telemetria", "v": 1, "id": "ESP32-0A1B", "seq": 1842, "ts": "2026-11-11T14:03:30Z",
        "lat": -2.5712, "lon": -44.3701, "vel": 4.8, "alt": 12, "sats": 9, "hdop": 0.9,
        "bat": 78, "gw": "GW-01", "rssi": -97,
    }
