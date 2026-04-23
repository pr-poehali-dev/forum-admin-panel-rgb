import json
import os
import re
import psycopg2
from datetime import datetime


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


def get_current_user(headers, cur):
    session_id = headers.get("X-Session-Id") or headers.get("x-session-id")
    if not session_id:
        return None
    safe_sid = session_id.replace("'", "''")
    cur.execute(
        f"SELECT u.id, u.username, u.email, u.role, u.is_banned, u.is_muted, u.bio, u.title, u.post_count, u.rgb_profile, u.rgb_color1, u.rgb_color2, u.rgb_color3, u.created_at "
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


def handle_get_categories(cur):
    cur.execute(
        "SELECT id, name, description, sort_order, topic_count, post_count, icon, created_at, color, is_visible "
        "FROM categories WHERE is_visible = TRUE ORDER BY sort_order ASC, id ASC"
    )
    rows = cur.fetchall()
    categories = []
    for row in rows:
        categories.append({
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "sort_order": row[3],
            "topic_count": row[4],
            "post_count": row[5],
            "icon": row[6],
            "created_at": row[7],
            "color": row[8],
            "is_visible": row[9],
        })
    return respond(200, {"categories": categories})


def handle_get_category_topics(cur, category_id, event):
    qs = event.get("queryStringParameters") or {}
    page = int(qs.get("page", 1))
    per_page = int(qs.get("per_page", 20))
    offset = (page - 1) * per_page

    safe_cid = int(category_id)

    cur.execute(
        f"SELECT COUNT(*) FROM topics WHERE category_id = {safe_cid}"
    )
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT t.id, t.title, t.category_id, t.author_id, u.username, t.is_pinned, t.is_locked, "
        f"t.views, t.reply_count, t.last_post_at, t.created_at, t.is_hot "
        f"FROM topics t LEFT JOIN users u ON t.author_id = u.id "
        f"WHERE t.category_id = {safe_cid} "
        f"ORDER BY t.is_pinned DESC, t.last_post_at DESC NULLS LAST "
        f"LIMIT {per_page} OFFSET {offset}"
    )
    rows = cur.fetchall()
    topics = []
    for row in rows:
        topics.append({
            "id": row[0],
            "title": row[1],
            "category_id": row[2],
            "author_id": row[3],
            "username": row[4],
            "is_pinned": row[5],
            "is_locked": row[6],
            "views": row[7],
            "reply_count": row[8],
            "last_post_at": row[9],
            "created_at": row[10],
            "is_hot": row[11],
        })
    return respond(200, {"topics": topics, "total": total, "page": page, "per_page": per_page})


def handle_get_topic(conn, cur, topic_id):
    safe_tid = int(topic_id)
    cur.execute(
        f"UPDATE topics SET views = views + 1 WHERE id = {safe_tid}"
    )
    conn.commit()
    cur.execute(
        f"SELECT t.id, t.title, t.category_id, t.author_id, u.username, t.is_pinned, t.is_locked, "
        f"t.views, t.reply_count, t.last_post_at, t.created_at, t.is_hot "
        f"FROM topics t LEFT JOIN users u ON t.author_id = u.id "
        f"WHERE t.id = {safe_tid}"
    )
    row = cur.fetchone()
    if not row:
        return respond(404, {"error": "Topic not found"})
    return respond(200, {"topic": {
        "id": row[0],
        "title": row[1],
        "category_id": row[2],
        "author_id": row[3],
        "username": row[4],
        "is_pinned": row[5],
        "is_locked": row[6],
        "views": row[7],
        "reply_count": row[8],
        "last_post_at": row[9],
        "created_at": row[10],
        "is_hot": row[11],
    }})


def handle_get_topic_posts(cur, topic_id, event):
    qs = event.get("queryStringParameters") or {}
    page = int(qs.get("page", 1))
    per_page = int(qs.get("per_page", 20))
    offset = (page - 1) * per_page
    safe_tid = int(topic_id)

    cur.execute(f"SELECT COUNT(*) FROM posts WHERE topic_id = {safe_tid}")
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT p.id, p.topic_id, p.author_id, u.username, u.title, u.role, u.post_count, "
        f"u.rgb_profile, u.rgb_color1, u.rgb_color2, u.rgb_color3, "
        f"p.content, p.created_at, p.edited_at, p.likes "
        f"FROM posts p LEFT JOIN users u ON p.author_id = u.id "
        f"WHERE p.topic_id = {safe_tid} AND p.removed = FALSE "
        f"ORDER BY p.created_at ASC "
        f"LIMIT {per_page} OFFSET {offset}"
    )
    rows = cur.fetchall()
    posts = []
    for row in rows:
        posts.append({
            "id": row[0],
            "topic_id": row[1],
            "author_id": row[2],
            "username": row[3],
            "user_title": row[4],
            "user_role": row[5],
            "user_post_count": row[6],
            "rgb_profile": row[7],
            "rgb_color1": row[8],
            "rgb_color2": row[9],
            "rgb_color3": row[10],
            "content": row[11],
            "created_at": row[12],
            "edited_at": row[13],
            "likes": row[14],
        })
    return respond(200, {"posts": posts, "total": total, "page": page, "per_page": per_page})


