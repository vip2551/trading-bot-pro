import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get all promo codes
export async function GET() {
  try {
    const promoCodes = await db.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ promoCodes });
  } catch (error) {
    console.error('Get promo codes error:', error);
    return NextResponse.json({ promoCodes: [] });
  }
}

// POST - Create or update promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      maxUsesPerUser,
      validFrom,
      validUntil,
      isActive,
      minPurchaseAmount,
      forNewUsersOnly,
    } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (id) {
      const promo = await db.promoCode.update({
        where: { id },
        data: {
          code,
          description,
          discountType,
          discountValue,
          maxUses,
          maxUsesPerUser,
          validFrom: validFrom ? new Date(validFrom) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive,
          minPurchaseAmount,
          forNewUsersOnly,
        }
      });
      
      return NextResponse.json({ success: true, promo });
    } else {
      const promo = await db.promoCode.create({
        data: {
          code,
          description,
          discountType: discountType || 'PERCENT',
          discountValue: discountValue || 10,
          maxUses,
          maxUsesPerUser: maxUsesPerUser || 1,
          validFrom: validFrom ? new Date(validFrom) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: isActive !== false,
          minPurchaseAmount,
          forNewUsersOnly: forNewUsersOnly || false,
        }
      });
      
      return NextResponse.json({ success: true, promo });
    }
  } catch (error: unknown) {
    console.error('Save promo code error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Unique constraint')) {
      return NextResponse.json({ error: 'كود الخصم موجود بالفعل!' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'فشل حفظ كود الخصم' }, { status: 500 });
  }
}

// DELETE - Delete promo code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    
    await db.promoCode.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete promo code error:', error);
    return NextResponse.json({ error: 'فشل حذف كود الخصم' }, { status: 500 });
  }
}

// PUT - Validate promo code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, amount } = body;
    
    const promo = await db.promoCode.findUnique({
      where: { code }
    });
    
    if (!promo) {
      return NextResponse.json({ valid: false, error: 'كود الخصم غير موجود' });
    }
    
    if (!promo.isActive) {
      return NextResponse.json({ valid: false, error: 'كود الخصم غير نشط' });
    }
    
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return NextResponse.json({ valid: false, error: 'تم استخدام الكود الحد الأقصى' });
    }
    
    const now = new Date();
    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return NextResponse.json({ valid: false, error: 'كود الخصم لم يبدأ بعد' });
    }
    
    if (promo.validUntil && new Date(promo.validUntil) < now) {
      return NextResponse.json({ valid: false, error: 'انتهت صلاحية كود الخصم' });
    }
    
    if (promo.minPurchaseAmount && amount < promo.minPurchaseAmount) {
      return NextResponse.json({ 
        valid: false, 
        error: `الحد الأدنى للشراء: $${promo.minPurchaseAmount}` 
      });
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === 'PERCENT') {
      discountAmount = amount * (promo.discountValue / 100);
    } else {
      discountAmount = promo.discountValue;
    }
    
    return NextResponse.json({
      valid: true,
      discountAmount,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      promoId: promo.id,
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    return NextResponse.json({ valid: false, error: 'خطأ في التحقق من الكود' });
  }
}
