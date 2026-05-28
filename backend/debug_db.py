from flask import Flask
from database import init_db
import os

print("Starting debug_db.py")
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nutriscan_debug.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

print("Calling init_db...")
try:
    init_db(app)
    print("init_db finished successfully!")
except Exception as e:
    print(f"init_db failed with error: {e}")
