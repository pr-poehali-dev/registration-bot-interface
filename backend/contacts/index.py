"""
Контакты VibeChat: поиск пользователя по номеру телефона.
GET ?action=search&phone=79991234567 — найти по номеру
GET ?action=list — все пользователи (кроме себя)
"""
import json
import os
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_id(token: str, cur) -> int | None:
    if not token or ":" not in token:
        return None
    uid = token.split(":")[0]
    if not uid.isdigit():
        return None
    cur.execute("SELECT id FROM vc_users WHERE id = %s", (int(uid),))
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "list")
    token = (event.get("headers") or {}).get("X-Session-Token") or ""

    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(token, cur)

    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}

    # GET ?action=search&phone=... — поиск по телефону
    if method == "GET" and action == "search":
        phone = (params.get("phone") or "").strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not phone:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Укажи номер телефона"})}

        cur.execute("SELECT id, nick, name FROM vc_users WHERE phone = %s AND id != %s", (phone, user_id))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Пользователь не найден. Попроси его зарегистрироваться в VibeChat с этим номером."})}
        return {
            "statusCode": 200, "headers": HEADERS,
            "body": json.dumps({"user": {"id": row[0], "nick": row[1], "name": row[2]}})
        }

    # GET ?action=list — все пользователи
    if method == "GET" and action == "list":
        cur.execute("SELECT id, nick, name FROM vc_users WHERE id != %s ORDER BY name", (user_id,))
        rows = cur.fetchall()
        conn.close()
        users = [{"id": r[0], "nick": r[1], "name": r[2]} for r in rows]
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"users": users})}

    conn.close()
    return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}
