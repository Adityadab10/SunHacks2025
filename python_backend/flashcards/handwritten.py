import easyocr
import cv2
from PIL import Image
import numpy as np

def preprocess_image(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Apply thresholding or contrast enhancement
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    pil_img = Image.fromarray(thresh)
    return pil_img

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'])

def extract_handwritten_text(preprocessed_img):
    img_np = np.array(preprocessed_img)
    results = reader.readtext(img_np)
    text = ""
    for (_, text_line, confidence) in results:
        if confidence > 0.5:  # filter low confidence results
            text += text_line + " "
    return text

# Usage
img_path = "./notes_image.jpg"
preprocessed_img = preprocess_image(img_path)
text = extract_handwritten_text(preprocessed_img)
print(text)
