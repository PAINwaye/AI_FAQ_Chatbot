from openai import OpenAI
from dotenv import load_dotenv
import os

from knowledge_base.retriever import retrieve_context

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)


def generate_faq(user_query):
    """
    Generate FAQs based on relevant knowledge base context.
    """

    retrieval_result = retrieve_context(
    user_query
    )
    context = retrieval_result["context"]
    
    sources = retrieval_result["sources"]

    if not context:

        return (
            "No relevant information was found "
            "in the knowledge base."
        )

    messages = [

        {
    "role": "user",
    "content":
    f"""
Knowledge Base Context:

{context}

Documents involved:

{', '.join(sources)}

User Request:

{user_query}

If multiple documents are involved,
separate FAQs by document.
"""
},

        {
            "role": "user",
            "content":
            f"""
Knowledge Base Context:

{context}

User Request:

{user_query}
"""
        }
    ]

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b:free",
        messages=messages,
        temperature=0.7,
        max_tokens=2000
    )

    return response.choices[0].message.content