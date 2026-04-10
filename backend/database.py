from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
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
            'food': self.food_name,
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


def init_db(app):
    db.init_app(app)
    bcrypt.init_app(app)
    with app.app_context():
        db.create_all()