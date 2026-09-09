import mongoose from 'mongoose';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { getAuthorizedGoogleClient } from '../services/google/googleAuth.js';
import { gmailService } from '../services/gmail/gmailService.js';

async function testGmail() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const user = await User.findOne({});
  if (!user) {
    console.error('❌ No user found in MongoDB');
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email}), ID: ${user._id}`);

  // Test 1: Verify token decryption & get authorized client
  const auth = await getAuthorizedGoogleClient(user._id.toString());
  const gmail = google.gmail({ version: 'v1', auth });

  // Test 2: Get user profile from Gmail API
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log(`\n🎉 SUCCESS! Real Gmail account authenticated:`);
  console.log(`- Email Address: ${profile.data.emailAddress}`);
  console.log(`- Total Messages: ${profile.data.messagesTotal}`);
  console.log(`- Total Threads: ${profile.data.threadsTotal}`);

  // Test 3: Fetch latest 5 emails (both unread and recent)
  console.log(`\nFetching latest 5 emails via Gmail API...`);
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 5,
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) {
    console.log('No messages found in this mailbox.');
  } else {
    console.log(`Found ${messages.length} message(s). Retrieving details:\n`);
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
      const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
      const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';
      const snippet = detail.data.snippet || '';

      console.log(`----------------------------------------`);
      console.log(`Email #${i + 1}:`);
      console.log(`From:    ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`Date:    ${date}`);
      console.log(`Snippet: ${snippet.slice(0, 100)}...`);
    }
  }

  // Also test GmailService.getUnreadEmails directly
  console.log(`\nTesting GmailService.getUnreadEmails()...`);
  try {
    const unread = await gmailService.getUnreadEmails(user._id.toString(), 5);
    console.log(`GmailService.getUnreadEmails returned: ${unread.length} unread email(s)`);
  } catch (err: any) {
    console.log(`Note on getUnreadEmails: ${err.message}`);
  }

  await mongoose.disconnect();
}

testGmail().catch((err) => {
  console.error('❌ Gmail API Call Error:', err);
  process.exit(1);
});
