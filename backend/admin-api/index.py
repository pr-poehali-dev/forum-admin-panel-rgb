import json
import os
import re
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


def get_admin_user(headers, cur):
    session_id = headers.get("X-Session-Id") or headers.get("x-session-id")
    if not session_id:
        return None
    safe_sid = session_id.replace("'", "''")
    cur.execute(
        f"SELECT u.id, u.username, u.email, u.role "
        f"FROM sessions s JOIN users u ON s.user_id = u.id "
        f"WHERE s.id = '{safe_sid}' AND (s.expires_at IS NULL OR s.expires_at > NOW())"
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "email": row[2], "role": row[3]}


def require_admin(headers, cur):
    user = get_admin_user(headers, cur)
    if not user:
        return None, respond(401, {"error": "Unauthorized"})
    if user["role"] not in ("admin", "owner"):
        return None, respond(403, {"error": "Forbidden: admin or owner role required"})
    return user, None


def handle_get_users(cur, event):
    qs = event.get("queryStringParameters") or {}
    page = int(qs.get("page", 1))
    per_page = int(qs.get("per_page", 20))
    offset = (page - 1) * per_page

    cur.execute("SELECT COUNT(*) FROM users")
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT id, username, email, role, is_banned, is_muted, post_count, created_at "
        f"FROM users ORDER BY created_at DESC "
        f"LIMIT {per_page} OFFSET {offset}"
    )
    rows = cur.fetchall()
    users = []
    for row in rows:
        users.append({
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "role": row[3],
            "is_banned": row[4],
            "is_muted": row[5],
            "post_count": row[6],
            "created_at": row[7],
        })
    return respond(200, {"users": users, "total": total, "page": page, "per_page": per_page})


def handle_ban_user(conn, cur, user_id, event):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    reason = str(body.get("reason", "")).strip().replace("'", "''")
    permanent = bool(body.get("permanent", False))
    expires_at = body.get("expires_at")
    safe_uid = int(user_id)

    cur.execute(f"SELECT id, role FROM users WHERE id = {safe_uid}")
    target = cur.fetchone()
    if not target:
        return respond(404, {"error": "User not found"})
    if target[1] in ("admin", "owner"):
        return respond(403, {"error": "Cannot ban admin or owner"})

    cur.execute(f"UPDATE users SET is_banned = TRUE WHERE id = {safe_uid}")

    if permanent or not expires_at:
        cur.execute(
            f"INSERT INTO bans (user_id, reason, is_permanent, created_at) "
            f"VALUES ({safe_uid}, '{reason}', TRUE, NOW())"
        )
    else:
        safe_expires = str(expires_at).replace("'", "''")
        cur.execute(
            f"INSERT INTO bans (user_id, reason, is_permanent, expires_at, created_at) "
            f"VALUES ({safe_uid}, '{reason}', FALSE, '{safe_expires}', NOW())"
        )

    conn.commit()
    return respond(200, {"message": "User banned"})


def handle_unban_user(conn, cur, user_id):
    safe_uid = int(user_id)
    cur.execute(f"UPDATE users SET is_banned = FALSE WHERE id = {safe_uid}")
    conn.commit()
    return respond(200, {"message": "User unbanned"})


def handle_mute_user(conn, cur, user_id, event):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    reason = str(body.get("reason", "")).strip().replace("'", "''")
    expires_at = body.get("expires_at")
    safe_uid = int(user_id)

    cur.execute(f"SELECT id FROM users WHERE id = {safe_uid}")
    if not cur.fetchone():
        return respond(404, {"error": "User not found"})

    cur.execute(f"UPDATE users SET is_muted = TRUE WHERE id = {safe_uid}")

    if expires_at:
        safe_expires = str(expires_at).replace("'", "''")
        cur.execute(
            f"INSERT INTO mutes (user_id, reason, expires_at, created_at) "
            f"VALUES ({safe_uid}, '{reason}', '{safe_expires}', NOW())"
        )
    else:
        cur.execute(
            f"INSERT INTO mutes (user_id, reason, created_at) "
            f"VALUES ({safe_uid}, '{reason}', NOW())"
        )

    conn.commit()
    return respond(200, {"message": "User muted"})


