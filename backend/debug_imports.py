import time
print("1. Importing os, sys...")
import os, sys
print("2. Importing Flask...")
import flask
from flask_cors import CORS
print("3. Importing Detect Food...")
from detect_food import detect_food
print("4. Importing Nutrition...")
from nutrition import get_nutrition
print("5. Importing Skin Logic...")
from skin_logic import analyze_ingredients
print("6. Importing Skin Model (Torch)...")
from skin_model import predict_skin_concern
print("7. Importing AI Insight...")
from ai_insight import generate_insight
print("DONE! All imports successful.")
