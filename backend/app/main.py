from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .compose import compose_post
from .content import CONCLUSIONS, DEMO, EVENTS, HASHTAGS, HOOKS, LEARNINGS
from .models import ComposeRequest, ComposeResponse

DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

app = FastAPI(title="LarpedIn")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def pick(table, item_id, field):
    if item_id not in table:
        raise HTTPException(status_code=422, detail=f"Unknown {field}: {item_id}")
    return table[item_id]


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/demo")
def demo():
    return DEMO


@app.post("/api/compose", response_model=ComposeResponse)
def compose(request: ComposeRequest):
    if len(request.learningIds) != 3 or len(set(request.learningIds)) != 3:
        raise HTTPException(status_code=422, detail="Choose exactly 3 different learnings")
    if not 1 <= len(request.hashtagIds) <= 3 or len(set(request.hashtagIds)) != len(request.hashtagIds):
        raise HTTPException(status_code=422, detail="Choose 1 to 3 different hashtags")
    text = compose_post(
        pick(EVENTS, request.eventId, "eventId"),
        pick(HOOKS, request.hookId, "hookId"),
        [pick(LEARNINGS, item_id, "learningId") for item_id in request.learningIds],
        pick(CONCLUSIONS, request.conclusionId, "conclusionId"),
        [pick(HASHTAGS, item_id, "hashtagId") for item_id in request.hashtagIds],
    )
    return {"text": text}


if (DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"))


@app.get("/{path:path}")  # must stay last so API routes win
def spa(path: str):
    if path == "api" or path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")
    index = DIST / "index.html"
    if not index.is_file():
        return JSONResponse(
            {"detail": "Frontend not built. Run scripts/build.sh"},
            status_code=503,
        )
    candidate = (DIST / path).resolve()
    if path and candidate.is_file() and DIST.resolve() in candidate.parents:
        return FileResponse(candidate)
    return FileResponse(index)
