from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class NotifPref(Base):
    __tablename__ = "notif_prefs"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    push01 = Column(Boolean, default=False)  # contenedor lleno
    push02 = Column(Boolean, default=False)  # contenedor overflow
    push03 = Column(Boolean, default=True)   # recordatorio de horario
    push04 = Column(Boolean, default=False)  # reporte propio confirmado
    push05 = Column(Boolean, default=True)   # resumen diario
    push06 = Column(Boolean, default=False)  # alertas admin

    user = relationship("User", back_populates="notif_pref")
