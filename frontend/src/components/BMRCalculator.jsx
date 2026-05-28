export default function BMRCalculator({ goals }) {
  if (!goals) return null
  const { bmr, tdee, daily_calories, macros, water_ml } = goals

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">BMR</p>
          <p className="text-white font-bold">{bmr}</p>
          <p className="text-gray-500 text-xs">kcal</p>
        </div>
        <div className="bg-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">TDEE</p>
          <p className="text-white font-bold">{tdee}</p>
          <p className="text-gray-500 text-xs">kcal</p>
        </div>
        <div className="bg-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-emerald-400 text-xs mb-1">Daily Target</p>
          <p className="text-emerald-400 font-bold">{daily_calories}</p>
          <p className="text-emerald-400/70 text-xs">kcal</p>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-3">Macronutrient Targets</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-300 text-sm">Protein</span>
            </div>
            <span className="text-white font-medium">{macros.protein}g</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-300 text-sm">Fat</span>
            </div>
            <span className="text-white font-medium">{macros.fat}g</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-300 text-sm">Carbs</span>
            </div>
            <span className="text-white font-medium">{macros.carbs}g</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <span className="text-gray-300 text-sm">Water Goal</span>
        </div>
        <span className="text-white font-medium">{water_ml} ml/day</span>
      </div>
    </div>
  )
}
