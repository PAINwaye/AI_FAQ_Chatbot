import google.generativeai as genai
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

# -------- Configure Gemini -------- #
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# -------- Configure Groq -------- #
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"


def generate_with_gemini(messages):
    """Try Gemini first."""

    system_prompt = ""
    chat_history = []

    for msg in messages:

        if msg["role"] == "system":
            system_prompt = msg["content"]

        elif msg["role"] == "user":
            chat_history.append({
                "role": "user",
                "parts": [msg["content"]]
            })

        elif msg["role"] == "assistant":
            chat_history.append({
                "role": "model",
                "parts": [msg["content"]]
            })

    history = chat_history[:-1] if len(chat_history) > 1 else []
    chat = gemini_model.start_chat(history=history)

    last_user_message = chat_history[-1]["parts"][0] if chat_history else ""
    full_message = f"{system_prompt}\n\n{last_user_message}" if system_prompt else last_user_message

    response = chat.send_message(full_message)
    return response.text


def generate_with_groq(messages):
    """Fallback to Groq if Gemini fails."""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=1200
    )

    return response.choices[0].message.content


def generate_response(messages):
    """
    Try Gemini first.
    If Gemini fails (quota/error), fall back to Groq.
    """

    try:
        print("[LLM] Trying Gemini...")
        response = generate_with_gemini(messages)
        print("[LLM] Gemini responded successfully.")
        return response

    except Exception as e:
        print(f"[LLM] Gemini failed: {e}")
        print("[LLM] Falling back to Groq...")

        try:
            response = generate_with_groq(messages)
            print("[LLM] Groq responded successfully.")
            return response

        except Exception as groq_error:
            print(f"[LLM] Groq also failed: {groq_error}")
            return "Both AI models are currently unavailable. Please try again later."