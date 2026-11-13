"""Cria o FastAPI e registra as rotas de cada módulo. Rotas REST sob /api/v1; WebSockets na raiz."""

from fastapi import FastAPI

from app.health import router as saude
from app.modulos.acionamentos.router import router as acionamentos
from app.modulos.alertas.router import router as alertas
from app.modulos.areas.router import router as areas
from app.modulos.auth.router import router as auth
from app.modulos.dispositivos.router import router as dispositivos
from app.modulos.pessoas.router import router as pessoas
from app.modulos.posicoes.router import router as posicoes
from app.modulos.tempo_real.router import router as tempo_real

app = FastAPI(title="GUARÁ · API da homologação", version="0.1.0")

for rotas in (saude, auth, pessoas, dispositivos, areas, posicoes, acionamentos, alertas):
    app.include_router(rotas, prefix="/api/v1")

# /ws/gateway, /ws/painel e /ws/rele (passam pela porta 443, como o site).
app.include_router(tempo_real)
