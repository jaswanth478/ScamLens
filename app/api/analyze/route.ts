import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScamRequestSchema, ScamResultSchema } from '@/lib/schemas';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ScamRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message } = parsed.data;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: `You are ScamShield, an expert AI-powered scam and fraud detection system for societal protection.
Analyze the provided message (SMS, email, chat, or any unstructured text) for scam indicators, phishing attempts, social engineering, or fraud.

Return a JSON object matching this exact schema:
{
  "classification": "Scam" | "Suspicious" | "Safe" | "Emergency",
  "score": number (0-100, where 100 is definitely a scam),
  "redFlags": string[] (specific manipulation tactics or fraud signals found),
  "recommendedActions": string[] (immediate actionable steps for the user),
  "summary": string (one-sentence plain English explanation)
}`,
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error('No response from Gemini');

    const raw = JSON.parse(response.text);
    const result = ScamResultSchema.safeParse(raw);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid AI response structure.' }, { status: 500 });
    }

    // Log to Firebase Firestore anonymously
    try {
      await addDoc(collection(db, 'scam_reports'), {
        classification: result.data.classification,
        score: result.data.score,
        redFlagCount: result.data.redFlags.length,
        timestamp: serverTimestamp(),
      });
    } catch {
      // Non-blocking: Firebase logging failure shouldn't fail the request
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('Scam analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message.' },
      { status: 500 }
    );
  }
}
