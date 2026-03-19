"""
Авторизация VibeChat: регистрация, вход, проверка токена.
GET ?action=me — проверить токен
POST ?action=register — регистрация
POST ?action=login — вход
"""
import json
import os
import hashlib
import secrets
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    # POST ?action=register
    if method == "POST" and action == "register":
        nick = (body.get("nick") or "").strip()
        name = (body.get("name") or "").strip()
        password = body.get("password") or ""
        phone = (body.get("phone") or "").strip().replace(" ", "").replace("-", "") or None

        if not nick or not name or not password:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Заполни все поля"})}

        try:
            ph = hash_password(password)
            cur.execute(
                "INSERT INTO vc_users (nick, name, phone, password_hash) VALUES (%s, %s, %s, %s) RETURNING id",
                (nick, name, phone, ph)
            )
            user_id = cur.fetchone()[0]
            token = f"{user_id}:{secrets.token_hex(16)}"
            conn.commit()
            conn.close()
            return {
                "statusCode": 200, "headers": HEADERS,
                "body": json.dumps({"ok": True, "token": token, "user": {"id": user_id, "nick": nick, "name": name}})
            }
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            conn.close()
            return {"statusCode": 409, "headers": HEADERS, "body": json.dumps({"error": "Ник или телефон уже занят"})}

    # POST ?action=login
    if method == "POST" and action == "login":
        nick = (body.get("nick") or "").strip()
        password = body.get("password") or ""
        cur.execute("SELECT id, nick, name FROM vc_users WHERE nick = %s AND password_hash = %s", (nick, hash_password(password)))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверный ник или пароль"})}
        user_id, nick_out, name = row
        token = f"{user_id}:{secrets.token_hex(16)}"
        return {
            "statusCode": 200, "headers": HEADERS,
            "body": json.dumps({"ok": True, "token": token, "user": {"id": user_id, "nick": nick_out, "name": name}})
        }

    # GET ?action=me
    if method == "GET" and action == "me":
        token = (event.get("headers") or {}).get("X-Session-Token") or ""
        if not token or ":" not in token:
            conn.close()
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}
        user_id = token.split(":")[0]
        cur.execute("SELECT id, nick, name FROM vc_users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Пользователь не найден"})}
        return {
            "statusCode": 200, "headers": HEADERS,
            "body": json.dumps({"ok": True, "user": {"id": row[0], "nick": row[1], "name": row[2]}})
        }

    conn.close()
    return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}
