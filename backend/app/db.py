import os

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


class DatabaseUnavailable(Exception):
    pass


class StandUpAlreadyPosted(Exception):
    pass


CREATE_STAND_UPS_TABLE = """
CREATE TABLE IF NOT EXISTS stand_up_posts (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL,
    local_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    headline TEXT NOT NULL,
    win TEXT NOT NULL,
    next_step TEXT NOT NULL,
    UNIQUE (client_id, local_date)
)
"""


def _stand_up(row, client_id):
    return {
        "id": row["id"], "createdAt": row["created_at"],
        "localDate": row["local_date"].isoformat(), "name": row["name"],
        "headline": row["headline"], "win": row["win"],
        "nextStep": row["next_step"], "isOwn": row["client_id"] == client_id,
    }


def list_stand_ups(client_id):
    try:
        with _connect() as conn:
            conn.execute(CREATE_STAND_UPS_TABLE)
            rows = conn.execute("SELECT * FROM stand_up_posts ORDER BY created_at DESC, id DESC").fetchall()
            return [_stand_up(row, client_id) for row in rows]
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not load stand-ups") from error


def save_stand_up(client_id, payload):
    try:
        with _connect() as conn:
            conn.execute(CREATE_STAND_UPS_TABLE)
            row = conn.execute(
                """INSERT INTO stand_up_posts (client_id, local_date, name, headline, win, next_step)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
                (client_id, payload.localDate, payload.name.strip(), payload.headline.strip(),
                 payload.win.strip(), payload.nextStep.strip()),
            ).fetchone()
            conn.execute(CREATE_DEMO_STATES_TABLE)
            conn.execute(
                """UPDATE demo_states SET state = state || %s, updated_at = now()
                   WHERE client_id = %s AND NOT COALESCE((state->>'standUpSubmitted')::boolean, false)""",
                (Jsonb({"standUpSubmitted": True, "standUpBullets": {
                    "bullet1": payload.win.strip(), "bullet2": payload.nextStep.strip(),
                }}), client_id),
            )
            return _stand_up(row, client_id)
    except psycopg.errors.UniqueViolation as error:
        raise StandUpAlreadyPosted from error
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not save stand-up") from error


def update_stand_up(client_id, post_id, payload):
    try:
        with _connect() as conn:
            conn.execute(CREATE_STAND_UPS_TABLE)
            row = conn.execute(
                """UPDATE stand_up_posts SET win = %s, next_step = %s
                   WHERE id = %s AND client_id = %s RETURNING *""",
                (payload.win.strip(), payload.nextStep.strip(), post_id, client_id),
            ).fetchone()
            return _stand_up(row, client_id) if row else None
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not update stand-up") from error


def delete_stand_up(client_id, post_id):
    try:
        with _connect() as conn:
            conn.execute(CREATE_STAND_UPS_TABLE)
            return conn.execute(
                "DELETE FROM stand_up_posts WHERE id = %s AND client_id = %s RETURNING id",
                (post_id, client_id),
            ).fetchone() is not None
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not delete stand-up") from error


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
    post_text TEXT NOT NULL,
    photo_data JSONB NOT NULL DEFAULT '[]'::jsonb
)
"""

CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    ip_address INET PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""

CREATE_DEMO_STATES_TABLE = """
CREATE TABLE IF NOT EXISTS demo_states (
    client_id UUID PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


ADD_POST_AUTHOR_IP = "ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_ip INET"
ADD_POST_PHOTOS = "ALTER TABLE posts ADD COLUMN IF NOT EXISTS photo_data JSONB NOT NULL DEFAULT '[]'::jsonb"
BACKFILL_POST_PHOTOS = """
UPDATE posts AS post
SET photo_data = (
    SELECT COALESCE(
        jsonb_agg(jsonb_build_object('promptId', photo.prompt_id, 'url', photo.photo_url)),
        '[]'::jsonb
    )
    FROM jsonb_each_text(saved.state->'photos') AS photo(prompt_id, photo_url)
    WHERE photo.photo_url <> 'null'
)
FROM demo_states AS saved
WHERE post.author_client_id = saved.client_id
  AND post.photo_data = '[]'::jsonb
  AND jsonb_typeof(saved.state->'photos') = 'object'
  AND EXISTS (
      SELECT 1 FROM jsonb_each_text(saved.state->'photos') AS photo(prompt_id, photo_url)
      WHERE photo.photo_url LIKE 'data:image/%'
  )
"""
BACKFILL_POST_PHOTOS_BY_IP = """
UPDATE posts AS post
SET photo_data = (
    SELECT COALESCE(
        jsonb_agg(jsonb_build_object('promptId', photo.prompt_id, 'url', photo.photo_url)),
        '[]'::jsonb
    )
    FROM jsonb_each_text(saved.state->'photos') AS photo(prompt_id, photo_url)
    WHERE photo.photo_url LIKE 'data:image/%'
)
FROM users AS saved
WHERE post.author_ip = saved.ip_address
  AND post.photo_data = '[]'::jsonb
  AND jsonb_typeof(saved.state->'photos') = 'object'
  AND EXISTS (
      SELECT 1 FROM jsonb_each_text(saved.state->'photos') AS photo(prompt_id, photo_url)
      WHERE photo.photo_url LIKE 'data:image/%'
  )
"""
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
        "photos": row["photo_data"] or [],
    }


def save_post(author_ip, event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, text):
    try:
        with _connect() as conn:
            conn.execute(CREATE_TABLE)
            conn.execute(ADD_POST_AUTHOR_IP)
            conn.execute(ADD_POST_PHOTOS)
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
                          conclusion_id, hashtag_ids, post_text, photo_data
                """,
                (author_ip, event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, text),
            ).fetchone()
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not save post") from error
    return _post(row)


