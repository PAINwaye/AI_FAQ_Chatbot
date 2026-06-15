import google.generativeai as genai
from dotenv import load_dotenv
import os

from knowledge_base.retriever import retrieve_context

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def generate_faq(user_query):
    """
    Generate FAQs based on relevant knowledge base context.
    """

    retrieval_result = retrieve_context(user_query)
    context = retrieval_result["context"]
    sources = retrieval_result["sources"]

    if not context:
        return (
            "No relevant information was found "
            "in the knowledge base."
        )

    prompt = f"""
Knowledge Base Context:

{context}

Documents involved:

{', '.join(sources)}

User Request:

{user_query}

If multiple documents are involved,
separate FAQs by document.
"""

    response = model.generate_content(prompt)

    return response.text