import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

export async function GET() {
  try {
    // Check database
    const admin = await db.user.findFirst({ where: { isAdmin: true } });
    
    if (!admin) {
      return NextResponse.json({ status: 'ok', admin: null, message: 'No admin found' });
    }

    const testHash = hashPassword('Admin@123456');

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      admin: {
        email: admin.email,
        hasPassword: !!admin.password,
        hashMatches: admin.password === testHash
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}