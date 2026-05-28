function InsightPanel({ insight }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 animate-fade-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-200">AI Health Insights</h3>
          <p className="text-sm text-gray-500">Powered by Llama 3</p>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{insight}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <span>Analysis based on nutritional data</span>
      </div>
    </div>
  )
}

export default InsightPanel