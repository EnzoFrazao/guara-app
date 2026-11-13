from fastapi import APIRouter

from app.core.deps import exigir_perfil, nao_implementado

router = APIRouter(tags=["pessoas"], dependencies=[exigir_perfil("admin")])


@router.get("/pessoas")
def listar_pessoas():
    raise nao_implementado("GET /pessoas")


@router.post("/pessoas")
def criar_pessoa():
    raise nao_implementado("POST /pessoas")


@router.patch("/pessoas/{pessoa_id}")
def atualizar_pessoa(pessoa_id: int):
    raise nao_implementado("PATCH /pessoas/{id}")
