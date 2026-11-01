import os

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


class DatabaseUnavailable(Exception):
    pass


CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_id TEXT NOT NULL,
    hook_id TEXT NOT NULL,
    learning_ids TEXT[] NOT NULL,
    conclusion_id TEXT NOT NULL,
    hashtag_ids TEXT[] NOT NULL,
    post_text TEXT NOT NULL
)
"""

CREATE_DEMO_STATES_TABLE = """
CREATE TABLE IF NOT EXISTS demo_states (
    client_id UUID PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def _connect():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise DatabaseUnavailable("DATABASE_URL is not set")
    try:
        return psycopg.connect(url, row_factory=dict_row)
    except psycopg.Error as error:
        raise DatabaseUnavailable("Database connection failed") from error


def _post(row):
    return {
        "id": row["id"],
        "createdAt": row["created_at"],
        "eventId": row["event_id"],
        "hookId": row["hook_id"],
        "learningIds": row["learning_ids"],
        "conclusionId": row["conclusion_id"],
        "hashtagIds": row["hashtag_ids"],
        "text": row["post_text"],
    }


def save_post(event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, text):
    try:
        with _connect() as conn:
            conn.execute(CREATE_TABLE)
            row = conn.execute(
                """
                INSERT INTO posts
                    (event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, post_text)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, created_at, event_id, hook_id, learning_ids,
                          conclusion_id, hashtag_ids, post_text
                """,
                (event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, text),
            ).fetchone()
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not save post") from error
    return _post(row)


def list_posts(limit):
    try:
        with _connect() as conn:
            conn.execute(CREATE_TABLE)
            rows = conn.execute(
                """
                SELECT id, created_at, event_id, hook_id, learning_ids,
                       conclusion_id, hashtag_ids, post_text
                FROM posts
                ORDER BY created_at DESC, id DESC
                LIMIT %s
                """,
                (limit,),
            ).fetchall()
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not load posts") from error
    return [_post(row) for row in rows]


def check_db():
    try:
        with _connect() as conn:
            conn.execute("SELECT 1")
    except psycopg.Error as error:
        raise DatabaseUnavailable("Database check failed") from error


def load_demo_state(client_id):
    try:
        with _connect() as conn:
            conn.execute(CREATE_DEMO_STATES_TABLE)
            row = conn.execute(
                "SELECT state FROM demo_states WHERE client_id = %s",
                (client_id,),
            ).fetchone()
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not load saved progress") from error
    return row["state"] if row else None


def save_demo_state(client_id, state):
    try:
        with _connect() as conn:
            conn.execute(CREATE_DEMO_STATES_TABLE)
            conn.execute(
                """
                INSERT INTO demo_states (client_id, state)
                VALUES (%s, %s)
                ON CONFLICT (client_id) DO UPDATE
                SET state = EXCLUDED.state, updated_at = now()
                """,
                (client_id, Jsonb(state)),
            )
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not save progress") from error
