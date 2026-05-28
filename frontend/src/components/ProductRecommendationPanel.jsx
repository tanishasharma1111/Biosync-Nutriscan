import React from 'react';

const ProductRecommendationPanel = ({ recommendations }) => {
  if (!recommendations || (!recommendations.recommended_actives && !recommendations.natural_remedies)) return null;

  const statusColors = {
    'Warning': 'border-red-500/30 bg-red-500/5 text-red-400',
    'Concern': 'border-orange-500/30 bg-orange-500/5 text-orange-400',
    'Normal': 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
  };

  const status = recommendations.status || 'Info';
  const colorClass = statusColors[status] || 'border-gray-500/30 bg-gray-500/5 text-gray-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`p-4 rounded-2xl border ${colorClass} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {status === 'Warning' ? '🚨' : status === 'Concern' ? '⚠️' : '✅'}
          </span>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs opacity-70">ML Verdict</h4>
            <p className="font-bold text-lg">{recommendations.message || "Curated Dermatological Advice"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
            🛒 Recommended Actives
          </h3>
          <div className="space-y-3">
            {recommendations.recommended_actives?.map((prod, i) => (
              <div key={i} className="group relative bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <div className="flex-1 flex items-center">
                    <h5 className="font-bold text-gray-100">{prod}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remedies Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
            🌿 Natural Remedies
          </h3>
          <div className="space-y-3">
            {recommendations.natural_remedies?.map((rem, i) => (
              <div key={i} className="group relative bg-gray-800/40 border border-gray-700/50 p-4 rounded-2xl hover:border-teal-500/30 transition-all duration-300">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🍃
                  </div>
                  <div className="flex-1 flex items-center">
                    <h5 className="font-bold text-gray-100">{rem}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRecommendationPanel;
