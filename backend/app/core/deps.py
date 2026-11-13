"""Dependências de autenticação das rotas REST (`/api/v1`)."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import ler_token_acesso

_bearer = HTTPBearer(auto_error=False)


def usuario_atual(
    credenciais: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    corpo = ler_token_acesso(credenciais.credentials) if credenciais else None
    if corpo is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Login necessário.", {"WWW-Authenticate": "Bearer"})
    return corpo


def exigir_perfil(*perfis: str):
    """Barra quem não tem um dos perfis. Sem perfis, basta estar logado."""

    def verificar(usuario: Annotated[dict, Depends(usuario_atual)]) -> dict:
        if perfis and usuario.get("perfil") not in perfis:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Perfil sem permissão para esta rota.")
        return usuario

    return Depends(verificar)


def nao_implementado(rota: str) -> HTTPException:
    """Rota já no contrato (documento de arquitetura), ainda sem regra construída."""
    return HTTPException(status.HTTP_501_NOT_IMPLEMENTED, f"{rota}: ainda não implementado.")
