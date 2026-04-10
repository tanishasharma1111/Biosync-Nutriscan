import requests
import os

USDA_API_KEY = os.getenv('USDA_API_KEY', '')
USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

def get_nutrition(food_name):
    """
    Query USDA FoodData Central for nutrition data.
    Returns dict with calories, protein, fat, carbs rounded to 2 decimal places.
    """
    if not USDA_API_KEY:
        return {'error': 'USDA_API_KEY not configured'}

    params = {
        'api_key': USDA_API_KEY,
        'query': food_name,
        'pageSize': 5
    }

    try:
        response = requests.get(f'{USDA_BASE_URL}/foods/search', params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        foods = data.get('foods', [])
        
        # Fallback to a simpler search if nothing found (e.g. 'pasta' instead of 'pasta with meat sauce')
        if not foods and ' ' in food_name:
            params['query'] = food_name.split()[0]
            try:
                response2 = requests.get(f'{USDA_BASE_URL}/foods/search', params=params, timeout=10)
                if response2.status_code == 200:
                    foods = response2.json().get('foods', [])
            except:
                pass

        if not foods:
            return {'error': 'food_not_found'}

        food = foods[0]
        nutrients = food.get('foodNutrients', [])

        def get_nutrient(nutrient_id):
            for n in nutrients:
                if n.get('nutrientId') == nutrient_id:
                    return float(n.get('value', 0))
            return 0.0

        calories = get_nutrient(1008)
        protein = get_nutrient(1003)
        fat = get_nutrient(1004)
        carbs = get_nutrient(1005)

        if calories == 0 and protein == 0 and fat == 0 and carbs == 0:
            return {'error': 'no_nutrition_data'}

        return {
            'calories': round(calories, 2),
            'protein': round(protein, 2),
            'fat': round(fat, 2),
            'carbs': round(carbs, 2)
        }
    except requests.exceptions.RequestException as e:
        return {'error': f'USDA API error: {str(e)}'}