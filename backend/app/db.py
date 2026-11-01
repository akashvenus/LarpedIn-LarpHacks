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
    author_ip INET,
    event_id TEXT NOT NULL,
    hook_id TEXT NOT NULL,
    learning_ids TEXT[] NOT NULL,
    conclusion_id TEXT NOT NULL,
    hashtag_ids TEXT[] NOT NULL,
    post_text TEXT NOT NULL
)
"""

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    ip_address INET PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""

ADD_POST_AUTHOR_IP = "ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_ip INET"
UNIQUE_POST_PER_USER = "CREATE UNIQUE INDEX IF NOT EXISTS posts_author_ip_unique ON posts(author_ip) WHERE author_ip IS NOT NULL"


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


def save_post(author_ip, event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, text):
    try:
        with _connect() as conn:
            conn.execute(CREATE_TABLE)
            conn.execute(ADD_POST_AUTHOR_IP)
            conn.execute(UNIQUE_POST_PER_USER)
            row = conn.execute(
                """
                INSERT INTO posts
                    (author_ip, event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, post_text)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (author_ip) WHERE author_ip IS NOT NULL DO UPDATE SET
                    created_at = now(), event_id = EXCLUDED.event_id, hook_id = EXCLUDED.hook_id,
                    learning_ids = EXCLUDED.learning_ids, conclusion_id = EXCLUDED.conclusion_id,
                    hashtag_ids = EXCLUDED.hashtag_ids, post_text = EXCLUDED.post_text
                RETURNING id, created_at, event_id, hook_id, learning_ids,
                          conclusion_id, hashtag_ids, post_text
                """,
                (author_ip, event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, text),
            ).fetchone()
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not save post") from error
    return _post(row)


def list_posts(limit=None):
    try:
        with _connect() as conn:
            conn.execute(CREATE_TABLE)
            conn.execute(ADD_POST_AUTHOR_IP)
            conn.execute(UNIQUE_POST_PER_USER)
            query = """
                SELECT id, created_at, event_id, hook_id, learning_ids,
                       conclusion_id, hashtag_ids, post_text
                FROM posts
                ORDER BY created_at DESC, id DESC
                """
            rows = conn.execute(query).fetchall() if limit is None else conn.execute(
                query + " LIMIT %s", (limit,)
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


def load_user_state(ip_address):
    try:
        with _connect() as conn:
            conn.execute(CREATE_USERS_TABLE)
            row = conn.execute(
                "SELECT state FROM users WHERE ip_address = %s",
                (ip_address,),
            ).fetchone()
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not load saved progress") from error
    return row["state"] if row else None


def save_user_state(ip_address, state):
    try:
        with _connect() as conn:
            conn.execute(CREATE_USERS_TABLE)
            conn.execute(
                """
                INSERT INTO users (ip_address, state)
                VALUES (%s, %s)
                ON CONFLICT (ip_address) DO UPDATE
                SET state = EXCLUDED.state, updated_at = now()
                """,
                (ip_address, Jsonb(state)),
            )
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not save progress") from error


def delete_user_post(author_ip):
    try:
        with _connect() as conn:
            conn.execute("DELETE FROM posts WHERE author_ip = %s", (author_ip,))
            conn.execute(CREATE_USERS_TABLE)
            conn.execute(
                """UPDATE users SET state = state || %s, updated_at = now()
                   WHERE ip_address = %s""",
                (Jsonb({
                    "postText": "",
                    "postPublished": False,
                    "composerInput": None,
                    "composerDraft": {"answers": {}, "hashtagIds": [], "active": "hook", "customOpen": False, "customDraft": ""},
                    "selections": {"hookId": None, "learningIds": [], "conclusionId": None, "hashtagIds": []},
                }), author_ip),
            )
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not delete post") from error
