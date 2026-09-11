import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { summaryScheduler } from './jobs/summaryJobs.js';
import { reminderScheduler } from './jobs/reminderJobs.js';

async function bootstrap() {
  let mongoUri = env.MONGODB_URI;

  if (!mongoUri && process.env.NODE_ENV !== 'production') {
    try {
      logger.info('No MONGODB_URI set in .env. Starting embedded in-memory MongoDB for local development...');
      // @ts-ignore
      const memPkg = 'mongodb-memory-server';
      const memModule: any = await (import(memPkg) as any).catch(() => null);
      if (memModule?.MongoMemoryServer) {
        const mongod = await memModule.MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        logger.info('✅ Embedded in-memory MongoDB started successfully');
      }
    } catch (err: any) {
      logger.warn(`Could not start in-memory MongoDB (${err.message}). Defaulting to localhost:27017.`);
      mongoUri = 'mongodb://localhost:27017/ai-assistant';
    }
  }

  try {
    logger.info('Connecting to MongoDB database...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('✅ Connected to MongoDB successfully');
  } catch (err: any) {
    logger.warn(`Could not connect to MongoDB Atlas (${err.message}).`);
    if (process.env.NODE_ENV !== 'production') {
      try {
        // @ts-ignore
        const memPkg = 'mongodb-memory-server';
        const memModule: any = await (import(memPkg) as any).catch(() => null);
        if (memModule?.MongoMemoryServer) {
          const mongod = await memModule.MongoMemoryServer.create();
          await mongoose.connect(mongod.getUri());
          logger.info('✅ Connected to fallback in-memory MongoDB successfully');
        }
      } catch (fallbackErr: any) {
        logger.error('Failed to start fallback in-memory MongoDB', { error: fallbackErr.message });
      }
    }
  }

  // Start background schedulers (node-cron for summaries & proactive reminders)
  try {
    summaryScheduler.start();
    reminderScheduler.start();
  } catch (err: any) {
    logger.error('Failed to start schedulers', { error: err.message });
  }

  // Start Telegram bot polling if token is configured
  if (env.TELEGRAM_BOT_TOKEN) {
    try {
      const { telegramService } = await import('./services/telegram/telegramService.js');
      const { agentOrchestrator } = await import('./services/orchestrator/agentOrchestrator.js');
      const { authController } = await import('./controllers/authController.js');
      const { Setting } = await import('./models/Setting.js');

      telegramService.startPolling(async (chatId, text) => {
        const { User } = await import('./models/User.js');
        const { TelegramLinkToken } = await import('./models/TelegramLinkToken.js');
        const trimmed = text.trim();

        // 1. Handle secure deep-link linking (/start <token> or /connect <token>)
        if (trimmed.startsWith('/start ') || trimmed.startsWith('/connect ')) {
          const code = trimmed.split(/\s+/)[1]?.trim();
          if (code) {
            const linkDoc = await TelegramLinkToken.findOne({
              token: code,
              expiresAt: { $gt: new Date() },
            });

            if (linkDoc) {
              const targetUser = await User.findById(linkDoc.userId);
              if (targetUser) {
                await Setting.updateOne(
                  { userId: targetUser._id },
                  { $set: { telegramChatId: chatId } },
                  { upsert: true }
                );
                await TelegramLinkToken.deleteOne({ _id: linkDoc._id });
                logger.info('Telegram account securely linked via token', {
                  userId: targetUser._id,
                  email: targetUser.email,
                  chatId,
                });
                return `✅ *Account Linked Successfully!*\n\nWelcome, *${targetUser.name}*! Your Telegram account is now securely linked to your Assistant OS workspace (${targetUser.email}).\n\nYou can now:\n• Reply *YES SEND* to approve pending drafts\n• Request email summaries & agendas\n• Receive morning & evening digests`;
              }
            }
            return '❌ *Connection Failed*\n\nThis linking code is invalid or has expired (codes expire after 10 minutes).\n\nPlease open the web dashboard (Settings > Telegram) and click "Connect Telegram" to generate a fresh link.';
          }
        }

        // 2. Strict lookup: only match user who explicitly linked this chatId
        const setting = await Setting.findOne({ telegramChatId: chatId });
        const user = setting ? await User.findById(setting.userId) : null;

        // 3. ZERO ADMIN FALLBACK: Unlinked chat IDs are rejected with instructions
        if (!user) {
          logger.warn('Rejected Telegram message from unlinked chatId', { chatId });
          return `🔒 *Unauthorized Access*\n\nYour Telegram account is not linked to any Assistant OS workspace.\n\nTo securely link your account:\n1. Log in to the web dashboard\n2. Open *Settings* > *Telegram*\n3. Click *Connect Telegram* to generate your one-time link`;
        }

        // 4. Authorized execution
        const res = await agentOrchestrator.handleMessage(user._id.toString(), 'telegram', text);
        return res.text;
      });
    } catch (err: any) {
      logger.error('Failed to start Telegram bot listener', { error: err.message });
    }
  }

  const port = parseInt(process.env.PORT || env.PORT, 10) || 5001;
  const host = '0.0.0.0';
  const server = app.listen(port, host, () => {
    logger.info(`🚀 Assistant server running in ${env.NODE_ENV} mode on ${host}:${port}`);
    logger.info(`👉 API Health: /api/health`);
    logger.info(`👉 Frontend Origin: ${env.CLIENT_URL}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const altPort = port + 1;
      logger.warn(`Port ${port} in use, attempting port ${altPort}...`);
      app.listen(altPort, host, () => {
        logger.info(`🚀 Assistant server running on fallback port ${altPort}`);
      });
    } else {
      logger.error('Server error', { error: err.message });
    }
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', { error: err.message, stack: err.stack });
  process.exit(1);
});
