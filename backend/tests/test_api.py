import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "content" / "demo.json"
DIST_INDEX = ROOT / "frontend" / "dist" / "index.html"

DEMO = json.loads(FIXTURE.read_text(encoding="utf-8"))
COMPOSER = DEMO["composer"]
LEARNING_TEXT = {item["id"]: item["text"] for item in COMPOSER["learnings"]}
HASHTAG_TEXT = {item["id"]: item["text"] for item in COMPOSER["hashtags"]}

client = TestClient(app)
needs_dist = pytest.mark.skipif(not DIST_INDEX.is_file(), reason="frontend build not present")


def good_payload():
    return {
        "eventId": DEMO["events"][0]["id"],
        "hookId": COMPOSER["hooks"][0]["id"],
        "learningIds": [item["id"] for item in COMPOSER["learnings"][:3]],
        "conclusionId": COMPOSER["conclusions"][0]["id"],
        "hashtagIds": [COMPOSER["hashtags"][0]["id"]],
    }


def compose(payload):
    return client.post("/api/compose", json=payload)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_demo_matches_fixture():
    response = client.get("/api/demo")
    assert response.status_code == 200
    assert response.json() == DEMO
    assert len(response.json()["events"]) == 3
    assert response.json()["events"][0]["id"] == "larphacks"
    assert response.json()["events"][0]["url"] == "https://luma.com/irn5abpa"


def test_valid_compose_is_deterministic():
    payload = good_payload()
    first = compose(payload)
    second = compose(payload)
    assert first.status_code == 200
    assert first.json()["text"] == second.json()["text"]
    assert COMPOSER["hooks"][0]["text"] in first.json()["text"]
    assert COMPOSER["conclusions"][0]["text"] in first.json()["text"]


def test_compose_matches_contract_format():
    payload = good_payload()
    text = compose(payload).json()["text"]
    event = next(item for item in DEMO["events"] if item["id"] == payload["eventId"])
    hook = next(item for item in COMPOSER["hooks"] if item["id"] == payload["hookId"])
    conclusion = next(item for item in COMPOSER["conclusions"] if item["id"] == payload["conclusionId"])
    learnings = [LEARNING_TEXT[item_id] for item_id in payload["learningIds"]]
    hashtags = [HASHTAG_TEXT[item_id] for item_id in payload["hashtagIds"]]
    expected = "\n".join(
        [
            hook["text"],
            "",
            f"I recently attended {event['title']}. Here are three things I learned:",
            "",
            f"1. {learnings[0]}",
            f"2. {learnings[1]}",
            f"3. {learnings[2]}",
            "",
            conclusion["text"],
            "",
            " ".join(hashtags),
        ]
    )
    assert text == expected


def test_compose_preserves_learning_order():
    forward = good_payload()
    backward = {**forward, "learningIds": list(reversed(forward["learningIds"]))}
    forward_text = compose(forward).json()["text"]
    backward_text = compose(backward).json()["text"]
    first_id, second_id, third_id = forward["learningIds"]
    assert forward_text.index(LEARNING_TEXT[first_id]) < forward_text.index(LEARNING_TEXT[second_id])
    assert forward_text.index(LEARNING_TEXT[second_id]) < forward_text.index(LEARNING_TEXT[third_id])
    assert backward_text.index(LEARNING_TEXT[third_id]) < backward_text.index(LEARNING_TEXT[second_id])
    assert backward_text.index(LEARNING_TEXT[second_id]) < backward_text.index(LEARNING_TEXT[first_id])


def test_compose_preserves_hashtag_order():
    payload = good_payload()
    payload["hashtagIds"] = [item["id"] for item in COMPOSER["hashtags"][:3]]
    text = compose(payload).json()["text"]
    expected = " ".join(HASHTAG_TEXT[item_id] for item_id in payload["hashtagIds"])
    assert expected in text


def test_two_learnings_return_422():
    payload = good_payload()
    payload["learningIds"] = payload["learningIds"][:2]
    assert compose(payload).status_code == 422


