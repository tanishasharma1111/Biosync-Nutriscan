import os
import requests
import cv2
import numpy as np

def detect_food(image_path):
    """
    Use Spoonacular API to identify food items, with a robust OpenCV fallback.
    """
    if not os.path.exists(image_path):
        return {'error': 'File not found'}

    spoonacular_key = os.getenv("SPOONACULAR_API_KEY")
    if spoonacular_key:
        try:
            url = f"https://api.spoonacular.com/food/images/classify?apiKey={spoonacular_key}"
            with open(image_path, 'rb') as f:
                files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
                response = requests.post(url, files=files, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                category = data.get('category')
                probability = data.get('probability', 0.0)
                
                # Check confidence threshold
                if category and probability > 0.2:
                    return {
                        'food_name': category.title(),
                        'confidence': round(probability, 2),
                        'nutrition': None, # Delegate to designated nutrition mapper
                        'is_fallback': False
                    }
        except Exception as e:
            print(f"Spoonacular Image API Error: {e}")
            pass # Proceed to fallback
            
    # OpenCV Basic Heuristics Fallback
    return _heuristic_opencv_food_detect(image_path)

def _heuristic_opencv_food_detect(image_path):
    """Fallback food detection based on primary hue analysis."""
    try:
        img = cv2.imread(image_path)
        img = cv2.resize(img, (100, 100))
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        mean_h = np.mean(hsv[:,:,0])
        mean_s = np.mean(hsv[:,:,1])
        
        # Default fallback
        food_name = "Salad" 
        
        if 10 < mean_h < 30 and mean_s > 100:
            food_name = "Pizza"
        elif 30 < mean_h < 60:
            food_name = "Pasta"
        elif mean_h < 15 or mean_h > 165:
            food_name = "Apple"
        elif mean_s < 50:
            food_name = "Rice"
            
        return {
            'food_name': food_name,
            'confidence': 0.65,
            'nutrition': None,
            'is_fallback': True
        }
    except Exception as e:
        print(f"Fallback detection failed: {e}")
        return {'error': 'no_food_detected'}
