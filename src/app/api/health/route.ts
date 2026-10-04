import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', proxy: true, version: '1.0.0' });
}
