import os
import uuid
import json
import jwt
import requests
from datetime import datetime as dt, date, datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from database import db, init_db, bcrypt, User, Scan, UserProfile, UserGoals, FoodEntry, WaterEntry, WeightEntry, MealPlan, SkinScan, SkincareProduct, GroceryItem, SleepStressEntry, SupplementEntry
from preprocess import preprocess_image
from detect_food import detect_food
from nutrition import get_nutrition
from skin_logic import analyze_ingredients, get_diet_skin_correlation, generate_smart_grocery_list, generate_skincare_advice, get_condition_recommendations
from skin_model import predict_skin_concern
from ai_insight import generate_insight, calculate_health_score, generate_skin_ai_insight, analyze_skin_vision

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///nutriscan.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'nutriscan-secret-key-change-in-production')

# Relax CORS for local development to prevent 'Failed to fetch'
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

init_db(app)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = jwt.encode({
        'user_id': user.id,
        'exp': dt.utcnow() + timedelta(days=7)
    }, app.config['JWT_SECRET'], algorithm='HS256')

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 201


@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': dt.utcnow() + timedelta(days=7)
    }, app.config['JWT_SECRET'], algorithm='HS256')

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@app.route('/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify(current_user.to_dict()), 200


@app.route('/upload', methods=['POST'])
@token_required
def upload(current_user):
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    upload_dir = './uploads'
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[1].lower()
    temp_filename = f"{uuid.uuid4()}.{ext}"
    temp_path = os.path.join(upload_dir, temp_filename)
    file.save(temp_path)

    try:
        processed_path = preprocess_image(temp_path, upload_dir)

        detection = detect_food(processed_path)
        if 'error' in detection:
            os.remove(temp_path)
            if 'low_confidence' in detection['error']:
                return jsonify({'error': 'Could not identify food with sufficient confidence'}), 422
            return jsonify(detection), 500

        food_name = detection['food_name']
        confidence = detection['confidence']
        
        # Determine nutrition data (Source prioritization)
        nutrition_data = None
        
        # Source 1: Local Vision AI (Direct from image analyze)
        if detection.get('nutrition'):
            nutrition_data = detection['nutrition']

        # Source 2: Local Text AI (Estimation fallback)
        if not nutrition_data:
            nutrition_data = get_nutrition(food_name)

        if not nutrition_data:
            os.remove(temp_path)
            return jsonify({'error': 'Could not retrieve nutrition data for identified food'}), 404

        calories = nutrition_data.get('calories', 0)
        protein = nutrition_data.get('protein', 0)
        fat = nutrition_data.get('fat', 0)
        carbs = nutrition_data.get('carbs', 0)

        health_score = calculate_health_score(calories, protein, fat, carbs)

        insight = generate_insight(food_name, calories, protein, fat, carbs)

        scan = Scan(
            user_id=current_user.id,
            food_name=food_name,
            confidence=confidence,
            calories=calories,
            protein=protein,
            fat=fat,
            carbs=carbs,
            health_score=health_score,
            ai_insight=insight,
            image_path=processed_path
        )
        db.session.add(scan)
        db.session.commit()

        return jsonify(scan.to_dict()), 201

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'error': str(e)}), 500


