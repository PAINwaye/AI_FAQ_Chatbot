# AI Globe – Knowledge-Based FAQ Generator

AI Globe is an intelligent Retrieval-Augmented Generation (RAG) system that enables users to interact with documents through natural language. Users can upload documents, generate FAQs, summarize content, compare multiple files, and ask context-aware questions using modern Large Language Models.

The system combines vector search, session-aware retrieval, and multiple AI models to provide accurate and reliable responses while maintaining document isolation across chat sessions.

---

# Features

### 📄 Document Upload

* Supports PDF, DOCX, and TXT files.
* Multiple document upload support.
* Session-specific document management.
* Active document tracking.

### ❓ Smart FAQ Generation

* Generate FAQs from a single document.
* Generate FAQs from multiple documents.
* Automatically separates FAQs by source document.

### 📝 Document Summarization

* Summarize individual documents.
* Generate summaries across all uploaded documents.
* Structured and easy-to-read responses.

### 🔍 Question Answering

* Ask natural language questions about uploaded documents.
* Source-aware responses using Retrieval-Augmented Generation (RAG).
* Context-driven answers based only on relevant information.

### ⚖️ Document Comparison

* Compare multiple documents.
* Highlight similarities and differences.
* Useful for contracts, reports, and knowledge analysis.

### 💬 General Chat

* Supports normal conversations outside the knowledge base.

### 🕒 Chat History

* Multiple chat sessions.
* Persistent conversation history.
* Chat renaming and deletion.

### 📑 PDF Export

* Download generated FAQs as PDF files.

### 🔄 Intelligent Model Fallback

Primary model:

* Gemini 2.5 Flash

Fallback model:

* Groq Llama 3.3 70B Versatile

If the primary model becomes unavailable or quota limits are reached, the system automatically switches to the fallback model.

---

# Technology Stack

## Frontend

* HTML
* CSS
* Tailwind CSS
* JavaScript

## Backend

* Python
* FastAPI

## Database

* Supabase

## Vector Database

* FAISS

## Embedding Model

* all-MiniLM-L6-v2

## Large Language Models

Primary:

* Gemini 2.5 Flash

Fallback:

* Llama 3.3 70B Versatile (Groq)

---

# Architecture

```text
User
│
▼
Frontend
│
▼
FastAPI Backend
│
▼
Retriever
│
▼
FAISS Vector Store
│
▼
Relevant Context
│
▼
System Prompt + Context
│
▼
Gemini 2.5 Flash
│
▼
Fallback (if needed)
│
▼
Groq Llama 3.3 70B
│
▼
Response
```

---

# Project Structure

```text
chatbot_FAQ/

├── backend/
│
│   ├── database/
│   │   ├── db.py
│   │   └── history.py
│   │
│   ├── knowledge_base/
│   │   ├── chunking.py
│   │   ├── retriever.py
│   │   └── vector_store.py
│   │
│   ├── prompts/
│   │   └── system_prompt.py
│   │
│   ├── services/
│   │   ├── llm.py
│   │   └── pdf_generator.py
│   │
│   ├── uploads/
│   │   └── faiss_index/
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── assets/
│   ├── app.js
│   ├── config.js
│   ├── index.html
│   └── style.css
│
└── README.md
```

---

# Retrieval Strategy

The system retrieves information using the following priority:

1. Explicitly selected documents.
2. All documents in the current session.
3. Active document.
4. General conversation.

This ensures responses remain accurate and isolated to the user's current context.

---

# Environment Variables

Create a `.env` file inside the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key

GROQ_API_KEY=your_groq_api_key

SUPABASE_URL=your_supabase_url

SUPABASE_KEY=your_supabase_key
```

---

# Installation

## Clone the Repository

```bash
git clone <repository-url>
```

---

## Backend Setup

```bash
cd backend

python -m venv myenv

myenv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend runs on:

```text
http://127.0.0.1:8000
```

---

## Frontend Setup

Open:

```text
frontend/index.html
```

or use Live Server.

---

# Supported File Formats

* PDF
* DOCX
* TXT

---

# Current Capabilities

✅ Single-document FAQ generation

✅ Multi-document FAQ generation

✅ Single-document summarization

✅ Multi-document summarization

✅ Context-aware question answering

✅ Multi-document comparison

✅ Session-based document isolation

✅ Persistent chat history

✅ PDF export

✅ Gemini → Groq automatic fallback

---

# Future Enhancements

* Hybrid knowledge base architecture.
* User-specific vector stores.
* Shared global knowledge base.
* Streaming responses.
* OCR support.
* Image understanding.
* Multi-language support.
* Voice interaction.
* Docker support.
* Kubernetes deployment.
* Cloud deployment on Render and Vercel.
* Authentication and role-based access control.

---

# Author

**Adhithya.D**

B.Tech Computer Science and Business Systems

Interests:

* Artificial Intelligence
* Machine Learning
* Cloud Computing
* Data Science
* Generative AI

---

## License

This project is intended for educational, research, and portfolio purposes.