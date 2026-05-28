import requests
import os
import json

def get_nutrition(food_name):
    """
    Query USDA FoodData Central API for exact nutritional macros.
    """
    print(f"Fetching precise macros for: {food_name}")
    api_key = os.getenv("USDA_API_KEY")
    
    if not api_key:
        print("Warning: USDA API Key not found. Proceeding to fallback.")
        return _heuristic_nutrition_fallback(food_name)
        
    try:
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            'api_key': api_key,
            'query': food_name,
            'pageSize': 1,
            'dataType': ['Foundation', 'SR Legacy', 'Survey (FNDDS)']
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            foods = data.get('foods', [])
            if foods:
                best_match = foods[0]
                nutrients = {n['nutrientId']: n['value'] for n in best_match.get('foodNutrients', [])}
                
                # USDA Nutrient IDs:
                # 1008 = Energy (kcal), 1003 = Protein (g), 1004 = Total lipid (fat) (g), 1005 = Carbohydrate (g)
                return {
                    'calories': round(nutrients.get(1008, 0), 2),
                    'protein': round(nutrients.get(1003, 0), 2),
                    'fat': round(nutrients.get(1004, 0), 2),
                    'carbs': round(nutrients.get(1005, 0), 2)
                }
        else:
            print(f"USDA API failed: {response.text}")
            
    except Exception as e:
        print(f"USDA connection error: {e}")
        
    return _heuristic_nutrition_fallback(food_name)

def _heuristic_nutrition_fallback(food_name):
    """Basic fallback mapping if USDA API fails."""
    food_name = food_name.lower()
    
    heuristics = {
        "pizza": {"calories": 285, "protein": 12, "fat": 10, "carbs": 36},
        "apple": {"calories": 95, "protein": 0.5, "fat": 0.3, "carbs": 25},
        "pasta": {"calories": 220, "protein": 8, "fat": 1, "carbs": 43},
        "burger": {"calories": 354, "protein": 20, "fat": 17, "carbs": 30},
        "salad": {"calories": 100, "protein": 2, "fat": 5, "carbs": 10},
        "rice": {"calories": 205, "protein": 4, "fat": 0.4, "carbs": 45}
    }
    
    # Return matched heuristic, otherwise a safe generic standard
    for key, val in heuristics.items():
        if key in food_name:
            return val
            
    return {"calories": 250, "protein": 10, "fat": 8, "carbs": 30}