import json
import uuid

import pytest

from app.services import agent_tools


@pytest.fixture
async def user_id(auth_client):
    _, _, user = auth_client
    return uuid.UUID(user["id"])


async def test_list_accounts_empty(db_session, user_id):
    result = json.loads(await agent_tools.list_accounts(user_id, db_session))
    assert result == []


async def test_create_account_tool(db_session, user_id):
    result = json.loads(await agent_tools.create_account(user_id, db_session, name="Efectivo", type="cash", balance=500))
    assert result["ok"] is True
    accounts = json.loads(await agent_tools.list_accounts(user_id, db_session))
    assert accounts[0]["name"] == "Efectivo"


async def test_create_transaction_resolves_existing_category(db_session, user_id):
    await agent_tools.create_account(user_id, db_session, name="Efectivo", type="cash", balance=1000)
    result = await agent_tools.create_transaction(
        user_id, db_session, amount=250, type="expense", category_name="alimentación"
    )
    body = json.loads(result)
    assert body["ok"] is True
    assert body["category"] == "Alimentación"


async def test_create_transaction_unknown_category_suggests_otro(db_session, user_id):
    await agent_tools.create_account(user_id, db_session, name="Efectivo", type="cash", balance=1000)
    result = await agent_tools.create_transaction(
        user_id, db_session, amount=250, type="expense", category_name="Categoría Que No Existe"
    )
    assert "Otro" in result
    assert "Categoría Que No Existe" in result


async def test_create_transaction_no_accounts_returns_helpful_message(db_session, user_id):
    result = await agent_tools.create_transaction(user_id, db_session, amount=100, type="expense", category_name="Otro")
    assert "no tiene ninguna cuenta" in result


async def test_create_transaction_multiple_accounts_requires_name(db_session, user_id):
    await agent_tools.create_account(user_id, db_session, name="Efectivo", type="cash")
    await agent_tools.create_account(user_id, db_session, name="Débito", type="debit")
    result = await agent_tools.create_transaction(user_id, db_session, amount=100, type="expense", category_name="Otro")
    assert "varias cuentas" in result


async def test_query_transactions_summary_includes_id_for_later_edit(db_session, user_id):
    await agent_tools.create_account(user_id, db_session, name="Efectivo", type="cash", balance=1000)
    await agent_tools.create_transaction(user_id, db_session, amount=100, type="expense", category_name="Otro", date="2026-08-01")
    summary = json.loads(await agent_tools.query_transactions_summary(user_id, db_session))
    assert summary["count"] == 1
    assert summary["total"] == 100
    tx_id = summary["transactions"][0]["id"]

    updated = json.loads(
        await agent_tools.update_transaction(user_id, db_session, transaction_id=tx_id, amount=200)
    )
    assert updated["amount"] == 200


async def test_update_transaction_invalid_id_format(db_session, user_id):
    result = await agent_tools.update_transaction(user_id, db_session, transaction_id="no-es-un-uuid", amount=1)
    assert "no es válido" in result


async def test_create_debt_defaults_remaining_to_total(db_session, user_id):
    result = json.loads(
        await agent_tools.create_debt(user_id, db_session, creditor="BBVA", total_amount=5000, monthly_payment=500)
    )
    assert result["remaining_amount"] == 5000


async def test_update_debt_payment_amount_subtracts_and_marks_paid(db_session, user_id):
    await agent_tools.create_debt(user_id, db_session, creditor="BBVA", total_amount=1000, monthly_payment=100)
    result = json.loads(
        await agent_tools.update_debt(user_id, db_session, creditor_name="bbva", payment_amount=1000)
    )
    assert result["remaining_amount"] == 0
    assert result["status"] == "paid"


async def test_update_debt_payment_amount_never_goes_negative(db_session, user_id):
    await agent_tools.create_debt(user_id, db_session, creditor="BBVA", total_amount=1000, monthly_payment=100)
    result = json.loads(
        await agent_tools.update_debt(user_id, db_session, creditor_name="BBVA", payment_amount=5000)
    )
    assert result["remaining_amount"] == 0


async def test_update_debt_unknown_creditor(db_session, user_id):
    await agent_tools.create_debt(user_id, db_session, creditor="BBVA", total_amount=100, monthly_payment=10)
    result = await agent_tools.update_debt(user_id, db_session, creditor_name="No existe")
    assert "No encontré una deuda" in result


async def test_update_debt_no_debts_at_all(db_session, user_id):
    result = await agent_tools.update_debt(user_id, db_session, creditor_name="Cualquiera")
    assert "no tiene deudas registradas" in result


async def test_create_budget_duplicate_category_returns_friendly_message(db_session, user_id):
    await agent_tools.create_budget(user_id, db_session, category_name="Alimentación", limit_amount=900)
    result = await agent_tools.create_budget(user_id, db_session, category_name="Alimentación", limit_amount=500)
    assert "Ya existe un presupuesto" in result


async def test_budget_status_tool(db_session, user_id):
    await agent_tools.create_account(user_id, db_session, name="Efectivo", type="cash", balance=1000)
    await agent_tools.create_budget(user_id, db_session, category_name="Alimentación", limit_amount=900)
    await agent_tools.create_transaction(user_id, db_session, amount=850, type="expense", category_name="Alimentación")
    result = json.loads(await agent_tools.budget_status(user_id, db_session))
    assert result[0]["spent"] == 850
