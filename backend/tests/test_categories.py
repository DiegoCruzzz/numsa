async def test_register_seeds_default_categories(auth_client):
    client, headers, _ = auth_client
    resp = await client.get("/api/v1/categories", headers=headers)
    categories = resp.json()
    expense = [c for c in categories if not c["is_income"]]
    income = [c for c in categories if c["is_income"]]
    assert len(expense) == 9  # 8 originales + Otro
    assert len(income) == 5
    assert all(c["is_default"] for c in categories)


async def test_create_custom_category(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/categories",
        json={"name": "Mascotas", "is_income": False, "icon": "🐾", "color": "#123456"},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Mascotas"
    assert body["is_default"] is False


async def test_create_category_defaults_to_expense(auth_client):
    client, headers, _ = auth_client
    resp = await client.post("/api/v1/categories", json={"name": "Sin tipo"}, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["is_income"] is False


async def test_update_category(auth_client):
    client, headers, _ = auth_client
    created = await client.post("/api/v1/categories", json={"name": "Vieja"}, headers=headers)
    cat_id = created.json()["id"]
    resp = await client.patch(f"/api/v1/categories/{cat_id}", json={"name": "Nueva"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Nueva"


async def test_delete_category_nulls_out_transaction_reference(auth_client):
    client, headers, _ = auth_client
    account = await client.post("/api/v1/accounts", json={"name": "A", "type": "cash", "balance": 1000}, headers=headers)
    category = await client.post("/api/v1/categories", json={"name": "Temp"}, headers=headers)
    tx = await client.post(
        "/api/v1/transactions",
        json={
            "account_id": account.json()["id"],
            "category_id": category.json()["id"],
            "amount": 100,
            "type": "expense",
            "date": "2026-08-01",
        },
        headers=headers,
    )
    assert tx.status_code == 201

    del_resp = await client.delete(f"/api/v1/categories/{category.json()['id']}", headers=headers)
    assert del_resp.status_code == 204

    tx_after = await client.get(f"/api/v1/transactions/{tx.json()['id']}", headers=headers)
    assert tx_after.json()["category_id"] is None


async def test_category_not_found(auth_client):
    client, headers, _ = auth_client
    resp = await client.get("/api/v1/categories/00000000-0000-0000-0000-000000000000", headers=headers)
    assert resp.status_code == 404


async def test_categories_are_isolated_per_user(auth_client, client):
    client1, headers1, _ = auth_client
    await client1.post("/api/v1/categories", json={"name": "SoloDeUsuario1"}, headers=headers1)

    reg2 = await client.post(
        "/api/v1/auth/register",
        json={"email": "cat_otro@example.com", "password": "testpass123", "name": "Otro"},
    )
    login2 = await client.post(
        "/api/v1/auth/login", json={"email": "cat_otro@example.com", "password": "testpass123"}
    )
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    categories2 = await client.get("/api/v1/categories", headers=headers2)
    names2 = {c["name"] for c in categories2.json()}
    assert "SoloDeUsuario1" not in names2
