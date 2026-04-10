import cv2
import numpy as np
import os

def preprocess_image(image_path, output_dir='./uploads'):
    """
    Read image from path, resize to 224x224, enhance contrast using CLAHE.
    Returns path to processed image.
    """
    os.makedirs(output_dir, exist_ok=True)

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image from {image_path}")

    img = cv2.resize(img, (224, 224))

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)

    lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    base_name = os.path.basename(image_path)
    processed_path = os.path.join(output_dir, f"processed_{base_name}")
    cv2.imwrite(processed_path, enhanced)

    return processed_path