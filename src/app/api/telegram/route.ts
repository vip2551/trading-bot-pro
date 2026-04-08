import { NextRequest, NextResponse } from 'next/server';

// GET - Get Telegram config status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // For now, return not configured
    return NextResponse.json({
      configured: false,
      enabled: false,
      hasBotToken: false,
      hasChatId: false
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Configure or test Telegram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, botToken, chatId, enabled } = body;

    console.log('Telegram API called:', { action, userId, hasToken: !!botToken, hasChatId: !!chatId });

    if (action === 'test_message') {
      const token = botToken;
      const chat = chatId;
      
      if (!token || !chat) {
        console.log('Missing token or chatId');
        return NextResponse.json({ 
          success: false,
          error: 'Bot token and Chat ID are required' 
        }, { status: 400 });
      }

      console.log('Sending test message to Telegram...');

      // Send message directly to Telegram API
      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: `🧪 <b>Test Message</b>

✅ Telegram integration working!

<i>From Trading Bot Pro</i>`,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      console.log('Telegram API response:', data);

      if (data.ok) {
        return NextResponse.json({ 
          success: true,
          messageId: data.result.message_id 
        });
      } else {
        return NextResponse.json({ 
          success: false,
          error: data.description || 'Failed to send message'
        });
      }
    }

    return NextResponse.json({ 
      success: false,
      error: 'Invalid action' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('Telegram API error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
