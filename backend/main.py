from fastapi import (
    FastAPI,
    UploadFile,
    File
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from typing import Annotated
from fastapi.responses import FileResponse
from faq.pdf_generator import (
    generate_pdf
)


from chatbot.llm import generate_response
from chatbot.prompts import get_system_prompt
from knowledge_base.document_loader import (
    extract_document_text
)

from knowledge_base.chunker import (
    create_chunks
)

from knowledge_base.vector_store import (
    add_to_vector_store
)

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
    
class PDFRequest(BaseModel):
    faq_content: str


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

    faq_keywords = [
        "faq",
        "faqs",
        "generate faq",
        "generate faqs"
    ]
    is_faq = any(
        keyword in request.message.lower()
        for keyword in faq_keywords
    )
    return {
        "response": response,
         "is_faq": is_faq
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

# ---------------- UPLOAD DOCUMENTS ---------------- #

@app.post("/upload-documents")

async def upload_documents(
    files: Annotated[List[UploadFile], File()]
):

    if len(files) > 10:

        return {
            "error":
            "Maximum 10 documents allowed."
        }
        
    uploaded_files = []

    total_chunks = 0

    for file in files:

        filename = file.filename.lower()
        uploaded_files.append(
        file.filename
       )

        if not filename.endswith(
            (
                ".pdf",
                ".docx",
                ".txt"
            )
        ):

            return {
                "error":
                f"{file.filename} is not supported."
            }

        file_path = f"uploads/{file.filename}"

        contents = await file.read()

        with open(
                file_path,
                "wb"
        ) as f:

            f.write(contents)

        text = extract_document_text(
            file_path
        )

        chunks = create_chunks(
            text
        )

        add_to_vector_store(
            chunks,
            file.filename
        )

        total_chunks += len(chunks)

    document_names = ", ".join(
        uploaded_files
    )
    response_message = f"""
    {document_names} uploaded successfully and added to the shared knowledge base.
    
    You can now:
    
    • Generate FAQs from the documents.
    • Generate FAQs from a specific section.
    • Ask questions about the documents.
    • Summarize the content.
    • Compare multiple documents.

    Or simply tell me what you'd like me to do.
"""

    return {
        "message": response_message,
        "documents_processed": len(files),
        "chunks_added": total_chunks
    }
    

# ---------------- DOWNLOAD FAQ PDF ---------------- #

@app.post("/download-faq-pdf")

async def download_faq_pdf(
        request: PDFRequest
):

    pdf_path = generate_pdf(
        request.faq_content
    )

    return FileResponse(
        path=pdf_path,
        filename="faq_output.pdf",
        media_type="application/pdf"
    )