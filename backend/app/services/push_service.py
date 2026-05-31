import logging
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.notif_pref import NotifPref

logger = logging.getLogger(__name__)

PUSH_MESSAGES = {
    "PUSH01": "Recordatorio: el camión pasa hoy a las {time}. ¿Ya bajaste la basura?",
    "PUSH02": "Atención: el contenedor está lleno. Espera a la recolección antes de bajar más residuos.",
    "PUSH03": "Aviso urgente: contenedor desbordado. La administración ha sido notificada.",
    "PUSH04": "Camión recolector pasó hace 10 min. Contenedor disponible nuevamente.",
    "PUSH05": "Importante: el horario de recolección de {day} cambia a las {time} desde la próxima semana.",
    "PUSH06": "Tip: las bolsas bien cerradas evitan que los perros las rompan. ¡Cuidemos entre todos!",
    "PUSH07": "Tus reportes de hace 30 días fueron eliminados automáticamente, como prometimos.",
}

_TIP_FILE = Path("logs/last_tip.txt")


def _within_hours() -> bool:
    now = datetime.now()
    minutes = now.hour * 60 + now.minute
    return 6 * 60 <= minutes <= 21 * 60 + 30


def _send_in_batches(tokens: list[str], title: str, body: str) -> int:
    if not tokens:
        return 0
    try:
        from exponent_server_sdk import PushClient, PushMessage
    except ImportError:
        logger.warning("exponent_server_sdk no instalado; push omitido")
        return 0

    client = PushClient()
    sent = 0
    for i in range(0, len(tokens), 100):
        batch = [PushMessage(to=t, title=title, body=body) for t in tokens[i:i + 100]]
        try:
            client.publish_multiple(batch)
            sent += len(batch)
        except Exception as exc:
            logger.error("Error en lote push %d: %s", i // 100, exc)
    return sent


def get_tokens_for_pref(pref_field: str, db: Session, respect_inactivity: bool = True) -> list[str]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    query = (
        db.query(User.push_token)
        .join(NotifPref, NotifPref.user_id == User.id)
        .filter(
            getattr(NotifPref, pref_field) == True,  # noqa: E712
            User.push_token.isnot(None),
        )
    )
    if respect_inactivity:
        query = query.filter(User.last_seen >= cutoff)
    return [row[0] for row in query.all()]


def send_truck_reminder(schedule_time: str, db: Session) -> int:
    if not _within_hours():
        return 0
    tokens = get_tokens_for_pref("push01", db)
    body = PUSH_MESSAGES["PUSH01"].format(time=schedule_time)
    return _send_in_batches(tokens, "Recordatorio de recolección", body)


def send_bin_alert(status: str, db: Session) -> int:
    if status == "OVERFLOW":
        tokens = get_tokens_for_pref("push03", db, respect_inactivity=False)
        body = PUSH_MESSAGES["PUSH03"]
        return _send_in_batches(tokens, "Contenedor desbordado", body)
    if status == "FULL":
        if not _within_hours():
            return 0
        tokens = get_tokens_for_pref("push02", db)
        body = PUSH_MESSAGES["PUSH02"]
        return _send_in_batches(tokens, "Contenedor lleno", body)
    return 0


def send_collection_confirmed(db: Session) -> int:
    if not _within_hours():
        return 0
    tokens = get_tokens_for_pref("push04", db)
    return _send_in_batches(tokens, "Recolección completada", PUSH_MESSAGES["PUSH04"])


def send_schedule_change(new_time: str, day_name: str, db: Session) -> int:
    tokens = get_tokens_for_pref("push05", db, respect_inactivity=False)
    body = PUSH_MESSAGES["PUSH05"].format(day=day_name, time=new_time)
    return _send_in_batches(tokens, "Cambio de horario", body)


def send_citizenship_tip(db: Session) -> int:
    if not _within_hours():
        return 0

    os.makedirs("logs", exist_ok=True)
    if _TIP_FILE.exists():
        try:
            last_str = _TIP_FILE.read_text().strip()
            last_dt = datetime.fromisoformat(last_str)
            if last_dt.tzinfo is None:
                last_dt = last_dt.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) - last_dt < timedelta(days=7):
                return 0
        except Exception:
            pass

    # Inactivos >14 días siguen recibiendo el tip semanal (es su única notificación permitida)
    tokens = get_tokens_for_pref("push06", db, respect_inactivity=False)
    sent = _send_in_batches(tokens, "Tip ciudadano", PUSH_MESSAGES["PUSH06"])

    if sent > 0:
        _TIP_FILE.write_text(datetime.now(timezone.utc).isoformat())

    return sent


def send_auto_delete_notice(affected_user_ids: list[str], db: Session) -> int:
    """Notifica a usuarios cuyos reportes expirados fueron eliminados (PUSH07)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    rows = (
        db.query(User.push_token)
        .join(NotifPref, NotifPref.user_id == User.id)
        .filter(
            User.id.in_(affected_user_ids),
            NotifPref.push07 == True,  # noqa: E712
            User.push_token.isnot(None),
            User.last_seen >= cutoff,
        )
        .all()
    )
    tokens = [r[0] for r in rows]
    return _send_in_batches(tokens, "Reportes eliminados", PUSH_MESSAGES["PUSH07"])


def send_admin_failure_alert(msg: str, db: Session) -> int:
    """Avisa a todos los administradores cuando falla el job de limpieza."""
    rows = (
        db.query(User.push_token)
        .filter(User.role == "ADMIN", User.push_token.isnot(None))
        .all()
    )
    tokens = [r[0] for r in rows]
    body = msg[:200] if msg else "Error desconocido"
    return _send_in_batches(tokens, "Error en limpieza automática", body)
