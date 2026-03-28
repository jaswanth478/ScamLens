'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { TrendingUp, AlertTriangle, Users, DollarSign, Globe, Shield, Activity } from 'lucide-react';

import { formatMoney, getLostToday, DAILY_LOSS_USD } from '@/app/lib/utils';

const LOSS_PER_SECOND = DAILY_LOSS_USD / 86_400;

const SCAM_TYPES = [
  { name: 'Imposter Scams', percentage: 33, color: 'bg-rose-500', amount: '$2.7B' },
  { name: 'Investment Fraud', percentage: 27, color: 'bg-orange-500', amount: '$4.6B' },
  { name: 'Online Shopping', percentage: 19, color: 'bg-amber-500', amount: '$392M' },
  { name: 'Tech Support', percentage: 12, color: 'bg-yellow-500', amount: '$924M' },
  { name: 'Romance Scams', percentage: 9, color: 'bg-pink-500', amount: '$652M' },
];

const SCAM_ALERTS = [
  {
    type: 'Crypto Investment',
    message: '"Double your Bitcoin in 24 hours! Limited spots available. Send 0.1 BTC to get started."',
    risk: 'SCAM',
    color: 'border-rose-500/30 bg-rose-500/5',
    badge: 'text-rose-400 bg-rose-400/10',
    region: '🌍 Global',
    loss: '$4.6B lost in 2023',
  },
  {
    type: 'Bank Impersonation',
    message: '"URGENT: Your account has been compromised. Call us immediately at 1-800-XXX-XXXX to prevent closure."',
    risk: 'SCAM',
    color: 'border-amber-500/30 bg-amber-500/5',
    badge: 'text-amber-400 bg-amber-400/10',
    region: '🇺🇸 United States',
    loss: '37% of all imposter scams',
  },
  {
    type: 'Package Delivery',
    message: '"Your FedEx package #9274 requires a $3.99 customs fee. Pay now or your parcel will be returned."',
    risk: 'SUSPICIOUS',
    color: 'border-orange-500/30 bg-orange-500/5',
    badge: 'text-orange-400 bg-orange-400/10',
    region: '🇬🇧 United Kingdom',
    loss: '12M smishing attacks/month',
  },
  {
    type: 'IRS/Tax Fraud',
    message: '"Final notice: You owe $4,320 in back taxes. Failure to pay immediately will result in arrest."',
    risk: 'SCAM',
    color: 'border-rose-500/30 bg-rose-500/5',
    badge: 'text-rose-400 bg-rose-400/10',
    region: '🇺🇸 United States',
    loss: '$5.5B+ in tax fraud yearly',
  },
  {
    type: 'Romance Scam',
    message: '"I\'m deployed overseas and need $500 for emergency surgery. I\'ll pay you back when I return, I promise."',
    risk: 'SCAM',
    color: 'border-pink-500/30 bg-pink-500/5',
    badge: 'text-pink-400 bg-pink-400/10',
    region: '🌍 Global',
    loss: '$652M reported in 2023',
  },
  {
    type: 'Tech Support',
    message: '"Microsoft Alert: Your computer is infected with a virus. Call our toll-free number NOW to fix it."',
    risk: 'SCAM',
    color: 'border-purple-500/30 bg-purple-500/5',
    badge: 'text-purple-400 bg-purple-400/10',
    region: '🇮🇳 India / Global',
    loss: '$924M in losses (FBI 2023)',
  },
];

interface RisklyStats {
  totalAnalyses: number;
  scamCount: number;
  suspiciousCount: number;
  safeCount: number;
  emergencyCount: number;
}

function useCountUp(target: number, duration = 1500): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = 0;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(startValueRef.current + eased * (target - startValueRef.current)));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

