import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get user or users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          subscription: { include: { plan: true } },
          botSettings: true
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }

      // Return safe user data
      const userSafe = {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        subscription: user.subscription,
        botSettings: user.botSettings
      };

      return NextResponse.json({ user: userSafe });
    }

    if (email) {
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, name: true }
      });

      return NextResponse.json({ exists: !!user, user });
    }

    return NextResponse.json({ error: 'userId or email required' }, { status: 400 });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات المستخدم' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();

    const user = await db.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم تحديث البيانات بنجاح'
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'فشل تحديث البيانات' }, { status: 500 });
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    await db.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف الحساب بنجاح'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'فشل حذف الحساب' }, { status: 500 });
  }
}
