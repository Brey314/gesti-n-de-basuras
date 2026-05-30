#!/bin/bash
# Implementa la cláusula 4.4 del Acta de Consentimiento:
# Eliminación de todos los datos personales en máx. 15 días hábiles.
#
# Uso: bash scripts/shutdown.sh
# Ejecutar desde la raíz del proyecto.

set -euo pipefail

LOG_FILE="shutdown_log.txt"
DB_FILE="${DB_FILE:-backend/db/app.db}"

if [ ! -f "$DB_FILE" ]; then
  echo "ERROR: No se encontró la base de datos en '$DB_FILE'."
  echo "Asegúrese de ejecutar este script desde la raíz del proyecto."
  exit 1
fi

# ── Encabezado ──────────────────────────────────────────────────────────────
{
  echo "=== CIERRE DEL PROYECTO — Gestión de Basuras ==="
  echo "Fecha: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""
} > "$LOG_FILE"

# ── Backup antes de eliminar ────────────────────────────────────────────────
BACKUP="backend/db/backup_final_$(date +%Y%m%d).db"
cp "$DB_FILE" "$BACKUP"
echo "Backup creado: $BACKUP" | tee -a "$LOG_FILE"

# ── Conteo de registros antes de eliminar ───────────────────────────────────
USERS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM users;")
REPORTS=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM reports;")
CODES=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM access_codes;")

{
  echo ""
  echo "Registros a eliminar:"
  echo "  Usuarios:       $USERS"
  echo "  Reportes:       $REPORTS"
  echo "  Códigos acceso: $CODES"
  echo ""
} | tee -a "$LOG_FILE"

# ── Eliminación de todos los datos personales ────────────────────────────────
sqlite3 "$DB_FILE" <<'SQL'
DELETE FROM reports;
DELETE FROM notif_prefs;
DELETE FROM users;
DELETE FROM access_codes;
SQL

{
  echo "Datos eliminados correctamente."
  echo ""
  echo "Verificación post-eliminación:"
  echo "  Usuarios restantes:  $(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM users;")"
  echo "  Reportes restantes:  $(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM reports;")"
  echo ""
  echo "Esta constancia debe ser entregada a Don Hernesto."
  echo ""
  echo "Firma investigador: ___________________________"
  echo "Fecha de entrega:   $(date +%d/%m/%Y)"
} | tee -a "$LOG_FILE"

echo ""
echo "Proceso completado. Entrega '$LOG_FILE' a Don Hernesto."
