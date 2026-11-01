from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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


class StandUpBullets(BaseModel):
    bullet1: str
    bullet2: str


class SavedSelections(BaseModel):
    hookId: str | None
    learningIds: list[str]
    conclusionId: str | None
    hashtagIds: list[str]


class SavedPhotos(BaseModel):
    room: str | None = Field(max_length=2_500_000)
    selfie: str | None = Field(max_length=2_500_000)
    banner: str | None = Field(max_length=2_500_000)
    handshake: str | None = Field(max_length=2_500_000)


class DemoStatePayload(BaseModel):
    currentScreen: Literal["dorm", "events", "camera", "trophies", "composer", "gift", "social"]
    eventId: str | None
    completedPrompts: list[Literal["room", "selfie", "banner", "handshake"]]
    photos: SavedPhotos
    selections: SavedSelections
    postText: str
    postPublished: bool
    avatarItem: str
    roomItems: list[str]
    standUpDraft: str
    standUpSubmitted: bool
    standUpBullets: StandUpBullets | None
    giftOpened: bool
    outreachSent: bool
    placements: dict[str, str]


class DemoStateWrite(BaseModel):
    state: DemoStatePayload


class DemoStateResponse(BaseModel):
    state: DemoStatePayload | None
