from fastapi import APIRouter

from app.core.deps import exigir_perfil, nao_implementado

router = APIRouter(tags=["acionamentos"], dependencies=[exigir_perfil("analista")])


@router.post("/demandas")
def abrir_demanda():
    raise nao_implementado("POST /demandas")


@router.get("/demandas/{demanda_id}/candidatos")
def candidatos(demanda_id: int):
    """Ranking de quem chega mais rápido (algoritmo húngaro, SciPy, quando houver contrato)."""
    raise nao_implementado("GET /demandas/{id}/candidatos")


@router.post("/acionamentos")
def acionar():
    raise nao_implementado("POST /acionamentos")


@router.patch("/acionamentos/{acionamento_id}")
def atualizar_acionamento(acionamento_id: int):
    raise nao_implementado("PATCH /acionamentos/{id}")


@router.get("/relatorios/tempos-deslocamento")
def tempos_de_deslocamento():
    raise nao_implementado("GET /relatorios/tempos-deslocamento")
