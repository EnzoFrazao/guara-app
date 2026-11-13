from datetime import datetime

from fastapi import APIRouter

from app.core.deps import exigir_perfil, nao_implementado

router = APIRouter(tags=["posicoes"], dependencies=[exigir_perfil("analista")])


@router.get("/posicoes/atuais")
def posicoes_atuais():
    """Foto inicial do mapa ao abrir o painel (depois, os eventos chegam por /ws/painel)."""
    raise nao_implementado("GET /posicoes/atuais")


@router.get("/pessoas/{pessoa_id}/trajeto")
def trajeto(pessoa_id: int, de: datetime | None = None, ate: datetime | None = None):
    raise nao_implementado("GET /pessoas/{id}/trajeto")
