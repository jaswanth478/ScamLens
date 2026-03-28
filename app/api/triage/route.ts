import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TriageRequestSchema, TriageResultSchema } from '@/lib/schemas';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = TriageRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { description, imageBase64 } = parsed.data;

    const contents: Parameters<typeof ai.models.generateContent>[0]['contents'] = imageBase64
      ? [
          {
            role: 'user',
            parts: [
              { text: description },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ]
      : description;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: `You are MedBridge, an AI-powered emergency medical triage assistant built for rapid first-response decisions.
You receive messy, panicked, unstructured descriptions of medical emergencies — text, symptoms, medical history snippets, or photos of injuries.
Your job is to instantly convert this chaos into clear, structured, life-saving actions.

IMPORTANT: You are NOT diagnosing. You are providing immediate first-aid triage guidance until professional help arrives.

Return ONLY a JSON object exactly matching this schema:
{
  "severity": "Critical" | "Urgent" | "Non-Urgent" | "Stable",
  "severityScore": number (0-100, where 100 is immediately life-threatening),
  "condition": string (likely condition in plain English),
  "immediateActions": string[] (numbered, clear, immediate first-aid steps),
  "doNotDo": string[] (CRITICAL things NOT to do),
  "vitalsToMonitor": string[] (what to watch for),
  "callEmergency": boolean (true if 911/ambulance should be called immediately),
  "dispatchPayload": {
    "incidentType": string,
    "severity": string,
    "symptoms": string[],
    "recommendedResponse": string,
    "estimatedArrivalPriority": "Immediate" | "High" | "Medium" | "Low"
  }
}`,
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) throw new Error('No response from Gemini');

    const raw = JSON.parse(response.text);
    const result = TriageResultSchema.safeParse(raw);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid AI response structure.' }, { status: 500 });
    }

    // Log to Firebase anonymously for incident pattern tracking
    try {
      await addDoc(collection(db, 'triage_incidents'), {
        severity: result.data.severity,
        severityScore: result.data.severityScore,
        callEmergency: result.data.callEmergency,
        hasImage: !!imageBase64,
        timestamp: serverTimestamp(),
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('Triage error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze medical situation.' },
      { status: 500 }
    );
  }
}