def test_four_learnings_return_422():
    payload = good_payload()
    payload["learningIds"].append(COMPOSER["learnings"][3]["id"])
    assert compose(payload).status_code == 422


def test_duplicate_learnings_return_422():
    payload = good_payload()
    payload["learningIds"][2] = payload["learningIds"][0]
    assert compose(payload).status_code == 422


def test_zero_hashtags_return_422():
    payload = good_payload()
    payload["hashtagIds"] = []
    assert compose(payload).status_code == 422


def test_four_hashtags_return_422():
    payload = good_payload()
    payload["hashtagIds"] = [item["id"] for item in COMPOSER["hashtags"][:4]]
    assert compose(payload).status_code == 422


def test_duplicate_hashtags_return_422():
    payload = good_payload()
    payload["hashtagIds"] = [COMPOSER["hashtags"][0]["id"]] * 2
    assert compose(payload).status_code == 422


@pytest.mark.parametrize(
    "field,value,message",
    [
        ("eventId", "missing-event", "eventId"),
        ("hookId", "missing-hook", "hookId"),
        ("conclusionId", "missing-conclusion", "conclusionId"),
        ("hashtagIds", ["missing-hashtag"], "hashtagId"),
    ],
)
def test_unknown_ids_return_422(field, value, message):
    payload = good_payload()
    payload[field] = value
    response = compose(payload)
    assert response.status_code == 422
    assert message in response.json()["detail"]


def test_unknown_learning_id_returns_422():
    payload = good_payload()
    payload["learningIds"][0] = "missing-learning"
    response = compose(payload)
    assert response.status_code == 422
    assert "learningId" in response.json()["detail"]


def test_missing_field_returns_422():
    payload = good_payload()
    del payload["hookId"]
    assert compose(payload).status_code == 422


def test_wrong_learning_type_returns_422():
    payload = good_payload()
    payload["learningIds"] = "not-a-list"
    assert compose(payload).status_code == 422


def test_unknown_api_route_returns_json_404():
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")


def test_get_compose_returns_405():
    assert client.get("/api/compose").status_code == 405


@needs_dist
def test_root_serves_html():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")


@needs_dist
def test_spa_route_serves_html():
    response = client.get("/events")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")


@needs_dist
def test_missing_asset_returns_404():
    assert client.get("/assets/nope.js").status_code == 404


@needs_dist
def test_path_traversal_does_not_leak_files():
    response = client.get("/..%2f..%2fcontent%2fdemo.json")
    assert response.status_code in (200, 404)
    assert "schemaVersion" not in response.text


def test_ai_preset_falls_back_without_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post("/api/ai/preset", json={"eventId": DEMO["events"][0]["id"]})
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert body["hookId"] in {item["id"] for item in COMPOSER["hooks"]}
    assert body["conclusionId"] in {item["id"] for item in COMPOSER["conclusions"]}
    assert len(body["learningIds"]) == 3
    assert len(set(body["learningIds"])) == 3
    assert all(item in LEARNING_TEXT for item in body["learningIds"])
    assert 1 <= len(body["hashtagIds"]) <= 3
    assert len(set(body["hashtagIds"])) == len(body["hashtagIds"])
    assert all(item in HASHTAG_TEXT for item in body["hashtagIds"])


