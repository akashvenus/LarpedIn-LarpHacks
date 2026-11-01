from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class StandUpEditRequest(BaseModel):
    win: str = Field(default="", max_length=500)
    nextStep: str = Field(default="", max_length=500)

    @model_validator(mode="after")
    def validate_answers(self):
        if not (self.win.strip() or self.nextStep.strip()):
            raise ValueError("At least one stand-up answer is required")
        return self


class StandUpRequest(StandUpEditRequest):
    localDate: date
    name: str = Field(min_length=1, max_length=100)
    headline: str = Field(min_length=1, max_length=160)

    @model_validator(mode="after")
    def validate_profile(self):
        if not self.name.strip() or not self.headline.strip():
            raise ValueError("A profile is required")
        return self


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


class StandUpBullets(BaseModel):
    bullet1: str
    bullet2: str


class SavedSelections(BaseModel):
    hookId: str | None
    learningIds: list[str]
    conclusionId: str | None
    hashtagIds: list[str]


class SavedComposerInput(BaseModel):
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


class SavedComposerAnswer(BaseModel):
    value: str = Field(max_length=280)
    id: str | None = None
    custom: bool


class SavedComposerDraft(BaseModel):
    answers: dict[Literal["hook", "moment", "person", "nextStep", "conclusion"], SavedComposerAnswer]
    hashtagIds: list[str]
    active: Literal["hook", "moment", "person", "nextStep", "conclusion", "hashtags"]
    customOpen: bool
    customDraft: str = Field(max_length=280)


class SavedPhotos(BaseModel):
    room: str | None = Field(max_length=2_500_000)
    selfie: str | None = Field(max_length=2_500_000)
    banner: str | None = Field(max_length=2_500_000)
    handshake: str | None = Field(max_length=2_500_000)


class DemoStatePayload(BaseModel):
    name: str = Field(default="", max_length=100)
    occupation: str = Field(default="", max_length=160)
    profilePhoto: Literal["room", "selfie", "banner", "handshake"] | None = None
    currentScreen: Literal["dorm", "events", "camera", "trophies", "composer", "gift", "social", "inbox"]
    eventId: str | None
    completedPrompts: list[Literal["room", "selfie", "banner", "handshake"]]
    photos: SavedPhotos
    selections: SavedSelections
    composerInput: SavedComposerInput | None
    composerDraft: SavedComposerDraft
    postText: str
    postPublished: bool
    avatarItem: str
    accessory: Literal["glasses", "lanyard", "propeller-cap"] | None = None
    heldProp: Literal["coffee", "pitch-deck"] | None = None
    roomItems: list[str]
    standUpDraft: str
    standUpSubmitted: bool
    standUpBullets: StandUpBullets | None
    giftOpened: bool
    outreachSent: bool
    outreachPostText: str = ""
    recruiterReplyOutcome: Literal["offer", "rejection"] | None = None
    recruiterReplyAt: int | None = Field(default=None, ge=0)
    placements: dict[str, str]


class DemoStateWrite(BaseModel):
    state: DemoStatePayload


class DemoStateResponse(BaseModel):
    state: DemoStatePayload | None
