from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import json
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    scans = db.relationship('Scan', backref='user', lazy=True)
    skin_scans = db.relationship('SkinScan', backref='user', lazy=True)
    skincare_products = db.relationship('SkincareProduct', backref='user', lazy=True)
    grocery_items = db.relationship('GroceryItem', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Scan(db.Model):
    __tablename__ = 'scans'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    food_name = db.Column(db.String, nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    calories = db.Column(db.Float, nullable=False)
    protein = db.Column(db.Float, nullable=False)
    fat = db.Column(db.Float, nullable=False)
    carbs = db.Column(db.Float, nullable=False)
    health_score = db.Column(db.Integer, nullable=False)
    ai_insight = db.Column(db.Text, nullable=True)
    image_path = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'food_name': self.food_name,
            'confidence': self.confidence,
            'nutrition': {
                'calories': round(self.calories, 2),
                'protein': round(self.protein, 2),
                'fat': round(self.fat, 2),
                'carbs': round(self.carbs, 2)
            },
            'health_score': self.health_score,
            'insight': self.ai_insight,
            'image_path': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    gender = db.Column(db.String, nullable=True)
    age = db.Column(db.Integer, nullable=True)
    height_cm = db.Column(db.Float, nullable=True)
    weight_kg = db.Column(db.Float, nullable=True)
    activity_level = db.Column(db.String, default='sedentary')
    weight_goal = db.Column(db.String, default='maintain')
    goal_weight_kg = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'gender': self.gender,
            'age': self.age,
            'height_cm': self.height_cm,
            'weight_kg': self.weight_kg,
            'activity_level': self.activity_level,
            'weight_goal': self.weight_goal,
            'goal_weight_kg': self.goal_weight_kg,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class UserGoals(db.Model):
    __tablename__ = 'user_goals'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    daily_calories = db.Column(db.Integer, nullable=False)
    protein_grams = db.Column(db.Float, nullable=False)
    fat_grams = db.Column(db.Float, nullable=False)
    carbs_grams = db.Column(db.Float, nullable=False)
    water_ml = db.Column(db.Integer, default=2000)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'daily_calories': self.daily_calories,
            'protein': self.protein_grams,
            'fat': self.fat_grams,
            'carbs': self.carbs_grams,
            'water_ml': self.water_ml,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class FoodEntry(db.Model):
    __tablename__ = 'food_entries'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.String, nullable=False)  # breakfast, lunch, dinner, snack
    food_name = db.Column(db.String, nullable=False)
    brand = db.Column(db.String, nullable=True)
    calories = db.Column(db.Float, nullable=False)
    protein = db.Column(db.Float, default=0)
    fat = db.Column(db.Float, default=0)
    carbs = db.Column(db.Float, default=0)
    serving_size = db.Column(db.String, nullable=True)
    servings = db.Column(db.Float, default=1.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'meal_type': self.meal_type,
            'food_name': self.food_name,
            'brand': self.brand,
            'calories': round(self.calories, 2),
            'protein': round(self.protein, 2),
            'fat': round(self.fat, 2),
            'carbs': round(self.carbs, 2),
            'serving_size': self.serving_size,
            'servings': self.servings,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class WaterEntry(db.Model):
    __tablename__ = 'water_entries'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    amount_ml = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'amount_ml': self.amount_ml,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class WeightEntry(db.Model):
    __tablename__ = 'weight_entries'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    weight_kg = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'weight_kg': round(self.weight_kg, 1),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class MealPlan(db.Model):
    __tablename__ = 'meal_plans'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Mon, 6=Sun
    meal_type = db.Column(db.String, nullable=False)
    food_name = db.Column(db.String, nullable=False)
    calories = db.Column(db.Float, default=0)
    protein = db.Column(db.Float, default=0)
    fat = db.Column(db.Float, default=0)
    carbs = db.Column(db.Float, default=0)
    servings = db.Column(db.Float, default=1.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'day_of_week': self.day_of_week,
            'meal_type': self.meal_type,
            'food_name': self.food_name,
            'calories': round(self.calories, 2),
            'protein': round(self.protein, 2),
            'fat': round(self.fat, 2),
            'carbs': round(self.carbs, 2),
            'servings': self.servings
        }


class SkinScan(db.Model):
    __tablename__ = 'skin_scans'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    image_path = db.Column(db.String, nullable=True)
    acne_score = db.Column(db.Integer, default=0) # 0-10 severity
    glow_score = db.Column(db.Integer, default=0)  # 0-10 glow level
    acne_type = db.Column(db.String, nullable=True) # hormonal, cystic, etc.
    skin_concern = db.Column(db.String, nullable=True) 
    confidence = db.Column(db.Float, default=0.0)
    ai_insight = db.Column(db.Text, nullable=True)
    analysis_data = db.Column(db.Text, nullable=True) # JSON string of detailed scores
    recommendations = db.Column(db.Text, nullable=True) # JSON string of advice
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        try:
            recs = json.loads(self.recommendations) if self.recommendations else {}
        except Exception:
            recs = {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'image_path': self.image_path,
            'acne_score': self.acne_score,
            'glow_score': self.glow_score,
            'acne_type': self.acne_type,
            'skin_concern': self.skin_concern,
            'confidence': self.confidence,
            'analysis_data': json.loads(self.analysis_data) if self.analysis_data else {},
            'recommendations': recs,
            'insight': self.ai_insight if hasattr(self, 'ai_insight') else '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SkincareProduct(db.Model):
    __tablename__ = 'skincare_products'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String, nullable=False)
    brand = db.Column(db.String, nullable=True)
    barcode = db.Column(db.String, nullable=True)
    ingredients = db.Column(db.Text, nullable=True)
    is_safe = db.Column(db.Boolean, default=True)
    concerns = db.Column(db.Text, nullable=True) # comma separated concerns
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'brand': self.brand,
            'barcode': self.barcode,
            'ingredients': self.ingredients,
            'is_safe': self.is_safe,
            'concerns': self.concerns,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class GroceryItem(db.Model):
    __tablename__ = 'grocery_items'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String, nullable=False)
    category = db.Column(db.String, nullable=True) # dairy, produce, etc.
    reason = db.Column(db.String, nullable=True) # e.g. "Low Zinc", "Skin Friendly"
    is_bought = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'reason': self.reason,
            'is_bought': self.is_bought,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SleepStressEntry(db.Model):
    __tablename__ = 'sleep_stress_entries'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    sleep_hours = db.Column(db.Float, default=0)
    stress_level = db.Column(db.Integer, default=5)  # 1-10
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'sleep_hours': self.sleep_hours,
            'stress_level': self.stress_level,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SupplementEntry(db.Model):
    __tablename__ = 'supplement_entries'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String, nullable=False)  # e.g. "Zinc", "Omega-3"
    dosage = db.Column(db.String, nullable=True)  # e.g. "50mg"
    category = db.Column(db.String, default='supplement')  # supplement or medication
    taken = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'name': self.name,
            'dosage': self.dosage,
            'category': self.category,
            'taken': self.taken,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


def _run_migrations(db):
    """Safely adds any missing columns to existing tables (SQLite-safe)."""
    migrations = [
        ("skin_scans", "ai_insight",      "TEXT"),
        ("skin_scans", "recommendations", "TEXT"),
        ("skin_scans", "acne_type",       "VARCHAR(100)"),
        ("skin_scans", "skin_concern",    "VARCHAR(100)"),
        ("skin_scans", "confidence",      "FLOAT"),
        ("skin_scans", "analysis_data",   "TEXT"),
    ]
    with db.engine.connect() as conn:
        for table, column, col_type in migrations:
            try:
                conn.execute(
                    db.text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                )
                conn.commit()
            except Exception:
                # Column already exists — safe to ignore
                pass

def init_db(app):
    print("Initializing Database...")
    db.init_app(app)
    bcrypt.init_app(app)
    with app.app_context():
        print("Creating tables (if missing)...")
        db.create_all()
        print("Running migrations...")
        _run_migrations(db)
    print("Database ready.")