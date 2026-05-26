from database.db import supabase


# CREATE CHAT SESSION
def create_chat(user_id, title):

    response = supabase.table(
        "chat_sessions"
    ).insert({
        "user_id": user_id,
        "title": title
    }).execute()

    return response.data[0]


# SAVE MESSAGE
def save_message(
    session_id,
    role,
    content
):

    response = supabase.table(
        "messages"
    ).insert({
        "session_id": session_id,
        "role": role,
        "content": content
    }).execute()

    return response.data[0]


# LOAD CHATS
def load_chats(user_id):

    response = supabase.table(
        "chat_sessions"
    ).select("*") \
    .eq("user_id", user_id) \
    .order("created_at", desc=True) \
    .execute()

    return response.data


# LOAD MESSAGES
def load_messages(session_id):

    response = supabase.table(
        "messages"
    ).select("*") \
    .eq("session_id", session_id) \
    .order("created_at") \
    .execute()

    return response.data


# DELETE CHAT
def delete_chat(session_id):

    supabase.table(
        "messages"
    ).delete() \
    .eq("session_id", session_id) \
    .execute()

    supabase.table(
        "chat_sessions"
    ).delete() \
    .eq("id", session_id) \
    .execute()

    return {
        "success": True
    }
    
    # UPDATE CHAT TITLE
def update_chat_title(session_id, title):

    response = supabase.table(
        "chat_sessions"
    ).update({
        "title": title
    }).eq(
        "id", session_id
    ).execute()

    return response.data