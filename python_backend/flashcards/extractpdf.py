from pdfminer.high_level import extract_text

# pdf_path =  "./Kartavya-Singh-Resume-2025.pdf"
pdf_path =  "./FA_Output_Notes.pdf"
text = extract_text(pdf_path)
print(text)