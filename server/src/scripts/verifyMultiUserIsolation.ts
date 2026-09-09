import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { PendingAction } from '../models/PendingAction.js';

async function testIsolation() {
  console.log('🧪 Starting Multi-User Data Isolation Verification...');
  await mongoose.connect(env.MONGODB_URI);

  // 1. User A (Jenish Bhesaniya)
  const userA = await User.findOne({ email: 'bhesaniyajenish06@gmail.com' });
  if (!userA) throw new Error('User A not found');

  let pendingA = await PendingAction.findOne({ userId: userA._id, status: 'awaiting_approval' });
  if (!pendingA) {
    pendingA = await PendingAction.create({
      userId: userA._id,
      type: 'send_email',
      status: 'awaiting_approval',
      summary: 'Test pending email for User A',
      payload: { to: 'client@example.com', subject: 'Test', body: 'Hello' },
      channelOrigin: 'dashboard',
      workspace: 'business',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  // 2. Create User B
  await User.deleteOne({ email: 'isolated.test.user.b@example.com' });
  const userB = await User.create({
    name: 'Test User B',
    email: 'isolated.test.user.b@example.com',
    role: 'user',
    tokenVersion: 0,
  });

  const tokenB = jwt.sign(
    { userId: userB._id.toString(), email: userB.email, role: userB.role, tokenVersion: 0 },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const clientB = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { Authorization: `Bearer ${tokenB}` },
  });

  // Test 1: User B fetching approvals queue should return 0 items
  const approvalsB = await clientB.get('/approvals');
  console.log(`Test 1 (Approvals Isolation): User B sees ${approvalsB.data.length} items. (Expected: 0)`);
  if (approvalsB.data.length !== 0) throw new Error('Isolation failed: User B saw User A approvals');

  // Test 2: User B attempting to approve User A's pending action should get 403 Forbidden
  try {
    await clientB.post(`/approvals/${pendingA._id}/approve`);
    throw new Error('Isolation failed: User B was able to approve User A action');
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log('Test 2 (Cross-User Action Block): HTTP 403 Forbidden returned correctly.');
    } else {
      throw new Error(`Expected 403, got: ${err.response?.status || err.message}`);
    }
  }

  // Test 3: User B fetching activity logs should return 0 items
  const logsB = await clientB.get('/logs');
  console.log(`Test 3 (Logs Isolation): User B sees ${logsB.data.length} logs. (Expected: 0)`);
  if (logsB.data.length !== 0) throw new Error('Isolation failed: User B saw User A logs');

  // Test 4: User B calling /api/auth/me should see User B identity
  const meB = await clientB.get('/auth/me');
  console.log(`Test 4 (Identity Verification): Email is ${meB.data.user.email}. (Expected: isolated.test.user.b@example.com)`);
  if (meB.data.user.email !== 'isolated.test.user.b@example.com') throw new Error('Identity mismatch');

  // Test 5: Logout server-side tokenVersion invalidation
  await clientB.post('/auth/logout');
  try {
    await clientB.get('/auth/me');
    throw new Error('Logout failed: Token was still valid after logout');
  } catch (err: any) {
    if (err.response?.status === 401) {
      console.log('Test 5 (Server-side Revocation on Logout): HTTP 401 returned correctly after logout.');
    } else {
      throw new Error(`Expected 401, got: ${err.response?.status || err.message}`);
    }
  }

  // Cleanup User B
  await User.deleteOne({ _id: userB._id });
  console.log('🎉 ALL 5 MULTI-USER ISOLATION TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testIsolation().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
