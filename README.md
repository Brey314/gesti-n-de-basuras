# Gestión de Basuras — Conjunto Residencial

Sistema digital de monitoreo participativo del estado del contenedor de basuras. Los residentes reportan el nivel de llenado desde su celular; el administrador visualiza estadísticas y gestiona horarios desde un dashboard web. El proyecto cumple con la Ley 1581 de 2012 (habeas data) y los principios de **Privacy by Design**.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.11 · FastAPI · SQLite · SQLAlchemy · APScheduler |
| Dashboard | React 19 · TypeScript · Vite · Tailwind CSS v4 |
| App residente | React 19 · TypeScript · Vite · Tailwind CSS v4 (PWA) |
| PDF / Export | jsPDF |
| Notificaciones push | Expo Server SDK |

---

## Estructura del repositorio

```
gestion-de-basuras/
├── backend/          # API REST (FastAPI)
│   ├── app/
│   ├── tests/
│   ├── docs/MAINTENANCE.md
│   └── requirements.txt
├── dashboard/        # Panel administrativo (React + Vite, puerto 5173)
├── mobile/           # App del residente (React + Vite, puerto 5174)
└── scripts/
    └── shutdown.sh   # Cierre del proyecto (cláusula 4.4)
```

---

## Instalación y arranque

Se requieren tres terminales. Ejecutar en orden.

### Terminal 1 — Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # editar JWT_SECRET
alembic upgrade head          # crear tablas
python seed.py                # datos iniciales (admin + códigos)
uvicorn app.main:app --reload --port 8000
```

API disponible en `http://localhost:8000` · Docs: `http://localhost:8000/docs`

Credenciales del seed:
- Alias: `admin` / Código: `ADMIN0001`

### Terminal 2 — Dashboard

```bash
cd dashboard
npm install
npm run dev      # http://localhost:5173
```

### Terminal 3 — App del residente

```bash
cd mobile
npm install
npm run dev      # http://localhost:5174
```

---

## Pruebas

```bash
cd backend
pip install -r requirements.txt   # instala pytest, pytest-cov, httpx
pytest
```

Informe de cobertura en pantalla. Cobertura mínima requerida: **60%**.

Para ejecutar un módulo específico:

```bash
pytest tests/test_auth.py -v
```

---

## Cierre del proyecto

Cuando finalice el estudio, ejecutar desde la raíz del repositorio:

```bash
bash scripts/shutdown.sh
```

El script:
1. Crea un backup final de la base de datos.
2. Elimina todos los usuarios, reportes, preferencias y códigos de acceso.
3. Genera `shutdown_log.txt` con conteos y fecha para firma del investigador.

Entregar `shutdown_log.txt` a Don Hernesto como constancia de eliminación (cláusula 4.4 del Acta de Consentimiento).

---

## Cumplimiento legal

| Norma | Aplicación |
|---|---|
| **Ley 1581 de 2012** (habeas data) | Alias anónimos, sin datos personales identificables, derecho de supresión implementado (`DELETE /me`), eliminación automática de reportes a los 30 días |
| **Privacy by Design** | Datos mínimos desde el diseño; no se almacenan emails ni teléfonos; reportes con TTL de 30 días |
| **Ley 842 de 2003** | Marco de responsabilidad del investigador en el uso de la información recolectada |

---

## Comandos útiles

```bash
# Ver logs del job de limpieza
tail -20 backend/logs/cleanup.log

# Backup manual
cp backend/db/app.db backend/db/backup_$(date +%Y%m%d).db

# Compilar TypeScript (mobile)
cd mobile && npm run build

# Linting (dashboard)
cd dashboard && npm run lint
```
