import os
import sys

print("Python version:", sys.version)
print("Current directory:", os.getcwd())

try:
    print("Testing imports...")
    import flask
    import flask_cors
    import flask_sqlalchemy
    import flask_bcrypt
    import cv2
    import requests
    import dotenv
    import jwt
    import torch
    import PIL
    print("All basic imports successful!")
    
    print("Testing local imports...")
    from app import app
    print("App import successful!")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
