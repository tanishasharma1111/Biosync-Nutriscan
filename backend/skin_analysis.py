import cv2
import numpy as np

def analyze_skin_image(image_path):
    """
    Extracts features from the skin image using OpenCV.
    Returns:
       metrics: A dictionary containing scores (0-100) for acne, redness, oiliness, dryness, pigmentation.
    """
    img = cv2.imread(image_path)
    if img is None:
        # Fallback if image cannot be read
        return _fallback_metrics()

    # Resize for faster processing
    img = cv2.resize(img, (400, 400))
    
    # Pre-calculate color spaces
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Redness / Sensitivity
    # Define color range for redness (wrap around hue)
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = mask1 | mask2
    red_ratio = np.sum(red_mask > 0) / (400 * 400)
    # Scale relative to expected skin max (e.g. 50% red is extreme)
    score_redness = min(100, int((red_ratio / 0.5) * 100))

    # 2. Texture Irregularities (Acne Proxy)
    # Use Canny edge detection after smoothing
    blur = cv2.bilateralFilter(gray, 9, 75, 75)
    edges = cv2.Canny(blur, 50, 150)
    edge_ratio = np.sum(edges > 0) / (400 * 400)
    score_acne = min(100, int((edge_ratio / 0.15) * 100)) # 15% edge is highly textured

    # 3. Pigmentation Spots
    # Detect dark spots in the L channel of LAB image
    l_channel, _, _ = cv2.split(lab)
    # Adaptive thresholding to find local dark regions
    th = cv2.adaptiveThreshold(l_channel, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 10)
    pigment_ratio = np.sum(th > 0) / (400 * 400)
    score_pigmentation = min(100, int((pigment_ratio / 0.2) * 100))

    # 4. Oiliness (Specular Reflection / Shine)
    # Shine forms very bright regions (high value in V channel)
    _, _, v_channel = cv2.split(hsv)
    shine_mask = v_channel > 210 # Assuming brightness > 210 is shine
    shine_ratio = np.sum(shine_mask) / (400 * 400)
    score_oiliness = min(100, int((shine_ratio / 0.15) * 100))

    # 5. Dryness
    # Reverse of oiliness, combined with texture
    # Dull, flaky skin: High texture but low shine
    if score_oiliness < 20 and score_acne > 20: # High texture, no shine => flakes
        score_dryness = min(100, score_acne * 2) 
    else:
        score_dryness = max(0, 100 - score_oiliness - 20)

    # Some normalization to prevent 0 scores across the board if it's a blurry / flat image
    metrics = {
        "acne": max(5, score_acne),
        "dryness": max(5, score_dryness),
        "oiliness": max(5, score_oiliness),
        "pigmentation": max(5, score_pigmentation),
        "redness": max(5, score_redness)
    }
    
    return metrics

def classify_condition(metrics):
    """
    Classify into one primary condition and calculate overall confidence.
    """
    # Define primary classes based on highest metric
    mapping = {
        "acne": "Acne",
        "dryness": "Dry Skin",
        "oiliness": "Oily Skin",
        "pigmentation": "Pigmentation",
        "redness": "Redness / Sensitivity"
    }

    # Find the top metric
    primary_key = max(metrics, key=metrics.get)
    max_score = metrics[primary_key]

    if max_score < 15:
        condition = "Normal Skin"
        confidence = 90
    else:
        condition = mapping[primary_key]
        # Confidence logic: Higher max_score -> higher confidence, capped at 98
        confidence = min(98, max_score + 10)
        
    return condition, confidence

def _fallback_metrics():
    return {
        "acne": 20,
        "dryness": 30,
        "oiliness": 40,
        "pigmentation": 10,
        "redness": 15
    }
