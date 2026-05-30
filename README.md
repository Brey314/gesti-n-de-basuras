# Gestión de Basuras

App móvil + dashboard web para que residentes de un conjunto reporten el estado de contenedores de basura en tiempo real.

## Requisitos

- Python 3.11+
- Node 20+

## Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Crea el archivo de entorno (edita JWT_SECRET si lo deseas)
cp .env.example .env

alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Dashboard (próxima fase)

```bash
cd dashboard
npm install
npm run dev
```

- URL: http://localhost:5173

## App móvil (próxima fase)

```bash
cd mobile
npm install
npx expo start
```

## Estructura del monorepo

```
/
├── backend/      # FastAPI + SQLAlchemy + SQLite
├── dashboard/    # React + TypeScript + Vite + Tailwind CSS
├── mobile/       # React Native (Expo)
└── README.md
```

## Privacidad

- Sin datos personales reales: identificación por alias + código de acceso.
- Borrado automático de reportes a los 30 días.
- HTTPS/TLS obligatorio en producción.
- Código abierto.
