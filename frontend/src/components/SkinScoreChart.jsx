import React from 'react';

const SkinScoreChart = ({ analysisData }) => {
  if (!analysisData || (!analysisData.scores && !analysisData.metrics)) return null;

  const dataMap = analysisData.metrics || analysisData.scores;
  const { condition, confidence, reason } = analysisData;

  const scoreLabels = {
    acne: 'Acne Severity',
    dryness: 'Dryness Level',
    oiliness: 'Oiliness',
    pigmentation: 'Pigmentation / Uneven Tone',
    redness: 'Redness / Sensitivity'
  };

  const getColor = (value, key) => {
    if (value > 70) return 'bg-rose-500';
    if (value > 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-3xl p-6 backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            📊 AI Confidence Breakdown
          </h3>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Dermatology-Grade Vision Scan</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-emerald-400">{confidence}%</div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Confidence</div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(dataMap).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-300">{scoreLabels[key] || key}</span>
              <span className={value > 50 ? 'text-gray-100' : 'text-gray-500'}>{value}%</span>
            </div>
            <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${getColor(value, key)}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {reason && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            👁️ Visual Reasoning
          </h4>
          <p className="text-sm text-gray-300 italic leading-relaxed">
            "{reason}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SkinScoreChart;