def handle_unmute_user(conn, cur, user_id):
    safe_uid = int(user_id)
    cur.execute(f"UPDATE users SET is_muted = FALSE WHERE id = {safe_uid}")
    conn.commit()
    return respond(200, {"message": "User unmuted"})


def handle_warn_user(conn, cur, user_id, event):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    reason = str(body.get("reason", "")).strip().replace("'", "''")
    if not reason:
        return respond(400, {"error": "reason is required"})

    safe_uid = int(user_id)

    cur.execute(f"SELECT id FROM users WHERE id = {safe_uid}")
    if not cur.fetchone():
        return respond(404, {"error": "User not found"})

    cur.execute(
        f"INSERT INTO warnings (user_id, reason, created_at) "
        f"VALUES ({safe_uid}, '{reason}', NOW()) RETURNING id, created_at"
    )
    row = cur.fetchone()
    conn.commit()
    return respond(201, {"warning": {"id": row[0], "user_id": safe_uid, "reason": reason, "created_at": row[1]}})


def handle_update_role(conn, cur, user_id, event, admin_user):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    new_role = str(body.get("role", "")).strip()
    allowed_roles = ("member", "moderator", "admin", "owner")
    if new_role not in allowed_roles:
        return respond(400, {"error": f"Role must be one of: {', '.join(allowed_roles)}"})

    safe_uid = int(user_id)

    if new_role == "owner" and admin_user["role"] != "owner":
        return respond(403, {"error": "Only owner can assign owner role"})

    cur.execute(f"SELECT id FROM users WHERE id = {safe_uid}")
    if not cur.fetchone():
        return respond(404, {"error": "User not found"})

    cur.execute(f"UPDATE users SET role = '{new_role}' WHERE id = {safe_uid}")
    conn.commit()
    return respond(200, {"message": f"Role updated to {new_role}"})


def handle_get_bans(cur, event):
    qs = event.get("queryStringParameters") or {}
    page = int(qs.get("page", 1))
    per_page = int(qs.get("per_page", 20))
    offset = (page - 1) * per_page

    cur.execute("SELECT COUNT(*) FROM bans")
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT b.id, b.user_id, u.username, b.reason, b.is_permanent, b.expires_at, b.created_at "
        f"FROM bans b LEFT JOIN users u ON b.user_id = u.id "
        f"ORDER BY b.created_at DESC "
        f"LIMIT {per_page} OFFSET {offset}"
    )
    rows = cur.fetchall()
    bans = []
    for row in rows:
        bans.append({
            "id": row[0],
            "user_id": row[1],
            "username": row[2],
            "reason": row[3],
            "is_permanent": row[4],
            "expires_at": row[5],
            "created_at": row[6],
        })
    return respond(200, {"bans": bans, "total": total, "page": page, "per_page": per_page})


def handle_get_warnings(cur, event):
    qs = event.get("queryStringParameters") or {}
    page = int(qs.get("page", 1))
    per_page = int(qs.get("per_page", 20))
    offset = (page - 1) * per_page

    cur.execute("SELECT COUNT(*) FROM warnings")
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT w.id, w.user_id, u.username, w.reason, w.created_at "
        f"FROM warnings w JOIN users u ON w.user_id = u.id "
        f"ORDER BY w.created_at DESC "
        f"LIMIT {per_page} OFFSET {offset}"
    )
    rows = cur.fetchall()
    warnings = []
    for row in rows:
        warnings.append({
            "id": row[0],
            "user_id": row[1],
            "username": row[2],
            "reason": row[3],
            "created_at": row[4],
        })
    return respond(200, {"warnings": warnings, "total": total, "page": page, "per_page": per_page})


def handle_update_settings(conn, cur, event):
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    if not body:
        return respond(400, {"error": "No settings provided"})

    for key, value in body.items():
        safe_key = str(key).replace("'", "''")
        safe_val = str(value).replace("'", "''")
        cur.execute(
            f"INSERT INTO forum_settings (key, value) VALUES ('{safe_key}', '{safe_val}') "
            f"ON CONFLICT (key) DO UPDATE SET value = '{safe_val}'"
        )

    conn.commit()
    return respond(200, {"message": "Settings updated"})


