import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const report = await request.json().catch(() => null);
    if (report) {
      console.warn('[CSP Violation]', JSON.stringify(report, null, 2));
    }
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'ok' });
  }
}
