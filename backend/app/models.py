from pydantic import BaseModel


class ComposeRequest(BaseModel):
    eventId: str
    hookId: str
    learningIds: list[str]
    conclusionId: str
    hashtagIds: list[str]


class ComposeResponse(BaseModel):
    text: str
