import { NextResponse } from 'next/server';

// POST - Logout (simplified - in production you'd clear session cookies/JWT)
export async function POST() {
  try {
    // In production, clear session cookie or invalidate JWT
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Still return success
  }
}
