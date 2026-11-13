from app.core.security import (
    criar_token_acesso,
    hash_senha,
    identificar_por_token,
    ler_token_acesso,
    senha_confere,
)


def test_senha_argon2():
    h = hash_senha("segredo")
    assert h != "segredo" and h.startswith("$argon2")
    assert senha_confere("segredo", h)
    assert not senha_confere("outra", h)


def test_jwt_ida_e_volta():
    corpo = ler_token_acesso(criar_token_acesso("7", "analista"))
    assert corpo is not None and corpo["sub"] == "7" and corpo["perfil"] == "analista"


def test_jwt_invalido_ou_vencido_vira_none(monkeypatch):
    assert ler_token_acesso("não.é.jwt") is None
    from app.core import security

    monkeypatch.setattr(security.get_settings(), "jwt_minutos", -1)
    assert ler_token_acesso(criar_token_acesso("7", "analista")) is None


def test_token_de_maquina():
    tokens = {"gw-01": "abc", "gw-02": "def"}
    assert identificar_por_token("def", tokens) == "gw-02"
    assert identificar_por_token("xxx", tokens) is None
    assert identificar_por_token(None, tokens) is None
