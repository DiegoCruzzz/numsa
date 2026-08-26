async def test_register_creates_user_with_seeded_categories(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "diego@example.com", "password": "testpass123", "name": "Diego"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "diego@example.com"
    assert body["currency"] == "MXN"

    login = await client.post(
        "/api/v1/auth/login", json={"email": "diego@example.com", "password": "testpass123"}
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    categories = await client.get("/api/v1/categories", headers=headers)
    names = {c["name"] for c in categories.json()}
    assert "Otro" in names
    assert any(c["name"] == "Otro" and not c["is_income"] for c in categories.json())


async def test_register_normalizes_email_to_lowercase(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "Diego.Prueba@Example.COM", "password": "testpass123", "name": "Diego"},
    )
    assert resp.status_code == 201
    assert resp.json()["email"] == "diego.prueba@example.com"


async def test_register_rejects_duplicate_email_different_case(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "testpass123", "name": "A"},
    )
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "DUP@EXAMPLE.COM", "password": "otherpass123", "name": "B"},
    )
    assert resp.status_code == 400
    assert "ya está registrado" in resp.json()["detail"]


async def test_register_rejects_invalid_email(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "no-es-email", "password": "testpass123", "name": "X"},
    )
    assert resp.status_code == 422


async def test_login_case_insensitive_email(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "case@example.com", "password": "testpass123", "name": "X"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "CASE@EXAMPLE.COM", "password": "testpass123"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login_wrong_password(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "password": "testpass123", "name": "X"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "wrongpw@example.com", "password": "incorrecta"}
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Email o contraseña incorrectos"


async def test_login_nonexistent_user(client):
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "nadie@example.com", "password": "x"}
    )
    assert resp.status_code == 401


async def test_me_requires_valid_token(client):
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer basura"})
    assert resp.status_code == 401


async def test_me_returns_current_user(auth_client):
    client, headers, user = auth_client
    resp = await client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == user["id"]


async def test_endpoints_require_auth(client):
    for path in ["/api/v1/accounts", "/api/v1/categories", "/api/v1/transactions", "/api/v1/debts", "/api/v1/budgets"]:
        resp = await client.get(path)
        assert resp.status_code == 403, path


async def test_update_preferences_rejects_invalid_hex_color(auth_client):
    client, headers, _ = auth_client
    resp = await client.patch("/api/v1/auth/preferences", json={"accent_color": "not-a-color"}, headers=headers)
    assert resp.status_code == 422


async def test_update_preferences_accepts_any_valid_hex(auth_client):
    client, headers, _ = auth_client
    resp = await client.patch("/api/v1/auth/preferences", json={"accent_color": "#4d1dc9"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["accent_color"] == "#4d1dc9"


async def test_update_preferences_theme(auth_client):
    client, headers, _ = auth_client
    resp = await client.patch("/api/v1/auth/preferences", json={"theme": "dark"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["theme"] == "dark"
