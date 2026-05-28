import requests
import json

# List of common comedogenic/pore-clogging ingredients
COMEDOGENIC_INGREDIENTS = {
    "coconut oil": "Highly comedogenic (4-5/5)",
    "cocoa butter": "Highly comedogenic (4/5)",
    "isopropyl myristate": "Highly comedogenic (5/5)",
    "isopropyl palmitate": "Highly comedogenic (4/5)",
    "lanolin": "Can be comedogenic (2-4/5)",
    "sodium lauryl sulfate": "Irritating and potentially comedogenic",
    "algae extract": "Highly comedogenic",
    "acetylated lanolin alcohol": "Highly comedogenic (4/5)",
    "marula oil": "Can be comedogenic (3-4/5)"
}

# Curated product database keyed by ML-detected skin concern
PRODUCT_RECOMMENDATIONS = {
    "mel": {
        "status": "Warning",
        "message": "Immediate Dermatologist Consultation Required",
        "products": [
            {"name": "Mineral Broad-Spectrum SPF 50+", "icon": "☀️", "reason": "Zinc/Titanium based protection is essential for high-risk spots to prevent further UV DNA damage."},
            {"name": "Doctor Referral", "icon": "🏥", "reason": "Potential Melanoma detected. Please see a skin cancer specialist immediately for a biopsy."}
        ],
        "remedies": [
            {"name": "Strict Sun Avoidance", "icon": "⛱️", "step": "Wear UPF 50+ clothing and avoid peak sun hours (10am-4pm)."},
            {"name": "Dermoscopic Exam", "icon": "🔍", "step": "Book an appointment within 1-2 weeks for professional screening."}
        ]
    },
    "bcc": {
        "status": "Warning",
        "message": "Medical Consultation Recommended",
        "products": [
            {"name": "Fragrance-Free Mineral SPF", "icon": "🛡️", "reason": "Protection for sensitive, potentially compromised skin barriers."},
            {"name": "Dermatologist Visit", "icon": "👩‍⚕️", "reason": "Potential Basal Cell Carcinoma should be professionally evaluated."}
        ],
        "remedies": [
            {"name": "Monitor Changes", "icon": "📝", "step": "Track any bleeding, crusting, or size changes daily until your appointment."},
            {"name": "Gentle Cleansing", "icon": "🧼", "step": "Use only soap-free, non-foaming cleansers on the affected area."}
        ]
    },
    "akiec": {
        "status": "Concern",
        "message": "Actinic Keratoses (Sun Damage)",
        "products": [
            {"name": "Vitamin C + Ferulic Acid", "icon": "🍊", "reason": "Powerful antioxidants to help repair oxidative sun damage and brighten tone."},
            {"name": "Broad-Spectrum SPF 50", "icon": "☀️", "reason": "Non-negotiable to prevent progression of sun-damaged cells."}
        ],
        "remedies": [
            {"name": "Green Tea Rinse", "icon": "🍵", "step": "External application of cooled green tea provides polyphenols to calm inflammation."},
            {"name": "Antioxidant Diet", "icon": "🫐", "step": "Increase intake of lycopene (tomatoes) and polyphenols (berries) for internal UV defense."}
        ]
    },
    "bkl": {
        "status": "Normal",
        "message": "Benign / Aging related pigmentation",
        "products": [
            {"name": "Retinol (0.5%)", "icon": "🌙", "reason": "Speeds up cell turnover to fade age spots and improve skin texture."},
            {"name": "Niacinamide Serum", "icon": "💧", "reason": "Strengthens the barrier and reduces the appearance of hyperpigmentation."}
        ],
        "remedies": [
            {"name": "Alpha-Hydroxy Acid Peel", "icon": "🧪", "step": "Weekly 10% Lactic Acid treatment to gently exfoliate surface pigments."},
            {"name": "Licorice Root Mask", "icon": "🌿", "step": "Natural skin brightener; mix extract with kaolin clay for a gentle mask."}
        ]
    },
    "vasc": {
        "status": "Concern",
        "message": "Vascular Concern / Redness",
        "products": [
            {"name": "Azelaic Acid 10%", "icon": "✨", "reason": "Clinically proven to reduce redness and calm skin reactivity."},
            {"name": "Centella Asiatica (Cica) Cream", "icon": "🌿", "reason": "Deeply soothing ingredient that repairs damaged capillaries and calms heat."}
        ],
        "remedies": [
            {"name": "Cold Compress", "icon": "❄️", "step": "Apply a chilled jade roller or spoon to constrict vessels and reduce flushing."},
            {"name": "Rosewater Mist", "icon": "🌹", "step": "Anti-inflammatory botanical mist to cool down skin temperature instantly."}
        ]
    },
    "nv": {
        "status": "Normal",
        "message": "Common Nevus (Mole)",
        "products": [
            {"name": "Daily Moisturising SPF", "icon": "☀️", "reason": "Keeps the mole area protected from UV-induced color changes."},
            {"name": "Ceramide Moisturiser", "icon": "🌊", "reason": "Maintains healthy skin around the nevus to ensure clarity during monitoring."}
        ],
        "remedies": [
            {"name": "Monthly Self-Check", "icon": "📱", "step": "Use NutriScan every 30 days to track of any 'ABCDE' changes in the mole."},
            {"name": "Vitamin E Oil", "icon": "💧", "step": "Keep the area hydrated to prevent dryness that might mimic skin texture changes."}
        ]
    },
    "df": {
        "status": "Normal",
        "message": "Dermatofibroma (Benign)",
        "products": [
            {"name": "Barrier Repair Balm", "icon": "🩹", "reason": "Protects the firm, raised area from friction and irritation."},
            {"name": "Vitamin C Serum", "icon": "🍊", "reason": "Supports collagen health around the fibrous lesion."}
        ],
        "remedies": [
            {"name": "Avoid Irritation", "icon": "🚫", "step": "Avoid shaving directly over the lesion if it is raised to prevent bleeding."},
            {"name": "Hydration", "icon": "💧", "step": "Maintain general skin hydration to keep the lesion site supple."}
        ]
    }
}

