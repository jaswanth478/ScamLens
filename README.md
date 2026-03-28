# Riskly — Gemini-Powered Threat Intelligence Bridge

> **Hackathon Submission** · Built for: *"Build a Gemini-powered App that solves for societal benefit by acting as a universal bridge between human intent and complex systems."*

---

## What is Riskly?

Riskly converts **any raw, unstructured message** — a suspicious SMS, a phishing email, a forwarded WhatsApp scam, a fake invoice — into a **structured, verified, life-saving action plan** in under 3 seconds.

It is not a keyword filter. It is a **cognitive bridge**: Gemini 2.5 Flash reads the psychological architecture of a message (urgency, authority impersonation, fear tactics, financial pressure) the same way a trained fraud investigator would, then translates that expert-level judgment into plain-language guidance any person can act on immediately.

### Problem Statement Alignment

| PS Requirement | Riskly's Implementation |
|---|---|
| **Gemini-powered** | Gemini 2.5 Flash — structured JSON output, intent analysis, social engineering pattern detection |
| **Universal bridge between human intent & complex systems** | Bridges a person's confusion ("is this real?") to fraud-detection infrastructure (Gemini AI + Google Safe Browsing + Firebase) |
| **Unstructured, messy, real-world inputs** | Raw SMS, emails, chat messages, call transcripts — no formatting required |
| **Structured, verified output** | Risk score (0–100), classification (Safe / Suspicious / Scam / Emergency), itemised red flags, prioritised actions |
| **Life-saving actions** | Financial fraud destroys lives — $10.2B lost in 2023; instant protection for the most vulnerable |
| **Societal benefit** | Free, accessible, democratising threat intelligence that once required expensive security teams |

---

## Live Features

### Core Analysis Engine
- **Gemini 2.5 Flash** analyses every message for phishing patterns, social engineering, urgency framing, impersonation, and financial coercion
- **Google Safe Browsing API** extracts all URLs from the message and cross-checks them against Google's real-time threat database — flagged URLs automatically raise the risk score and reclassify the threat
- **Structured JSON output** — classification, 0–100 risk score, red flags list, recommended actions — validated server-side before returning to the client

### Google Services Stack
| Service | Role |
|---|---|
| Google Gemini 2.5 Flash (`@google/genai`) | Core AI analysis — intent, tone, threat pattern recognition |
| Google Safe Browsing API v4 | Real-time URL threat verification |
| Google Maps Static API | Global scam hotspot heatmap visualisation |
| Firebase Firestore | Persists every analysis result; tracks community aggregate stats |
| Firebase Analytics | Event tracking — `page_view`, `analysis_started`, `analysis_complete`, `analysis_error` |
| Firebase Authentication | Google Sign-In — personalised experience, auth state persisted |
| Google Fonts (Next.js) | Geist Sans & Geist Mono — optimised with `display: swap` |

### Global Scam Intelligence Dashboard
A live data section below the analyser shows:
- **Running money counter** — real-time accumulation of global daily fraud losses (~$324/second, based on FTC 2023: $10.2B/year)
- **Key stats** — 2.6M fraud reports, 7,100+ victims/day, $500 median loss per victim
- **Real scam example carousel** — 6 rotating real-world scam types (crypto, IRS, romance, tech support, bank impersonation, package delivery) auto-advancing every 4 seconds
- **Top scam categories** — animated bar chart (Imposter 33%, Investment 27%, Shopping 19%, Tech Support 12%, Romance 9%)
- **Google Maps heatmap** — major fraud origin countries marked on a styled world map
- **Live Firestore stats** — community count of messages analysed and scams detected, updated per request

---

## Architecture

```
User Input (raw message)
        │
        ▼
┌─────────────────────────────────────────────────┐
│  proxy.ts (Next.js 16 Proxy)                   │
│  · Rate limiting: 10 req/min per IP            │
│  · Security headers: HSTS, CSP, X-Frame-Options│
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│  /api/analyze  (Next.js Route Handler)          │
│                                                 │
│  1. sanitizeInput()  — trim, cap at 10,000 chars│
│  2. extractUrls()    — regex URL extraction     │
│  3. Promise.all([                               │
│       Gemini 2.5 Flash analysis,               │
│       Google Safe Browsing URL check           │
│     ])                                          │
│  4. isValidClassification() + isValidScore()   │
│     — server-side response validation           │
│  5. logToFirestore()  — non-blocking async log │
└─────────────────────────────────────────────────┘
        │
        ▼
Structured Response:
{ classification, score, redFlags, recommendedActions }
        │
        ▼
┌─────────────────────────────────────────────────┐
│  React UI (Next.js App Router)                 │
│  · Risk score ring (SVG, animated)             │
│  · Classification card with icon               │
│  · Red flags list                               │
│  · Recommended actions (numbered)              │
│  · Focus management (auto-focus results)       │
└─────────────────────────────────────────────────┘
```

---

## Security

