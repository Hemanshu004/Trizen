require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

const seedAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME || 'System Admin';
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not provided in environment variables. Skipping admin seed.');
      return;
    }

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin user already exists with email: ${email}`);
      return;
    }

    await User.create({
      name,
      email,
      password,
      role: 'admin',
      status: 'approved',
    });

    console.log(`Successfully created admin user: ${email}`);
  } catch (error) {
    console.error('Error seeding admin user on startup:', error);
  }
};

const start = async () => {
  await connectDB();
  
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start();