def handle_pin_topic(conn, cur, topic_id):
    safe_tid = int(topic_id)
    cur.execute(f"SELECT id, is_pinned FROM topics WHERE id = {safe_tid}")
    row = cur.fetchone()
    if not row:
        return respond(404, {"error": "Topic not found"})
    new_state = not row[1]
    cur.execute(f"UPDATE topics SET is_pinned = {new_state} WHERE id = {safe_tid}")
    conn.commit()
    action = "pinned" if new_state else "unpinned"
    return respond(200, {"message": f"Topic {action}", "is_pinned": new_state})


def handle_lock_topic(conn, cur, topic_id):
    safe_tid = int(topic_id)
    cur.execute(f"SELECT id, is_locked FROM topics WHERE id = {safe_tid}")
    row = cur.fetchone()
    if not row:
        return respond(404, {"error": "Topic not found"})
    new_state = not row[1]
    cur.execute(f"UPDATE topics SET is_locked = {new_state} WHERE id = {safe_tid}")
    conn.commit()
    action = "locked" if new_state else "unlocked"
    return respond(200, {"message": f"Topic {action}", "is_locked": new_state})


def strip_prefix(path: str) -> str:
    """Remove function-id prefix: /d4eXXX/actual/path -> /actual/path"""
    parts = path.split("/")
    if len(parts) > 2:
        return "/" + "/".join(parts[2:])
    return "/"


def handler(event: dict, context) -> dict:
    """Admin API: управление пользователями, модерация"""
    method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    raw_path = event.get("path") or event.get("rawPath", "/")
    path = strip_prefix(raw_path)
    headers = event.get("headers") or {}

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    conn, cur = get_db()

    admin_user, err = require_admin(headers, cur)
    if err:
        return err

    # GET /users
    if method == "GET" and re.fullmatch(r"/users", path):
        return handle_get_users(cur, event)

    # POST /users/{id}/ban
    m = re.fullmatch(r"/users/(\d+)/ban", path)
    if m and method == "POST":
        return handle_ban_user(conn, cur, m.group(1), event)

    # POST /users/{id}/unban
    m = re.fullmatch(r"/users/(\d+)/unban", path)
    if m and method == "POST":
        return handle_unban_user(conn, cur, m.group(1))

    # POST /users/{id}/mute
    m = re.fullmatch(r"/users/(\d+)/mute", path)
    if m and method == "POST":
        return handle_mute_user(conn, cur, m.group(1), event)

    # POST /users/{id}/unmute
    m = re.fullmatch(r"/users/(\d+)/unmute", path)
    if m and method == "POST":
        return handle_unmute_user(conn, cur, m.group(1))

    # POST /users/{id}/warn
    m = re.fullmatch(r"/users/(\d+)/warn", path)
    if m and method == "POST":
        return handle_warn_user(conn, cur, m.group(1), event)

    # PUT /users/{id}/role
    m = re.fullmatch(r"/users/(\d+)/role", path)
    if m and method == "PUT":
        return handle_update_role(conn, cur, m.group(1), event, admin_user)

    # GET /moderation/bans
    if method == "GET" and re.fullmatch(r"/moderation/bans", path):
        return handle_get_bans(cur, event)

    # GET /moderation/warnings
    if method == "GET" and re.fullmatch(r"/moderation/warnings", path):
        return handle_get_warnings(cur, event)

    # PUT /settings
    if method == "PUT" and re.fullmatch(r"/settings", path):
        return handle_update_settings(conn, cur, event)

    # POST /topics/{id}/pin
    m = re.fullmatch(r"/topics/(\d+)/pin", path)
    if m and method == "POST":
        return handle_pin_topic(conn, cur, m.group(1))

    # POST /topics/{id}/lock
    m = re.fullmatch(r"/topics/(\d+)/lock", path)
    if m and method == "POST":
        return handle_lock_topic(conn, cur, m.group(1))

    return respond(404, {"error": "Not found"})