- **Rate limiting** — 10 requests/minute per IP via Next.js Proxy; `429` with `Retry-After` header
- **Security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`
- **Input sanitisation** — trimmed and capped at 10,000 characters before any processing
- **Response validation** — AI output validated with `isValidClassification()` and `isValidScore()` before returning to client
- **No user data stored** — only classification type and score are logged to Firestore (no message content)
- **Type-safe error handling** — `instanceof Error` pattern, no `any` escapes

---

## Performance & Efficiency

- **Lazy-loaded ScamStats** — `React.lazy` + `Suspense` splits the dashboard into a separate chunk, reducing initial JS bundle
- **`optimizePackageImports`** — enabled for `firebase` and `lucide-react` in `next.config.ts` (tree-shaking)
- **`next/image`** — optimised image loading for Google Maps heatmap (WebP/AVIF, lazy loading)
- **`display: swap`** on Google Fonts — eliminates render-blocking font load
- **`useCallback`** on `analyzeMessage` and `handleKeyDown` — prevents unnecessary re-renders
- **Parallel API calls** — Gemini analysis and Safe Browsing check run in `Promise.all()`
- **Stats route revalidation** — `revalidate: 60` caches Firestore aggregate stats at the CDN edge for 60 seconds

---

## Accessibility

- **Skip navigation link** — `SkipNav` component, visible on focus, jumps to `#main-content`
- **Focus management** — after analysis completes, focus moves programmatically to the results region
- **`aria-live="assertive"`** on error alerts, `"polite"` on results and character counter
- **`role="progressbar"` with `aria-valuenow/min/max`** on every scam category bar
- **`role="tablist"` + `role="tab"` + `aria-selected`** on carousel navigation dots
- **`Ctrl+Enter` keyboard shortcut** on the textarea for keyboard-only users
- **Proper landmark regions** — `<header>`, `<main id="main-content">`, `<nav>`, `<section>` with `aria-labelledby`
- **Ordered list (`<ol>`)** for recommended actions — correct semantics for numbered steps
- **`sr-only` descriptions** for icon-only buttons and supplementary context

---

## Testing

**53 tests · 3 test files · Vitest + React Testing Library**

### `__tests__/utils.test.ts` — 28 unit tests
Pure function coverage for the shared utility layer:
- `extractUrls` — single URL, multiple URLs, HTTP/HTTPS, embedded in scam text, empty input
- `formatMoney` — small amounts, billion+ amounts with `B` suffix, zero
- `getLostToday` — positive number, within daily bounds, correct rate
- `getRiskScoreColor` — correct colour for high/medium/low scores
- `sanitizeInput` — whitespace trim, 10,000 char truncation
- `isValidClassification` — all valid values, invalid values, null, numbers
- `isValidScore` — boundary values, out-of-range, non-numeric

### `__tests__/analyze-route.test.ts` — 14 tests
Logic coverage for the analysis pipeline:
- Message validation (empty, non-string, valid)
- URL extraction from real scam messages
- Result validation (classification values, score ranges)
- Safe Browsing upgrade logic (score boost, Suspicious→Scam reclassification)
- Rate limiting algorithm (count tracking, window reset)

### `__tests__/scam-stats.test.tsx` — 11 component tests
UI and accessibility coverage for the dashboard:
- Section heading renders
- All four stat cards render
- Scam category breakdown renders all 5 types
- Real scam examples carousel renders
- `role="tablist"` present with correct tab count
- Keyboard navigation of carousel tabs
- Firestore community stats appear after fetch
- `role="progressbar"` on all 5 category bars with correct ARIA attributes
- Google Maps image renders when API key is set
- `aria-live` region present on money counter

---

## Setup

### Environment Variables

```env
# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Google Safe Browsing
GOOGLE_SAFE_BROWSING_API_KEY=your_google_cloud_api_key

# Google Maps (Static API)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX  # optional, for Analytics
```

### Firebase Setup Required
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** (Native mode)
3. Enable **Authentication → Google** sign-in provider
4. Enable **Analytics** (optional)

### Running Locally

```bash
npm install
npm run dev       # development server at localhost:3000
npm test          # run all 53 tests
npm run build     # production build
```

---

## Project Structure

```
riskly/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts   # Gemini + Safe Browsing + Firestore logging
│   │   └── stats/route.ts     # Firestore aggregate stats (60s cache)
│   ├── components/
│   │   ├── AuthButton.tsx     # Firebase Google Sign-In
│   │   ├── FirebaseAnalytics.tsx # Analytics initialisation
│   │   ├── ScamStats.tsx      # Live global scam dashboard
│   │   └── SkipNav.tsx        # Accessibility skip link
│   ├── lib/
│   │   ├── analytics.ts       # Firebase Analytics helpers
│   │   ├── auth.ts            # Firebase Auth helpers
│   │   ├── firebase.ts        # Firebase app + Firestore init
│   │   └── utils.ts           # Pure utility functions (tested)
│   ├── globals.css            # Tailwind v4 + glassmorphism utilities
│   ├── layout.tsx             # Root layout with metadata + Analytics
│   └── page.tsx               # Home page — analyser + dashboard
├── __tests__/
│   ├── analyze-route.test.ts  # API logic tests
│   ├── scam-stats.test.tsx    # Component tests
│   └── utils.test.ts          # Unit tests
├── proxy.ts                   # Rate limiting + security headers
├── next.config.ts             # Image optimisation + security headers
├── vitest.config.mts          # Test configuration
└── vitest.setup.ts            # Global test mocks (Firebase, IntersectionObserver)
```

---

## Data Sources

All statistics are sourced from official 2023 annual reports:
- **FTC Consumer Sentinel Network Data Book 2023** — total fraud losses, report counts, median loss
- **FBI Internet Crime Complaint Center (IC3) 2023 Annual Report** — investment fraud, tech support scams, romance scams
- **Europol Cybercrime Centre** — international fraud origin data

---

*Riskly — because the difference between a scam and a safe message should never cost someone their life savings.*
