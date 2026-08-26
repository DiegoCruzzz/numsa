async def _make_account_and_category(client, headers, category_name="Comida"):
    account = await client.post(
        "/api/v1/accounts", json={"name": "Cuenta", "type": "cash", "balance": 10000}, headers=headers
    )
    category = await client.post(
        "/api/v1/categories", json={"name": category_name, "is_income": False}, headers=headers
    )
    return account.json()["id"], category.json()["id"]


async def test_create_transaction(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    resp = await client.post(
        "/api/v1/transactions",
        json={
            "account_id": account_id,
            "category_id": category_id,
            "amount": 250.5,
            "type": "expense",
            "description": "Super",
            "date": "2026-08-20",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["amount"] == 250.5


async def test_create_transaction_rejects_zero_amount(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    resp = await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 0, "type": "expense", "date": "2026-08-20"},
        headers=headers,
    )
    assert resp.status_code == 422


async def test_create_transaction_rejects_negative_amount(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    resp = await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": -50, "type": "expense", "date": "2026-08-20"},
        headers=headers,
    )
    assert resp.status_code == 422


async def test_create_transaction_rejects_amount_overflow(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    resp = await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 10**14, "type": "expense", "date": "2026-08-20"},
        headers=headers,
    )
    assert resp.status_code == 422


async def test_create_transaction_rejects_nonexistent_account(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/transactions",
        json={
            "account_id": "00000000-0000-0000-0000-000000000000",
            "amount": 100,
            "type": "expense",
            "date": "2026-08-20",
        },
        headers=headers,
    )
    assert resp.status_code == 404


async def test_filter_by_date_range(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    for d in ["2026-01-15", "2026-06-15", "2026-12-15"]:
        await client.post(
            "/api/v1/transactions",
            json={"account_id": account_id, "category_id": category_id, "amount": 10, "type": "expense", "date": d},
            headers=headers,
        )
    resp = await client.get(
        "/api/v1/transactions", params={"date_from": "2026-05-01", "date_to": "2026-07-01"}, headers=headers
    )
    assert len(resp.json()) == 1
    assert resp.json()[0]["date"] == "2026-06-15"


async def test_filter_by_account(auth_client):
    client, headers, _ = auth_client
    acc1, cat_id = await _make_account_and_category(client, headers)
    acc2 = (await client.post("/api/v1/accounts", json={"name": "Otra", "type": "debit"}, headers=headers)).json()["id"]
    await client.post(
        "/api/v1/transactions",
        json={"account_id": acc1, "category_id": cat_id, "amount": 10, "type": "expense", "date": "2026-08-01"},
        headers=headers,
    )
    await client.post(
        "/api/v1/transactions",
        json={"account_id": acc2, "category_id": cat_id, "amount": 20, "type": "expense", "date": "2026-08-01"},
        headers=headers,
    )
    resp = await client.get("/api/v1/transactions", params={"account_id": acc1}, headers=headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["amount"] == 10


async def test_search_by_description(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    await client.post(
        "/api/v1/transactions",
        json={
            "account_id": account_id, "category_id": category_id, "amount": 10,
            "type": "expense", "date": "2026-08-01", "description": "Uber al aeropuerto",
        },
        headers=headers,
    )
    await client.post(
        "/api/v1/transactions",
        json={
            "account_id": account_id, "category_id": category_id, "amount": 20,
            "type": "expense", "date": "2026-08-01", "description": "Super de la semana",
        },
        headers=headers,
    )
    resp = await client.get("/api/v1/transactions", params={"search": "uber"}, headers=headers)
    assert len(resp.json()) == 1
    assert "Uber" in resp.json()[0]["description"]


async def test_pagination_limit_offset(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    for i in range(5):
        await client.post(
            "/api/v1/transactions",
            json={
                "account_id": account_id, "category_id": category_id, "amount": 10 + i,
                "type": "expense", "date": f"2026-08-{i + 1:02d}",
            },
            headers=headers,
        )
    resp = await client.get("/api/v1/transactions", params={"limit": 2, "offset": 0}, headers=headers)
    assert len(resp.json()) == 2
    resp_all = await client.get("/api/v1/transactions", headers=headers)
    assert len(resp_all.json()) == 5


async def test_update_transaction(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    created = await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 10, "type": "expense", "date": "2026-08-01"},
        headers=headers,
    )
    tx_id = created.json()["id"]
    resp = await client.patch(f"/api/v1/transactions/{tx_id}", json={"amount": 999}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["amount"] == 999


async def test_delete_transaction(auth_client):
    client, headers, _ = auth_client
    account_id, category_id = await _make_account_and_category(client, headers)
    created = await client.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 10, "type": "expense", "date": "2026-08-01"},
        headers=headers,
    )
    tx_id = created.json()["id"]
    resp = await client.delete(f"/api/v1/transactions/{tx_id}", headers=headers)
    assert resp.status_code == 204


async def test_cannot_access_another_users_transaction(auth_client, client):
    client1, headers1, _ = auth_client
    account_id, category_id = await _make_account_and_category(client1, headers1)
    created = await client1.post(
        "/api/v1/transactions",
        json={"account_id": account_id, "category_id": category_id, "amount": 10, "type": "expense", "date": "2026-08-01"},
        headers=headers1,
    )
    tx_id = created.json()["id"]

    await client.post(
        "/api/v1/auth/register",
        json={"email": "tx_otro@example.com", "password": "testpass123", "name": "Otro"},
    )
    login2 = await client.post(
        "/api/v1/auth/login", json={"email": "tx_otro@example.com", "password": "testpass123"}
    )
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    resp = await client.get(f"/api/v1/transactions/{tx_id}", headers=headers2)
    assert resp.status_code == 404
