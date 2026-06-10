from knowledge_base.vector_store import load_vector_store


SIMILARITY_THRESHOLD = 1.0


def retrieve_context(query, k=5):
    """
    Retrieve relevant chunks and source names.
    """

    vector_store = load_vector_store()

    if vector_store is None:

        return {
            "context": "",
            "sources": []
        }

    results = vector_store.similarity_search_with_score(
        query,
        k=k
    )

    relevant_chunks = []

    sources = set()

    for doc, score in results:

        if score < SIMILARITY_THRESHOLD:

            relevant_chunks.append(
                doc.page_content
            )

            source_name = doc.metadata.get(
                "source",
                "Unknown"
            )

            sources.add(
                source_name
            )

    if not relevant_chunks:

        return {
            "context": "",
            "sources": []
        }

    context = "\n\n".join(
        relevant_chunks
    )

    return {
        "context": context,
        "sources": list(
            sources
        )
    }