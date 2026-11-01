import json
from pathlib import Path

DEMO_PATH = Path(__file__).resolve().parents[2] / "content" / "demo.json"


def _by_id(items):
    return {item["id"]: item for item in items}


def _check(demo):
    composer = demo["composer"]
    lists = [
        ("events", demo["events"]),
        ("hooks", composer["hooks"]),
        ("learnings", composer["learnings"]),
        ("conclusions", composer["conclusions"]),
        ("hashtags", composer["hashtags"]),
    ]
    for name, items in lists:
        ids = [item["id"] for item in items]
        if len(ids) != len(set(ids)):
            raise RuntimeError(f"demo.json: duplicate ids in {name}")
    if len(demo["events"]) != 3:
        raise RuntimeError("demo.json: expected exactly 3 events")


with open(DEMO_PATH, encoding="utf-8") as file:
    DEMO = json.load(file)
_check(DEMO)

EVENTS = _by_id(DEMO["events"])
HOOKS = _by_id(DEMO["composer"]["hooks"])
LEARNINGS = _by_id(DEMO["composer"]["learnings"])
CONCLUSIONS = _by_id(DEMO["composer"]["conclusions"])
HASHTAGS = _by_id(DEMO["composer"]["hashtags"])
