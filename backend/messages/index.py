"""
Сообщения VibeChat: отправка и загрузка переписки.
GET ?action=bot — история с ботом
POST ?action=bot — отправить боту
GET ?action=chat&with_user_id=N — история с пользователем
POST ?action=chat — отправить сообщение пользователю
GET ?action=chats — список всех чатов текущего пользователя
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

VESELUSHKA_REPLIES = {
    "привет": "Привет-привет! 👋 Какие дела?",
    "как дела": "Отлично! Я бот, у меня всегда хорошее настроение 😄 А у тебя как?",
    "ты кто": "Я бот Веселушка! 🤖 Помогаю сделать общение ярче и веселее!",
    "что умеешь": "Я умею общаться, поднимать настроение и быть рядом 🎉",
    "анекдот": "Почему программисты путают Halloween и Christmas? Потому что Oct 31 == Dec 25! 😂",
    "как тебя зовут": "Меня зовут Веселушка! Твой верный бот-друг 🌟",
    "пока": "Пока-пока! Буду скучать! 👋😊",
    "хорошо": "Вот и отлично! 🌈 Хорошее настроение — это главное!",
    "плохо": "Не грусти! Я рядом 🫂 Напиши анекдот — подниму настроение!",
}

def bot_reply(text: str) -> str:
    lower = text.lower().strip()
    for key, val in VESELUSHKA_REPLIES.items():
        if key in lower:
            return val
    return "Интересно! 😊 Напиши «анекдот» — расскажу смешное!"

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

def fmt_time(ts) -> str:
    return ts.strftime("%H:%M") if ts else ""

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = (event.get("headers") or {}).get("X-Session-Token") or ""

    conn = get_conn()
    cur = conn.cursor()
    user_id = get_user_id(token, cur)

    if not user_id:
        conn.close()
        return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}

    # GET ?action=bot — история с ботом
    if method == "GET" and action == "bot":
        cur.execute(
            "SELECT id, text, from_bot, created_at FROM vc_bot_messages WHERE user_id = %s ORDER BY created_at ASC LIMIT 200",
            (user_id,)
        )
        rows = cur.fetchall()
        conn.close()
        msgs = [{"id": r[0], "text": r[1], "from": "bot" if r[2] else "me", "time": fmt_time(r[3])} for r in rows]
        if not msgs:
            msgs = [{"id": 0, "text": "Привет! Я бот Веселушка 🎉 Напиши мне «привет» или «ты кто»!", "from": "bot", "time": ""}]
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"messages": msgs})}

    # POST ?action=bot — отправить боту
    if method == "POST" and action == "bot":
        text = (body.get("text") or "").strip()
        if not text:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Пустое сообщение"})}

        cur.execute("INSERT INTO vc_bot_messages (user_id, text, from_bot) VALUES (%s, %s, FALSE) RETURNING id, created_at", (user_id, text))
        user_msg_id, user_ts = cur.fetchone()
        reply_text = bot_reply(text)
        cur.execute("INSERT INTO vc_bot_messages (user_id, text, from_bot) VALUES (%s, %s, TRUE) RETURNING id, created_at", (user_id, reply_text))
        bot_msg_id, bot_ts = cur.fetchone()
        conn.commit()
        conn.close()
        return {
            "statusCode": 200, "headers": HEADERS,
            "body": json.dumps({
                "userMsg": {"id": user_msg_id, "text": text, "from": "me", "time": fmt_time(user_ts)},
                "botMsg": {"id": bot_msg_id, "text": reply_text, "from": "bot", "time": fmt_time(bot_ts)},
            })
        }

    # GET ?action=chat&with_user_id=N
    if method == "GET" and action == "chat":
        with_id = params.get("with_user_id")
        if not with_id:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "with_user_id required"})}

        u1, u2 = min(user_id, int(with_id)), max(user_id, int(with_id))
        cur.execute("SELECT id FROM vc_chats WHERE user1_id = %s AND user2_id = %s", (u1, u2))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"messages": []})}

        chat_id = row[0]
        cur.execute(
            "SELECT m.id, m.text, m.sender_id, m.created_at FROM vc_messages m WHERE m.chat_id = %s ORDER BY m.created_at ASC LIMIT 200",
            (chat_id,)
        )
        rows = cur.fetchall()
        conn.close()
        msgs = [{"id": r[0], "text": r[1], "from": "me" if r[2] == user_id else "other", "time": fmt_time(r[3])} for r in rows]
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"messages": msgs})}

    # POST ?action=chat — отправить сообщение
    if method == "POST" and action == "chat":
        with_id = int(body.get("with_user_id") or 0)
        text = (body.get("text") or "").strip()
        if not with_id or not text:
            conn.close()
            return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Нужен with_user_id и text"})}

        u1, u2 = min(user_id, with_id), max(user_id, with_id)
        cur.execute("SELECT id FROM vc_chats WHERE user1_id = %s AND user2_id = %s", (u1, u2))
        row = cur.fetchone()
        if row:
            chat_id = row[0]
        else:
            cur.execute("INSERT INTO vc_chats (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (u1, u2))
            chat_id = cur.fetchone()[0]

        cur.execute("INSERT INTO vc_messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at", (chat_id, user_id, text))
        msg_id, ts = cur.fetchone()
        conn.commit()
        conn.close()
        return {
            "statusCode": 200, "headers": HEADERS,
            "body": json.dumps({"message": {"id": msg_id, "text": text, "from": "me", "time": fmt_time(ts)}})
        }

    # GET ?action=chats — список чатов
    if method == "GET" and action == "chats":
        cur.execute("""
            SELECT
                c.id,
                CASE WHEN c.user1_id = %s THEN c.user2_id ELSE c.user1_id END as partner_id,
                u.nick, u.name,
                (SELECT text FROM vc_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_msg,
                (SELECT created_at FROM vc_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_time
            FROM vc_chats c
            JOIN vc_users u ON u.id = CASE WHEN c.user1_id = %s THEN c.user2_id ELSE c.user1_id END
            WHERE c.user1_id = %s OR c.user2_id = %s
            ORDER BY last_time DESC NULLS LAST
        """, (user_id, user_id, user_id, user_id))
        rows = cur.fetchall()
        conn.close()
        chats = [{
            "chat_id": r[0],
            "partner_id": r[1],
            "nick": r[2],
            "name": r[3],
            "last_msg": r[4] or "",
            "last_time": fmt_time(r[5]) if r[5] else "",
        } for r in rows]
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"chats": chats})}

    conn.close()
    return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}
