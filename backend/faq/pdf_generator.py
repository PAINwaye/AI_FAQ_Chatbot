from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)

from reportlab.platypus import (
    PageBreak
)

from reportlab.lib.styles import (
    getSampleStyleSheet
)

from reportlab.lib.units import inch


def generate_pdf(
        faq_content,
        filename="uploads/faq_output.pdf"
):
    """
    Generate PDF from FAQ content.
    """

    doc = SimpleDocTemplate(
        filename
    )

    styles = getSampleStyleSheet()

    story = []

    title = Paragraph(
        "Knowledge-Based FAQ Report",
        styles["Title"]
    )

    story.append(title)

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

    doc.build(
        story
    )

    return filename