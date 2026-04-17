import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activityId } = body;

    // In production, this would save to database
    // and set up real-time tracking for this whale

    return NextResponse.json({
      success: true,
      message: "Now following whale activity",
      activityId,
      followedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to follow whale" },
      { status: 500 }
    );
  }
}
