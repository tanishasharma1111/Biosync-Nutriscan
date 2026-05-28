import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = {
  calories: '#f97316',
  protein: '#3b82f6',
  fat: '#eab308',
  carbs: '#8b5cf6'
}

function NutritionChart({ nutrition }) {
  const data = [
    { name: 'Calories', value: nutrition.calories, color: COLORS.calories, unit: 'kcal' },
    { name: 'Protein', value: nutrition.protein, color: COLORS.protein, unit: 'g' },
    { name: 'Fat', value: nutrition.fat, color: COLORS.fat, unit: 'g' },
    { name: 'Carbs', value: nutrition.carbs, color: COLORS.carbs, unit: 'g' }
  ]

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Macro Breakdown</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={70} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value, name, props) => [`${value} ${data.find(d => d.name === name)?.unit}`, name]}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default NutritionChart