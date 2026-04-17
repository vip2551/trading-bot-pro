import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch single plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;

    const plan = await db.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

// PATCH - Update plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};

    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priceMonthly !== undefined) updateData.priceMonthly = parseFloat(data.priceMonthly);
    if (data.priceYearly !== undefined) updateData.priceYearly = parseFloat(data.priceYearly);
    if (data.maxTradesPerDay !== undefined) updateData.maxTradesPerDay = parseInt(data.maxTradesPerDay);
    if (data.maxActiveTrades !== undefined) updateData.maxActiveTrades = parseInt(data.maxActiveTrades);
    if (data.trialDays !== undefined) updateData.trialDays = parseInt(data.trialDays);
    if (data.features !== undefined) updateData.features = JSON.stringify(data.features);
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const plan = await db.plan.update({
      where: { id: planId },
      data: updateData,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE - Delete plan (soft delete by setting isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;

    // Soft delete
    const plan = await db.plan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
