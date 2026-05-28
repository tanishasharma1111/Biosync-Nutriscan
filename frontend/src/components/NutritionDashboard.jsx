import { useEffect, useState } from 'react'

function CircularProgress({ value, max, label, unit, color }) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const percentage = Math.min((animatedValue / max) * 100, 100)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          <circle
            cx="56"
            cy="56"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(value)}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-400">{label}</p>
      <p className="text-xs text-gray-500">{unit}</p>
    </div>
  )
}

function HealthGauge({ score }) {
  const getColor = () => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBgColor = () => {
    if (score >= 70) return 'from-green-500/20'
    if (score >= 40) return 'from-yellow-500/20'
    return 'from-red-500/20'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${getBgColor()} to-transparent p-1`}>
          <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
            <span className={`text-4xl font-bold ${getColor()}`}>{score}</span>
          </div>
        </div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <span className={`text-xs px-2 py-1 rounded-full ${getColor()} bg-gray-800`}>
            {score >= 70 ? 'Healthy' : score >= 40 ? 'Moderate' : 'Unhealthy'}
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-400">Health Score</p>
    </div>
  )
}

function NutritionDashboard({ scan }) {
  const { food_name, confidence, nutrition, health_score } = scan
  const percentage = Math.round(confidence * 100)

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold capitalize">{food_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-400">Confidence:</span>
            <span className="px-2 py-1 bg-emerald-400/20 text-emerald-400 rounded-full text-sm font-medium">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 py-8">
        <CircularProgress
          value={nutrition.calories}
          max={500}
          label="Calories"
          unit="kcal"
          color="#f97316"
        />
        <CircularProgress
          value={nutrition.protein}
          max={50}
          label="Protein"
          unit="g"
          color="#3b82f6"
        />
        <CircularProgress
          value={nutrition.fat}
          max={65}
          label="Fat"
          unit="g"
          color="#eab308"
        />
        <CircularProgress
          value={nutrition.carbs}
          max={100}
          label="Carbs"
          unit="g"
          color="#8b5cf6"
        />
        <HealthGauge score={health_score} />
      </div>
    </div>
  )
}

export default NutritionDashboard