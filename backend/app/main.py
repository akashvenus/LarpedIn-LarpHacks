from pathlib import Path
from uuid import UUID

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .compose import compose_personal_post, compose_post
from .content import CONCLUSIONS, DEMO, EVENTS, HASHTAGS, HOOKS, LEARNINGS
from .db import DatabaseUnavailable, check_db, list_posts, load_demo_state, save_demo_state, save_post
from .gemini import generate_preset
from .models import (
    AiPresetRequest,
    AiPresetResponse,
    ComposeRequest,
    ComposeResponse,
    DbHealthResponse,
    DemoStateResponse,
    DemoStateWrite,
    PostListResponse,
    PostResponse,
)

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


def compose_from_request(request):
    if len(request.learningIds) != 3 or len(set(request.learningIds)) != 3:
        raise HTTPException(status_code=422, detail="Choose exactly 3 different learnings")
    if not 1 <= len(request.hashtagIds) <= 3 or len(set(request.hashtagIds)) != len(request.hashtagIds):
        raise HTTPException(status_code=422, detail="Choose 1 to 3 different hashtags")
    if request.format == "personal":
        # Validate the legacy IDs as well, since they remain part of the saved record.
        for item_id in request.learningIds:
            pick(LEARNINGS, item_id, "learningId")
        return compose_personal_post(
            pick(EVENTS, request.eventId, "eventId"),
            pick(HOOKS, request.hookId, "hookId"),
            pick(CONCLUSIONS, request.conclusionId, "conclusionId"),
            [pick(HASHTAGS, item_id, "hashtagId") for item_id in request.hashtagIds],
            request.moment, request.person, request.nextStep, request.customHook, request.customConclusion,
        )
    return compose_post(
        pick(EVENTS, request.eventId, "eventId"),
        pick(HOOKS, request.hookId, "hookId"),
        [pick(LEARNINGS, item_id, "learningId") for item_id in request.learningIds],
        pick(CONCLUSIONS, request.conclusionId, "conclusionId"),
        [pick(HASHTAGS, item_id, "hashtagId") for item_id in request.hashtagIds],
    )


@app.post("/api/compose", response_model=ComposeResponse)
def compose(request: ComposeRequest):
    return {"text": compose_from_request(request)}


@app.post("/api/ai/preset", response_model=AiPresetResponse)
def ai_preset(request: AiPresetRequest):
    event = pick(EVENTS, request.eventId, "eventId")
    return generate_preset(event)


@app.post("/api/posts", response_model=PostResponse, status_code=201)
def create_post(request: ComposeRequest):
    text = compose_from_request(request)
    try:
        return save_post(
            request.eventId,
            request.hookId,
            request.learningIds,
            request.conclusionId,
            request.hashtagIds,
            text,
        )
    except DatabaseUnavailable:
        raise HTTPException(status_code=503, detail="Database unavailable")


@app.get("/api/posts", response_model=PostListResponse)
def get_posts(limit: int = 20):
    if not 1 <= limit <= 50:
        raise HTTPException(status_code=422, detail="limit must be between 1 and 50")
    try:
        return {"posts": list_posts(limit)}
    except DatabaseUnavailable:
        raise HTTPException(status_code=503, detail="Database unavailable")


@app.get("/api/db/health", response_model=DbHealthResponse)
def db_health():
    try:
        check_db()
    except DatabaseUnavailable:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"ok": True}


@app.get("/api/state/{client_id}", response_model=DemoStateResponse)
def get_demo_state(client_id: UUID):
    try:
        return {"state": load_demo_state(client_id)}
    except DatabaseUnavailable:
        raise HTTPException(status_code=503, detail="Database unavailable")


@app.put("/api/state/{client_id}", response_model=DemoStateResponse)
def put_demo_state(client_id: UUID, request: DemoStateWrite):
    try:
        state = request.state.model_dump(mode="json")
        save_demo_state(client_id, state)
        return {"state": state}
    except DatabaseUnavailable:
        raise HTTPException(status_code=503, detail="Database unavailable")


if (DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"))


@app.get("/{path:path}")  # must stay last so API routes win
def spa(path: str):
    if path == "api/compose":
        raise HTTPException(status_code=405, detail="Method Not Allowed")
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
