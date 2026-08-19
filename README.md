# Smart Freight API

Backend API for the Smart Freight hackathon project, built with FastAPI.

## Setup

### 1. Create a virtual environment

```bash
python -m venv venv
```

### 2. Activate the virtual environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

## Run the server

```bash
uvicorn main:app --reload
```

The server starts at **http://127.0.0.1:8000**.

## Endpoints

| Method | Path      | Description          |
|--------|-----------|----------------------|
| GET    | `/health` | API health check     |
| GET    | `/docs`   | Swagger UI (auto)    |
| GET    | `/redoc`  | ReDoc docs (auto)    |

## Verify it works

Open your browser or run:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "Smart Freight API"
}
```
