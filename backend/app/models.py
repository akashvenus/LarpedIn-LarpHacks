from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ComposeRequest(BaseModel):
    eventId: str
    hookId: str
    learningIds: list[str]
    conclusionId: str
    hashtagIds: list[str]


class ComposeResponse(BaseModel):
    text: str


class AiPresetRequest(BaseModel):
    eventId: str


class AiPresetResponse(BaseModel):
    source: Literal["gemini", "fallback"]
    hookId: str
    learningIds: list[str]
    conclusionId: str
    hashtagIds: list[str]


class PostResponse(BaseModel):
    id: int
    createdAt: datetime
    eventId: str
    hookId: str
    learningIds: list[str]
    conclusionId: str
    hashtagIds: list[str]
    text: str


class PostListResponse(BaseModel):
    posts: list[PostResponse]


class DbHealthResponse(BaseModel):
    ok: bool
