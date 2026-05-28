import requests
import json
import os
import time
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIClient:
    """
    Centralized client for local AI services (Ollama) with fallback support.
    """
    OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434/api/generate')
    VISION_MODEL = os.getenv('VISION_MODEL', 'llava')
    TEXT_MODEL = os.getenv('TEXT_MODEL', 'llama3')
    
    # Default timeouts
    CONNECT_TIMEOUT = 5
    READ_TIMEOUT = 45 # Increased to handle model loading

    @classmethod
    def call_ollama(cls, payload, timeout=READ_TIMEOUT):
        """
        Generic helper for Ollama API calls.
        """
        try:
            response = requests.post(
                cls.OLLAMA_URL, 
                json=payload, 
                timeout=(cls.CONNECT_TIMEOUT, timeout)
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            logger.warning("Ollama request timed out.")
            return {"error": "timeout", "message": "Service is taking too long to respond."}
        except requests.exceptions.ConnectionError:
            logger.warning("Ollama connection failed (Is it running?).")
            return {"error": "connection", "message": "Could not connect to AI service."}
        except Exception as e:
            logger.error(f"Ollama unexpected error: {str(e)}")
            return {"error": "unknown", "message": str(e)}

    @classmethod
    def analyze_food_image(cls, base64_image):
        """
        Analyze food image using Vision AI with a fallback.
        """
        prompt = """Identify the primary food item in this image. 
        Return STRICT JSON: {"food_name": "...", "confidence": 0.0, "nutrition": {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}}"""
        
        payload = {
            'model': cls.VISION_MODEL,
            'prompt': prompt,
            'images': [base64_image],
            'stream': False,
            'format': 'json'
        }
        
        result = cls.call_ollama(payload, timeout=60)
        
        if "error" in result:
            return cls.get_heuristic_food_analysis("Unknown Food")
        
        try:
            analysis = json.loads(result.get('response', '{}'))
            if not analysis.get('food_name'):
                return cls.get_heuristic_food_analysis("Unknown Food")
            return analysis
        except Exception:
            return cls.get_heuristic_food_analysis("Unknown Food")

    @classmethod
    def generate_insight(cls, food_name, calories, protein, fat, carbs):
        """
        Generate nutritional insight with a fallback.
        """
        prompt = f"Give a 2-line nutrition tip for {food_name} ({calories} kcal, {protein}g protein, {fat}g fat, {carbs}g carbs). Keep it under 50 words."
        
        payload = {
            'model': cls.TEXT_MODEL,
            'prompt': prompt,
            'stream': False
        }
        
        result = cls.call_ollama(payload, timeout=20)
        
        if "error" in result:
            return cls.get_heuristic_insight(calories, protein, fat, carbs)
            
        return result.get('response', cls.get_heuristic_insight(calories, protein, fat, carbs))

    @staticmethod
    def get_heuristic_food_analysis(name="Unknown Food"):
        """
        Basic fallback when AI vision fails.
        """
        return {
            "food_name": name,
            "confidence": 0.5,
            "nutrition": {
                "calories": 250,
                "protein": 10,
                "fat": 8,
                "carbs": 30
            },
            "is_fallback": True
        }

    @staticmethod
    def get_heuristic_insight(calories, protein, fat, carbs):
        """
        Rule-based insight fallback.
        """
        if calories > 500:
            return "This seems like a calorie-dense meal. Consider portion control or balancing it with a fiber-rich salad."
        if protein > 20:
            return "Excellent protein source! This will help with muscle recovery and satiety."
        return "This is a standard serving. Try to pair it with plenty of water for optimal digestion."

    @classmethod
    def estimate_nutrition(cls, food_name):
        """
        Estimate nutrition for a given food name.
        """
        prompt = f"Provide nutrition for 100g of {food_name} in STRICT JSON: {{\"calories\": 0, \"protein\": 0, \"fat\": 0, \"carbs\": 0}}"
        
        payload = {
            'model': cls.TEXT_MODEL,
            'prompt': prompt,
            'stream': False,
            'format': 'json'
        }
        
        result = cls.call_ollama(payload, timeout=15)
        
        if "error" in result:
            return cls.get_heuristic_food_analysis(food_name)["nutrition"]
            
        try:
            return json.loads(result.get('response', '{}'))
        except:
            return cls.get_heuristic_food_analysis(food_name)["nutrition"]
