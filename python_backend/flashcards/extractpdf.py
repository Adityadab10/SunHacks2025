from pdfminer.high_level import extract_text

def extractpdf(pdf_path):
    text = extract_text(pdf_path)
    return text