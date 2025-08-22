from PIL import Image
from texify.model.model import load_model
from texify.model.processor import load_processor

model     = load_model()      # downloads weights on first run
processor = load_processor()  # loads the image/text preprocessing pipeline

# 2. Open your image
img = Image.open("./math_equation.jpg")

# 3. Run batch inference (even for a single image)
from texify.inference import batch_inference
results = batch_inference([img], model, processor)
# results is a list of dicts, each with keys "raw" (markdown+LaTeX) and "boxes"

# 4. Extract the OCR’d LaTeX
latex_output = results[0]["raw"]
print(latex_output)
