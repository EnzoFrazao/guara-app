from app.db import session
from tests.conftest import token_de


def test_health_sem_login_e_banco_fora(cliente, monkeypatch):
    monkeypatch.setattr(session, "banco_responde", lambda: False)
    r = cliente.get("/api/v1/health")
    assert r.status_code == 503
    assert r.json() == {"status": "degradado", "api": "ok", "banco": "indisponivel"}


def test_health_com_banco(cliente, monkeypatch):
    monkeypatch.setattr(session, "banco_responde", lambda: True)
    r = cliente.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_rota_do_contrato_exige_login(cliente):
    assert cliente.get("/api/v1/posicoes/atuais").status_code == 401
    assert cliente.get("/api/v1/posicoes/atuais", headers={"Authorization": "Bearer lixo"}).status_code == 401


def test_perfil_errado_recebe_403(cliente):
    h = {"Authorization": f"Bearer {token_de('seguranca')}"}
    assert cliente.get("/api/v1/posicoes/atuais", headers=h).status_code == 403
    assert cliente.get("/api/v1/bloqueios", headers=h).status_code == 501  # permitido, ainda sem regra


def test_rota_com_perfil_certo_responde_501_enquanto_nao_implementada(cliente):
    h = {"Authorization": f"Bearer {token_de('analista')}"}
    r = cliente.get("/api/v1/posicoes/atuais", headers=h)
    assert r.status_code == 501
    assert "ainda não implementado" in r.json()["detail"]


def test_login_nao_pede_token(cliente):
    assert cliente.post("/api/v1/auth/login").status_code == 501