# Skin-friendly food recommendations keyed by nutrient gap
SKIN_FOODS_BY_NUTRIENT = {
    "vitamin_a": [
        {"name": "Sweet Potato", "category": "Produce", "reason": "Extremely high in Vitamin A — reduces acne & speeds skin cell turnover"},
        {"name": "Carrots", "category": "Produce", "reason": "Beta-carotene converts to Vitamin A, reducing skin inflammation"},
    ],
    "omega3": [
        {"name": "Salmon", "category": "Protein", "reason": "Omega-3 fatty acids strengthen skin barrier & reduce redness"},
        {"name": "Walnuts", "category": "Nuts", "reason": "Rich in Omega-3 & Vitamin E for healthy, moisturised skin"},
    ],
    "zinc": [
        {"name": "Pumpkin Seeds", "category": "Nuts", "reason": "High in Zinc — controls oil production & reduces acne bacteria"},
        {"name": "Chickpeas", "category": "Legumes", "reason": "Great plant-based Zinc source for skin repair"},
    ],
    "vitamin_c": [
        {"name": "Bell Peppers", "category": "Produce", "reason": "Top Vitamin C source — boosts collagen & brightens skin tone"},
        {"name": "Strawberries", "category": "Fruit", "reason": "Antioxidant-rich, fights free radicals that age skin"},
    ],
    "antioxidants": [
        {"name": "Blueberries", "category": "Fruit", "reason": "Packed with antioxidants that protect skin from UV damage"},
        {"name": "Spinach", "category": "Produce", "reason": "Iron, Vitamin A & C combo — reduces dark circles & boosts glow"},
    ],
    "hydration": [
        {"name": "Cucumber", "category": "Produce", "reason": "96% water content — keeps skin plump and hydrated"},
        {"name": "Green Tea", "category": "Beverages", "reason": "EGCG antioxidants reduce inflammation & calm acne-prone skin"},
    ],
    "protein": [
        {"name": "Eggs", "category": "Protein", "reason": "Complete protein with biotin — essential for skin & hair repair"},
        {"name": "Greek Yogurt", "category": "Dairy", "reason": "Probiotics balance gut microbiome, which reduces inflammatory acne"},
    ],
    "healthy_fats": [
        {"name": "Avocado", "category": "Produce", "reason": "Healthy monounsaturated fats + Vitamin E — deeply nourishes skin"},
        {"name": "Almonds", "category": "Nuts", "reason": "Vitamin E powerhouse — protects skin cells from oxidative damage"},
    ],
}

# Foods that are BAD for skin (high-fat, high-glycemic, dairy-dominant)
BAD_SKIN_KEYWORDS = [
    "chips", "cookie", "butter", "croissant", "biscuit", "oil", "fast food",
    "fried", "chocolate", "cake", "soda", "pizza", "pastry", "donut", "sugar"
]

# Foods already considered skin-friendly (no need to suggest supplements)
GOOD_SKIN_KEYWORDS = [
    "spinach", "salmon", "avocado", "blueberry", "carrot", "sweet potato",
    "walnut", "almond", "egg", "yogurt", "broccoli", "kale", "green tea",
    "cucumber", "bell pepper", "strawberry", "chickpea", "pumpkin seed"
]


