"""BMR and TDEE Calculator using Mifflin-St Jeor Equation"""

# Activity level multipliers
ACTIVITY_MULTIPLIERS = {
    'sedentary': 1.2,          # Little or no exercise
    'light': 1.375,           # Light exercise 1-3 days/week
    'moderate': 1.55,         # Moderate exercise 3-5 days/week
    'active': 1.725,          # Hard exercise 6-7 days/week
    'very_active': 1.9        # Very hard exercise, physical job
}

# Weight goals (kg per week)
WEIGHT_GOALS = {
    'lose_0.5': -500,         # Lose 0.5 kg/week
    'lose_1': -1000,          # Lose 1 kg/week
    'maintain': 0,            # Maintain weight
    'gain_0.5': 500,          # Gain 0.5 kg/week
    'gain_1': 1000            # Gain 1 kg/week
}

def calculate_bmr(weight_kg, height_cm, age, gender):
    """
    Calculate BMR using Mifflin-St Jeor equation.
    Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
    Female: BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
    """
    if gender.lower() in ['male', 'm', 'man']:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161


def calculate_tdee(bmr, activity_level):
    """Calculate TDEE by multiplying BMR by activity multiplier."""
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level.lower(), 1.2)
    return bmr * multiplier


def calculate_daily_calories(tdee, weight_goal):
    """
    Adjust TDEE based on weight goal.
    weight_goal: string like 'lose_0.5', 'lose_1', 'maintain', 'gain_0.5', 'gain_1'
    Returns target daily calorie intake.
    """
    adjustment = WEIGHT_GOALS.get(weight_goal, 0)
    return tdee + adjustment


def calculate_macros(calories, goal='maintain'):
    """
    Calculate macro breakdown based on calorie target.
    Default split for maintenance: 30% protein, 30% fat, 40% carbs
    For weight loss: 35% protein, 25% fat, 40% carbs
    For weight gain: 25% protein, 25% fat, 50% carbs
    """
    if goal in ['lose_0.5', 'lose_1']:
        # Higher protein, lower fat for weight loss
        protein_pct = 0.35
        fat_pct = 0.25
    elif goal in ['gain_0.5', 'gain_1']:
        # Higher carbs for weight gain
        protein_pct = 0.25
        fat_pct = 0.25
    else:
        # Balanced maintenance
        protein_pct = 0.30
        fat_pct = 0.30

    carbs_pct = 1 - protein_pct - fat_pct

    protein_calories = calories * protein_pct
    fat_calories = calories * fat_pct
    carbs_calories = calories * carbs_pct

    # Protein: 4 cal/g, Fat: 9 cal/g, Carbs: 4 cal/g
    protein_grams = protein_calories / 4
    fat_grams = fat_calories / 9
    carbs_grams = carbs_calories / 4

    return {
        'protein': round(protein_grams, 1),
        'fat': round(fat_grams, 1),
        'carbs': round(carbs_grams, 1)
    }


def calculate_goals(weight_kg, height_cm, age, gender, activity_level, weight_goal):
    """
    Main function to calculate all goals.
    Returns dict with bmr, tdee, daily_calories, and macro breakdown.
    """
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)
    daily_calories = calculate_daily_calories(tdee, weight_goal)
    macros = calculate_macros(daily_calories, weight_goal)

    return {
        'bmr': round(bmr, 0),
        'tdee': round(tdee, 0),
        'daily_calories': round(daily_calories, 0),
        'macros': macros,
        'water_ml': 2000  # Default water goal
    }
