"""Standalone seed script to create demo user."""
import sys
sys.path.insert(0, '.')

from app import app, db
from database import User, UserProfile, UserGoals, FoodEntry, WaterEntry, WeightEntry
from datetime import date, timedelta
import bcrypt

with app.app_context():
    # Check if demo user exists
    demo_user = User.query.filter_by(email='demo@bio-sync.com').first()
    if not demo_user:
        demo_user = User(username='demo', email='demo@bio-sync.com')
        demo_user.set_password('demo123')
        db.session.add(demo_user)
        db.session.commit()
        print(f"Created user: demo@bio-sync.com / demo123 (id={demo_user.id})")
    else:
        print(f"User already exists: demo@bio-sync.com / demo123 (id={demo_user.id})")

    # Create profile
    profile = UserProfile.query.filter_by(user_id=demo_user.id).first()
    if not profile:
        profile = UserProfile(
            user_id=demo_user.id,
            gender='male',
            age=28,
            height_cm=175,
            weight_kg=75,
            activity_level='moderate',
            weight_goal='lose_0.5',
            goal_weight_kg=70
        )
        db.session.add(profile)
        db.session.commit()
        print("Created profile")

    # Create goals
    goals = UserGoals.query.filter_by(user_id=demo_user.id).first()
    if not goals:
        goals = UserGoals(
            user_id=demo_user.id,
            daily_calories=2100,
            protein_grams=160,
            fat_grams=65,
            carbs_grams=180,
            water_ml=2500
        )
        db.session.add(goals)
        db.session.commit()
        print("Created goals")

    # Create food entries for today
    today = date.today()
    sample_foods = [
        {'meal_type': 'breakfast', 'food_name': 'Scrambled eggs with whole wheat toast', 'calories': 350, 'protein': 20, 'fat': 18, 'carbs': 28},
        {'meal_type': 'breakfast', 'food_name': 'Greek yogurt with granola', 'calories': 180, 'protein': 15, 'fat': 5, 'carbs': 25},
        {'meal_type': 'lunch', 'food_name': 'Grilled chicken breast salad', 'calories': 420, 'protein': 45, 'fat': 15, 'carbs': 20},
        {'meal_type': 'lunch', 'food_name': 'Brown rice with steamed broccoli', 'calories': 220, 'protein': 6, 'fat': 3, 'carbs': 42},
        {'meal_type': 'dinner', 'food_name': 'Salmon fillet with quinoa', 'calories': 580, 'protein': 42, 'fat': 28, 'carbs': 35},
        {'meal_type': 'dinner', 'food_name': 'Mixed vegetable stir fry', 'calories': 150, 'protein': 5, 'fat': 6, 'carbs': 22},
        {'meal_type': 'snack', 'food_name': 'Apple with almond butter', 'calories': 200, 'protein': 5, 'fat': 12, 'carbs': 22},
        {'meal_type': 'snack', 'food_name': 'Protein shake with banana', 'calories': 180, 'protein': 25, 'fat': 3, 'carbs': 15},
    ]

    # Clear existing today entries for demo user
    FoodEntry.query.filter_by(user_id=demo_user.id, date=today).delete()

    for food in sample_foods:
        entry = FoodEntry(
            user_id=demo_user.id,
            date=today,
            meal_type=food['meal_type'],
            food_name=food['food_name'],
            calories=food['calories'],
            protein=food['protein'],
            fat=food['fat'],
            carbs=food['carbs'],
            serving_size='1 serving'
        )
        db.session.add(entry)
    db.session.commit()
    print(f"Created {len(sample_foods)} food entries for today")

    # Yesterday entries
    yesterday = today - timedelta(days=1)
    FoodEntry.query.filter_by(user_id=demo_user.id, date=yesterday).delete()
    yesterday_foods = [
        {'meal_type': 'breakfast', 'food_name': 'Oatmeal with berries', 'calories': 300, 'protein': 10, 'fat': 6, 'carbs': 52},
        {'meal_type': 'lunch', 'food_name': 'Turkey sandwich with avocado', 'calories': 480, 'protein': 30, 'fat': 22, 'carbs': 40},
        {'meal_type': 'dinner', 'food_name': 'Beef stir fry with vegetables', 'calories': 520, 'protein': 35, 'fat': 25, 'carbs': 30},
        {'meal_type': 'snack', 'food_name': 'Mixed nuts and dried fruit', 'calories': 220, 'protein': 6, 'fat': 14, 'carbs': 18},
    ]
    for food in yesterday_foods:
        entry = FoodEntry(
            user_id=demo_user.id,
            date=yesterday,
            meal_type=food['meal_type'],
            food_name=food['food_name'],
            calories=food['calories'],
            protein=food['protein'],
            fat=food['fat'],
            carbs=food['carbs'],
            serving_size='1 serving'
        )
        db.session.add(entry)
    db.session.commit()
    print(f"Created {len(yesterday_foods)} food entries for yesterday")

    # Water entries
    WaterEntry.query.filter_by(user_id=demo_user.id, date=today).delete()
    WaterEntry.query.filter_by(user_id=demo_user.id, date=yesterday).delete()
    for ml in [500, 500, 250, 750]:
        db.session.add(WaterEntry(user_id=demo_user.id, date=today, amount_ml=ml))
    for ml in [500, 500, 500]:
        db.session.add(WaterEntry(user_id=demo_user.id, date=yesterday, amount_ml=ml))
    db.session.commit()
    print("Created water entries")

    # Weight entries (last 7 days)
    weights = [75.2, 75.0, 74.8, 74.6, 74.4, 74.2, 74.1]
    for i, w in enumerate(weights):
        d = today - timedelta(days=6-i)
        existing = WeightEntry.query.filter_by(user_id=demo_user.id, date=d).first()
        if not existing:
            db.session.add(WeightEntry(user_id=demo_user.id, date=d, weight_kg=w))
    db.session.commit()
    print("Created weight entries")

    print("\nDemo user ready:")
    print("  Email:    demo@bio-sync.com")
    print("  Password: demo123")
