import json
import os
import random

from google import genai
from google.genai import types
from pydantic import BaseModel

from .content import CONCLUSIONS, HASHTAGS, HOOKS, LEARNINGS


class GeminiPreset(BaseModel):
    hookId: str
    learningIds: list[str]
    conclusionId: str
    hashtagIds: list[str]


def fallback_preset():
    return {
        "source": "fallback",
        "hookId": random.choice(list(HOOKS)),
        "learningIds": random.sample(list(LEARNINGS), 3),
        "conclusionId": random.choice(list(CONCLUSIONS)),
        "hashtagIds": random.sample(list(HASHTAGS), random.randint(1, 3)),
    }


def _valid_preset(data):
    hook_id = data.get("hookId")
    conclusion_id = data.get("conclusionId")
    learning_ids = data.get("learningIds")
    hashtag_ids = data.get("hashtagIds")

    if hook_id not in HOOKS or conclusion_id not in CONCLUSIONS:
        return False
    if not isinstance(learning_ids, list) or len(learning_ids) != 3:
        return False
    if not isinstance(hashtag_ids, list) or not 1 <= len(hashtag_ids) <= 3:
        return False
    if not all(isinstance(item, str) for item in learning_ids + hashtag_ids):
        return False
    if len(set(learning_ids)) != 3 or len(set(hashtag_ids)) != len(hashtag_ids):
        return False
    return all(item in LEARNINGS for item in learning_ids) and all(
        item in HASHTAGS for item in hashtag_ids
    )


def _prompt(event):
    hooks = "\n".join(f"- {key}: {value['text']}" for key, value in HOOKS.items())
    learnings = "\n".join(f"- {key}: {value['text']}" for key, value in LEARNINGS.items())
    conclusions = "\n".join(f"- {key}: {value['text']}" for key, value in CONCLUSIONS.items())
    hashtags = "\n".join(f"- {key}: {value['text']}" for key, value in HASHTAGS.items())
    return f"""Fill a short career post worksheet for a student who attended {event['title']}.
Choose one hook, exactly three different learnings, one conclusion, and one to three different hashtags.
Use only the IDs listed below.

Hooks:
{hooks}

Learnings:
{learnings}

Conclusions:
{conclusions}

Hashtags:
{hashtags}
"""


def generate_preset(event):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return fallback_preset()
    try:
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=8000,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        )
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=_prompt(event),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiPreset,
                temperature=1.0,
            ),
        )
        data = json.loads(response.text)
        if not _valid_preset(data):
            return fallback_preset()
        return {"source": "gemini", **data}
    except Exception:
        return fallback_preset()
