from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ComposeRequest(BaseModel):
    eventId: str
    hookId: str
    learningIds: list[str]
    conclusionId: str
    hashtagIds: list[str]
    format: Literal["legacy", "personal"] = "legacy"
    customHook: str = Field(default="", max_length=280)
    customConclusion: str = Field(default="", max_length=280)
    moment: str = Field(default="", max_length=280)
    person: str = Field(default="", max_length=120)
    nextStep: str = Field(default="", max_length=280)


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
