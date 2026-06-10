from pathlib import Path
from pypdf import PdfReader
from docx import Document


def extract_pdf_text(file_path):
    """
    Extract text from PDF files.
    """
    text = ""

    reader = PdfReader(file_path)

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


def extract_docx_text(file_path):
    """
    Extract text from DOCX files.
    """
    doc = Document(file_path)

    text = "\n".join(
        paragraph.text
        for paragraph in doc.paragraphs
    )

    return text


def extract_txt_text(file_path):
    """
    Extract text from TXT files.
    """
    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        text = file.read()

    return text


def extract_document_text(file_path):
    """
    Detect file type and extract text.
    """

    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        return extract_pdf_text(file_path)

    elif extension == ".docx":
        return extract_docx_text(file_path)

    elif extension == ".txt":
        return extract_txt_text(file_path)

    else:
        raise ValueError(
            f"Unsupported file type: {extension}"
        )