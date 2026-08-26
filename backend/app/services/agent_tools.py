import json
import uuid
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.account import AccountOut
from app.schemas.transaction import TransactionCreate
from app.services import account as account_service
from app.services import budget as budget_service
from app.services import category as category_service
from app.services import transaction as transaction_service

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "list_accounts",
            "description": "Lista las cuentas del usuario con su saldo actual. Úsala si necesitas saber en qué cuenta registrar algo y hay más de una.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_categories",
            "description": "Lista las categorías de gasto e ingreso del usuario. Úsala si no estás seguro de qué categoría usar.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_transaction",
            "description": "Registra un gasto o ingreso nuevo para el usuario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "amount": {"type": "number", "description": "Monto, siempre positivo"},
                    "type": {"type": "string", "enum": ["income", "expense"]},
                    "category_name": {"type": "string", "description": "Nombre de una categoría existente del usuario"},
                    "account_name": {
                        "type": "string",
                        "description": "Nombre de la cuenta a usar. Opcional si el usuario solo tiene una cuenta.",
                    },
                    "description": {"type": "string", "description": "Descripción corta, opcional"},
                    "date": {"type": "string", "description": "Fecha en formato YYYY-MM-DD. Si no se da, es hoy."},
                },
                "required": ["amount", "type", "category_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_transactions_summary",
            "description": "Consulta y suma las transacciones del usuario en un rango de fechas, opcionalmente filtradas por categoría o tipo. Úsala para responder preguntas como '¿cuánto gasté esta semana?'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date_from": {"type": "string", "description": "YYYY-MM-DD"},
                    "date_to": {"type": "string", "description": "YYYY-MM-DD"},
                    "category_name": {"type": "string"},
                    "type": {"type": "string", "enum": ["income", "expense", "transfer"]},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "budget_status",
            "description": "Muestra el estado de los presupuestos del usuario: límite, gastado y porcentaje usado por categoría. Úsala para dar alertas o recomendaciones sobre presupuestos.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


def _parse_date(value: str | None) -> date:
    if not value:
        return date.today()
    return date.fromisoformat(value)


async def _resolve_account(user_id: uuid.UUID, db: AsyncSession, account_name: str | None) -> AccountOut | str:
    accounts = await account_service.get_all(user_id, db)
    if not accounts:
        return "El usuario no tiene ninguna cuenta registrada todavía. Pídele que cree una desde la sección Cuentas."
    if not account_name:
        if len(accounts) == 1:
            return accounts[0]
        names = ", ".join(a.name for a in accounts)
        return f"El usuario tiene varias cuentas ({names}). Pregúntale cuál quiere usar y vuelve a intentar con account_name."
    match = next((a for a in accounts if a.name.lower() == account_name.lower()), None)
    if not match:
        names = ", ".join(a.name for a in accounts)
        return f"No existe una cuenta llamada '{account_name}'. Cuentas disponibles: {names}."
    return match


async def _resolve_category(
    user_id: uuid.UUID, db: AsyncSession, category_name: str, is_income: bool
) -> Category | str:
    categories = await category_service.get_all(user_id, db)
    candidates = [c for c in categories if c.is_income == is_income]
    match = next((c for c in candidates if c.name.lower() == category_name.lower()), None)
    if not match:
        names = ", ".join(c.name for c in candidates)
        return f"No existe la categoría '{category_name}' para este tipo. Categorías disponibles: {names}."
    return match


async def list_accounts(user_id: uuid.UUID, db: AsyncSession) -> str:
    accounts = await account_service.get_all(user_id, db)
    return json.dumps([{"name": a.name, "type": a.type, "balance": a.balance} for a in accounts])


async def list_categories(user_id: uuid.UUID, db: AsyncSession) -> str:
    categories = await category_service.get_all(user_id, db)
    return json.dumps([{"name": c.name, "is_income": c.is_income} for c in categories])


async def create_transaction(
    user_id: uuid.UUID,
    db: AsyncSession,
    amount: float,
    type: str,
    category_name: str,
    account_name: str | None = None,
    description: str | None = None,
    date: str | None = None,
) -> str:
    account = await _resolve_account(user_id, db, account_name)
    if isinstance(account, str):
        return account

    category = await _resolve_category(user_id, db, category_name, is_income=(type == "income"))
    if isinstance(category, str):
        return category

    tx = await transaction_service.create(
        TransactionCreate(
            account_id=account.id,
            category_id=category.id,
            amount=amount,
            type=type,
            description=description,
            date=_parse_date(date),
        ),
        user_id,
        db,
    )
    return json.dumps({"ok": True, "id": str(tx.id), "amount": tx.amount, "category": category.name})


async def query_transactions_summary(
    user_id: uuid.UUID,
    db: AsyncSession,
    date_from: str | None = None,
    date_to: str | None = None,
    category_name: str | None = None,
    type: str | None = None,
) -> str:
    category_id = None
    if category_name:
        categories = await category_service.get_all(user_id, db)
        match = next((c for c in categories if c.name.lower() == category_name.lower()), None)
        if not match:
            names = ", ".join(c.name for c in categories)
            return f"No existe la categoría '{category_name}'. Categorías disponibles: {names}."
        category_id = match.id

    transactions = await transaction_service.get_all(
        user_id,
        db,
        date_from=_parse_date(date_from) if date_from else None,
        date_to=_parse_date(date_to) if date_to else None,
        category_id=category_id,
        type=type,
    )
    total = sum(t.amount for t in transactions)
    return json.dumps(
        {
            "count": len(transactions),
            "total": total,
            "transactions": [
                {"amount": t.amount, "type": t.type, "category_id": str(t.category_id) if t.category_id else None, "date": t.date.isoformat(), "description": t.description}
                for t in transactions
            ],
        }
    )


async def budget_status(user_id: uuid.UUID, db: AsyncSession) -> str:
    statuses = await budget_service.get_status(user_id, db)
    return json.dumps(
        [
            {
                "category": s.category_name,
                "limit": s.limit_amount,
                "spent": s.spent_amount,
                "remaining": s.remaining,
                "used_pct": s.used_pct,
            }
            for s in statuses
        ]
    )


TOOL_EXECUTORS = {
    "list_accounts": list_accounts,
    "list_categories": list_categories,
    "create_transaction": create_transaction,
    "query_transactions_summary": query_transactions_summary,
    "budget_status": budget_status,
}