@app.route('/history', methods=['GET'])
@token_required
def history(current_user):
    try:
        scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).all()
        return jsonify([scan.to_dict() for scan in scans]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/scan/<int:scan_id>', methods=['GET'])
@token_required
def get_scan(current_user, scan_id):
    try:
        scan = Scan.query.filter_by(id=scan_id, user_id=current_user.id).first()
        if not scan:
            return jsonify({'error': 'Scan not found'}), 404
        return jsonify(scan.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/scan/<int:scan_id>', methods=['DELETE'])
@token_required
def delete_scan(current_user, scan_id):
    try:
        scan = Scan.query.filter_by(id=scan_id, user_id=current_user.id).first()
        if not scan:
            return jsonify({'error': 'Scan not found'}), 404

        if scan.image_path and os.path.exists(scan.image_path):
            os.remove(scan.image_path)

        db.session.delete(scan)
        db.session.commit()
        return jsonify({'message': 'Scan deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200


# ============ USER PROFILE ROUTES ============

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'profile': None}), 200
    return jsonify({'profile': profile.to_dict()}), 200


@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.session.add(profile)

    if 'gender' in data: profile.gender = data['gender']
    if 'age' in data: profile.age = data['age']
    if 'height_cm' in data: profile.height_cm = data['height_cm']
    if 'weight_kg' in data: profile.weight_kg = data['weight_kg']
    if 'activity_level' in data: profile.activity_level = data['activity_level']
    if 'weight_goal' in data: profile.weight_goal = data['weight_goal']
    if 'goal_weight_kg' in data: profile.goal_weight_kg = data['goal_weight_kg']

    db.session.commit()
    return jsonify({}), 200


# ============ FOOD SEARCH (USDA) ============

USDA_API_KEY = os.getenv('USDA_API_KEY', 'k30MiModx79dRPbbngGZJ9HzYtMVCdNp49hwwhnc')
USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

@app.route('/api/food/search', methods=['GET'])
@token_required
def search_food(current_user):
    query = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    if not query:
        return jsonify({'foods': [], 'totalHits': 0}), 200

    try:
        url = f'{USDA_BASE_URL}/foods/search'
        params = {
            'api_key': USDA_API_KEY,
            'query': query,
            'pageSize': 20,
            'pageNumber': page,
            'dataType': ['Foundation', 'SR Legacy']
        }
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code != 200:
            return jsonify({'error': 'USDA API error', 'details': resp.text}), 502

        data = resp.json()
        foods = []
        for item in data.get('foods', []):
            nutrients = {n['nutrientId']: n['value'] for n in item.get('foodNutrients', [])}
            foods.append({
                'fdcId': item.get('fdcId'),
                'description': item.get('description', ''),
                'brand': item.get('brandOwner', ''),
                'serving_size': item.get('servingSize', ''),
                'serving_unit': item.get('servingUnit', ''),
                'calories': nutrients.get(1008, 0),
                'protein': nutrients.get(1003, 0),
                'fat': nutrients.get(1004, 0),
                'carbs': nutrients.get(1005, 0)
            })
        return jsonify({'foods': foods, 'totalHits': data.get('totalHits', 0)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============ FOOD LOG ROUTES ============

@app.route('/api/food/log', methods=['POST'])
@token_required
def log_food(current_user):
    data = request.get_json()
    date_str = data.get('date', date.today().isoformat())
    entry = FoodEntry(
        user_id=current_user.id,
        date=datetime.strptime(date_str, '%Y-%m-%d').date(),
        meal_type=data.get('meal_type', 'snack'),
        food_name=data.get('food_name', ''),
        brand=data.get('brand', ''),
        calories=float(data.get('calories', 0)),
        protein=float(data.get('protein', 0)),
        fat=float(data.get('fat', 0)),
        carbs=float(data.get('carbs', 0)),
        serving_size=data.get('serving_size', ''),
        servings=float(data.get('servings', 1))
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'entry': entry.to_dict()}), 201


@app.route('/api/food/log', methods=['GET'])
@token_required
def get_food_log(current_user):
    date_str = request.args.get('date', date.today().isoformat())
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    entries = FoodEntry.query.filter_by(
        user_id=current_user.id, date=target_date
    ).order_by(FoodEntry.created_at).all()
    return jsonify({'entries': [e.to_dict() for e in entries]}), 200


@app.route('/api/food/log/<int:entry_id>', methods=['DELETE'])
@token_required
def delete_food_log(current_user, entry_id):
    entry = FoodEntry.query.filter_by(id=entry_id, user_id=current_user.id).first()
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


# ============ WATER LOG ROUTES ============

@app.route('/api/water/log', methods=['POST'])
@token_required
def log_water(current_user):
    data = request.get_json()
    date_str = data.get('date', date.today().isoformat())
    entry = WaterEntry(
        user_id=current_user.id,
        date=datetime.strptime(date_str, '%Y-%m-%d').date(),
        amount_ml=int(data.get('amount_ml', 0))
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'entry': entry.to_dict()}), 201


@app.route('/api/water/log', methods=['GET'])
@token_required
def get_water_log(current_user):
    date_str = request.args.get('date', date.today().isoformat())
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    entries = WaterEntry.query.filter_by(
        user_id=current_user.id, date=target_date
    ).order_by(WaterEntry.created_at).all()
    total = sum(e.amount_ml for e in entries)
    return jsonify({'entries': [e.to_dict() for e in entries], 'total_ml': total}), 200


# ============ WEIGHT LOG ROUTES ============

@app.route('/api/weight/log', methods=['POST'])
@token_required
def log_weight(current_user):
    data = request.get_json()
    date_str = data.get('date', date.today().isoformat())
    entry = WeightEntry(
        user_id=current_user.id,
        date=datetime.strptime(date_str, '%Y-%m-%d').date(),
        weight_kg=float(data.get('weight_kg', 0))
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'entry': entry.to_dict()}), 201


@app.route('/api/weight/log', methods=['GET'])
@token_required
def get_weight_log(current_user):
    days = int(request.args.get('days', 30))
    cutoff = date.today() - timedelta(days=days)
    entries = WeightEntry.query.filter(
        WeightEntry.user_id == current_user.id,
        WeightEntry.date >= cutoff
    ).order_by(WeightEntry.date).all()
    return jsonify({'entries': [e.to_dict() for e in entries]}), 200


# ============ GOALS ROUTES ============

@app.route('/api/goals', methods=['GET'])
@token_required
def get_goals(current_user):
    goals = UserGoals.query.filter_by(user_id=current_user.id).first()
    if not goals:
        return jsonify({'goals': None}), 200
    return jsonify({'goals': goals.to_dict()}), 200


@app.route('/api/goals', methods=['POST'])
@token_required
def set_goals(current_user):
    data = request.get_json()
    goals = UserGoals.query.filter_by(user_id=current_user.id).first()
    if not goals:
        goals = UserGoals(user_id=current_user.id)
        db.session.add(goals)

    goals.daily_calories = int(data.get('daily_calories', 2000))
    goals.protein_grams = float(data.get('protein', 150))
    goals.fat_grams = float(data.get('fat', 65))
    goals.carbs_grams = float(data.get('carbs', 200))
    goals.water_ml = int(data.get('water_ml', 2000))
    db.session.commit()
    return jsonify({'goals': goals.to_dict()}), 201


@app.route('/api/goals/calculate', methods=['POST'])
@token_required
def calculate_user_goals(current_user):
    data = request.get_json()
    profile = UserProfile.query.filter_by(user_id=current_user.id).first()

    weight_kg = data.get('weight_kg') or (profile.weight_kg if profile else None)
    height_cm = data.get('height_cm') or (profile.height_cm if profile else None)
    age = data.get('age') or (profile.age if profile else None)
    gender = data.get('gender') or (profile.gender if profile else 'male')
    activity_level = data.get('activity_level') or (profile.activity_level if profile else 'sedentary')
    weight_goal = data.get('weight_goal') or (profile.weight_goal if profile else 'maintain')

    if not weight_kg or not height_cm or not age:
        return jsonify({'error': 'weight_kg, height_cm, and age are required'}), 400

    results = calculate_goals(weight_kg, height_cm, age, gender, activity_level, weight_goal)
    return jsonify({'goals': results}), 200


# ============ MEAL PLANNING ROUTES ============

@app.route('/api/meal-plans', methods=['GET'])
@token_required
def get_meal_plans(current_user):
    plans = MealPlan.query.filter_by(user_id=current_user.id).order_by(MealPlan.day_of_week, MealPlan.meal_type).all()
    return jsonify({'plans': [p.to_dict() for p in plans]}), 200


@app.route('/api/meal-plans', methods=['POST'])
@token_required
def save_meal_plan(current_user):
    data = request.get_json()
    # Replace entire day/meal combo or add new
    existing = MealPlan.query.filter_by(
        user_id=current_user.id,
        day_of_week=data.get('day_of_week'),
        meal_type=data.get('meal_type'),
        food_name=data.get('food_name')
    ).first()
    if existing:
        existing.calories = float(data.get('calories', 0))
        existing.protein = float(data.get('protein', 0))
        existing.fat = float(data.get('fat', 0))
        existing.carbs = float(data.get('carbs', 0))
        existing.servings = float(data.get('servings', 1))
    else:
        plan = MealPlan(
            user_id=current_user.id,
            day_of_week=data.get('day_of_week'),
            meal_type=data.get('meal_type'),
            food_name=data.get('food_name'),
            calories=float(data.get('calories', 0)),
            protein=float(data.get('protein', 0)),
            fat=float(data.get('fat', 0)),
            carbs=float(data.get('carbs', 0)),
            servings=float(data.get('servings', 1))
        )
        db.session.add(plan)
    db.session.commit()
    return jsonify({'message': 'Meal plan saved'}), 200


@app.route('/api/meal-plans/copy', methods=['POST'])
@token_required
def copy_meal_plan(current_user):
    data = request.get_json()
    source_date = datetime.strptime(data.get('date', date.today().isoformat()), '%Y-%m-%d').date()
    # Copy entries from that date's food log as a "plan"
    entries = FoodEntry.query.filter_by(user_id=current_user.id, date=source_date).all()
    for e in entries:
        existing = MealPlan.query.filter_by(
            user_id=current_user.id,
            day_of_week=source_date.weekday(),
            meal_type=e.meal_type,
            food_name=e.food_name
        ).first()
        if not existing:
            plan = MealPlan(
                user_id=current_user.id,
                day_of_week=source_date.weekday(),
                meal_type=e.meal_type,
                food_name=e.food_name,
                calories=e.calories,
                protein=e.protein,
                fat=e.fat,
                carbs=e.carbs,
                servings=e.servings
            )
            db.session.add(plan)
    db.session.commit()
    return jsonify({'message': 'Meal plan copied'}), 200


# ============ BARCODE LOOKUP (Open Food Facts) ============

@app.route('/api/barcode/lookup', methods=['POST'])
@token_required
def lookup_barcode(current_user):
    data = request.get_json()
    barcode = data.get('barcode', '')
    if not barcode:
        return jsonify({'error': 'barcode required'}), 400

    try:
        url = f'https://world.openfoodfacts.org/api/v0/product/{barcode}.json'
        resp = requests.get(url, timeout=10, headers={'User-Agent': 'NutriScanAI/1.0'})
        if resp.status_code != 200:
            return jsonify({'error': 'Open Food Facts API error'}), 502

        product = resp.json().get('product', {})
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        nutrients = product.get('nutriments', {})
        return jsonify({
            'food': {
                'fdcId': None,
                'description': product.get('product_name', product.get('product_name_en', 'Unknown')),
                'brand': product.get('brands', ''),
                'serving_size': product.get('serving_size', ''),
                'serving_unit': 'g',
                'calories': nutrients.get('energy-kcal_100g', 0),
                'protein': nutrients.get('proteins_100g', 0),
                'fat': nutrients.get('fat_100g', 0),
                'carbs': nutrients.get('carbohydrates_100g', 0)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============ SKIN TRACKER ROUTES ============

@app.route('/api/skin/history', methods=['GET'])
@token_required
def get_skin_history(current_user):
    scans = SkinScan.query.filter_by(user_id=current_user.id).order_by(SkinScan.created_at.desc()).all()
    return jsonify([s.to_dict() for s in scans]), 200

@app.route('/api/skin/scan', methods=['POST'])
@token_required
def upload_skin_scan(current_user):
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    acne_score = int(request.form.get('acne_score', 0))
    glow_score = int(request.form.get('glow_score', 0))
    
    upload_dir = './uploads/skin'
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    
    # Extract features using robust OpenCV logic
    from skin_analysis import analyze_skin_image, classify_condition
    metrics = analyze_skin_image(filepath)
    condition, confidence_score = classify_condition(metrics)
    
    # Generate specialized product recommendations based on strict mapping
    recs = get_condition_recommendations(condition)
    
    # Create the strict JSON output required by the frontend/user
    api_response = {
        "condition": condition,
        "confidence": confidence_score,
        "metrics": metrics,
        "recommended_actives": recs.get("recommended_actives", []),
        "natural_remedies": recs.get("natural_remedies", [])
    }
    
    # AI Insight (Legacy text for summary)
    insight = f"Detected primary concern: {condition}. Extracted accurate metrics using deterministic OpenCV analysis."
    
    scan = SkinScan(
        user_id=current_user.id,
        image_path=filepath,
        acne_score=acne_score,
        glow_score=glow_score,
        skin_concern=condition,
        confidence=confidence_score,
        ai_insight=insight,
        analysis_data=json.dumps(api_response), # Save the full structured JSON for history
        recommendations=json.dumps(recs)
    )
    db.session.add(scan)
    db.session.commit()
    
    # Return exactly the structured JSON format the user requested
    # We can inject the DB id / image_path into it if frontend needs history rendering
    api_response["id"] = scan.id
    api_response["image_path"] = scan.image_path
    return jsonify(api_response), 201

@app.route('/api/skin/correlation', methods=['GET'])
@token_required
def get_skin_correlation(current_user):
    food_entries = FoodEntry.query.filter_by(user_id=current_user.id).all()
    skin_scans = SkinScan.query.filter_by(user_id=current_user.id).all()
    correlation = get_diet_skin_correlation(food_entries, skin_scans)
    return jsonify({'correlation': correlation}), 200

@app.route('/api/skin/recommend', methods=['POST'])
@token_required
def get_skin_recommendations(current_user):
    data = request.get_json()
    skin_concern = data.get('skin_concern')
    if not skin_concern:
        return jsonify({'error': 'skin_concern required'}), 400
    
    recs = get_condition_recommendations(skin_concern)
    return jsonify(recs), 200


# ============ SKINCARE ANALYZER ROUTES ============

@app.route('/api/skincare/analyze', methods=['POST'])
@token_required
def analyze_skincare(current_user):
    data = request.get_json()
    name = data.get('name', 'Unknown Product')
    ingredients = data.get('ingredients', '')
    
    is_safe, concerns = analyze_ingredients(ingredients)
    
    product = SkincareProduct(
        user_id=current_user.id,
        name=name,
        ingredients=ingredients,
        is_safe=is_safe,
        concerns=", ".join(concerns)
    )
    db.session.add(product)
    db.session.commit()
    
    return jsonify(product.to_dict()), 200


# ============ SMART GROCERY ROUTES ============

@app.route('/api/grocery/generate', methods=['POST'])
@token_required
def generate_grocery(current_user):
    food_entries = FoodEntry.query.filter_by(user_id=current_user.id).all()
    goals = UserGoals.query.filter_by(user_id=current_user.id).first()
    
    items = generate_smart_grocery_list(food_entries, goals)
    
    # Clear old items and add new ones
    GroceryItem.query.filter_by(user_id=current_user.id).delete()
    
    new_items = []
    if not isinstance(items, list):
        items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        gi = GroceryItem(
            user_id=current_user.id,
            name=item.get('name', 'Item'),
            category=item.get('category', 'General'),
            reason=item.get('reason', 'Skin-friendly recommendation')
        )
        db.session.add(gi)
        new_items.append(gi)

    db.session.commit()
    return jsonify([i.to_dict() for i in new_items]), 201

@app.route('/api/grocery/list', methods=['GET'])
@token_required
def get_grocery_list(current_user):
    items = GroceryItem.query.filter_by(user_id=current_user.id).all()
    return jsonify([i.to_dict() for i in items]), 200

@app.route('/api/grocery/toggle/<int:item_id>', methods=['POST'])
@token_required
def toggle_grocery(current_user, item_id):
    item = GroceryItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    item.is_bought = not item.is_bought
    db.session.commit()
    return jsonify(item.to_dict()), 200


# ============ SLEEP & STRESS ROUTES ============

@app.route('/api/sleep-stress/log', methods=['POST'])
@token_required
def log_sleep_stress(current_user):
    data = request.get_json()
    date_str = data.get('date', date.today().isoformat())
    # Upsert: one entry per day
    existing = SleepStressEntry.query.filter_by(
        user_id=current_user.id,
        date=datetime.strptime(date_str, '%Y-%m-%d').date()
    ).first()
    if existing:
        existing.sleep_hours = float(data.get('sleep_hours', existing.sleep_hours))
        existing.stress_level = int(data.get('stress_level', existing.stress_level))
        existing.notes = data.get('notes', existing.notes)
    else:
        existing = SleepStressEntry(
            user_id=current_user.id,
            date=datetime.strptime(date_str, '%Y-%m-%d').date(),
            sleep_hours=float(data.get('sleep_hours', 7)),
            stress_level=int(data.get('stress_level', 5)),
            notes=data.get('notes', '')
        )
        db.session.add(existing)
    db.session.commit()
    return jsonify(existing.to_dict()), 201


@app.route('/api/sleep-stress/log', methods=['GET'])
@token_required
def get_sleep_stress(current_user):
    days = int(request.args.get('days', 7))
    cutoff = date.today() - timedelta(days=days)
    entries = SleepStressEntry.query.filter(
        SleepStressEntry.user_id == current_user.id,
        SleepStressEntry.date >= cutoff
    ).order_by(SleepStressEntry.date).all()
    return jsonify({'entries': [e.to_dict() for e in entries]}), 200


# ============ SUPPLEMENT & MEDICATION ROUTES ============

@app.route('/api/supplements/log', methods=['POST'])
@token_required
def log_supplement(current_user):
    data = request.get_json()
    date_str = data.get('date', date.today().isoformat())
    entry = SupplementEntry(
        user_id=current_user.id,
        date=datetime.strptime(date_str, '%Y-%m-%d').date(),
        name=data.get('name', 'Supplement'),
        dosage=data.get('dosage', ''),
        category=data.get('category', 'supplement'),
        taken=data.get('taken', True)
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@app.route('/api/supplements/log', methods=['GET'])
@token_required
def get_supplements(current_user):
    date_str = request.args.get('date', date.today().isoformat())
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    entries = SupplementEntry.query.filter_by(
        user_id=current_user.id, date=target_date
    ).order_by(SupplementEntry.created_at).all()
    return jsonify({'entries': [e.to_dict() for e in entries]}), 200


@app.route('/api/supplements/log/<int:entry_id>', methods=['DELETE'])
@token_required
def delete_supplement(current_user, entry_id):
    entry = SupplementEntry.query.filter_by(id=entry_id, user_id=current_user.id).first()
    if not entry:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


# ============ SKIN PROGRESS TIMELINE ============

@app.route('/api/skin/progress', methods=['GET'])
@token_required
def get_skin_progress(current_user):
    scans = SkinScan.query.filter_by(user_id=current_user.id).order_by(SkinScan.created_at).all()
    return jsonify([s.to_dict() for s in scans]), 200


# ============ BARCODE SKIN IMPACT ============

@app.route('/api/barcode/skin-impact', methods=['POST'])
@token_required
def barcode_skin_impact(current_user):
    data = request.get_json()
    barcode = data.get('barcode', '')
    if not barcode:
        return jsonify({'error': 'barcode required'}), 400

    try:
        url = f'https://world.openfoodfacts.org/api/v0/product/{barcode}.json'
        resp = requests.get(url, timeout=10, headers={'User-Agent': 'NutriScanAI/1.0'})
        if resp.status_code != 200:
            return jsonify({'error': 'API error'}), 502

        product = resp.json().get('product', {})
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        nutrients = product.get('nutriments', {})
        name = product.get('product_name', 'Unknown')
        ingredients_text = product.get('ingredients_text', '').lower()

        # Skin impact analysis
        warnings = []
        skin_score = 80  # Start optimistic

        sugar = nutrients.get('sugars_100g', 0) or 0
        if sugar > 15:
            warnings.append(f"High sugar ({sugar}g/100g) — can trigger acne & inflammation")
            skin_score -= 25

        fat_sat = nutrients.get('saturated-fat_100g', 0) or 0
        if fat_sat > 5:
            warnings.append(f"High saturated fat ({fat_sat}g/100g) — linked to oily skin & breakouts")
            skin_score -= 15

        if any(d in ingredients_text for d in ['milk', 'whey', 'casein', 'lactose', 'cream', 'cheese']):
            warnings.append("Contains dairy — a known acne trigger for many people")
            skin_score -= 20

        if any(g in ingredients_text for g in ['high fructose corn syrup', 'maltodextrin', 'dextrose']):
            warnings.append("Contains high-glycemic sweeteners — spikes blood sugar = acne flares")
            skin_score -= 15

        sodium = nutrients.get('sodium_100g', 0) or 0
        if sodium > 0.6:
            warnings.append(f"High sodium ({sodium}g/100g) — causes water retention & puffiness")
            skin_score -= 10

        skin_score = max(0, min(100, skin_score))

        return jsonify({
            'product_name': name,
            'brand': product.get('brands', ''),
            'calories': nutrients.get('energy-kcal_100g', 0),
            'sugar_g': sugar,
            'fat_sat_g': fat_sat,
            'skin_score': skin_score,
            'warnings': warnings,
            'verdict': 'Skin-Friendly ✅' if skin_score >= 70 else ('Caution ⚠️' if skin_score >= 40 else 'Avoid for Skin ❌')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
