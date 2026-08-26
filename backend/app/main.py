import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import auth, accounts, transactions, categories, debts, budgets, chat
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(title="Numsa API", version="1.0.0")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Error no manejado en %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Ocurrió un error inesperado, intenta de nuevo."})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(accounts.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(debts.router, prefix="/api/v1")
app.include_router(budgets.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
