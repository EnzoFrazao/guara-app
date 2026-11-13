from fastapi import APIRouter

from app.core.deps import exigir_perfil, nao_implementado

router = APIRouter(tags=["areas"], dependencies=[exigir_perfil("admin")])


@router.get("/areas")
def listar_areas():
    raise nao_implementado("GET /areas")


@router.post("/areas")
def criar_area():
    raise nao_implementado("POST /areas")


@router.patch("/areas/{area_id}")
def atualizar_area(area_id: int):
    raise nao_implementado("PATCH /areas/{id}")
