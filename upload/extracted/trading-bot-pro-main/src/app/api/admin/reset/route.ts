import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { setupKey, newPassword } = body;

    const validSetupKey = process.env.ADMIN_SETUP_KEY || 'trading-bot-admin-2024';

    if (setupKey !== validSetupKey) {
      return NextResponse.json({ success: false, error: 'Invalid setup key' }, { status: 403 });
    }

    const password = newPassword || 'Admin@123456';
    const hashedPassword = hashPassword(password);

    const admin = await db.user.findFirst({ where: { isAdmin: true } });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    await db.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      admin: { email: admin.email, password: password }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}