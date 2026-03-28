"use client";

import { useState, useRef, useCallback, Suspense, lazy } from 'react';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import AuthButton from '@/app/components/AuthButton';
import { trackEvent } from '@/app/lib/analytics';

const ScamStats = lazy(() => import('@/app/components/ScamStats'));

interface AnalysisResult {
  classification: 'Scam' | 'Suspicious' | 'Safe' | 'Emergency';
  score: number;
  redFlags: string[];
  recommendedActions: string[];
}

function ScamStatsLoader() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      <div className="h-8 bg-slate-800 rounded-xl w-48 mx-auto" />
      <div className="h-32 glass-panel rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 glass-panel rounded-xl" />)}
      </div>
      <div className="h-48 glass-panel rounded-2xl" />
    </div>
  );
}

function getClassificationConfig(classification: string) {
  switch (classification) {
    case 'Safe':
      return {
        icon: <ShieldCheck className="w-8 h-8 text-emerald-400" aria-hidden="true" />,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/20',
        description: 'This message appears normal. No immediate threats detected.',
      };
    case 'Suspicious':
      return {
        icon: <AlertTriangle className="w-8 h-8 text-amber-400" aria-hidden="true" />,
        color: 'text-amber-400',
        bg: 'bg-amber-400/10',
        border: 'border-amber-400/20',
        description: 'Proceed with caution. Suspicious markers found.',
      };
    case 'Scam':
      return {
        icon: <ShieldAlert className="w-8 h-8 text-rose-400" aria-hidden="true" />,
        color: 'text-rose-400',
        bg: 'bg-rose-400/10',
        border: 'border-rose-400/20',
        description: 'High risk detected. Do not engage with this message.',
      };
    case 'Emergency':
      return {
        icon: <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" aria-hidden="true" />,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        description: 'Immediate threat detected. Take action now.',
      };
    default:
      return {
        icon: <Shield className="w-8 h-8 text-slate-400" aria-hidden="true" />,
        color: 'text-slate-400',
        bg: 'bg-slate-400/10',
        border: 'border-slate-400/20',
        description: 'Analysis complete.',
      };
  }
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const analyzeMessage = useCallback(async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    trackEvent('analysis_started', { message_length: message.length });

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to analyze message.');
      }

      const data: AnalysisResult = await res.json();
      setResult(data);

      trackEvent('analysis_complete', {
        classification: data.classification,
        score: data.score,
        flag_count: data.redFlags.length,
      });

      requestAnimationFrame(() => resultsRef.current?.focus());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      trackEvent('analysis_error');
    } finally {
      setLoading(false);
    }
  }, [message]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeMessage();
      }
    },
    [analyzeMessage]
  );

  return (
    <div className="min-h-screen p-4 md:p-8 font-[family-name:var(--font-geist-sans)] flex flex-col items-center">

      {/* Top nav */}
      <nav className="w-full max-w-3xl mx-auto flex justify-between items-center mb-8" aria-label="Site navigation">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-500" aria-hidden="true" />
          <span className="font-semibold text-slate-300 text-sm">Riskly</span>
        </div>
        <AuthButton />
      </nav>

      <main id="main-content" className="max-w-3xl w-full mx-auto space-y-16 pb-20" tabIndex={-1}>

        {/* Header */}
        <header className="text-center space-y-5">
          <div className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-2" aria-hidden="true">
            <Shield className="w-10 h-10 text-brand-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />
              Powered by Google Gemini · Firebase · Safe Browsing
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gradient pb-2">Riskly</h1>

            <p className="text-slate-300 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-snug">
              Any message. Any threat. Instant clarity.
            </p>
            <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
              Riskly is a <span className="text-slate-200 font-medium">Gemini-powered threat intelligence bridge</span> — it takes raw, unstructured messages (SMS, email, chat, scam calls) and converts them into structured, verified, life-saving action plans in seconds.
            </p>
          </div>

          {/* PS Alignment Mission Block */}
          <div className="glass-panel rounded-2xl p-5 text-left max-w-2xl mx-auto border border-blue-500/10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              How Riskly Bridges Human Intent &amp; Complex Systems
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              {[
                {
                  step: '01',
                  label: 'Messy Input',
                  desc: 'Any raw, unstructured message — suspicious SMS, phishing email, fake call transcript',
                  color: 'text-rose-400',
                },
                {
                  step: '02',
                  label: 'Gemini Analysis',
                  desc: 'Gemini 2.5 Flash decodes intent, tone, pressure tactics & cross-checks URLs via Safe Browsing',
                  color: 'text-brand-500',
                },
                {
                  step: '03',
                  label: 'Structured Action',
                  desc: 'A verified risk score, classification, red flags & prioritised steps — ready to act on immediately',
                  color: 'text-emerald-400',
                },
              ].map((item) => (
                <div key={item.step} className="space-y-1.5">
                  <div className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.step}</div>
                  <div className="text-sm font-semibold text-slate-200">{item.label}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Analyzer */}
        <section aria-labelledby="analyzer-heading">
          <h2 id="analyzer-heading" className="sr-only">Message Risk Analyzer</h2>

          <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-4">
            <label htmlFor="message-input" className="block text-sm font-medium text-slate-400">
              Paste the message you want to analyze
              <span className="ml-2 text-slate-600 font-normal text-xs">(Ctrl+Enter to analyze)</span>
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Your account has been locked. Click here immediately to verify your identity…"
              className="w-full h-40 rounded-xl p-4 glass-input resize-none text-base sm:text-lg"
              disabled={loading}
              maxLength={10000}
              aria-describedby="char-count message-hint"
            />
            <div className="flex justify-between items-center">
              <div>
                <span id="char-count" className="text-sm text-slate-500" aria-live="polite">
                  {message.length.toLocaleString()} / 10,000 characters
                </span>
                <p id="message-hint" className="sr-only">
                  Paste any suspicious SMS, email or chat message. Press Ctrl+Enter or click Analyze Risk to get results.
                </p>
              </div>
              <button
                onClick={analyzeMessage}
                disabled={loading || !message.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label={loading ? 'Analyzing message, please wait…' : 'Analyze message risk'}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <span>Analyze Risk</span>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" aria-live="assertive" className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div
              ref={resultsRef}
              tabIndex={-1}
              className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none"
              role="region"
              aria-label={`Analysis complete: ${result.classification}`}
              aria-live="polite"
            >
              <div className="grid md:grid-cols-3 gap-4">
                {/* Score */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Risk Score</span>
                  <div
                    className="relative flex items-center justify-center"
                    role="img"
                    aria-label={`Risk score ${result.score} out of 100`}
                  >
                    <svg className="w-24 h-24 transform -rotate-90" aria-hidden="true">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                      <circle
                        cx="48" cy="48" r="40"
                        stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * result.score) / 100}
                        className={`${result.score > 70 ? 'text-rose-500' : result.score > 30 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                      />
                    </svg>
                    <span className="absolute text-3xl font-bold tabular-nums" aria-hidden="true">{result.score}</span>
                  </div>
                </div>

                {/* Classification */}
                {(() => {
                  const config = getClassificationConfig(result.classification);
                  return (
                    <div className={`md:col-span-2 ${config.bg} border ${config.border} p-6 rounded-2xl flex items-center space-x-6`}>
                      <div className="p-4 bg-slate-900/50 rounded-2xl shadow-inner shrink-0">{config.icon}</div>
                      <div>
                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Classification</span>
                        <h3 className={`text-3xl font-bold ${config.color} mt-1`}>{result.classification}</h3>
                        <p className="text-slate-300 mt-2">{config.description}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Red Flags */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-slate-200">
                    <AlertTriangle className="w-5 h-5 mr-2 text-rose-400" aria-hidden="true" />
                    Red Flags Detected
                    {result.redFlags.length > 0 && (
                      <span className="ml-auto text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                        {result.redFlags.length}
                      </span>
                    )}
                  </h3>
                  {result.redFlags.length > 0 ? (
                    <ul className="space-y-3" aria-label={`${result.redFlags.length} red flag${result.redFlags.length !== 1 ? 's' : ''} detected`}>
                      {result.redFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 mr-3 shrink-0" aria-hidden="true" />
                          <span className="text-slate-300">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic">No significant red flags detected.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-slate-200">
                    <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" aria-hidden="true" />
                    Recommended Actions
                  </h3>
                  {result.recommendedActions.length > 0 ? (
                    <ol className="space-y-3" aria-label="Recommended protective actions">
                      {result.recommendedActions.map((action, idx) => (
                        <li key={idx} className="flex items-start bg-slate-800/50 p-3 rounded-lg border border-white/5">
                          <span
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mr-3 shrink-0"
                            aria-hidden="true"
                          >
                            {idx + 1}
                          </span>
                          <span className="text-slate-300 text-sm leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-slate-500 italic">No specific actions required.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Scam Statistics — lazy loaded */}
        <Suspense fallback={<ScamStatsLoader />}>
          <ScamStats />
        </Suspense>

      </main>
    </div>
  );
}
