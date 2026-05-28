import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BMRCalculator from '../components/BMRCalculator'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Light (exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (exercise 3-5 days/week)' },
  { value: 'active', label: 'Active (exercise 6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (hard exercise daily)' }
]

const WEIGHT_GOALS = [
  { value: 'lose_1', label: 'Lose 1 kg/week' },
  { value: 'lose_0.5', label: 'Lose 0.5 kg/week' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain_0.5', label: 'Gain 0.5 kg/week' },
  { value: 'gain_1', label: 'Gain 1 kg/week' }
]

export default function GoalsSetupPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    height_cm: '',
    weight_kg: '',
    activity_level: 'sedentary',
    weight_goal: 'maintain',
    goal_weight_kg: ''
  })
  const [goalsResult, setGoalsResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleCalculate = async () => {
    const res = await fetch(`${API_BASE}/api/goals/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        gender: formData.gender,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        activity_level: formData.activity_level,
        weight_goal: formData.weight_goal
      })
    })
    const data = await res.json()
    setGoalsResult(data.goals)
    setStep(3)
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      // Save profile
      await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          gender: formData.gender,
          age: parseInt(formData.age),
          height_cm: parseFloat(formData.height_cm),
          weight_kg: parseFloat(formData.weight_kg),
          activity_level: formData.activity_level,
          weight_goal: formData.weight_goal,
          goal_weight_kg: formData.goal_weight_kg ? parseFloat(formData.goal_weight_kg) : null
        })
      })
      // Save goals
      await fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          daily_calories: goalsResult.daily_calories,
          protein: goalsResult.macros.protein,
          fat: goalsResult.macros.fat,
          carbs: goalsResult.macros.carbs,
          water_ml: goalsResult.water_ml
        })
      })
      navigate('/dashboard')
    } catch {}
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Set Your Goals</h1>
          <p className="text-gray-400 text-sm">Step {step} of 3</p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-colors ${s === step ? 'bg-emerald-400' : s < step ? 'bg-emerald-600' : 'bg-gray-600'}`} />
          ))}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Your Profile</h2>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Gender</label>
                <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Age</label>
                  <input type="number" value={formData.age} onChange={e => handleChange('age', e.target.value)}
                    placeholder="Years" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Height (cm)</label>
                  <input type="number" value={formData.height_cm} onChange={e => handleChange('height_cm', e.target.value)}
                    placeholder="cm" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Current Weight (kg)</label>
                <input type="number" step="0.1" value={formData.weight_kg} onChange={e => handleChange('weight_kg', e.target.value)}
                  placeholder="kg" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Activity Level</label>
                <select value={formData.activity_level} onChange={e => handleChange('activity_level', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  {ACTIVITY_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <button onClick={() => setStep(2)}
                className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors"
                disabled={!formData.age || !formData.height_cm || !formData.weight_kg}>
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Your Goal</h2>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Goal Weight (kg)</label>
                <input type="number" step="0.1" value={formData.goal_weight_kg} onChange={e => handleChange('goal_weight_kg', e.target.value)}
                  placeholder={formData.weight_kg} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Weight Change Goal</label>
                <select value={formData.weight_goal} onChange={e => handleChange('weight_goal', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  {WEIGHT_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
                  Back
                </button>
                <button onClick={handleCalculate}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors">
                  Calculate
                </button>
              </div>
            </div>
          )}

          {step === 3 && goalsResult && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Your Daily Targets</h2>
              <BMRCalculator goals={goalsResult} />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
                  Back
                </button>
                <button onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Confirm & Start'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
