import json
import logging
import uuid
from datetime import date

import litellm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.services.agent_tools import TOOL_EXECUTORS, TOOL_SCHEMAS

logger = logging.getLogger(__name__)

HISTORY_LIMIT = 20
MAX_TOOL_ROUNDS = 5


def _system_prompt(currency: str) -> str:
    return (
        "Eres el asistente financiero de Numsa, una app de finanzas personales. "
        f"La moneda del usuario es {currency}. Hoy es {date.today().isoformat()}. "
        "Puedes crear y editar cuentas, categorías, transacciones, deudas y presupuestos usando las tools "
        "disponibles, y responder preguntas sobre las finanzas del usuario. Nunca inventes montos, categorías, "
        "cuentas o cifras — usa list_categories/list_accounts/query_transactions_summary cuando no estés seguro. "
        "No puedes eliminar nada (ni transacciones, ni cuentas, ni deudas, ni presupuestos) — si el usuario pide "
        "borrar algo, dile que lo haga desde la app web. "
        "Si el usuario describe un gasto, ingreso, deuda o pago con datos suficientes, regístralo directamente sin "
        "pedir confirmación extra. Si falta información esencial, pregunta antes de adivinar. "
        "Para editar una transacción existente, primero usa query_transactions_summary para obtener su id. "
        "Para registrar un abono a una deuda, usa update_debt con payment_amount en vez de calcular tú el nuevo saldo. "
        "Cuando registres un gasto, si es relevante revisa budget_status y avisa si deja al usuario cerca o por "
        "encima de algún presupuesto. "
        "Si el usuario manda una imagen (captura de una app de banco, recibo, etc.), léela y extrae los datos "
        "relevantes para registrar la transacción o deuda correspondiente. "
        "Responde siempre en español, breve y directo, como un mensaje de chat."
    )


async def _load_history(user_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(HISTORY_LIMIT)
    )
    rows = list(reversed(result.scalars().all()))
    return [{"role": m.role, "content": m.content} for m in rows]


def _build_user_content(user_message: str, image: str | None) -> str | list:
    if not image:
        return user_message
    return [
        {"type": "text", "text": user_message},
        {"type": "image_url", "image_url": {"url": image}},
    ]


async def run_agent(current_user: User, user_message: str, db: AsyncSession, image: str | None = None) -> str:
    history = await _load_history(current_user.id, db)
    messages: list = (
        [{"role": "system", "content": _system_prompt(current_user.currency)}]
        + history
        + [{"role": "user", "content": _build_user_content(user_message, image)}]
    )

    reply = "No pude completar la solicitud, intenta reformularla."
    for _ in range(MAX_TOOL_ROUNDS):
        try:
            response = await litellm.acompletion(
                model=settings.CHAT_MODEL,
                messages=messages,
                tools=TOOL_SCHEMAS,
                tool_choice="auto",
                api_key=settings.GEMINI_API_KEY,
            )
        except Exception:
            logger.exception("Error llamando al modelo de chat")
            reply = "No pude conectar con el asistente en este momento, intenta de nuevo en un rato."
            break
        message = response.choices[0].message
        tool_calls = message.tool_calls

        if not tool_calls:
            reply = message.content or ""
            break

        messages.append(message)
        for tool_call in tool_calls:
            fn_name = tool_call.function.name
            try:
                fn_args = json.loads(tool_call.function.arguments or "{}")
            except json.JSONDecodeError:
                fn_args = {}
            executor = TOOL_EXECUTORS.get(fn_name)
            if not executor:
                result = f"Tool desconocida: {fn_name}"
            else:
                try:
                    result = await executor(current_user.id, db, **fn_args)
                except Exception:
                    logger.exception("Error ejecutando la tool %s", fn_name)
                    result = "Ocurrió un error ejecutando esa acción, intenta reformular la solicitud."
            messages.append(
                {
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": fn_name,
                    "content": result,
                }
            )

    persisted_user_content = f"{user_message} [imagen adjunta]" if image else user_message
    db.add(ChatMessage(user_id=current_user.id, role="user", content=persisted_user_content))
    db.add(ChatMessage(user_id=current_user.id, role="assistant", content=reply))
    await db.commit()

    return reply
