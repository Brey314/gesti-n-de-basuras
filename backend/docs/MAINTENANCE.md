# Guía de Mantenimiento — Gestión de Basuras

Este documento está dirigido al administrador del conjunto residencial.
Todos los comandos se ejecutan desde la carpeta `backend/` salvo que se indique otra ruta.

---

## 1. Actualizar horarios del camión de basura

### Desde el dashboard web (recomendado)

1. Abrir el navegador en `http://localhost:5174` (o la URL del servidor).
2. Iniciar sesión con el alias y código de administrador.
3. Ir a **Panel Admin → 🗓 Horarios**.
4. Editar el día, la hora y la etiqueta del horario deseado y pulsar **Guardar**.
5. Opcional: pulsar **📢 Notificar cambio** para enviar una notificación push a todos los residentes.

### Desde la línea de comandos (sqlite3)

```bash
# Listar horarios actuales
sqlite3 db/app.db "SELECT id, day_of_week, time, label FROM schedules;"

# Cambiar hora del viernes (day_of_week=5) a 07:00
sqlite3 db/app.db "UPDATE schedules SET time='07:00' WHERE day_of_week=5;"

# Verificar cambio
sqlite3 db/app.db "SELECT * FROM schedules;"
```

> **Nota:** tras editar la BD directamente, reiniciar uvicorn para que el scheduler recargue los recordatorios.

---

## 2. Generar códigos de acceso para nuevos residentes

### Desde el dashboard

1. Ir a **Panel Admin → 🔑 Códigos**.
2. Pulsar **＋ Generar código**.
3. Copiar el código de 8 caracteres mostrado en pantalla.
4. Enviarlo al nuevo residente por WhatsApp o correo.

Cada código es de un solo uso: se desactiva automáticamente al registrarse.

### Desde la línea de comandos

```bash
# Ver cuántos códigos activos quedan
sqlite3 db/app.db "SELECT COUNT(*) FROM access_codes WHERE status='ACTIVE';"
```

Para generar códigos de forma masiva, usar el endpoint de la API:

```bash
curl -X POST http://localhost:8000/api/v1/codes/ \
  -H "Authorization: Bearer <admin_token>"
```

---

## 3. Verificar el job de borrado automático

El sistema borra automáticamente los reportes mayores de 30 días cada día a las 2:00 AM UTC.

### Ver el log de limpieza

```bash
tail -20 logs/cleanup.log
```

Formato esperado de cada línea:

```
2025-06-01T02:00:03Z | DELETED: 12 | STATUS: SUCCESS
```

Si aparece `STATUS: ERROR`, revisar la línea completa para el mensaje de error y verificar que la base de datos no esté bloqueada.

### Borrado manual (emergencia)

```bash
# Contar reportes expirados
sqlite3 db/app.db \
  "SELECT COUNT(*) FROM reports WHERE expires_at <= datetime('now');"

# Eliminarlos manualmente
sqlite3 db/app.db \
  "DELETE FROM reports WHERE expires_at <= datetime('now');"
```

---

## 4. Backup de la base de datos

Hacer backup antes de cualquier actualización o cambio importante:

```bash
# Backup con fecha del día
cp db/app.db db/backup_$(date +%Y%m%d).db

# Verificar que el backup se creó
ls -lh db/backup_*.db
```

Guardar una copia del archivo `.db` fuera del directorio del proyecto (USB, Google Drive, etc.) al menos una vez por semana.

Para restaurar un backup:

```bash
# Detener el servidor primero
cp db/backup_20250601.db db/app.db
# Reiniciar el servidor
```

---

## 5. Cierre del proyecto

Cuando finalice el estudio, se deben eliminar todos los datos personales según la cláusula 4.4 del Acta de Consentimiento (plazo máximo: 15 días hábiles desde la fecha de cierre).

### Pasos

1. **Detener el servidor:**

   ```bash
   # Si uvicorn está en primer plano: Ctrl+C
   # Si está en segundo plano:
   kill $(lsof -ti:8000)
   ```

2. **Ejecutar el script de cierre** (desde la raíz del proyecto):

   ```bash
   bash scripts/shutdown.sh
   ```

3. **Entregar `shutdown_log.txt`** a Don Hernesto como constancia de la eliminación.

El script crea un backup final, elimina todos los datos de usuarios, reportes, preferencias y códigos de acceso, y genera el archivo `shutdown_log.txt` con la fecha, conteos y espacio para firma del investigador.
