import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message provided.' },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
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
    });

    if (!response.text) {
      throw new Error('No completion returned from Gemini');
    }

    const result = JSON.parse(response.text);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error analyzing message:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message. Ensure your GEMINI_API_KEY is properly set.' },
      { status: 500 }
    );
  }
}
