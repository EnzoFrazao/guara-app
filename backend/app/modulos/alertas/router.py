from fastapi import APIRouter

from app.core.deps import exigir_perfil, nao_implementado

router = APIRouter(tags=["alertas"])


@router.get("/alertas", dependencies=[exigir_perfil("analista")])
def listar_alertas():
    raise nao_implementado("GET /alertas")


@router.post("/alertas/{alerta_id}/reconhecer", dependencies=[exigir_perfil("analista")])
def reconhecer_alerta(alerta_id: int):
    raise nao_implementado("POST /alertas/{id}/reconhecer")


@router.get("/bloqueios", dependencies=[exigir_perfil("seguranca")])
def listar_bloqueios():
    raise nao_implementado("GET /bloqueios")


@router.post("/bloqueios/{bloqueio_id}/liberar", dependencies=[exigir_perfil("seguranca")])
def liberar_bloqueio(bloqueio_id: int):
    """Liberar só com confirmação humana: nunca automático."""
    raise nao_implementado("POST /bloqueios/{id}/liberar")
