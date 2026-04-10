import requests
import os

OLLAMA_URL = 'http://localhost:11434/api/generate'
OLLAMA_MODEL = 'llama3'

def generate_insight(food_name, calories, protein, fat, carbs):
    """
    Generate AI-powered health insight using Ollama (Llama 3).
    Returns response text.
    """
    prompt = f"""You are a certified nutritionist. Given the food '{food_name}' with {calories} kcal, {protein}g protein, {fat}g fat, {carbs}g carbs:
1. Give a 2-line health assessment.
2. Suggest one healthier alternative.
3. Give one meal pairing tip.
Keep it under 80 words."""

    payload = {
        'model': OLLAMA_MODEL,
        'prompt': prompt,
        'stream': False
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result.get('response', 'Insight generation failed.')
    except requests.exceptions.RequestException as e:
        # Fallback if Ollama is unavailable or out of RAM
        assessment = "This is a balanced meal."
        if calories > 600:
            assessment = "This is a high-calorie meal."
        elif calories < 300:
            assessment = "This is a relatively light meal or snack."
            
        if protein > 20:
            assessment += " Great protein content!"
            
        if fat > 20:
            assessment += " Consider pairing it with fiber-rich vegetables to balance out the higher fat content."
        else:
            assessment += " Consider adding some healthy fats like avocado or nuts."
            
        return assessment

def calculate_health_score(calories, protein, fat, carbs):
    """
    Calculate health score (0-100) based on macros.
    """
    base = 100

    if calories > 600:
        base -= 20

    if protein > 20:
        base += 10

    if fat > 30:
        base -= 15

    if carbs > 60:
        base -= 10

    return max(0, min(100, base))