def test_ai_preset_unknown_event_returns_422(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post("/api/ai/preset", json={"eventId": "missing-event"})
    assert response.status_code == 422
    assert "eventId" in response.json()["detail"]


def test_ai_preset_rejects_invalid_model_output():
    from app.gemini import _valid_preset

    assert _valid_preset(
        {
            "hookId": COMPOSER["hooks"][0]["id"],
            "learningIds": [item["id"] for item in COMPOSER["learnings"][:3]],
            "conclusionId": COMPOSER["conclusions"][0]["id"],
            "hashtagIds": [COMPOSER["hashtags"][0]["id"]],
        }
    )
    assert not _valid_preset(
        {
            "hookId": COMPOSER["hooks"][0]["id"],
            "learningIds": ["missing-learning"] * 3,
            "conclusionId": COMPOSER["conclusions"][0]["id"],
            "hashtagIds": [COMPOSER["hashtags"][0]["id"]],
        }
    )


def test_posts_endpoints_require_database(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert client.post("/api/posts", json=good_payload()).status_code == 503
    assert client.get("/api/posts").status_code == 503
    assert client.get("/api/db/health").status_code == 503


def test_posts_validates_before_database(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    payload = good_payload()
    payload["learningIds"] = payload["learningIds"][:2]
    assert client.post("/api/posts", json=payload).status_code == 422


def test_posts_limit_validation(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert client.get("/api/posts?limit=0").status_code == 422
    assert client.get("/api/posts?limit=51").status_code == 422


def test_personal_post_formats_optional_details_and_preserves_legacy():
    payload = {**good_payload(), "format": "personal"}
    plain = compose(payload)
    assert plain.status_code == 200
    assert "I recently attended LarpHacks." in plain.json()["text"]
    assert "One moment" not in plain.json()["text"]
    assert "Next up:" not in plain.json()["text"]
    filled = compose({**payload, "moment": " a demo! ", "person": "my team", "nextStep": "keep building"})
    assert filled.status_code == 200
    assert "One moment that stuck with me: a demo! A big thank you to my team." in filled.json()["text"]
    assert "Next up: keep building." in filled.json()["text"]
    assert "Here are three things I learned:" in compose(good_payload()).json()["text"]
    assert compose({**payload, "moment": "x" * 281}).status_code == 422
    assert compose({**payload, "format": "unknown"}).status_code == 422


def test_personal_save_uses_composed_text(monkeypatch):
    from datetime import datetime, timezone
    from app import main

    captured = {}
    def fake_save(event, hook, learnings, conclusion, hashtags, text):
        captured["text"] = text
        return {"id": 1, "createdAt": datetime.now(timezone.utc), "eventId": event,
                "hookId": hook, "learningIds": learnings, "conclusionId": conclusion,
                "hashtagIds": hashtags, "text": text}

    monkeypatch.setattr(main, "save_post", fake_save)
    payload = {**good_payload(), "format": "personal", "moment": "our demo", "person": "the team", "nextStep": "ship it"}
    response = client.post('/api/posts', json=payload)
    assert response.status_code == 201
    assert response.json()['text'] == captured['text'] == compose(payload).json()['text']


def test_personal_custom_lines_and_validation(monkeypatch):
    from datetime import datetime, timezone
    from app import main

    def fake_save(event, hook, learnings, conclusion, hashtags, text):
        return {"id": 1, "createdAt": datetime.now(timezone.utc), "eventId": event,
                "hookId": hook, "learningIds": learnings, "conclusionId": conclusion,
                "hashtagIds": hashtags, "text": text}

    monkeypatch.setattr(main, "save_post", fake_save)
    payload = {**good_payload(), "format": "personal", "customHook": " My opening! ",
               "customConclusion": "My closing", "moment": "the conversations",
               "person": "everyone who showed up", "nextStep": "keep building"}
    response = compose(payload)
    assert response.status_code == 200
    text = response.json()["text"]
    assert text.startswith("My opening!\n\n")
    assert "My closing." in text
    assert client.post("/api/posts", json=payload).json()["text"] == text
    assert compose({**payload, "customHook": "x" * 281}).status_code == 422
    assert compose({**payload, "customConclusion": "x" * 281}).status_code == 422
    assert compose({**payload, "format": "legacy"}).json()["text"] == compose(good_payload()).json()["text"]


def test_user_post_replacement_and_deletion_are_scoped(monkeypatch):
    from app import main
    posts = {}
    def save(client_id, event_id, text, composer_input):
        posts[str(client_id)] = {"eventId": event_id, "text": text, "input": composer_input}
    def delete(client_id):
        posts.pop(str(client_id), None)
    monkeypatch.setattr(main, "save_user_post", save)
    monkeypatch.setattr(main, "delete_user_post", delete)
    first = "11111111-1111-4111-8111-111111111111"
    second = "22222222-2222-4222-8222-222222222222"
    payload = {**good_payload(), "format": "personal", "moment": "first version"}
    assert client.put(f"/api/user-post/{first}", json=payload).status_code == 200
    assert client.put(f"/api/user-post/{second}", json=payload).status_code == 200
    replacement = {**payload, "moment": "replacement"}
    response = client.put(f"/api/user-post/{first}", json=replacement)
    assert response.status_code == 200
    assert "replacement" in posts[first]["text"] == response.json()["text"]
    assert "first version" in posts[second]["text"]
    assert client.delete(f"/api/user-post/{first}").status_code == 204
    assert first not in posts and second in posts
    assert client.delete("/api/user-post/not-a-uuid").status_code == 422


def test_user_post_database_failures_are_reported(monkeypatch):
    from app import main
    from app.db import DatabaseUnavailable
    def fail(*args):
        raise DatabaseUnavailable()
    monkeypatch.setattr(main, "save_user_post", fail)
    monkeypatch.setattr(main, "delete_user_post", fail)
    client_id = "11111111-1111-4111-8111-111111111111"
    assert client.put(f"/api/user-post/{client_id}", json=good_payload()).status_code == 503
    assert client.delete(f"/api/user-post/{client_id}").status_code == 503


def test_ai_preset_calls_gemini_when_configured(monkeypatch):
    from types import SimpleNamespace
    from app import gemini
    selected = {
        "hookId": COMPOSER["hooks"][0]["id"],
        "learningIds": [item["id"] for item in COMPOSER["learnings"][:3]],
        "conclusionId": COMPOSER["conclusions"][0]["id"],
        "hashtagIds": [COMPOSER["hashtags"][0]["id"]],
    }
    calls = []
    def generate_content(**kwargs):
        calls.append(kwargs)
        return SimpleNamespace(text=json.dumps(selected))
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini.genai, "Client", lambda **kwargs: SimpleNamespace(models=SimpleNamespace(generate_content=generate_content)))
    response = client.post("/api/ai/preset", json={"eventId": DEMO["events"][0]["id"]})
    assert response.status_code == 200
    assert response.json() == {"source": "gemini", **selected}
    assert len(calls) == 1 and calls[0]["model"] == "gemini-3.5-flash-lite"


def test_ai_preset_silently_falls_back_when_gemini_fails(monkeypatch):
    from app import gemini
    def fail(**kwargs):
        raise RuntimeError("unavailable")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(gemini.genai, "Client", fail)
    response = client.post("/api/ai/preset", json={"eventId": DEMO["events"][0]["id"]})
    assert response.status_code == 200
    assert response.json()["source"] == "fallback"


def test_saved_progress_profile_fields_are_backward_compatible():
    from app.models import DemoStatePayload
    payload = {
        "currentScreen": "dorm", "eventId": None, "completedPrompts": [],
        "photos": {"room": None, "selfie": None, "banner": None, "handshake": None},
        "selections": {"hookId": None, "learningIds": [], "conclusionId": None, "hashtagIds": []},
        "composerInput": None, "composerDraft": {"answers": {}, "hashtagIds": [], "active": "hook", "customOpen": False, "customDraft": ""},
        "postText": "", "postPublished": False, "avatarItem": "base", "roomItems": [],
        "standUpDraft": "", "standUpSubmitted": False, "standUpBullets": None,
        "giftOpened": False, "outreachSent": False, "placements": {},
    }
    legacy = DemoStatePayload.model_validate(payload)
    assert legacy.name == "" and legacy.occupation == "" and legacy.profilePhoto is None
    updated = DemoStatePayload.model_validate({**payload, "name": "Sam", "occupation": "Designer", "profilePhoto": "selfie", "currentScreen": "inbox", "outreachPostText": "My post"})
    assert updated.name == "Sam" and updated.profilePhoto == "selfie" and updated.outreachPostText == "My post"
