async def test_create_debt(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/debts",
        json={
            "creditor": "Banco BBVA",
            "total_amount": 37000,
            "remaining_amount": 8000,
            "monthly_payment": 300,
            "interest_rate": 2.5,
            "due_date": "2026-12-31",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "active"


async def test_create_debt_rejects_interest_rate_overflow(auth_client):
    """Regresión: interest_rate=2300 causaba un 500 crudo de Postgres (NUMERIC(5,2) overflow)."""
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/debts",
        json={
            "creditor": "ESTUDIOS",
            "total_amount": 37000,
            "remaining_amount": 8000,
            "monthly_payment": 300,
            "interest_rate": 2300,
            "due_date": "2026-02-28",
        },
        headers=headers,
    )
    assert resp.status_code == 422
    assert "999.99" in str(resp.json())


async def test_create_debt_rejects_interest_rate_exactly_at_boundary(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/debts",
        json={"creditor": "X", "total_amount": 100, "remaining_amount": 100, "monthly_payment": 10, "interest_rate": 999.99},
        headers=headers,
    )
    assert resp.status_code == 201

    resp2 = await client.post(
        "/api/v1/debts",
        json={"creditor": "Y", "total_amount": 100, "remaining_amount": 100, "monthly_payment": 10, "interest_rate": 1000},
        headers=headers,
    )
    assert resp2.status_code == 422


async def test_create_debt_rejects_negative_amounts(auth_client):
    client, headers, _ = auth_client
    resp = await client.post(
        "/api/v1/debts",
        json={"creditor": "X", "total_amount": -100, "remaining_amount": 0, "monthly_payment": 0},
        headers=headers,
    )
    assert resp.status_code == 422


async def test_update_debt_register_payment(auth_client):
    client, headers, _ = auth_client
    created = await client.post(
        "/api/v1/debts",
        json={"creditor": "X", "total_amount": 1000, "remaining_amount": 1000, "monthly_payment": 100},
        headers=headers,
    )
    debt_id = created.json()["id"]
    resp = await client.patch(f"/api/v1/debts/{debt_id}", json={"remaining_amount": 700}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["remaining_amount"] == 700


async def test_update_debt_rejects_interest_rate_overflow(auth_client):
    client, headers, _ = auth_client
    created = await client.post(
        "/api/v1/debts",
        json={"creditor": "X", "total_amount": 1000, "remaining_amount": 1000, "monthly_payment": 100},
        headers=headers,
    )
    debt_id = created.json()["id"]
    resp = await client.patch(f"/api/v1/debts/{debt_id}", json={"interest_rate": 5000}, headers=headers)
    assert resp.status_code == 422


async def test_debt_summary_calculates_progress(auth_client):
    client, headers, _ = auth_client
    await client.post(
        "/api/v1/debts",
        json={"creditor": "A", "total_amount": 1000, "remaining_amount": 400, "monthly_payment": 100},
        headers=headers,
    )
    resp = await client.get("/api/v1/debts/summary", headers=headers)
    body = resp.json()
    assert body["total_debt"] == 400
    assert body["total_paid"] == 600
    assert body["global_progress_pct"] == 60.0
    assert body["active_debts"] == 1


async def test_debt_summary_excludes_paid_from_active_count(auth_client):
    client, headers, _ = auth_client
    await client.post(
        "/api/v1/debts",
        json={
            "creditor": "Pagada", "total_amount": 1000, "remaining_amount": 0,
            "monthly_payment": 0, "status": "paid",
        },
        headers=headers,
    )
    resp = await client.get("/api/v1/debts/summary", headers=headers)
    assert resp.json()["active_debts"] == 0


async def test_delete_debt(auth_client):
    client, headers, _ = auth_client
    created = await client.post(
        "/api/v1/debts",
        json={"creditor": "X", "total_amount": 100, "remaining_amount": 100, "monthly_payment": 10},
        headers=headers,
    )
    debt_id = created.json()["id"]
    resp = await client.delete(f"/api/v1/debts/{debt_id}", headers=headers)
    assert resp.status_code == 204


async def test_cannot_access_another_users_debt(auth_client, client):
    client1, headers1, _ = auth_client
    created = await client1.post(
        "/api/v1/debts",
        json={"creditor": "Privada", "total_amount": 100, "remaining_amount": 100, "monthly_payment": 10},
        headers=headers1,
    )
    debt_id = created.json()["id"]

    await client.post(
        "/api/v1/auth/register",
        json={"email": "debt_otro@example.com", "password": "testpass123", "name": "Otro"},
    )
    login2 = await client.post(
        "/api/v1/auth/login", json={"email": "debt_otro@example.com", "password": "testpass123"}
    )
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    resp = await client.get(f"/api/v1/debts/{debt_id}", headers=headers2)
    assert resp.status_code == 404
