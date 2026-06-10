import os

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)

from reportlab.lib.styles import (
    getSampleStyleSheet
)

from reportlab.lib.units import inch


def generate_pdf(
        faq_content,
        filename="faq_output.pdf"
):
    """
    Generate PDF from FAQ content.
    """

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    filename = "uploads/faq_output.pdf"

    doc = SimpleDocTemplate(
        filename
    )

    styles = getSampleStyleSheet()

    story = []

    title = Paragraph(
        "Knowledge-Based FAQ Report",
        styles["Title"]
    )

    story.append(
        title
    )

    story.append(
        Spacer(
            1,
            0.3 * inch
        )
    )

    sections = faq_content.split(
        "\n"
    )

    for line in sections:

        if not line.strip():

            story.append(
                Spacer(
                    1,
                    0.1 * inch
                )
            )

            continue

        try:

            paragraph = Paragraph(
                line,
                styles["BodyText"]
            )

            story.append(
                paragraph
            )

            story.append(
                Spacer(
                    1,
                    0.1 * inch
                )
            )

        except Exception:

            continue

    doc.build(
        story
    )

    return filename