function StatCard({
  label,
  value,
  icon,
  colorClass,
  animatedValue,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  animatedValue?: number;
}) {
  const displayValue = animatedValue !== undefined ? animatedValue.toLocaleString() : value;
  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-2">
      <div className={`${colorClass}`} aria-hidden="true">
        {icon}
      </div>
      <div className={`text-xl md:text-2xl font-bold tabular-nums ${colorClass}`} aria-label={`${label}: ${displayValue}`}>
        {displayValue}
      </div>
      <div className="text-xs text-slate-500 leading-tight">{label}</div>
    </div>
  );
}

export default function ScamStats() {
  const [lostToday, setLostToday] = useState(() => getLostToday());
  const [stats, setStats] = useState<RisklyStats | null>(null);
  const [alertIndex, setAlertIndex] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);

  const animatedTotal = useCountUp(stats?.totalAnalyses ?? 0);
  const animatedScams = useCountUp(stats?.scamCount ?? 0);

  useEffect(() => {
    const id = setInterval(() => setLostToday(getLostToday()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAlertIndex((i) => (i + 1) % SCAM_ALERTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setBarsVisible(true); },
      { threshold: 0.2 }
    );
    if (barsRef.current) observer.observe(barsRef.current);
    return () => observer.disconnect();
  }, []);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapUrl = mapsApiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?size=640x200&zoom=1&center=20,0&maptype=roadmap` +
      `&style=feature:all%7Celement:geometry%7Ccolor:0x1a1f2e` +
      `&style=feature:water%7Celement:geometry%7Ccolor:0x0f172a` +
      `&style=feature:road%7Cvisibility:off` +
      `&style=feature:administrative%7Celement:labels%7Cvisibility:off` +
      `&style=feature:poi%7Cvisibility:off` +
      `&markers=color:red%7Csize:small%7C6.5,3.38%7C31.2,121.47%7C44.44,26.1%7C18.52,73.86%7C55.75,37.61%7C-23.55,-46.63` +
      `&key=${mapsApiKey}`
    : null;

  const currentAlert = SCAM_ALERTS[alertIndex];

  return (
    <section aria-labelledby="scam-crisis-heading" className="space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 text-rose-400 text-sm font-medium uppercase tracking-widest mb-1">
          <Activity className="w-4 h-4 animate-pulse" aria-hidden="true" />
          <span>Live Global Data</span>
        </div>
        <h2 id="scam-crisis-heading" className="text-2xl md:text-3xl font-bold text-slate-100">
          The Global Scam Crisis
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Real-world data from FTC Consumer Sentinel Network &amp; FBI Internet Crime Complaint Center (IC3) 2023 Annual Reports
        </p>
      </div>

      {/* Live Money Counter */}
      <div
        className="glass-panel rounded-2xl p-8 text-center relative overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-rose-900/10 pointer-events-none" aria-hidden="true" />
        <Globe className="w-6 h-6 text-slate-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Estimated Money Lost to Scams Today
        </p>
        <div
          className="text-4xl md:text-6xl font-bold text-rose-400 font-mono tabular-nums transition-none"
          aria-label={`${formatMoney(lostToday)} lost to scams today`}
        >
          {formatMoney(lostToday)}
        </div>
        <p className="text-slate-500 mt-3 text-sm">
          ≈ <span className="text-slate-400 font-medium">$324</span> stolen every second &bull; <span className="text-slate-400 font-medium">$10.2 billion</span> lost annually (FTC 2023)
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" role="list" aria-label="Global scam statistics">
        <div role="listitem">
          <StatCard label="Fraud Reports in 2023" value="2.6M" icon={<AlertTriangle className="w-5 h-5" />} colorClass="text-amber-400" />
        </div>
        <div role="listitem">
          <StatCard label="Annual Losses (FTC)" value="$10.2B" icon={<DollarSign className="w-5 h-5" />} colorClass="text-rose-400" />
        </div>
        <div role="listitem">
          <StatCard label="Victims Per Day" value="7,100+" icon={<Users className="w-5 h-5" />} colorClass="text-orange-400" />
        </div>
        <div role="listitem">
          <StatCard label="Median Loss / Victim" value="$500" icon={<TrendingUp className="w-5 h-5" />} colorClass="text-purple-400" />
        </div>
      </div>

      {/* Real-time Scam Alert Carousel */}
      <div className="space-y-3" aria-label="Example scam messages">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
          Real Scam Examples in the Wild
        </h3>
        <div
          key={alertIndex}
          className={`border rounded-xl p-4 transition-all duration-500 ${currentAlert.color}`}
          role="article"
          aria-label={`${currentAlert.type} scam example`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentAlert.badge}`}>
                {currentAlert.risk}
              </span>
              <span className="text-sm font-medium text-slate-300">{currentAlert.type}</span>
            </div>
            <span className="text-xs text-slate-500 shrink-0">{currentAlert.region}</span>
          </div>
          <blockquote className="text-slate-400 text-sm italic leading-relaxed border-l-2 border-white/10 pl-3 mb-2">
            {currentAlert.message}
          </blockquote>
          <p className="text-xs text-slate-600">{currentAlert.loss}</p>
        </div>
        <div className="flex justify-center gap-1.5" aria-label="Alert navigation dots" role="tablist">
          {SCAM_ALERTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setAlertIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === alertIndex ? 'bg-rose-400 w-4' : 'bg-slate-700 hover:bg-slate-500'}`}
              aria-label={`View alert ${i + 1}`}
              aria-selected={i === alertIndex}
              role="tab"
            />
          ))}
        </div>
      </div>

      {/* Scam Type Breakdown */}
      <div className="glass-panel rounded-2xl p-6" ref={barsRef}>
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-500" aria-hidden="true" />
          Top Scam Categories (2023)
        </h3>
        <ul className="space-y-3" aria-label="Scam type percentages">
          {SCAM_TYPES.map((type) => (
            <li key={type.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{type.name}</span>
                <span className="text-slate-500 tabular-nums">{type.percentage}% · {type.amount}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={type.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${type.name}: ${type.percentage}%`}>
                <div
                  className={`h-full ${type.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: barsVisible ? `${type.percentage * 3}%` : '0%' }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-600 mt-4">
          Source: FTC Consumer Sentinel Network Data Book 2023 &amp; FBI IC3 2023 Internet Crime Report
        </p>
      </div>

      {/* Google Maps Scam Hotspot */}
      {mapUrl && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 pb-0">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-500" aria-hidden="true" />
              Global Scam Hotspots
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Major origins of international fraud &amp; phishing operations</p>
          </div>
          <div className="mt-3 relative">
            <Image
              src={mapUrl}
              alt="World map showing major scam hotspot regions: Nigeria, Romania, India, China, Russia, and Brazil"
              className="w-full object-cover opacity-80"
              width={640}
              height={200}
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-2">
              {['🇳🇬 Nigeria', '🇷🇴 Romania', '🇮🇳 India', '🇨🇳 China', '🇷🇺 Russia', '🇧🇷 Brazil'].map((country) => (
                <span key={country} className="text-xs bg-black/50 text-slate-300 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {country}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-600 px-4 py-3">
            Powered by Google Maps · Data: FBI IC3 &amp; Europol Cybercrime Centre 2023
          </p>
        </div>
      )}

      {/* Riskly Live Stats from Firestore */}
      {stats !== null && (
        <div
          className="glass-panel rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          aria-label="Riskly community statistics"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10">
              <Shield className="w-5 h-5 text-brand-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Riskly Community</p>
              <p className="text-sm text-slate-300 mt-0.5">Protecting users worldwide in real time</p>
            </div>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-500 tabular-nums" aria-label={`${animatedTotal} messages analyzed`}>
                {animatedTotal.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Messages Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-400 tabular-nums" aria-label={`${animatedScams} scams detected`}>
                {animatedScams.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Scams Detected</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
