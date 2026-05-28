import React from 'react';

const SkinConcernBadge = ({ concern, confidence }) => {
  if (!concern) return null;

  const getConcernStyles = (label) => {
    const l = label.toLowerCase();
    if (l.includes('melanoma') || l.includes('carcinoma')) {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
    if (l.includes('sun damage') || l.includes('akiec')) {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    }
    if (l.includes('redness') || l.includes('vascular')) {
      return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    }
    if (l.includes('benign') || l.includes('aging')) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  };

  const confidencePercentage = Math.round(confidence * 100);
  
  return (
    <div className={`inline-flex flex-col gap-1 p-3 rounded-xl border ${getConcernStyles(concern)} backdrop-blur-sm`}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Detection</span>
        <span className="text-xs font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded">{confidencePercentage}% match</span>
      </div>
      <h3 className="text-lg font-bold leading-tight">{concern}</h3>
      <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
        <div 
          className="h-full bg-current transition-all duration-1000 ease-out" 
          style={{ width: `${confidencePercentage}%` }}
        />
      </div>
    </div>
  );
};

export default SkinConcernBadge;
