from openai import OpenAI
from dotenv import load_dotenv
import os


load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)


def generate_response(messages):

    user_question = messages[-1]["content"]
    
    from knowledge_base.retriever import (
        retrieve_context
    )

    # Retrieve relevant context from KB
    retrieval_result = retrieve_context(
    user_question
)

    context = retrieval_result["context"]

    sources = retrieval_result["sources"]

    # If relevant context exists, augment the prompt
    if context:

        enhanced_messages = [
            messages[0],  # system prompt
            {
                "role": "system",
                "content":
                f"""
Use the following knowledge base information when answering.

Knowledge Base Context:

{context}

Relevant Documents:

{', '.join(sources)}

If the context is relevant, use it.

If the context is insufficient,
combine it with your own knowledge.

Mention document names only when appropriate.
"""
            },
            {
                "role": "user",
                "content": user_question
            }
        ]

    else:

        enhanced_messages = messages

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b:free",
        messages=enhanced_messages,
        temperature=0.7,
        max_tokens=1200
    )

    return response.choices[0].message.content