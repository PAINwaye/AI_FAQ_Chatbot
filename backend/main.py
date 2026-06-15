
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from typing import List

from typing import Annotated

from fastapi.responses import FileResponse

from faq.pdf_generator import (
    generate_pdf
)

from knowledge_base.retriever import (
    retrieve_context
)


from chatbot.llm import generate_response

from chatbot.prompts import get_system_prompt

from knowledge_base.document_loader import (
    extract_document_text
)

from knowledge_base.chunker import (
    create_chunks
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
    update_chat_title,
    update_active_document,
    get_active_document,
    update_session_documents,
    get_session_documents
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

    session_id: str


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

    # Get current active document
    active_document = get_active_document(
        request.session_id
    )
    print(
        "ACTIVE DOCUMENT:",
        active_document
    )
    
    message = request.message.lower()

    faq_query = any(
        keyword in message
        for keyword in [
            "faq",
            "faqs",
            "generate faq",
            "generate faqs"
        ]
    )

    summary_query = any(
        keyword in message
        for keyword in [
            "summary",
            "summaries",
            "summarize",
            "summarise",
            "summarized",
            "summarised"
        ]
    )

    all_documents_query = any(
        phrase in message
        for phrase in [
            "all documents",
            "all the documents",
            "every document",
            "all files",
            "all the files",
            "all pdfs"
        ]
    )
    comparison_query = (
        "compare" in message
    )
    
    print("\n====== QUERY TYPE ======")
    print("FAQ:", faq_query)
    print("SUMMARY:", summary_query)
    print("ALL DOCS:", all_documents_query)
    print("COMPARE:", comparison_query)
    print(
        "MESSAGE:",
        request.message
    )
    print("========================\n")

    # Get all documents in this session
    documents = get_session_documents(
        request.session_id
    )
    print(
        "DOCUMENTS:",
        documents
    )

    # Detect documents explicitly mentioned in user query
    selected_documents = []

    for doc in documents:

        if doc.lower() in request.message.lower():

            selected_documents.append(
                doc
            )

    # If exactly one document is mentioned,
    # make it the new active document
    if len(selected_documents) == 1:

        update_active_document(
            request.session_id,
            selected_documents[0]
        )

        active_document = selected_documents[0]

    # Retrieve context
    # ---------------- RETRIEVAL ROUTING ---------------- #

    kb_data = {
        "context": "",
        "sources": []
    }

    # Case 1 : Generate FAQ/Summary for ALL documents
    if all_documents_query:

        kb_data = retrieve_context(
            request.message,
            request.session_id,
            all_documents=True
        )

    # Case 2 : Compare or explicitly mention documents
    elif len(selected_documents) > 0:

        kb_data = retrieve_context(
            request.message,
            request.session_id,
            selected_documents=selected_documents
        )

    # Case 3 : Active document operations
    elif faq_query or summary_query:

        kb_data = retrieve_context(
            request.message,
            request.session_id,
            active_document=active_document
        )
        
        print("\n===== AFTER RETRIEVAL =====")
        print("KB Sources:", kb_data["sources"])
        print("Context length:", len(kb_data["context"]))
        print("===========================\n")

    # Case 4 : General question
    else:

        kb_data = {

            "context": "",

            "sources": []

        }

    context = kb_data["context"]

    system_prompt = get_system_prompt()

    if context:

        system_prompt += f"""

Use the following document context when answering.

Document Context:

{context}

Rules:

- Answer strictly using the document context.
- If the answer is unavailable, say so.
- Generate FAQs, summaries, comparisons and explanations based on the document.
"""

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

    response = generate_response(
        messages
    )

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

        "is_faq": is_faq,

        "sources": kb_data["sources"]

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
    files: Annotated[List[UploadFile], File()],
    session_id: str = Form(...)
):

    if len(files) > 10:

        return {
            "error":
            "Maximum 10 documents allowed."
        }
        
    uploaded_files = []

    total_chunks = 0
    existing_documents = get_session_documents(
    session_id
    )
    print("\n========== BEFORE ==========")
    print(existing_documents)
    print("============================")

    for file in files:

        filename = file.filename.lower()
        uploaded_files.append(
        file.filename
       )
        
        if file.filename not in existing_documents:

          existing_documents.append(
           file.filename
         )
          
          print("Appending:", file.filename)
          print("Current list:", existing_documents)

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
        from knowledge_base.vector_store import (
            add_to_vector_store
        )

        add_to_vector_store(
            chunks,
            file.filename,
            session_id
        )

        total_chunks += len(chunks)
        
    print("\n========== SAVING ==========")
    print(existing_documents)
    print("============================")    
    
    update_session_documents(
    session_id,
    existing_documents
    )

    update_active_document(
    session_id,
    uploaded_files[-1]
    )

    # ---------------- RESPONSE MESSAGE ---------------- #

    if len(uploaded_files) == 1:

        response_message = f"""
    {uploaded_files[0]} uploaded successfully.

    You can now:

    • Generate FAQs from the document.

    • Summarize the document.

    • Ask questions about the document.

    • Tell me what you'd like to do with the document.
    """

    else:

        document_list = "\n".join(
            [
                f"• {doc}"
                for doc in uploaded_files
            ]
        )

        response_message = f"""
    Documents uploaded successfully.

    Available documents

    {document_list}

    You can:

    • Generate FAQ for all documents.

    • Summarize all documents.

    • Generate FAQ for a specific document by mentioning its name.

    • Summarize a specific document by mentioning its name.

    • Ask questions about any document by mentioning its name.

    • Compare documents.

    • Tell me what you'd like to do.
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