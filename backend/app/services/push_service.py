from typing import Optional


async def send_push(token: str, title: str, body: str, data: Optional[dict] = None) -> bool:
    """Placeholder — integrar con Expo Push o FCM en fases posteriores."""
    return True


async def notify_overflow(push_tokens: list[str], message: str) -> None:
    """Envía notificación de overflow a una lista de tokens."""
    for token in push_tokens:
        await send_push(token, "Contenedor lleno", message)
