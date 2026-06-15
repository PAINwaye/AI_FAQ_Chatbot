from collections import defaultdict

from knowledge_base.vector_store import load_vector_store
from database.history import get_session_documents


def retrieve_context(
        query,
        session_id,
        active_document=None,
        selected_documents=None,
        all_documents=False,
        k=100
):
    """
    Priority

    1. selected_documents
    2. all_documents
    3. active_document
    """

    vector_store = load_vector_store()
    if vector_store is None:

        print("VECTOR STORE IS NONE")

        return {
            "context": "",
            "sources": []
        }
    print(
        "VECTOR STORE SIZE:",
        len(vector_store.docstore._dict)
    )

    if vector_store is None:

        return {
            "context": "",
            "sources": []
        }

    source_chunks = defaultdict(list)

    sources = set()

    session_documents = get_session_documents(
        session_id
    )

    # ---------------- ALL DOCUMENTS ---------------- #

    if all_documents:

        for _, doc in vector_store.docstore._dict.items():

            metadata = doc.metadata

            doc_session_id = metadata.get(
                "session_id"
            )

            source_name = metadata.get(
                "source"
            )

            # Session filter
            if doc_session_id != session_id:

                continue

            # Only documents belonging to this session
            if source_name not in session_documents:

                continue

            source_chunks[source_name].append(
                doc.page_content
            )

            sources.add(
                source_name
            )

    # ---------------- MULTI-DOCUMENT RETRIEVAL ---------------- #

    elif selected_documents and len(selected_documents) > 1:

        for _, doc in vector_store.docstore._dict.items():

            metadata = doc.metadata

            doc_session_id = metadata.get(
                "session_id"
            )

            source_name = metadata.get(
                "source"
            )

            # Session filter
            if doc_session_id != session_id:

                continue

            # Selected document filter
            if source_name not in selected_documents:

                continue

            source_chunks[source_name].append(
                doc.page_content
            )

            sources.add(
                source_name
            )

    # ---------------- NORMAL RETRIEVAL ---------------- #

    else:

        results = vector_store.similarity_search_with_score(
            query,
            k=k
        )

        for doc, score in results:

            metadata = doc.metadata

            doc_session_id = metadata.get(
                "session_id"
            )

            source_name = metadata.get(
                "source"
            )

            # Session filter
            if doc_session_id != session_id:

                continue

            # Explicit document selection
            if selected_documents:

                if source_name not in selected_documents:

                    continue

            # Active document selection
            elif active_document:

                print(
                    "Source:",
                    repr(source_name),
                    "| Active:",
                    repr(active_document)
                )

                if source_name != active_document:

                    continue

            print(
                "Score:",
                score,
                "| Source:",
                source_name
            )

            source_chunks[source_name].append(
                doc.page_content
            )

            sources.add(
                source_name
            )

    # ---------------- EMPTY RESULT ---------------- #

    if not source_chunks:

        return {
            "context": "",
            "sources": []
        }

    # ---------------- BUILD CONTEXT ---------------- #

    context_parts = []

    for source_name, chunks in source_chunks.items():

        document_text = "\n\n".join(
            chunks[:10]
        )

        context_parts.append(
            f"""
===== {source_name} =====

{document_text}

==================================
"""
        )

    context = "\n\n".join(
        context_parts
    )

    # ---------------- DEBUG ---------------- #

    print("\n========== RETRIEVAL ==========")

    print(
        "Query:",
        query
    )

    print(
        "Selected documents:",
        selected_documents
    )

    print(
        "Active document:",
        active_document
    )

    print(
        "All documents:",
        all_documents
    )

    print(
        "Session documents:",
        session_documents
    )

    print(
        "Sources:",
        sources
    )

    print(
        "================================\n"
    )

    return {

        "context": context,

        "sources": list(
            sources
        )

    }