def list_posts(limit=None, exclude_client_id=None):
    try:
        with _connect() as conn:
            conn.execute(CREATE_TABLE)
            conn.execute(ADD_POST_AUTHOR_IP)
            conn.execute(ADD_POST_PHOTOS)
            conn.execute(UNIQUE_POST_PER_USER)
            conn.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_client_id UUID")
            conn.execute(CREATE_DEMO_STATES_TABLE)
            conn.execute(BACKFILL_POST_PHOTOS)
            conn.execute(CREATE_USERS_TABLE)
            conn.execute(BACKFILL_POST_PHOTOS_BY_IP)
            query = """SELECT id, created_at, event_id, hook_id, learning_ids,
                              conclusion_id, hashtag_ids, post_text, photo_data FROM posts"""
            params = []
            if exclude_client_id is not None:
                query += " WHERE author_client_id IS DISTINCT FROM %s"
                params.append(exclude_client_id)
            query += " ORDER BY created_at DESC, id DESC"
            if limit is not None:
                query += " LIMIT %s"
                params.append(limit)
            rows = conn.execute(query, params).fetchall()
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


CREATE_USER_POSTS = """
CREATE TABLE IF NOT EXISTS user_posts (
    client_id UUID PRIMARY KEY,
    event_id TEXT NOT NULL,
    post_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def save_user_post(client_id, event_id, text, composer_input, photos):
    try:
        with _connect() as conn:
            conn.execute(CREATE_USER_POSTS)
            conn.execute(CREATE_TABLE)
            conn.execute(ADD_POST_PHOTOS)
            conn.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_client_id UUID")
            conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS posts_author_client_id_unique ON posts(author_client_id) WHERE author_client_id IS NOT NULL")
            conn.execute(
                """INSERT INTO posts (author_client_id, event_id, hook_id, learning_ids, conclusion_id, hashtag_ids, post_text, photo_data)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (author_client_id) WHERE author_client_id IS NOT NULL DO UPDATE SET
                     created_at = now(), event_id = EXCLUDED.event_id, hook_id = EXCLUDED.hook_id,
                     learning_ids = EXCLUDED.learning_ids, conclusion_id = EXCLUDED.conclusion_id,
                     hashtag_ids = EXCLUDED.hashtag_ids, post_text = EXCLUDED.post_text,
                     photo_data = EXCLUDED.photo_data""",
                (client_id, event_id, composer_input['hookId'], composer_input['learningIds'],
                 composer_input['conclusionId'], composer_input['hashtagIds'], text, Jsonb(photos)),
            )
            conn.execute(
                """INSERT INTO user_posts (client_id, event_id, post_text)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (client_id) DO UPDATE SET
                     event_id = EXCLUDED.event_id, post_text = EXCLUDED.post_text,
                     updated_at = now()""",
                (client_id, event_id, text),
            )
            conn.execute(CREATE_DEMO_STATES_TABLE)
            conn.execute(
                """UPDATE demo_states SET state = state || %s, updated_at = now()
                   WHERE client_id = %s""",
                (Jsonb({"postText": text, "postPublished": True, "composerInput": composer_input}), client_id),
            )
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not save post") from error


def delete_browser_post(client_id):
    try:
        with _connect() as conn:
            conn.execute(CREATE_USER_POSTS)
            conn.execute(CREATE_DEMO_STATES_TABLE)
            conn.execute(CREATE_TABLE)
            conn.execute(ADD_POST_PHOTOS)
            conn.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_client_id UUID")
            conn.execute("DELETE FROM posts WHERE author_client_id = %s", (client_id,))
            conn.execute("DELETE FROM user_posts WHERE client_id = %s", (client_id,))
            conn.execute(
                """UPDATE demo_states SET state = state || %s, updated_at = now()
                   WHERE client_id = %s""",
                (Jsonb({"postText": "", "postPublished": False, "composerInput": None,
                       "composerDraft": {"answers": {}, "hashtagIds": [], "active": "hook", "customOpen": False, "customDraft": ""},
                       "selections": {"hookId": None, "learningIds": [], "conclusionId": None, "hashtagIds": []}}), client_id),
            )
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not delete post") from error


def reset_browser_data(client_id):
    try:
        with _connect() as conn:
            conn.execute(CREATE_DEMO_STATES_TABLE)
            conn.execute(CREATE_USER_POSTS)
            conn.execute(CREATE_TABLE)
            conn.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_client_id UUID")
            conn.execute(CREATE_STAND_UPS_TABLE)
            conn.execute("DELETE FROM posts WHERE author_client_id = %s", (client_id,))
            conn.execute("DELETE FROM user_posts WHERE client_id = %s", (client_id,))
            conn.execute("DELETE FROM stand_up_posts WHERE client_id = %s", (client_id,))
            conn.execute("DELETE FROM demo_states WHERE client_id = %s", (client_id,))
    except psycopg.Error as error:
        raise DatabaseUnavailable("Could not reset demo progress") from error
