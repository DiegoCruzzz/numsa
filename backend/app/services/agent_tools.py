import json
import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.account import AccountCreate, AccountOut, AccountUpdate
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetUpdate
from app.schemas.category import CategoryCreate
from app.schemas.debt import DebtCreate, DebtOut, DebtUpdate
from app.schemas.transaction import TransactionCreate, TransactionUpdate
from app.services import account as account_service
from app.services import budget as budget_service
from app.services import category as category_service
from app.services import debt as debt_service
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
            "name": "create_account",
            "description": "Crea una cuenta nueva (efectivo, débito, crédito o ahorro).",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "type": {"type": "string", "enum": ["cash", "debit", "credit", "savings"]},
                    "balance": {"type": "number", "description": "Saldo inicial, default 0"},
                    "currency": {"type": "string", "description": "Default MXN"},
                },
                "required": ["name", "type"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_account",
            "description": "Actualiza una cuenta existente (nombre, tipo, saldo, moneda o si está activa).",
            "parameters": {
                "type": "object",
                "properties": {
                    "account_name": {"type": "string", "description": "Nombre actual de la cuenta. Opcional si el usuario solo tiene una."},
                    "new_name": {"type": "string"},
                    "type": {"type": "string", "enum": ["cash", "debit", "credit", "savings"]},
                    "balance": {"type": "number"},
                    "currency": {"type": "string"},
                    "is_active": {"type": "boolean"},
                },
                "required": [],
            },
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
            "name": "create_category",
            "description": "Crea una categoría nueva de gasto o ingreso.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "is_income": {"type": "boolean", "description": "true si es categoría de ingreso, false si es de gasto"},
                    "icon": {"type": "string", "description": "Un emoji representativo, opcional"},
                    "color": {"type": "string", "description": "Color hex, opcional"},
                },
                "required": ["name", "is_income"],
            },
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
            "name": "update_transaction",
            "description": "Edita una transacción ya existente. Necesitas el transaction_id — consíguelo primero con query_transactions_summary.",
            "parameters": {
                "type": "object",
                "properties": {
                    "transaction_id": {"type": "string"},
                    "amount": {"type": "number"},
                    "type": {"type": "string", "enum": ["income", "expense", "transfer"]},
                    "category_name": {"type": "string"},
                    "description": {"type": "string"},
                    "date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["transaction_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_transactions_summary",
            "description": "Consulta y suma las transacciones del usuario en un rango de fechas, opcionalmente filtradas por categoría o tipo. Úsala para responder preguntas como '¿cuánto gasté esta semana?', y para obtener el id de una transacción antes de editarla.",
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
            "name": "create_debt",
            "description": "Registra una deuda nueva (algo que el usuario debe a un acreedor).",
            "parameters": {
                "type": "object",
                "properties": {
                    "creditor": {"type": "string", "description": "A quién se le debe, ej. 'Tarjeta BBVA'"},
                    "total_amount": {"type": "number"},
                    "remaining_amount": {"type": "number", "description": "Si no se da, se asume igual a total_amount"},
                    "monthly_payment": {"type": "number"},
                    "interest_rate": {"type": "number", "description": "Porcentaje, default 0"},
                    "due_date": {"type": "string", "description": "YYYY-MM-DD, opcional"},
                    "status": {"type": "string", "enum": ["active", "paid", "negotiating"]},
                },
                "required": ["creditor", "total_amount", "monthly_payment"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_debt",
            "description": "Actualiza una deuda existente o registra un abono/pago (usa payment_amount para restar del saldo pendiente en vez de calcular tú el nuevo total).",
            "parameters": {
                "type": "object",
                "properties": {
                    "creditor_name": {"type": "string", "description": "Nombre del acreedor tal como está registrado"},
                    "payment_amount": {"type": "number", "description": "Monto abonado — se resta del remaining_amount actual"},
                    "remaining_amount": {"type": "number", "description": "Nuevo saldo pendiente absoluto, alternativa a payment_amount"},
                    "monthly_payment": {"type": "number"},
                    "interest_rate": {"type": "number"},
                    "due_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "status": {"type": "string", "enum": ["active", "paid", "negotiating"]},
                },
                "required": ["creditor_name"],
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
    {
        "type": "function",
        "function": {
            "name": "create_budget",
            "description": "Crea un presupuesto nuevo para una categoría de gasto.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category_name": {"type": "string"},
                    "limit_amount": {"type": "number"},
                    "period": {"type": "string", "enum": ["monthly", "weekly"], "description": "Default monthly"},
                    "start_date": {"type": "string", "description": "YYYY-MM-DD, default hoy"},
                },
                "required": ["category_name", "limit_amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_budget",
            "description": "Actualiza el presupuesto existente de una categoría.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category_name": {"type": "string"},
                    "limit_amount": {"type": "number"},
                    "period": {"type": "string", "enum": ["monthly", "weekly"]},
                    "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["category_name"],
            },
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
        return "El usuario no tiene ninguna cuenta registrada todavía. Pídele que cree una desde la sección Cuentas, o créala tú con create_account."
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


async def _resolve_debt(user_id: uuid.UUID, db: AsyncSession, creditor_name: str) -> DebtOut | str:
    debts = await debt_service.get_all(user_id, db)
    if not debts:
        return "El usuario no tiene deudas registradas todavía."
    match = next((d for d in debts if d.creditor.lower() == creditor_name.lower()), None)
    if not match:
        names = ", ".join(d.creditor for d in debts)
        return f"No encontré una deuda con '{creditor_name}'. Deudas registradas: {names}."
    return match


async def _resolve_budget(user_id: uuid.UUID, db: AsyncSession, category_name: str) -> BudgetOut | str:
    category = await _resolve_category(user_id, db, category_name, is_income=False)
    if isinstance(category, str):
        return category
    budgets = await budget_service.get_all(user_id, db)
    match = next((b for b in budgets if b.category_id == category.id), None)
    if not match:
        return f"No hay un presupuesto para la categoría '{category_name}'. Créalo primero con create_budget."
    return match


async def list_accounts(user_id: uuid.UUID, db: AsyncSession) -> str:
    accounts = await account_service.get_all(user_id, db)
    return json.dumps([{"name": a.name, "type": a.type, "balance": a.balance} for a in accounts])


async def create_account(
    user_id: uuid.UUID, db: AsyncSession, name: str, type: str, balance: float = 0, currency: str = "MXN"
) -> str:
    account = await account_service.create(AccountCreate(name=name, type=type, balance=balance, currency=currency), user_id, db)
    return json.dumps({"ok": True, "id": str(account.id), "name": account.name, "balance": account.balance})


async def update_account(
    user_id: uuid.UUID,
    db: AsyncSession,
    account_name: str | None = None,
    new_name: str | None = None,
    type: str | None = None,
    balance: float | None = None,
    currency: str | None = None,
    is_active: bool | None = None,
) -> str:
    account = await _resolve_account(user_id, db, account_name)
    if isinstance(account, str):
        return account
    updated = await account_service.update(
        account.id,
        AccountUpdate(name=new_name, type=type, balance=balance, currency=currency, is_active=is_active),
        user_id,
        db,
    )
    return json.dumps({"ok": True, "id": str(updated.id), "name": updated.name, "balance": updated.balance})


async def list_categories(user_id: uuid.UUID, db: AsyncSession) -> str:
    categories = await category_service.get_all(user_id, db)
    return json.dumps([{"name": c.name, "is_income": c.is_income} for c in categories])


async def create_category(
    user_id: uuid.UUID,
    db: AsyncSession,
    name: str,
    is_income: bool = False,
    icon: str | None = None,
    color: str | None = None,
) -> str:
    category = await category_service.create(CategoryCreate(name=name, icon=icon, color=color, is_income=is_income), user_id, db)
    return json.dumps({"ok": True, "id": str(category.id), "name": category.name})


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


async def update_transaction(
    user_id: uuid.UUID,
    db: AsyncSession,
    transaction_id: str,
    amount: float | None = None,
    type: str | None = None,
    category_name: str | None = None,
    description: str | None = None,
    date: str | None = None,
) -> str:
    try:
        tx_uuid = uuid.UUID(transaction_id)
    except ValueError:
        return "El id de transacción no es válido. Usa query_transactions_summary primero para obtenerlo."

    try:
        existing = await transaction_service.get_one(tx_uuid, user_id, db)
    except HTTPException:
        return "No encontré esa transacción."

    category_id = None
    if category_name:
        effective_type = type or existing.type
        category = await _resolve_category(user_id, db, category_name, is_income=(effective_type == "income"))
        if isinstance(category, str):
            return category
        category_id = category.id

    updated = await transaction_service.update(
        tx_uuid,
        TransactionUpdate(
            amount=amount,
            type=type,
            category_id=category_id,
            description=description,
            date=_parse_date(date) if date else None,
        ),
        user_id,
        db,
    )
    return json.dumps({"ok": True, "id": str(updated.id), "amount": updated.amount})


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
                {
                    "id": str(t.id),
                    "amount": t.amount,
                    "type": t.type,
                    "category_id": str(t.category_id) if t.category_id else None,
                    "date": t.date.isoformat(),
                    "description": t.description,
                }
                for t in transactions
            ],
        }
    )


async def create_debt(
    user_id: uuid.UUID,
    db: AsyncSession,
    creditor: str,
    total_amount: float,
    monthly_payment: float,
    remaining_amount: float | None = None,
    interest_rate: float = 0,
    due_date: str | None = None,
    status: str = "active",
) -> str:
    debt = await debt_service.create(
        DebtCreate(
            creditor=creditor,
            total_amount=total_amount,
            remaining_amount=remaining_amount if remaining_amount is not None else total_amount,
            monthly_payment=monthly_payment,
            interest_rate=interest_rate,
            due_date=_parse_date(due_date) if due_date else None,
            status=status,
        ),
        user_id,
        db,
    )
    return json.dumps({"ok": True, "id": str(debt.id), "creditor": debt.creditor, "remaining_amount": debt.remaining_amount})


async def update_debt(
    user_id: uuid.UUID,
    db: AsyncSession,
    creditor_name: str,
    payment_amount: float | None = None,
    remaining_amount: float | None = None,
    monthly_payment: float | None = None,
    interest_rate: float | None = None,
    due_date: str | None = None,
    status: str | None = None,
) -> str:
    debt = await _resolve_debt(user_id, db, creditor_name)
    if isinstance(debt, str):
        return debt

    new_remaining = remaining_amount
    if payment_amount is not None:
        new_remaining = max(debt.remaining_amount - payment_amount, 0)
    if new_remaining is not None and new_remaining <= 0 and status is None:
        status = "paid"

    updated = await debt_service.update(
        debt.id,
        DebtUpdate(
            remaining_amount=new_remaining,
            monthly_payment=monthly_payment,
            interest_rate=interest_rate,
            due_date=_parse_date(due_date) if due_date else None,
            status=status,
        ),
        user_id,
        db,
    )
    return json.dumps(
        {"ok": True, "creditor": updated.creditor, "remaining_amount": updated.remaining_amount, "status": updated.status}
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


async def create_budget(
    user_id: uuid.UUID,
    db: AsyncSession,
    category_name: str,
    limit_amount: float,
    period: str = "monthly",
    start_date: str | None = None,
) -> str:
    category = await _resolve_category(user_id, db, category_name, is_income=False)
    if isinstance(category, str):
        return category
    budget = await budget_service.create(
        BudgetCreate(category_id=category.id, limit_amount=limit_amount, period=period, start_date=_parse_date(start_date)),
        user_id,
        db,
    )
    return json.dumps({"ok": True, "id": str(budget.id), "category": category.name, "limit_amount": budget.limit_amount})


async def update_budget(
    user_id: uuid.UUID,
    db: AsyncSession,
    category_name: str,
    limit_amount: float | None = None,
    period: str | None = None,
    start_date: str | None = None,
) -> str:
    budget = await _resolve_budget(user_id, db, category_name)
    if isinstance(budget, str):
        return budget
    updated = await budget_service.update(
        budget.id,
        BudgetUpdate(limit_amount=limit_amount, period=period, start_date=_parse_date(start_date) if start_date else None),
        user_id,
        db,
    )
    return json.dumps({"ok": True, "category_id": str(updated.category_id), "limit_amount": updated.limit_amount})


TOOL_EXECUTORS = {
    "list_accounts": list_accounts,
    "create_account": create_account,
    "update_account": update_account,
    "list_categories": list_categories,
    "create_category": create_category,
    "create_transaction": create_transaction,
    "update_transaction": update_transaction,
    "query_transactions_summary": query_transactions_summary,
    "create_debt": create_debt,
    "update_debt": update_debt,
    "budget_status": budget_status,
    "create_budget": create_budget,
    "update_budget": update_budget,
}
