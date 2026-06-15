from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)


def generate_response(messages):

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b:free",
        messages=messages,
        temperature=0.7,
        max_tokens=1200
    )

    return response.choices[0].message.content