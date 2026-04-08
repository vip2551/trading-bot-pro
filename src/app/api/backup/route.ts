import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

/**
 * Backup API
 * نظام النسخ الاحتياطي التلقائي
 */

// Ensure backup directory exists
async function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }
}

// GET - Get backup list or download backup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');
    const type = searchParams.get('type') || 'list';

    if (download) {
      // Download specific backup
      const backupPath = path.join(BACKUP_DIR, download);
      if (!existsSync(backupPath)) {
        return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
      }
      
      const content = await readFile(backupPath, 'utf-8');
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${download}"`,
        },
      });
    }

    // Get list of backups
    await ensureBackupDir();
    const { readdir, stat } = await import('fs/promises');
    const files = await readdir(BACKUP_DIR);
    
    const backups = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const filePath = path.join(BACKUP_DIR, f);
          const stats = await stat(filePath);
          return {
            filename: f,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
          };
        })
    );

    // Sort by creation date
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Get latest backup info
    const latestBackup = backups[0];
    let autoBackupEnabled = false;
    let nextBackupTime: Date | null = null;

    const settings = await db.systemSettings.findFirst();
    if (settings?.backupEnabled) {
      autoBackupEnabled = true;
      if (settings.lastBackupAt) {
        const nextBackup = new Date(settings.lastBackupAt);
        nextBackup.setHours(nextBackup.getHours() + (settings.backupInterval || 24));
        nextBackupTime = nextBackup;
      }
    }

    return NextResponse.json({
      backups,
      autoBackupEnabled,
      nextBackupTime,
      totalSize: backups.reduce((s, b) => s + b.size, 0),
    });

  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 });
  }
}

// POST - Create new backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'FULL', userId, sendToTelegram = false } = body;

    await ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type.toLowerCase()}-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, filename);

    const backupData: Record<string, unknown> = {
      metadata: {
        type,
        createdAt: new Date(),
        version: '1.0',
      },
    };

    // Full backup
    if (type === 'FULL' || type === 'SETTINGS') {
      backupData.settings = await db.botSettings.findMany();
      backupData.notificationSettings = await db.notificationSettings.findMany();
      backupData.systemSettings = await db.systemSettings.findMany();
    }

    if (type === 'FULL' || type === 'TRADES') {
      backupData.trades = await db.trade.findMany({
        include: {
          logs: true,
          notifications: true,
        },
      });
      backupData.signals = await db.tradingViewSignal.findMany();
    }

    if (type === 'FULL' || type === 'SUBSCRIPTIONS') {
      backupData.users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          subscription: true,
          payments: true,
        },
      });
      backupData.plans = await db.plan.findMany();
    }

    if (type === 'FULL' || type === 'ANALYTICS') {
      backupData.dailyStats = await db.dailyStats.findMany();
      backupData.backtests = await db.backtest.findMany();
      backupData.auditLogs = await db.auditLog.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Write backup file
    await writeFile(backupPath, JSON.stringify(backupData, null, 2));

    // Update system settings
    await db.systemSettings.upsert({
      where: { id: 'system' },
      create: {
        id: 'system',
        lastBackupAt: new Date(),
        backupEnabled: true,
      },
      update: {
        lastBackupAt: new Date(),
      },
    });

    // Send to Telegram if requested
    if (sendToTelegram && userId) {
      const notifSettings = await db.notificationSettings.findUnique({
        where: { userId },
      });

      if (notifSettings?.telegramEnabled && notifSettings.telegramBotToken && notifSettings.telegramChatId) {
        const message = `
💾 *Backup Created*

📅 *Time:* ${new Date().toLocaleString()}
📦 *Type:* ${type}
📊 *Size:* ${(JSON.stringify(backupData).length / 1024).toFixed(2)} KB

✅ Backup saved successfully
`.trim();

        await fetch(`https://api.telegram.org/bot${notifSettings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: notifSettings.telegramChatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });

        // Send file if small enough
        if (JSON.stringify(backupData).length < 1024 * 1024 * 50) { // 50MB limit
          // Could implement file upload here
        }
      }
    }

    return NextResponse.json({
      success: true,
      filename,
      path: backupPath,
      size: JSON.stringify(backupData).length,
      message: 'Backup created successfully',
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

// PUT - Restore from backup
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, restoreSettings = true, restoreTrades = false } = body;

    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400 });
    }

    const backupPath = path.join(BACKUP_DIR, filename);
    if (!existsSync(backupPath)) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    const content = await readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(content);

    const results: Record<string, number> = {};

    // Restore settings
    if (restoreSettings && backupData.settings) {
      for (const setting of backupData.settings) {
        await db.botSettings.upsert({
          where: { id: setting.id },
          create: setting,
          update: setting,
        });
      }
      results.settings = backupData.settings.length;
    }

    // Note: Trades restore is dangerous and should be done carefully
    // Usually better to just restore settings and let trades sync from IB

    return NextResponse.json({
      success: true,
      message: 'Backup restored',
      results,
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}

// DELETE - Delete old backups
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keepDays = parseInt(searchParams.get('keepDays') || '30');
    const filename = searchParams.get('filename');

    const { readdir, unlink, stat } = await import('fs/promises');
    await ensureBackupDir();
    const files = await readdir(BACKUP_DIR);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    let deleted = 0;

    for (const file of files) {
      if (filename && file !== filename) continue;
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await stat(filePath);

      if (stats.birthtime < cutoffDate || filename === file) {
        await unlink(filePath);
        deleted++;
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      message: `Deleted ${deleted} old backup(s)`,
    });

  } catch (error) {
    console.error('Error deleting backups:', error);
    return NextResponse.json({ error: 'Failed to delete backups' }, { status: 500 });
  }
}
