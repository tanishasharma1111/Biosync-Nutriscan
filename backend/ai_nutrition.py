from ai_client import AIClient

def estimate_nutrition_with_ai(food_name):
    """
    Use AIClient to estimate nutrition data if APIs fail.
    """
    return AIClient.estimate_nutrition(food_name)

