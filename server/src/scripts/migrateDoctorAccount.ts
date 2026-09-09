import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

async function migrate() {
  logger.info('Starting doctor account migration...');
  await mongoose.connect(env.MONGODB_URI);

  // Find user by old default email or find the first user
  let user = await User.findOne({ email: 'client@realestate.com' });
  if (!user) {
    user = await User.findOne({});
  }

  if (!user) {
    logger.warn('No existing user found to migrate. A user will be created on first sign-in.');
    process.exit(0);
  }

  const oldEmail = user.email;
  const oldName = user.name;

  user.email = 'bhesaniyajenish06@gmail.com';
  user.name = 'Jenish Bhesaniya';
  user.role = 'admin';
  user.tokenVersion = user.tokenVersion || 0;
  await user.save();

  logger.info(`✅ Successfully migrated existing user (${user._id}) from "${oldName}" <${oldEmail}> to "${user.name}" <${user.email}>.`);
  process.exit(0);
}

migrate().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
