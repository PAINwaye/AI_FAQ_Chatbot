from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from chatbot.llm import generate_response
from chatbot.prompts import get_system_prompt

from auth.auth import (
    signup_user,
    login_user,
    google_login
)

from database.history import (
    create_chat,
    save_message,
    load_chats,
    load_messages,
    delete_chat,
    update_chat_title
)

app = FastAPI()

# ---------------- CORS ---------------- #

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MODELS ---------------- #

class ChatRequest(BaseModel):
    message: str


class AuthRequest(BaseModel):
    email: str
    password: str


# ---------------- ROOT ---------------- #

@app.get("/")

async def root():

    return {
        "message": "AI FAQ Backend Running"
    }


# ---------------- CHAT ---------------- #

@app.post("/chat")

async def chat(request: ChatRequest):

    system_prompt = get_system_prompt()

    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": request.message
        }
    ]

    response = generate_response(messages)

    return {
        "response": response
    }


# ---------------- SIGNUP ---------------- #

@app.post("/signup")

async def signup(request: AuthRequest):

    response = signup_user(
        request.email,
        request.password
    )

    return {
        "user": str(response.user.id)
    }


# ---------------- LOGIN ---------------- #

@app.post("/login")

async def login(request: AuthRequest):

    response = login_user(
        request.email,
        request.password
    )

    return {
        "user": str(response.user.id),
        "email": response.user.email
    }


# ---------------- GOOGLE LOGIN ---------------- #

@app.get("/google-login")

async def google_auth():

    url = google_login()

    return {
        "url": url
    }


# ---------------- CREATE CHAT ---------------- #

@app.post("/create-chat")

async def create_new_chat(data: dict):

    chat = create_chat(
        data["user_id"],
        data["title"]
    )

    return chat


# ---------------- SAVE MESSAGE ---------------- #

@app.post("/save-message")

async def save_chat_message(data: dict):

    message = save_message(
        data["session_id"],
        data["role"],
        data["content"]
    )

    return message


# ---------------- LOAD CHATS ---------------- #

@app.get("/load-chats/{user_id}")

async def get_chats(user_id: str):

    chats = load_chats(user_id)

    return chats


# ---------------- LOAD MESSAGES ---------------- #

@app.get("/load-messages/{session_id}")

async def get_messages(session_id: str):

    messages = load_messages(session_id)

    return messages


# ---------------- DELETE CHAT ---------------- #

@app.delete("/delete-chat/{session_id}")

async def remove_chat(session_id: str):

    result = delete_chat(session_id)

    return result

# ---------------- UPDATE CHAT TITLE ---------------- #

@app.put("/update-chat-title")

async def update_chat_title(data: dict):

    from database.history import update_chat_title

    result = update_chat_title(
        data["session_id"],
        data["title"]
    )

    return result