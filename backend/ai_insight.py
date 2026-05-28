import os
import base64
from ai_client import AIClient

def generate_insight(food_name, calories, protein, fat, carbs):
    """
    Generate AI-powered health insight using AIClient.
    """
    return AIClient.generate_insight(food_name, calories, protein, fat, carbs)

def calculate_health_score(calories, protein, fat, carbs):
    """
    Calculate health score (0-100) based on macros.
    """
    base = 100
    if calories > 600: base -= 20
    if protein > 20: base += 10
    if fat > 30: base -= 15
    if carbs > 60: base -= 10
    return max(0, min(100, base))

def generate_skin_ai_insight(skin_concern, acne_score, glow_score):
    """
    Generate personalized skin health advice using AIClient.
    """
    prompt = f"Dietary tip for {skin_concern} (Acne: {acne_score}, Glow: {glow_score}). Under 60 words."
    
    payload = {
        'model': AIClient.TEXT_MODEL,
        'prompt': prompt,
        'stream': False
    }

    result = AIClient.call_ollama(payload, timeout=20)
    
    if "error" in result:
        # Fallback based on concern
        if 'Melanoma' in skin_concern or 'Carcinoma' in skin_concern:
            return "Based on the scan, this spot requires urgent professional evaluation. Please visit a dermatologist ASAP."
        return f"Your scan shows signs of '{skin_concern}'. Focus on hydration and SPF while monitoring for changes."
        
    return result.get('response', 'AI insight temporarily unavailable.')

def analyze_skin_vision(image_path):
    """
    Advanced Dermatology Analysis using Vision AI via AIClient.
    """
    if not os.path.exists(image_path):
        return None

    try:
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
    except Exception:
        return None

    prompt = """Analyze this skin image. Return STRICT JSON: {"condition": "...", "confidence": "0%", "scores": {"acne": 0, "hyperpigmentation": 0, "sun_damage": 0, "dry_skin": 0, "oily_skin": 0, "normal_skin": 0, "sensitive": 0, "combination": 0}, "reason": "..."}"""

    payload = {
        'model': AIClient.VISION_MODEL,
        'prompt': prompt,
        'images': [encoded_image],
        'stream': False,
        'format': 'json'
    }

    result = AIClient.call_ollama(payload, timeout=60)
    
    if "error" in result:
        return {
            "condition": "Analysis Failed",
            "confidence": "0%",
            "scores": {k: 0 for k in ["acne", "hyperpigmentation", "sun_damage", "dry_skin", "oily_skin", "normal_skin", "sensitive", "combination"]},
            "reason": f"AI service unavailable: {result.get('message')}. Using heuristic estimate."
        }

    try:
        import json
        return json.loads(result.get('response', '{}'))
    except:
        return {
            "condition": "Error parsing AI response",
            "confidence": "0%",
            "scores": {k: 0 for k in ["acne", "hyperpigmentation", "sun_damage", "dry_skin", "oily_skin", "normal_skin", "sensitive", "combination"]},
            "reason": "AI returned invalid format."
        }