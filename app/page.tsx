"use client";

import { useState } from 'react';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface AnalysisResult {
  classification: 'Scam' | 'Suspicious' | 'Safe' | 'Emergency';
  score: number;
  redFlags: string[];
  recommendedActions: string[];
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze message. Ensure the Gemini API key is valid.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getClassificationConfig = (classification: string) => {
    switch (classification) {
      case 'Safe':
        return {
          icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-400/10',
          border: 'border-emerald-400/20',
          gradient: 'text-gradient-safe'
        };
      case 'Suspicious':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          color: 'text-amber-400',
          bg: 'bg-amber-400/10',
          border: 'border-amber-400/20',
          gradient: 'text-gradient-warning'
        };
      case 'Scam':
        return {
          icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
          color: 'text-rose-400',
          bg: 'bg-rose-400/10',
          border: 'border-rose-400/20',
          gradient: 'text-gradient-danger'
        };
      case 'Emergency':
        return {
          icon: <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          gradient: 'text-gradient-danger'
        };
      default:
        return {
          icon: <Shield className="w-8 h-8 text-slate-400" />,
          color: 'text-slate-400',
          bg: 'bg-slate-400/10',
          border: 'border-slate-400/20',
          gradient: 'text-gradient'
        };
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <main className="max-w-3xl w-full mx-auto space-y-8 mt-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-2">
            <Shield className="w-10 h-10 text-brand-500 mb-1 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient pb-2">Riskly</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            AI-powered Message Risk Analyzer. Paste a suspicious SMS, email, or chat to instantly uncover hidden threats.
          </p>
        </div>

        {/* Input Area */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste the message you want to analyze here..."
            className="w-full h-40 rounded-xl p-4 glass-input resize-none text-base sm:text-lg"
            disabled={loading}
          />
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">
              {message.length} characters
            </div>
            <button
              onClick={analyzeMessage}
              disabled={loading || !message.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Analyze Risk</span>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
            {error}
          </div>
        )}

        {/* Results Area */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Score Card */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Risk Score</span>
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * result.score) / 100} 
                      className={`${result.score > 70 ? 'text-rose-500' : result.score > 30 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">{result.score}</span>
                </div>
              </div>

              {/* Classification Card */}
              {(() => {
                const config = getClassificationConfig(result.classification);
                return (
                  <div className={`md:col-span-2 ${config.bg} border ${config.border} p-6 rounded-2xl flex items-center space-x-6`}>
                    <div className="p-4 bg-slate-900/50 rounded-2xl shadow-inner">
                      {config.icon}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Classification</span>
                      <h2 className={`text-3xl font-bold ${config.color} mt-1`}>{result.classification}</h2>
                      <p className="text-slate-300 mt-2">
                        {result.classification === 'Safe' 
                          ? 'This message appears normal. No immediate threats detected.' 
                          : 'Proceed with caution. Suspicious markers found.'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Red Flags */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-slate-200">
                  <AlertTriangle className="w-5 h-5 mr-2 text-rose-400" />
                  Red Flags Detected
                </h3>
                {result.redFlags.length > 0 ? (
                  <ul className="space-y-3">
                    {result.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 mr-3 shrink-0" />
                        <span className="text-slate-300">{flag}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No significant red flags detected.</p>
                )}
              </div>

              {/* Recommended Actions */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-slate-200">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
                  Recommended Actions
                </h3>
                {result.recommendedActions.length > 0 ? (
                  <div className="space-y-3">
                    {result.recommendedActions.map((action, idx) => (
                      <div key={idx} className="flex items-start bg-slate-800/50 p-3 rounded-lg border border-white/5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mr-3 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 text-sm leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No specific actions required.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
