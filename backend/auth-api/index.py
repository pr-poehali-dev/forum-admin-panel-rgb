import json
import os
import re
import hashlib
import secrets
import psycopg2


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id, Authorization",
    "Content-Type": "application/json",
}


def respond(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("SET search_path TO t_p16479477_forum_admin_panel_rg")
    return conn, cur


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def generate_session_id() -> str:
    return secrets.token_hex(32)


def get_current_user(headers, cur):
    session_id = headers.get("X-Session-Id") or headers.get("x-session-id")
    if not session_id:
        return None
    safe_sid = session_id.replace("'", "''")
    cur.execute(
        f"SELECT u.id, u.username, u.email, u.role, u.is_banned, u.is_muted, u.bio, u.title, "
        f"u.post_count, u.rgb_profile, u.rgb_color1, u.rgb_color2, u.rgb_color3, u.created_at "
        f"FROM sessions s JOIN users u ON s.user_id = u.id "
        f"WHERE s.id = '{safe_sid}' AND (s.expires_at IS NULL OR s.expires_at > NOW())"
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "username": row[1],
        "email": row[2],
        "role": row[3],
        "is_banned": row[4],
        "is_muted": row[5],
        "bio": row[6],
        "title": row[7],
        "post_count": row[8],
        "rgb_profile": row[9],
        "rgb_color1": row[10],
        "rgb_color2": row[11],
        "rgb_color3": row[12],
        "created_at": row[13],
    }


def handle_register(conn, cur, event):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    username = str(body.get("username", "")).strip()
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", "")).strip()

    if not username or not email or not password:
        return respond(400, {"error": "username, email and password are required"})

    if len(username) < 3 or len(username) > 32:
        return respond(400, {"error": "Username must be 3-32 characters"})

    if len(password) < 6:
        return respond(400, {"error": "Password must be at least 6 characters"})

    safe_username = username.replace("'", "''")
    safe_email = email.replace("'", "''")

    cur.execute(f"SELECT id FROM users WHERE username = '{safe_username}'")
    if cur.fetchone():
        return respond(409, {"error": "Username already taken"})

    cur.execute(f"SELECT id FROM users WHERE email = '{safe_email}'")
    if cur.fetchone():
        return respond(409, {"error": "Email already registered"})

    password_hash = hash_password(password)

    cur.execute(
        f"INSERT INTO users (username, email, password_hash, role, is_banned, is_muted, post_count, created_at) "
        f"VALUES ('{safe_username}', '{safe_email}', '{password_hash}', 'member', FALSE, FALSE, 0, NOW()) "
        f"RETURNING id, username, email, role, created_at"
    )
    row = cur.fetchone()
    user_id = row[0]

    session_id = generate_session_id()
    cur.execute(
        f"INSERT INTO sessions (id, user_id, created_at) "
        f"VALUES ('{session_id}', {user_id}, NOW())"
    )
    conn.commit()

    return respond(201, {
        "session_id": session_id,
        "user": {
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "role": row[3],
            "created_at": row[4],
        }
    })


def handle_login(conn, cur, event):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", "")).strip()

    if not email or not password:
        return respond(400, {"error": "email and password are required"})

    safe_email = email.replace("'", "''")
    password_hash = hash_password(password)

    cur.execute(
        f"SELECT id, username, email, role, is_banned, is_muted, post_count, created_at "
        f"FROM users WHERE email = '{safe_email}' AND password_hash = '{password_hash}'"
    )
    row = cur.fetchone()
    if not row:
        return respond(401, {"error": "Invalid email or password"})

    user_id = row[0]
    if row[4]:
        return respond(403, {"error": "Your account is banned"})

    session_id = generate_session_id()
    cur.execute(
        f"INSERT INTO sessions (id, user_id, created_at) "
        f"VALUES ('{session_id}', {user_id}, NOW())"
    )
    conn.commit()

    return respond(200, {
        "session_id": session_id,
        "user": {
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "role": row[3],
            "is_banned": row[4],
            "is_muted": row[5],
            "post_count": row[6],
            "created_at": row[7],
        }
    })


def handle_logout(conn, cur, headers):
    session_id = headers.get("X-Session-Id") or headers.get("x-session-id")
    if not session_id:
        return respond(401, {"error": "Unauthorized"})
    safe_sid = session_id.replace("'", "''")
    cur.execute(f"UPDATE sessions SET expires_at = NOW() WHERE id = '{safe_sid}'")
    conn.commit()
    return respond(200, {"message": "Logged out"})


def handle_me(headers, cur):
    user = get_current_user(headers, cur)
    if not user:
        return respond(401, {"error": "Unauthorized"})
    return respond(200, {"user": user})


def handle_update_profile(conn, cur, event, headers):
    user = get_current_user(headers, cur)
    if not user:
        return respond(401, {"error": "Unauthorized"})

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    allowed_fields = ["bio", "title", "rgb_profile", "rgb_color1", "rgb_color2", "rgb_color3"]
    updates = []

    for field in allowed_fields:
        if field in body:
            val = str(body[field]).replace("'", "''") if body[field] is not None else None
            if val is None:
                updates.append(f"{field} = NULL")
            else:
                updates.append(f"{field} = '{val}'")

    if not updates:
        return respond(400, {"error": "No fields to update"})

    set_clause = ", ".join(updates)
    uid = user["id"]

    cur.execute(f"UPDATE users SET {set_clause} WHERE id = {uid}")
    conn.commit()

    cur.execute(
        f"SELECT id, username, email, role, is_banned, is_muted, bio, title, post_count, "
        f"rgb_profile, rgb_color1, rgb_color2, rgb_color3, created_at "
        f"FROM users WHERE id = {uid}"
    )
    row = cur.fetchone()
    return respond(200, {"user": {
        "id": row[0],
        "username": row[1],
        "email": row[2],
        "role": row[3],
        "is_banned": row[4],
        "is_muted": row[5],
        "bio": row[6],
        "title": row[7],
        "post_count": row[8],
        "rgb_profile": row[9],
        "rgb_color1": row[10],
        "rgb_color2": row[11],
        "rgb_color3": row[12],
        "created_at": row[13],
    }})


def strip_prefix(path: str) -> str:
    """Remove function-id prefix: /d4eXXX/actual/path -> /actual/path"""
    parts = path.split("/")
    if len(parts) > 2:
        return "/" + "/".join(parts[2:])
    return "/"


def handler(event: dict, context) -> dict:
    """Auth API: регистрация, вход, профиль"""
    method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    raw_path = event.get("path") or event.get("rawPath", "/")
    path = strip_prefix(raw_path)
    headers = event.get("headers") or {}

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    conn, cur = get_db()

    if method == "POST" and re.fullmatch(r"/register", path):
        return handle_register(conn, cur, event)

    if method == "POST" and re.fullmatch(r"/login", path):
        return handle_login(conn, cur, event)

    if method == "POST" and re.fullmatch(r"/logout", path):
        return handle_logout(conn, cur, headers)

    if method == "GET" and re.fullmatch(r"/me", path):
        return handle_me(headers, cur)

    if method == "PUT" and re.fullmatch(r"/profile", path):
        return handle_update_profile(conn, cur, event, headers)

    return respond(404, {"error": "Not found"})