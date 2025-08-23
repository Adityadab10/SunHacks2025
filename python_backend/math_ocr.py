from paddleocr import PaddleOCR

# 1. Initialize OCR engine (remove invalid parameter)
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en'
)

# 2. Run OCR on the equation image
result = ocr.predict('./math_equation.jpg')  # Use ocr() instead of predict()

# 3. Extract and print the text
for line in result:
    for item in line:
        text = item[1][0]
        print(f"Detected text: {text}")