require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding.');

    const name = process.env.ADMIN_NAME || 'System Admin';
    const email = process.env.ADMIN_EMAIL || 'admin@serviceprovider.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

    // 2. Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin user already exists with email: ${email}`);
      process.exit(0);
    }

    // 3. Create admin
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      status: 'approved', // Admins are automatically approved
    });

    console.log(`Successfully created admin user: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