def handle_create_post(conn, cur, topic_id, event, headers):
    user = get_current_user(headers, cur)
    if not user:
        return respond(401, {"error": "Unauthorized"})
    if user["is_banned"]:
        return respond(403, {"error": "You are banned"})
    if user["is_muted"]:
        return respond(403, {"error": "You are muted"})

    safe_tid = int(topic_id)

    cur.execute(f"SELECT id, is_locked FROM topics WHERE id = {safe_tid}")
    topic_row = cur.fetchone()
    if not topic_row:
        return respond(404, {"error": "Topic not found"})
    if topic_row[1]:
        return respond(403, {"error": "Topic is locked"})

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    content = str(body.get("content", "")).strip()
    if not content:
        return respond(400, {"error": "Content is required"})

    safe_content = content.replace("'", "''")
    uid = user["id"]

    cur.execute(
        f"INSERT INTO posts (topic_id, author_id, content, created_at) "
        f"VALUES ({safe_tid}, {uid}, '{safe_content}', NOW()) RETURNING id, created_at"
    )
    row = cur.fetchone()
    post_id = row[0]
    created_at = row[1]

    cur.execute(f"UPDATE users SET post_count = post_count + 1 WHERE id = {uid}")
    cur.execute(
        f"UPDATE topics SET reply_count = reply_count + 1, last_post_at = NOW() WHERE id = {safe_tid}"
    )
    conn.commit()

    return respond(201, {"post": {
        "id": post_id,
        "topic_id": safe_tid,
        "author_id": uid,
        "username": user["username"],
        "content": content,
        "created_at": created_at,
    }})


def handle_create_topic(conn, cur, category_id, event, headers):
    user = get_current_user(headers, cur)
    if not user:
        return respond(401, {"error": "Unauthorized"})
    if user["is_banned"]:
        return respond(403, {"error": "You are banned"})
    if user["is_muted"]:
        return respond(403, {"error": "You are muted"})

    safe_cid = int(category_id)

    cur.execute(f"SELECT id FROM categories WHERE id = {safe_cid}")
    if not cur.fetchone():
        return respond(404, {"error": "Category not found"})

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    title = str(body.get("title", "")).strip()
    content = str(body.get("content", "")).strip()
    if not title:
        return respond(400, {"error": "Title is required"})
    if not content:
        return respond(400, {"error": "Content is required"})

    safe_title = title.replace("'", "''")
    safe_content = content.replace("'", "''")
    uid = user["id"]

    cur.execute(
        f"INSERT INTO topics (category_id, author_id, title, is_pinned, is_locked, is_hot, views, reply_count, created_at, last_post_at) "
        f"VALUES ({safe_cid}, {uid}, '{safe_title}', FALSE, FALSE, FALSE, 0, 0, NOW(), NOW()) RETURNING id, created_at"
    )
    row = cur.fetchone()
    topic_id = row[0]
    created_at = row[1]

    cur.execute(
        f"INSERT INTO posts (topic_id, author_id, content, created_at) "
        f"VALUES ({topic_id}, {uid}, '{safe_content}', NOW())"
    )
    cur.execute(f"UPDATE users SET post_count = post_count + 1 WHERE id = {uid}")
    cur.execute(f"UPDATE categories SET topic_count = topic_count + 1, post_count = post_count + 1 WHERE id = {safe_cid}")
    conn.commit()

    return respond(201, {"topic": {
        "id": topic_id,
        "category_id": safe_cid,
        "author_id": uid,
        "username": user["username"],
        "title": title,
        "is_pinned": False,
        "is_locked": False,
        "is_hot": False,
        "views": 0,
        "reply_count": 0,
        "created_at": created_at,
    }})


def handle_get_stats(cur):
    cur.execute("SELECT COUNT(*) FROM users")
    users_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM posts")
    posts_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM topics")
    topics_count = cur.fetchone()[0]

    cur.execute(
        "SELECT COUNT(*) FROM sessions WHERE expires_at > NOW() OR expires_at IS NULL"
    )
    online_count = cur.fetchone()[0]

    return respond(200, {
        "users": users_count,
        "posts": posts_count,
        "topics": topics_count,
        "online_count": online_count,
    })


def handle_get_settings(cur):
    cur.execute("SELECT key, value FROM forum_settings")
    rows = cur.fetchall()
    settings = {row[0]: row[1] for row in rows}
    return respond(200, settings)


def strip_prefix(path: str) -> str:
    """Remove function-id prefix: /d4eXXX/actual/path -> /actual/path"""
    parts = path.split("/")
    # parts[0] is empty string (before leading /), parts[1] is function id prefix
    if len(parts) > 2:
        return "/" + "/".join(parts[2:])
    return "/"


def handler(event: dict, context) -> dict:
    """API форума: категории, топики, посты"""
    method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    raw_path = event.get("path") or event.get("rawPath", "/")
    path = strip_prefix(raw_path)
    headers = event.get("headers") or {}

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    conn, cur = get_db()

    # GET /categories
    if method == "GET" and re.fullmatch(r"/categories", path):
        return handle_get_categories(cur)

    # GET /categories/{id}/topics
    m = re.fullmatch(r"/categories/(\d+)/topics", path)
    if m:
        if method == "GET":
            return handle_get_category_topics(cur, m.group(1), event)
        if method == "POST":
            return handle_create_topic(conn, cur, m.group(1), event, headers)

    # GET /topics/{id}
    m = re.fullmatch(r"/topics/(\d+)", path)
    if m:
        if method == "GET":
            return handle_get_topic(conn, cur, m.group(1))

    # GET/POST /topics/{id}/posts
    m = re.fullmatch(r"/topics/(\d+)/posts", path)
    if m:
        if method == "GET":
            return handle_get_topic_posts(cur, m.group(1), event)
        if method == "POST":
            return handle_create_post(conn, cur, m.group(1), event, headers)

    # GET /stats
    if method == "GET" and re.fullmatch(r"/stats", path):
        return handle_get_stats(cur)

    # GET /settings
    if method == "GET" and re.fullmatch(r"/settings", path):
        return handle_get_settings(cur)

    return respond(404, {"error": "Not found"})