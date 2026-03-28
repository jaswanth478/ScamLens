'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle,
  Loader2, Heart, Phone, MapPin, Upload, X,
  AlertCircle, CheckCircle2, Siren, ClipboardList
} from 'lucide-react';
import type { ScamResult, TriageResult, Hospital } from '@/lib/schemas';

type Mode = 'scam' | 'medical';

type SeverityColor = {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
};

function getSeverityConfig(severity: string): SeverityColor {
  switch (severity) {
    case 'Critical':
      return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: <Siren className="w-8 h-8 text-red-400 animate-pulse" /> };
    case 'Urgent':
      return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: <AlertCircle className="w-8 h-8 text-orange-400" /> };
    case 'Non-Urgent':
      return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: <AlertTriangle className="w-8 h-8 text-yellow-400" /> };
    case 'Stable':
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" /> };
    default:
      return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: <Heart className="w-8 h-8 text-slate-400" /> };
  }
}

function getScamConfig(classification: string) {
  switch (classification) {
    case 'Safe':
      return { icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
    case 'Suspicious':
      return { icon: <AlertTriangle className="w-8 h-8 text-amber-400" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
    case 'Scam':
    case 'Emergency':
      return { icon: <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse" />, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' };
    default:
      return { icon: <Shield className="w-8 h-8 text-slate-400" />, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
  }
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('medical');
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scamResult, setScamResult] = useState<ScamResult | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const fetchNearbyHospitals = useCallback(async () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/hospitals?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          const data = await res.json();
          setHospitals(data);
        } catch {
          // Silent fail for hospitals
        } finally {
          setLocationLoading(false);
        }
      },
      () => setLocationLoading(false)
    );
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setScamResult(null);
    setTriageResult(null);
    setHospitals([]);

    try {
      if (mode === 'scam') {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });
        if (!res.ok) throw new Error('Scam analysis failed.');
        const data: ScamResult = await res.json();
        setScamResult(data);
      } else {
        const res = await fetch('/api/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: input, imageBase64 }),
        });
        if (!res.ok) throw new Error('Triage analysis failed.');
        const data: TriageResult = await res.json();
        setTriageResult(data);
        if (data.callEmergency || data.severity === 'Critical' || data.severity === 'Urgent') {
          await fetchNearbyHospitals();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [input, mode, imageBase64, fetchNearbyHospitals]);

  const scoreColor = (score: number) =>
    score > 70 ? 'text-rose-500' : score > 30 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <main className="max-w-3xl w-full mx-auto space-y-6 mt-10" role="main">
        {/* Header */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2 glass-panel px-4 py-2 rounded-full text-sm text-slate-400 mb-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" aria-hidden="true" />
            Powered by Gemini AI
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gradient pb-1">MedBridge</h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Your AI-powered emergency bridge — from messy human panic to structured, life-saving action.
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="glass-panel rounded-2xl p-1.5 flex" role="tablist" aria-label="Analysis mode">
          <button
            role="tab"
            id="tab-medical"
            aria-selected={mode === 'medical'}
            aria-controls="panel-medical"
            onClick={() => { setMode('medical'); setScamResult(null); setTriageResult(null); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${mode === 'medical' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Heart className="w-4 h-4" aria-hidden="true" />
            Medical Triage
          </button>
          <button
            role="tab"
            id="tab-scam"
            aria-selected={mode === 'scam'}
            aria-controls="panel-scam"
            onClick={() => { setMode('scam'); setScamResult(null); setTriageResult(null); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${mode === 'scam' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Shield className="w-4 h-4" aria-hidden="true" />
            Scam Detector
          </button>
        </div>

        {/* Input Panel */}
        <section
          className="glass-panel rounded-2xl p-6 space-y-4"
          role="region"
          id={mode === 'medical' ? 'panel-medical' : 'panel-scam'}
          aria-labelledby={mode === 'medical' ? 'tab-medical' : 'tab-scam'}
        >
          <label htmlFor="main-input" className="text-sm font-medium text-slate-300 block">
            {mode === 'medical'
              ? '🚨 Describe the emergency (panicked text, symptoms, medical history — anything):'
              : '🔍 Paste the suspicious message (SMS, email, chat):'}
          </label>
          <textarea
            id="main-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'medical'
              ? 'e.g. "my dad fell, hes 68, takes blood thinners, bleeding from head and confused..."'
              : 'e.g. "URGENT: Your bank account has been locked. Click here to verify..."'}
            className="w-full h-36 rounded-xl p-4 glass-input resize-none text-base"
            disabled={loading}
            aria-label={mode === 'medical' ? 'Describe the medical emergency' : 'Paste suspicious message'}
          />

          {/* Image Upload (Medical only) */}
          {mode === 'medical' && (
            <div aria-label="Upload injury or symptom photo">
              {imagePreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Uploaded medical image preview" className="h-32 rounded-xl object-cover border border-white/10" />
                  <button
                    onClick={clearImage}
                    aria-label="Remove uploaded image"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all text-sm"
                  aria-label="Upload a photo of the injury or symptom"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Upload injury / symptom photo (optional)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-hidden="true"
              />
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500" aria-live="polite">{input.length} / 5000 characters</span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:shadow-[0_0_30px_rgba(37,99,235,0.55)] flex items-center gap-2"
              aria-busy={loading}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />Analyzing...</>
              ) : (
                <>{mode === 'medical' ? '🚨 Triage Now' : '🔍 Detect Scam'}</>
              )}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div role="alert" className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Scam Results */}
        {scamResult && (
          <section className="space-y-5" role="region" aria-label="Scam analysis results" aria-live="polite">
            {(() => {
              const config = getScamConfig(scamResult.classification);
              return (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-2" aria-label={`Risk score: ${scamResult.score} out of 100`}>
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Risk Score</span>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90" aria-hidden="true">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * scamResult.score) / 100}
                          className={`${scoreColor(scamResult.score)} transition-all duration-1000`} />
                      </svg>
                      <span className="absolute text-3xl font-bold">{scamResult.score}</span>
                    </div>
                  </div>
                  <div className={`md:col-span-2 ${config.bg} border ${config.border} p-6 rounded-2xl flex items-center gap-6`}>
                    <div className="p-4 bg-slate-900/50 rounded-2xl">{config.icon}</div>
                    <div>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Classification</span>
                      <h2 className={`text-3xl font-bold ${config.color} mt-1`}>{scamResult.classification}</h2>
                      <p className="text-slate-300 text-sm mt-1">{scamResult.summary}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400" aria-hidden="true" />Red Flags
                </h3>
                {scamResult.redFlags.length > 0 ? (
                  <ul className="space-y-2" aria-label="Red flags detected">
                    {scamResult.redFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" aria-hidden="true" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-slate-500 italic text-sm">No red flags detected.</p>}
              </div>
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />Actions
                </h3>
                <ol className="space-y-2" aria-label="Recommended actions">
                  {scamResult.recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300 text-sm bg-slate-800/50 p-2.5 rounded-lg border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* Medical Triage Results */}
        {triageResult && (
          <section className="space-y-5" role="region" aria-label="Medical triage results" aria-live="polite">
            {(() => {
              const config = getSeverityConfig(triageResult.severity);
              return (
                <>
                  {/* Emergency Banner */}
                  {triageResult.callEmergency && (
                    <div role="alert" className="bg-red-600/20 border border-red-500/40 rounded-2xl p-4 flex items-center gap-4">
                      <Phone className="w-6 h-6 text-red-400 animate-bounce shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-red-300 text-lg">🚨 Call Emergency Services NOW</p>
                        <p className="text-red-400 text-sm">This situation requires immediate professional emergency response. Dial 911 / 112 immediately.</p>
                      </div>
                    </div>
                  )}

                  {/* Severity + Score */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center space-y-2" aria-label={`Severity score: ${triageResult.severityScore} out of 100`}>
                      <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Severity</span>
                      <div className="relative flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90" aria-hidden="true">
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * triageResult.severityScore) / 100}
                            className={`${scoreColor(triageResult.severityScore)} transition-all duration-1000`} />
                        </svg>
                        <span className="absolute text-3xl font-bold">{triageResult.severityScore}</span>
                      </div>
                    </div>
                    <div className={`md:col-span-2 ${config.bg} border ${config.border} p-6 rounded-2xl flex items-center gap-6`}>
                      <div className="p-4 bg-slate-900/50 rounded-2xl">{config.icon}</div>
                      <div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Severity Level</span>
                        <h2 className={`text-3xl font-bold ${config.text} mt-1`}>{triageResult.severity}</h2>
                        <p className="text-slate-300 text-sm mt-1">{triageResult.condition}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions + Do Not */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="glass-panel p-5 rounded-2xl">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />Immediate Actions
                      </h3>
                      <ol className="space-y-2" aria-label="Immediate first aid steps">
                        {triageResult.immediateActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                            {action}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-200">
                        <AlertCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />Do NOT Do
                      </h3>
                      <ul className="space-y-2" aria-label="Things to avoid">
                        {triageResult.doNotDo.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Vitals + Dispatch */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="glass-panel p-5 rounded-2xl">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-200">
                        <Heart className="w-4 h-4 text-pink-400" aria-hidden="true" />Vitals to Monitor
                      </h3>
                      <ul className="space-y-1.5">
                        {triageResult.vitalsToMonitor.map((v, i) => (
                          <li key={i} className="text-slate-300 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" aria-hidden="true" />{v}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-panel p-5 rounded-2xl">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-slate-200">
                        <ClipboardList className="w-4 h-4 text-blue-400" aria-hidden="true" />Emergency Dispatch JSON
                      </h3>
                      <pre className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-36 border border-white/5" aria-label="Emergency dispatch payload">
                        {JSON.stringify(triageResult.dispatchPayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Nearby Hospitals */}
        {(locationLoading || hospitals.length > 0) && (
          <section className="glass-panel rounded-2xl p-5 space-y-3" role="region" aria-label="Nearby hospitals" aria-live="polite">
            <h3 className="text-base font-semibold flex items-center gap-2 text-slate-200">
              <MapPin className="w-4 h-4 text-blue-400" aria-hidden="true" />Nearest Hospitals
            </h3>
            {locationLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm" aria-busy="true">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Finding nearest hospitals...
              </div>
            ) : (
              <ul className="space-y-2">
                {hospitals.map((h, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                    <div>
                      <p className="font-medium text-slate-200 text-sm">{h.name}</p>
                      <p className="text-slate-500 text-xs">{h.address}</p>
                      {h.openNow !== undefined && (
                        <span className={`text-xs font-medium ${h.openNow ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.openNow ? '● Open now' : '● Closed'}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-blue-400 text-sm font-bold">{h.distance}</span>
                      {h.rating && <p className="text-slate-500 text-xs">⭐ {h.rating}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
