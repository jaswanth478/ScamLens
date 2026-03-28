import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const revalidate = 60;

export async function GET() {
  try {
    const db = getDb();
    const statsDoc = await getDoc(doc(db, 'stats', 'global'));

    if (!statsDoc.exists()) {
      return NextResponse.json({
        totalAnalyses: 0,
        scamCount: 0,
        suspiciousCount: 0,
        safeCount: 0,
        emergencyCount: 0,
      });
    }

    const data = statsDoc.data();
    return NextResponse.json({
      totalAnalyses: data.totalAnalyses ?? 0,
      scamCount: data.scamCount ?? 0,
      suspiciousCount: data.suspiciousCount ?? 0,
      safeCount: data.safeCount ?? 0,
      emergencyCount: data.emergencyCount ?? 0,
    });
  } catch {
    return NextResponse.json({
      totalAnalyses: 0,
      scamCount: 0,
      suspiciousCount: 0,
      safeCount: 0,
      emergencyCount: 0,
    });
  }
}
