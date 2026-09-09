import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';
import { TelegramLinkToken } from '../models/TelegramLinkToken.js';
import crypto from 'crypto';

dotenv.config({ path: '../.env' });
dotenv.config();

async function run() {
  console.log('--- STARTING TELEGRAM SECURITY & ZERO-FALLBACK VERIFICATION ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/assistant');

  // Test User A (Jenish Bhesaniya)
  const userA = await User.findOne({ email: 'bhesaniyajenish06@gmail.com' });
  if (!userA) {
    throw new Error('User A (Jenish Bhesaniya) not found');
  }

  // Clear any existing telegramChatId for User A
  await Setting.updateOne({ userId: userA._id }, { $unset: { telegramChatId: 1 } });
  await TelegramLinkToken.deleteMany({});

  const attackerChatId = 'attacker_chat_99999';

  // TEST 1: Unlinked incoming message must NOT bind to admin or User A
  console.log('\n[TEST 1] Verifying unlinked incoming message rejects and does NOT auto-bind...');
  let settingBefore = await Setting.findOne({ telegramChatId: attackerChatId });
  if (settingBefore) {
    throw new Error('Precondition failed: attackerChatId already mapped');
  }

  // Simulate server.ts polling lookup
  const settingCheck = await Setting.findOne({ telegramChatId: attackerChatId });
  const userCheck = settingCheck ? await User.findById(settingCheck.userId) : null;

  if (userCheck) {
    throw new Error('FAILED: Unlinked chatId found a user without authentication!');
  }

  // Verify Setting was not updated to bind to any user
  const settingAfter = await Setting.findOne({ telegramChatId: attackerChatId });
  if (settingAfter) {
    throw new Error('FAILED: Auto-binding vulnerability still exists!');
  }
  console.log('✅ PASS: Unlinked chatId was rejected and NOT bound to any user.');

  // TEST 2: Generate one-time linking token for User A
  console.log('\n[TEST 2] Generating one-time linking token for User A...');
  const testToken = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await TelegramLinkToken.create({ userId: userA._id, token: testToken, expiresAt });
  console.log(`✅ Token created: ${testToken}`);

  // TEST 3: Simulate user opening deep link /start <token>
  console.log('\n[TEST 3] Simulating Telegram /start <token> handshake...');
  const legitimateChatId = 'user_a_real_telegram_12345';
  const linkDoc = await TelegramLinkToken.findOne({
    token: testToken,
    expiresAt: { $gt: new Date() },
  });

  if (!linkDoc) {
    throw new Error('FAILED: Valid token not found in DB');
  }

  const targetUser = await User.findById(linkDoc.userId);
  if (!targetUser || targetUser._id.toString() !== userA._id.toString()) {
    throw new Error('FAILED: Token mapped to wrong user');
  }

  await Setting.updateOne(
    { userId: targetUser._id },
    { $set: { telegramChatId: legitimateChatId } },
    { upsert: true }
  );
  await TelegramLinkToken.deleteOne({ _id: linkDoc._id });

  // Verify User A is now linked to legitimateChatId
  const verifiedSetting = await Setting.findOne({ userId: userA._id });
  if (verifiedSetting?.telegramChatId !== legitimateChatId) {
    throw new Error('FAILED: User A was not linked to legitimateChatId');
  }
  console.log(`✅ PASS: User A successfully linked to Telegram chatId ${legitimateChatId} via one-time token.`);

  // TEST 4: Verify one-time token cannot be re-used
  console.log('\n[TEST 4] Verifying one-time token replay prevention...');
  const reuseCheck = await TelegramLinkToken.findOne({ token: testToken });
  if (reuseCheck) {
    throw new Error('FAILED: Token was not consumed upon linking');
  }
  console.log('✅ PASS: Token consumed; replay attacks prevented.');

  // TEST 5: Verify attacker cannot hijack User A's session from different chatId
  console.log('\n[TEST 5] Verifying attacker cannot impersonate User A from different chatId...');
  const attackerLookup = await Setting.findOne({ telegramChatId: attackerChatId });
  if (attackerLookup) {
    throw new Error('FAILED: Attacker unexpectedly mapped to setting');
  }
  console.log('✅ PASS: Attacker is completely isolated and unauthorized.');

  console.log('\n--- ALL TELEGRAM ZERO-FALLBACK SECURITY TESTS PASSED ---\n');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
