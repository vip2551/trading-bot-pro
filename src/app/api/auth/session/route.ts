import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Check current session (simplified - in production use proper session management)
export async function GET() {
  try {
    // For demo purposes, return the admin user if exists
    // In production, you'd check a proper session cookie/JWT
    const admin = await db.user.findFirst({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        subscription: {
          select: {
            planName: true,
            status: true,
            isTrial: true,
            maxTradesPerDay: true,
            maxActiveTrades: true,
          }
        }
      }
    });

    if (admin) {
      return NextResponse.json({ user: admin });
    }

    // Check for any user
    const user = await db.user.findFirst({
      where: { isAdmin: false },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        subscription: {
          select: {
            planName: true,
            status: true,
            isTrial: true,
            maxTradesPerDay: true,
            maxActiveTrades: true,
          }
        }
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
