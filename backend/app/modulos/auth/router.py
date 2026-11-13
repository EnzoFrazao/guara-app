from fastapi import APIRouter

from app.core.deps import exigir_perfil, nao_implementado

router = APIRouter(tags=["auth"])


@router.post("/auth/login")
def login():
    raise nao_implementado("POST /auth/login")


@router.post("/auth/refresh")
def renovar():
    raise nao_implementado("POST /auth/refresh")


@router.post("/auth/logout")
def sair():
    raise nao_implementado("POST /auth/logout")


@router.get("/me", dependencies=[exigir_perfil()])
def meu_perfil():
    raise nao_implementado("GET /me")
