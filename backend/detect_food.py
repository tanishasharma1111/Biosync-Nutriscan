import requests
import os
from dotenv import load_dotenv

load_dotenv()

SPOONACULAR_API_URL = 'https://api.spoonacular.com/food/images/analyze'

def detect_food(image_path):
    """
    Use Spoonacular food API to identify food items.
    Returns top food label and confidence score.
    """
    api_key = os.getenv('SPOONACULAR_API_KEY')
    if not api_key:
        return {'error': 'SPOONACULAR_API_KEY not configured'}

    try:
        with open(image_path, 'rb') as f:
            files = {'file': f}
            params = {'apiKey': api_key}
            # Make REST API request
            response = requests.post(SPOONACULAR_API_URL, params=params, files=files, timeout=30)
            
        if response.status_code != 200:
            return {'error': f'Spoonacular API error: {response.status_code} - {response.text}'}
        
        result = response.json()
        
        # Check for API-level errors
        if result.get('status') == 'failure':
            return {'error': f"Spoonacular error: {result.get('message', 'Unknown error')}"}
            
        category = result.get('category', {})
        food_name = category.get('name')
        confidence = category.get('probability')
        
        if not food_name or confidence is None:
            return {'error': 'no_food_detected'}
            
        if confidence < 0.5:
            return {'error': 'low_confidence'}
            
        return {
            'food_name': food_name,
            'confidence': confidence
        }
    except Exception as e:
        return {'error': f'Failed to parse Spoonacular response: {str(e)}'}
