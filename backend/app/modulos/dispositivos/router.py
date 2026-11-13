from fastapi import APIRouter

from app.core.deps import exigir_perfil, nao_implementado

router = APIRouter(tags=["dispositivos"], dependencies=[exigir_perfil("admin")])


@router.get("/dispositivos")
def listar_dispositivos():
    raise nao_implementado("GET /dispositivos")


@router.post("/dispositivos")
def criar_dispositivo():
    raise nao_implementado("POST /dispositivos")


@router.post("/dispositivos/{dispositivo_id}/vinculo")
def vincular(dispositivo_id: int):
    raise nao_implementado("POST /dispositivos/{id}/vinculo")


@router.delete("/dispositivos/{dispositivo_id}/vinculo")
def desvincular(dispositivo_id: int):
    raise nao_implementado("DELETE /dispositivos/{id}/vinculo")
