import fitz  # PyMuPDF


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts all text from a PDF byte stream using PyMuPDF.
    Returns cleaned, concatenated text from each page.
    """
    text_parts: list[str] = []
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                text_parts.append(page.get_text("text"))
    except Exception as exc:
        # Log and return empty string so the pipeline can continue gracefully
        print(f"[pdf_parser] ERROR extracting text: {exc}")
        return ""
    return "\n".join(text_parts).strip()