def analyze_ingredients(ingredients_string):
    """Analyzes a string of ingredients for known pore-clogging components."""
    if not ingredients_string:
        return True, []
    
    found_concerns = []
    ingredients_list = [i.strip().lower() for i in ingredients_string.split(',')]
    
    for ingredient in ingredients_list:
        for concern, reason in COMEDOGENIC_INGREDIENTS.items():
            if concern in ingredient:
                found_concerns.append(f"{ingredient.title()} ({reason})")
    
    is_safe = len(found_concerns) == 0
    return is_safe, found_concerns


def get_diet_skin_correlation(food_entries, skin_scans):
    """Correlates diet with skin health using Ollama, with a fallback."""
    if not food_entries or not skin_scans:
        return "Not enough data yet. Log more meals and at least one skin scan to see AI insights!"

    diet_summary = [f"{e.food_name} ({e.meal_type})" for e in food_entries[-20:]]
    skin_summary = [f"Acne Score {s.acne_score}/10, Glow {s.glow_score}/10" for s in skin_scans[-5:]]

    prompt = f"""Analyze diet and skin data. Diet: {', '.join(diet_summary)}.
Skin: {', '.join(skin_summary)}.
Give a 2-3 sentence insight about how this diet may be affecting skin health."""

    try:
        response = requests.post('http://localhost:11434/api/generate', 
                               json={"model": "llama3", "prompt": prompt, "stream": False},
                               timeout=20)
        if response.status_code == 200:
            return response.json().get('response', '')
    except Exception:
        pass

    # Fallback: simple rule-based response
    bad_foods = [e.food_name for e in food_entries if any(b in e.food_name.lower() for b in BAD_SKIN_KEYWORDS)]
    if bad_foods:
        return f"Your recent diet includes {', '.join(bad_foods[:3])}, which are high in refined fats or sugars. These can trigger inflammation and acne flare-ups. Try replacing some of these with leafy greens, nuts, or omega-3 rich foods."
    return "Your diet looks relatively balanced! Keep logging meals regularly so the AI can detect more specific skin-diet patterns over time."


def generate_smart_grocery_list(food_entries, user_goals):
    """
    Generates a skin-friendly grocery list based on nutrient gap analysis.
    Uses pure Python logic — no AI required — so it always works.
    """
    # Analyse what the user has been eating
    eaten_names = [e.food_name.lower() for e in food_entries[-20:]]
    
    # Count bad-skin foods in diet
    bad_count = sum(1 for name in eaten_names if any(b in name for b in BAD_SKIN_KEYWORDS))
    good_count = sum(1 for name in eaten_names if any(g in name for g in GOOD_SKIN_KEYWORDS))

    # Calculate nutritional totals to identify gaps
    total_protein = sum(getattr(e, 'protein', 0) or 0 for e in food_entries[-7:])
    total_fat = sum(getattr(e, 'fat', 0) or 0 for e in food_entries[-7:])
    total_calories = sum(getattr(e, 'calories', 0) or 0 for e in food_entries[-7:])

    # Determine which nutrients are lacking
    gaps = []

    # High fat intake detected → need omega-3 balance
    if total_fat > 150:
        gaps.append("omega3")
    
    # Low protein → need complete protein sources
    if total_protein < 200:
        gaps.append("protein")

    # High bad-skin food ratio
    if bad_count > 2:
        gaps.append("antioxidants")
        gaps.append("vitamin_c")

    # Low good-skin food variety
    if good_count < 2:
        gaps.append("vitamin_a")
        gaps.append("zinc")

    # Always suggest hydration & healthy fats if not already eating them
    has_healthy_fat = any("avocado" in n or "olive" in n or "walnut" in n for n in eaten_names)
    if not has_healthy_fat:
        gaps.append("healthy_fats")

    has_hydration = any("tea" in n or "water" in n or "cucumber" in n for n in eaten_names)
    if not has_hydration:
        gaps.append("hydration")

    # Deduplicate gaps and pick foods for each
    seen_foods = set()
    result = []
    
    # Always ensure at least these base gaps are covered
    if not gaps:
        gaps = ["antioxidants", "omega3", "zinc", "vitamin_a", "healthy_fats"]

    for gap in gaps:
        for food in SKIN_FOODS_BY_NUTRIENT.get(gap, []):
            if food["name"] not in seen_foods:
                # Skip if user already eats this
                if not any(food["name"].lower() in n for n in eaten_names):
                    seen_foods.add(food["name"])
                    result.append(food)
            if len(result) >= 8:
                break
        if len(result) >= 8:
            break

    # Final safety fallback — should never be empty
    if not result:
        result = [
            {"name": "Spinach", "category": "Produce", "reason": "Vitamin A & Iron combo — reduces dark circles & boosts glow"},
            {"name": "Salmon", "category": "Protein", "reason": "Omega-3 fatty acids strengthen skin barrier & reduce redness"},
            {"name": "Blueberries", "category": "Fruit", "reason": "Antioxidants protect skin from UV damage & free radicals"},
            {"name": "Walnuts", "category": "Nuts", "reason": "Omega-3 & Vitamin E — moisturises skin from the inside out"},
            {"name": "Sweet Potato", "category": "Produce", "reason": "Beta-carotene → Vitamin A for skin cell repair"},
        ]

    return result

    return result


