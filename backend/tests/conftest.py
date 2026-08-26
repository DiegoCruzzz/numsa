import asyncio
import uuid

import asyncpg
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app

TEST_DB_NAME = "numsa_test"


def _plain_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://")


ADMIN_DSN = _plain_dsn(settings.DATABASE_URL).rsplit("/", 1)[0] + "/postgres"
TEST_DATABASE_URL = settings.DATABASE_URL.rsplit("/", 1)[0] + f"/{TEST_DB_NAME}"


async def _prepare_test_database() -> None:
    conn = await asyncpg.connect(ADMIN_DSN)
    try:
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", TEST_DB_NAME)
        if not exists:
            await conn.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        await conn.close()

    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _database_ready():
    """Crea (si hace falta) la base de datos de test y su esquema, una sola vez por sesión.

    Corre en su propio loop aislado (asyncio.run) a propósito — así ningún engine/conexión
    async queda atado al loop de un test en particular, evitando el clásico error de
    pytest-asyncio "attached to a different loop" cuando se comparte un engine de sesión.
    """
    asyncio.run(_prepare_test_database())


@pytest_asyncio.fixture
async def db_session(_database_ready):
    """Sesión con savepoint: cada test corre dentro de una transacción que se revierte al final."""
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as conn:
            trans = await conn.begin()
            session = AsyncSession(bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint")
            try:
                yield session
            finally:
                await session.close()
                await trans.rollback()
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client):
    """Registra un usuario nuevo y regresa (client, headers, user_json)."""
    email = f"user_{uuid.uuid4().hex[:10]}@example.com"
    password = "testpass123"
    resp = await client.post(
        "/api/v1/auth/register", json={"email": email, "password": password, "name": "Test User"}
    )
    assert resp.status_code == 201, resp.text
    user = resp.json()
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers, user
