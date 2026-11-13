"""Senha (Argon2), JWT de acesso e conferência de tokens de máquina (gateway e relé)."""

import hmac
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError

from app.core.config import get_settings

PERFIS = ("analista", "seguranca", "admin")

_hasher = PasswordHasher()


def hash_senha(senha: str) -> str:
    return _hasher.hash(senha)


def senha_confere(senha: str, hash_: str) -> bool:
    try:
        return _hasher.verify(hash_, senha)
    except VerificationError:
        return False


def criar_token_acesso(usuario_id: str, perfil: str) -> str:
    cfg = get_settings()
    agora = datetime.now(UTC)
    corpo = {"sub": usuario_id, "perfil": perfil, "iat": agora, "exp": agora + timedelta(minutes=cfg.jwt_minutos)}
    return jwt.encode(corpo, cfg.jwt_secret, algorithm="HS256")


def ler_token_acesso(token: str) -> dict | None:
    """Devolve o corpo do JWT, ou None se for inválido ou estiver vencido."""
    try:
        return jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def identificar_por_token(token: str | None, tokens: dict[str, str]) -> str | None:
    """Acha o dono de um token de máquina (comparação em tempo constante)."""
    if not token:
        return None
    achado = None
    for dono, valor in tokens.items():
        if hmac.compare_digest(token.encode(), valor.encode()):
            achado = dono
    return achado
