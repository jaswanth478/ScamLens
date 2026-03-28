import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getDb } from '@/app/lib/firebase';
import { extractUrls, sanitizeInput, isValidClassification, isValidScore } from '@/app/lib/utils';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

async function checkSafeBrowsing(urls: string[]): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey || urls.length === 0) return [];

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'riskly', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: urls.map((url) => ({ url })),
          },
        }),
      }
    );
    const data = await res.json();
    return (data.matches ?? []).map((m: { threat: { url: string } }) => m.threat.url);
  } catch {
    return [];
  }
}

async function logToFirestore(result: {
  classification: string;
  score: number;
  flagCount: number;
}) {
  try {
    const db = getDb();
    await addDoc(collection(db, 'analyses'), {
      classification: result.classification,
      score: result.score,
      flagCount: result.flagCount,
      timestamp: serverTimestamp(),
    });
    const statsRef = doc(db, 'stats', 'global');
    const classificationKey = result.classification.toLowerCase() + 'Count';
    await setDoc(
      statsRef,
      {
        totalAnalyses: increment(1),
        [classificationKey]: increment(1),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-blocking — Firestore write failures don't affect the response
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw: string = body?.message ?? '';

    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return NextResponse.json({ error: 'Invalid message provided.' }, { status: 400 });
    }

    const message = sanitizeInput(raw);
    const urls = extractUrls(message);

    const [geminiResponse, flaggedUrls] = await Promise.all([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: `You are Riskly, an expert AI-powered Message Risk Analyzer.
Your task is to analyze user-provided messages (SMS, emails, chats) and accurately assess the risk level based on the context, urgency, framing, and common scam vectors (phishing, social engineering, immediate financial demands, explicit hazards).

Output your response strictly as a JSON object matching this schema:
{
  "classification": "Scam" | "Suspicious" | "Safe" | "Emergency",
  "score": number (0 to 100, where 0 is completely safe and 100 is extremely dangerous/immediate harm),
  "redFlags": string[] (A concise list of specific reasons why the message is risky, or empty if completely safe),
  "recommendedActions": string[] (Actionable, clear steps the user should take immediately)
}`,
          responseMimeType: 'application/json',
        },
      }),
      checkSafeBrowsing(urls),
    ]);

    if (!geminiResponse.text) {
      throw new Error('No completion returned from Gemini');
    }

    const result = JSON.parse(geminiResponse.text);

    if (!isValidClassification(result.classification) || !isValidScore(result.score)) {
      throw new Error('Invalid response structure from AI model');
    }

    if (flaggedUrls.length > 0) {
      result.redFlags = [
        ...(result.redFlags ?? []),
        ...flaggedUrls.map((u: string) => `URL flagged by Google Safe Browsing: ${u}`),
      ];
      result.score = Math.min(100, result.score + 20);
      if (result.classification === 'Suspicious' || result.classification === 'Safe') {
        result.classification = 'Scam';
      }
    }

    logToFirestore({
      classification: result.classification,
      score: result.score,
      flagCount: result.redFlags.length,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error analyzing message:', message);
    return NextResponse.json(
      { error: 'Failed to analyze message. Ensure your GEMINI_API_KEY is properly set.' },
      { status: 500 }
    );
  }
}
