from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, accounts, transactions, categories, debts, budgets
from app.core.config import settings

app = FastAPI(title="Numsa API", version="1.0.0")

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


@app.get("/health")
async def health():
    return {"status": "ok"}
