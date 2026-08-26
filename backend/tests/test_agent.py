import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select

from app.models.chat_message import ChatMessage
from app.models.user import User
from app.services.agent import run_agent


class FakeFunction:
    def __init__(self, name, arguments):
        self.name = name
        self.arguments = arguments


class FakeToolCall:
    def __init__(self, call_id, name, arguments):
        self.id = call_id
        self.function = FakeFunction(name, arguments)


class FakeMessage:
    def __init__(self, content=None, tool_calls=None):
        self.content = content
        self.tool_calls = tool_calls


class FakeResponse:
    def __init__(self, message):
        self.choices = [type("Choice", (), {"message": message})()]


@pytest.fixture
async def current_user(auth_client, db_session):
    _, _, user_json = auth_client
    return await db_session.get(User, uuid.UUID(user_json["id"]))


async def test_run_agent_plain_text_reply(current_user, db_session):
    fake_response = FakeResponse(FakeMessage(content="Hola, ¿en qué te ayudo?"))
    with patch("app.services.agent.litellm.acompletion", new=AsyncMock(return_value=fake_response)):
        reply = await run_agent(current_user, "hola", db_session)
    assert reply == "Hola, ¿en qué te ayudo?"


async def test_run_agent_persists_history(current_user, db_session):
    fake_response = FakeResponse(FakeMessage(content="Listo"))
    with patch("app.services.agent.litellm.acompletion", new=AsyncMock(return_value=fake_response)):
        await run_agent(current_user, "gasté 100 en comida", db_session)

    result = await db_session.execute(select(ChatMessage).where(ChatMessage.user_id == current_user.id))
    messages = result.scalars().all()
    assert len(messages) == 2
    assert messages[0].role == "user"
    assert messages[0].content == "gasté 100 en comida"
    assert messages[1].role == "assistant"
    assert messages[1].content == "Listo"


async def test_run_agent_persists_image_placeholder_not_raw_data(current_user, db_session):
    fake_response = FakeResponse(FakeMessage(content="Vi la imagen"))
    with patch("app.services.agent.litellm.acompletion", new=AsyncMock(return_value=fake_response)):
        await run_agent(current_user, "mira esto", db_session, image="data:image/png;base64,AAAA")

    result = await db_session.execute(select(ChatMessage).where(ChatMessage.user_id == current_user.id))
    messages = result.scalars().all()
    assert "AAAA" not in messages[0].content
    assert "[imagen adjunta]" in messages[0].content


async def test_run_agent_executes_tool_call_then_replies(current_user, db_session):
    tool_call = FakeToolCall("call_1", "list_accounts", "{}")
    first_response = FakeResponse(FakeMessage(content=None, tool_calls=[tool_call]))
    second_response = FakeResponse(FakeMessage(content="No tienes cuentas todavía."))

    with patch(
        "app.services.agent.litellm.acompletion",
        new=AsyncMock(side_effect=[first_response, second_response]),
    ):
        reply = await run_agent(current_user, "¿qué cuentas tengo?", db_session)

    assert reply == "No tienes cuentas todavía."


async def test_run_agent_handles_llm_connection_error(current_user, db_session):
    with patch(
        "app.services.agent.litellm.acompletion", new=AsyncMock(side_effect=RuntimeError("boom"))
    ):
        reply = await run_agent(current_user, "hola", db_session)
    assert "No pude conectar" in reply


async def test_run_agent_handles_unknown_tool_gracefully(current_user, db_session):
    tool_call = FakeToolCall("call_1", "tool_que_no_existe", "{}")
    first_response = FakeResponse(FakeMessage(content=None, tool_calls=[tool_call]))
    second_response = FakeResponse(FakeMessage(content="No pude hacer eso."))

    with patch(
        "app.services.agent.litellm.acompletion",
        new=AsyncMock(side_effect=[first_response, second_response]),
    ):
        reply = await run_agent(current_user, "haz algo raro", db_session)

    assert reply == "No pude hacer eso."


async def test_run_agent_handles_malformed_tool_arguments(current_user, db_session):
    tool_call = FakeToolCall("call_1", "list_accounts", "no es json valido")
    first_response = FakeResponse(FakeMessage(content=None, tool_calls=[tool_call]))
    second_response = FakeResponse(FakeMessage(content="ok"))

    with patch(
        "app.services.agent.litellm.acompletion",
        new=AsyncMock(side_effect=[first_response, second_response]),
    ):
        reply = await run_agent(current_user, "algo", db_session)

    assert reply == "ok"
