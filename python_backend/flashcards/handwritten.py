from pdf2image import convert_from_path
from transformers import pipeline
from PIL import Image

ocr_pipe = pipeline("image-to-text", model="microsoft/trocr-base-handwritten")

pdf_path = "./FA_Output_Notes.pdf"
pages = convert_from_path(pdf_path)

full_text = ""
for page in pages:
    text = ocr_pipe(page)[0]['generated_text']
    full_text += text + "\n\n"

print(full_text)
