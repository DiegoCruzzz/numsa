from datetime import date


async def _make_account_and_category(client, headers, category_name="Comida"):
    account = await client.post(
        "/api/v1/accounts", json={"name": "Cuenta", "type": "cash", "balance": 10000}, headers=headers
    )
    category = await client.post(
        "/api/v1/categories", json={"name": category_name, "is_income": False}, headers=headers
    )
    return account.json()["id"], category.json()["id"]


async def test_create_budget(auth_client):
    client, headers, _ = auth_client
    _, category_id = await _make_account_and_category(client, headers)
    resp = await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 1000, "period": "monthly", "start_date": "2026-08-01"},
        headers=headers,
    )
    assert resp.status_code == 201


async def test_create_budget_rejects_duplicate_category(auth_client):
    client, headers, _ = auth_client
    _, category_id = await _make_account_and_category(client, headers)
    await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 1000, "start_date": "2026-08-01"},
        headers=headers,
    )
    resp = await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 500, "start_date": "2026-08-01"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "Ya existe un presupuesto" in resp.json()["detail"]


async def test_create_budget_rejects_zero_limit(auth_client):
    client, headers, _ = auth_client
    _, category_id = await _make_account_and_category(client, headers)
    resp = await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 0, "start_date": "2026-08-01"},
        headers=headers,
    )
    assert resp.status_code == 422


async def test_budget_status_computed_from_real_transactions(auth_client):
    """Regresión: spent_amount se quedaba fijo en 0 y nunca reflejaba transacciones reales."""
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 900, "start_date": date.today().isoformat()},
        headers=headers,
    )
    today = date.today().isoformat()
    await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 850, "type": "expense", "date": today},
        headers=headers,
    )

    resp = await client.get("/api/v1/budgets/status", headers=headers)
    status = resp.json()[0]
    assert status["spent_amount"] == 850
    assert status["remaining"] == 50
    assert status["used_pct"] == 94.44


async def test_budget_status_ignores_income_transactions(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers, category_name="Salario")
    budget = await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 1000, "start_date": date.today().isoformat()},
        headers=headers,
    )
    assert budget.status_code == 201
    today = date.today().isoformat()
    await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 500, "type": "income", "date": today},
        headers=headers,
    )
    resp = await client.get("/api/v1/budgets/status", headers=headers)
    assert resp.json()[0]["spent_amount"] == 0


async def test_budget_status_ignores_transactions_outside_current_period(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 1000, "start_date": "2020-01-01"},
        headers=headers,
    )
    await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 500, "type": "expense", "date": "2020-01-15"},
        headers=headers,
    )
    resp = await client.get("/api/v1/budgets/status", headers=headers)
    assert resp.json()[0]["spent_amount"] == 0


async def test_update_budget(auth_client):
    client, headers, _ = auth_client
    _, category_id = await _make_account_and_category(client, headers)
    created = await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 1000, "start_date": "2026-08-01"},
        headers=headers,
    )
    resp = await client.patch(f"/api/v1/budgets/{created.json()['id']}", json={"limit_amount": 1500}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["limit_amount"] == 1500


async def test_delete_budget(auth_client):
    client, headers, _ = auth_client
    _, category_id = await _make_account_and_category(client, headers)
    created = await client.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 1000, "start_date": "2026-08-01"},
        headers=headers,
    )
    resp = await client.delete(f"/api/v1/budgets/{created.json()['id']}", headers=headers)
    assert resp.status_code == 204


async def test_cannot_access_another_users_budget(auth_client, client):
    client1, headers1, _ = auth_client
    _, category_id = await _make_account_and_category(client1, headers1)
    created = await client1.post(
        "/api/v1/budgets",
        json={"category_id": category_id, "limit_amount": 1000, "start_date": "2026-08-01"},
        headers=headers1,
    )
    budget_id = created.json()["id"]

    await client.post(
        "/api/v1/auth/register",
        json={"email": "budget_otro@example.com", "password": "testpass123", "name": "Otro"},
    )
    login2 = await client.post(
        "/api/v1/auth/login", json={"email": "budget_otro@example.com", "password": "testpass123"}
    )
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    resp = await client.get(f"/api/v1/budgets/{budget_id}", headers=headers2)
    assert resp.status_code == 404
