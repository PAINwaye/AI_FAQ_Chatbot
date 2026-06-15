import os

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

FAISS_PATH = "uploads/faiss_index"

embedding_model = None


def get_embedding_model():

    global embedding_model

    if embedding_model is None:

        embedding_model = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )

    return embedding_model


def load_vector_store():

    index_file = os.path.join(
        FAISS_PATH,
        "index.faiss"
    )

    if not os.path.exists(
        index_file
    ):

        return None

    try:

        return FAISS.load_local(
            FAISS_PATH,
            get_embedding_model(),
            allow_dangerous_deserialization=True
        )

    except Exception as e:

        print(
            f"Error loading FAISS index: {e}"
        )

        return None


def add_to_vector_store(
        chunks,
        source_name,
        session_id
):

    # Remove empty chunks
    chunks = [

        chunk.strip()

        for chunk in chunks

        if chunk and chunk.strip()

    ]

    if len(chunks) == 0:

        print(
            f"No valid chunks found for {source_name}"
        )

        return load_vector_store()

    metadata = [

        {
            "source": source_name,
            "session_id": session_id
        }

        for _ in chunks

    ]

    vector_store = load_vector_store()

    if vector_store is None:

        vector_store = FAISS.from_texts(
            texts=chunks,
            embedding=get_embedding_model(),
            metadatas=metadata
        )

    else:

        vector_store.add_texts(
            texts=chunks,
            metadatas=metadata,
            embedding=get_embedding_model()
        )

    os.makedirs(
        FAISS_PATH,
        exist_ok=True
    )

    vector_store.save_local(
        FAISS_PATH
    )

    return vector_store