def get_condition_recommendations(condition):
    """
    Returns personalized actives and natural remedies based on detected skin condition.
    """
    mapping = {
        "Acne": {
            "recommended_actives": ["Salicylic Acid", "Niacinamide"],
            "natural_remedies": ["Neem", "Tea Tree"]
        },
        "Dry Skin": {
            "recommended_actives": ["Hyaluronic Acid", "Ceramides"],
            "natural_remedies": ["Aloe Vera", "Honey"]
        },
        "Pigmentation": {
            "recommended_actives": ["Vitamin C", "Retinol"],
            "natural_remedies": ["Turmeric"]
        },
        "Redness / Sensitivity": {
            "recommended_actives": ["Azelaic Acid", "Centella Asiatica"],
            "natural_remedies": ["Cucumber", "Oatmeal"]
        },
        "Oily Skin": {
            "recommended_actives": ["Niacinamide", "Zinc"],
            "natural_remedies": ["Green Tea", "Witch Hazel"]
        },
        "Normal Skin": {
            "recommended_actives": ["Vitamin C", "Hyaluronic Acid"],
            "natural_remedies": ["Aloe Vera", "Green Tea"]
        }
    }
    
    return mapping.get(condition, mapping["Normal Skin"])

def generate_skincare_advice(acne_score, glow_score, acne_type):
    """
    Generates rule-based skincare advice (products & remedies).
    """
    products = []
    remedies = []

    # Ensure scores are integers
    try:
        acne_score = int(acne_score)
        glow_score = int(glow_score)
    except:
        acne_score = 0
        glow_score = 0

    # 1. Product Advice (Ingredients/Actives)
    if acne_score > 6:
        products.append({"name": "Salicylic Acid (BHA) Cleanser", "icon": "🧼", "reason": "Deep cleans pores and reduces active breakouts."})
        products.append({"name": "Benzoyl Peroxide Spot Treatment", "icon": "🎯", "reason": "Kills acne-causing bacteria on the surface."})
    elif acne_score > 3:
        products.append({"name": "Niacinamide Serum", "icon": "💧", "reason": "Regulates oil production and calms redness."})
        products.append({"name": "Azelaic Acid", "icon": "✨", "reason": "Gently exfoliates and reduces post-acne marks."})
    else:
        products.append({"name": "Hyaluronic Acid Serum", "icon": "🌊", "reason": "Provides deep hydration without clogging pores."})

    if glow_score < 5:
        products.append({"name": "Vitamin C Serum", "icon": "🍊", "reason": "Powerful antioxidant to brighten and even skin tone."})
        products.append({"name": "Glycolic Acid Toner", "icon": "🧪", "reason": "Chemical exfoliant to remove dead skin cells for a glow."})
    else:
        products.append({"name": "Squalane Oil", "icon": "🥥", "reason": "Lightweight lipid to lock in moisture and sustain radiance."})

    # 2. Natural Home Remedy Advice
    if acne_score > 5:
        remedies.append({"name": "Green Tea Compress", "icon": "🍵", "step": "Brew green tea, let cool, and apply with a cotton pad for 10 mins to reduce inflammation."})
        remedies.append({"name": "Honey Spot Mask", "icon": "🍯", "step": "Apply raw honey to spots for 15 mins. Antibacterial properties help heal active acne."})
    
    if glow_score < 6:
        remedies.append({"name": "Turmeric & Yogurt Mask", "icon": "🥣", "step": "Mix 1 tsp turmeric with 2 tsp yogurt. Apply for 10 mins for an instant brightening boost."})
        remedies.append({"name": "Cold Water Slush", "icon": "❄️", "step": "Splash face with ice-cold water in the morning to constrict vessels and boost circulation."})

    # Always recommend sun protection as a base
    products.append({"name": "Broad-Spectrum SPF 50", "icon": "☀️", "reason": "Non-negotiable to prevent UV damage and aging."})

    return {
        "products": products,
        "remedies": remedies
    }
