async def test_create_account(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/accounts", json={"name": "Efectivo", "type": "cash", "balance": 500}, headers=headers
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Efectivo"
    assert body["balance"] == 500
    assert body["is_active"] is True


async def test_create_account_defaults_balance_zero(auth_client):
    client, headers, _ = auth_client
    resp = await client.post("/api/v1/accounts", json={"name": "Ahorros", "type": "savings"}, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["balance"] == 0


async def test_create_account_rejects_negative_balance(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/accounts", json={"name": "X", "type": "cash", "balance": -100}, headers=headers
    )
    assert resp.status_code == 422


async def test_create_account_rejects_balance_overflow(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/accounts", json={"name": "X", "type": "cash", "balance": 10**14}, headers=headers
    )
    assert resp.status_code == 422


async def test_create_account_rejects_invalid_type(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/accounts", json={"name": "X", "type": "bitcoin", "balance": 0}, headers=headers
    )
    assert resp.status_code == 422


async def test_list_accounts(auth_client):
    client, headers, _ = auth_client
    await client.post("/api/v1/accounts", json={"name": "A", "type": "cash"}, headers=headers)
    await client.post("/api/v1/accounts", json={"name": "B", "type": "debit"}, headers=headers)
    resp = await client.get("/api/v1/accounts", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_update_account_archive(auth_client):
    client, headers, _ = auth_client
    created = await client.post("/api/v1/accounts", json={"name": "A", "type": "cash"}, headers=headers)
    acc_id = created.json()["id"]
    resp = await client.patch(f"/api/v1/accounts/{acc_id}", json={"is_active": False}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


async def test_delete_account(auth_client):
    client, headers, _ = auth_client
    created = await client.post("/api/v1/accounts", json={"name": "A", "type": "cash"}, headers=headers)
    acc_id = created.json()["id"]
    resp = await client.delete(f"/api/v1/accounts/{acc_id}", headers=headers)
    assert resp.status_code == 204
    resp = await client.get(f"/api/v1/accounts/{acc_id}", headers=headers)
    assert resp.status_code == 404


async def test_account_not_found(auth_client):
    client, headers, _ = auth_client
    resp = await client.get("/api/v1/accounts/00000000-0000-0000-0000-000000000000", headers=headers)
    assert resp.status_code == 404


async def test_create_savings_account_with_interest_rate(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/accounts",
        json={"name": "Ahorros", "type": "savings", "balance": 10000, "interest_rate": 12},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["interest_rate"] == 12


async def test_apply_interest_increments_balance_and_creates_transaction(auth_client):
    client, headers, _ = auth_client
    created = await client.post(
        "/api/v1/accounts",
        json={"name": "Ahorros", "type": "savings", "balance": 12000, "interest_rate": 12},
        headers=headers,
    )
    acc_id = created.json()["id"]

    resp = await client.post(f"/api/v1/accounts/{acc_id}/apply-interest", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["interest_amount"] == 120.0
    assert body["account"]["balance"] == 12120.0
    assert body["transaction"]["type"] == "income"
    assert body["transaction"]["account_id"] == acc_id

    tx_list = await client.get("/api/v1/transactions", headers=headers)
    assert any(t["id"] == body["transaction"]["id"] for t in tx_list.json())


async def test_apply_interest_rejects_non_savings_account(auth_client):
    client, headers, _ = auth_client
    created = await client.post(
        "/api/v1/accounts", json={"name": "Efectivo", "type": "cash", "balance": 1000}, headers=headers
    )
    acc_id = created.json()["id"]
    resp = await client.post(f"/api/v1/accounts/{acc_id}/apply-interest", headers=headers)
    assert resp.status_code == 400


async def test_apply_interest_rejects_missing_rate(auth_client):
    client, headers, _ = auth_client
    created = await client.post(
        "/api/v1/accounts", json={"name": "Ahorros", "type": "savings", "balance": 1000}, headers=headers
    )
    acc_id = created.json()["id"]
    resp = await client.post(f"/api/v1/accounts/{acc_id}/apply-interest", headers=headers)
    assert resp.status_code == 400


async def test_cannot_access_another_users_account(auth_client, client):
    client1, headers1, _ = auth_client
    created = await client1.post("/api/v1/accounts", json={"name": "Privada", "type": "cash"}, headers=headers1)
    acc_id = created.json()["id"]

    reg2 = await client.post(
        "/api/v1/auth/register",
        json={"email": "otro_usuario@example.com", "password": "testpass123", "name": "Otro"},
    )
    login2 = await client.post(
        "/api/v1/auth/login", json={"email": "otro_usuario@example.com", "password": "testpass123"}
    )
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    resp = await client.get(f"/api/v1/accounts/{acc_id}", headers=headers2)
    assert resp.status_code == 404

    resp = await client.delete(f"/api/v1/accounts/{acc_id}", headers=headers2)
    assert resp.status_code == 404

    accounts2 = await client.get("/api/v1/accounts", headers=headers2)
    assert accounts2.json() == []
