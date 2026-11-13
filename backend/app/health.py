"""GET /api/v1/health: sem login, para o monitoramento."""

from fastapi import APIRouter, Response, status

from app.db import session

router = APIRouter(tags=["saude"])


@router.get("/health")
def saude(resposta: Response):
    banco = session.banco_responde()
    if not banco:
        resposta.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ok" if banco else "degradado", "api": "ok", "banco": "ok" if banco else "indisponivel"}
