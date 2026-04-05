import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from '../src/config/db.js';
import { 
  users, 
  financialRecords, 
  auditLogs, 
  idempotencyKeys 
} from '../src/db/schema.js';

const seedDatabase = async () => {
  console.log('🌱 Starting Database Seeding...');

  try {
    console.log('🧹 Clearing existing data...');
    await db.delete(auditLogs);
    await db.delete(idempotencyKeys);
    await db.delete(financialRecords);
    await db.delete(users);

    console.log('👤 Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Password123!', salt);

    const userPayloads = [
      { name: 'System Admin', email: 'admin@finance.com', password, role: 'admin', status: 'active' },
      { name: 'Finance Manager', email: 'manager@finance.com', password, role: 'manager', status: 'active' },
      { name: 'Data Analyst', email: 'analyst@finance.com', password, role: 'analyst', status: 'active' },
      { name: 'Guest Viewer', email: 'viewer@finance.com', password, role: 'viewer', status: 'active' },
    ];

    const insertedUsers = await db.insert(users).values(userPayloads).returning();
    const adminUser = insertedUsers.find((u) => u.role === 'admin');

    console.log('💰 Seeding financial records...');
    const today = new Date().toISOString().split('T')[0];
    
    const recordPayloads = [
      {
        amount: '5000.00',
        type: 'income',
        category: 'services',
        date: today,
        notes: 'Initial consulting retainer',
        createdBy: adminUser.id,
      },
      {
        amount: '120.50',
        type: 'expense',
        category: 'software',
        date: today,
        notes: 'Monthly cloud hosting bill',
        createdBy: adminUser.id,
      }
    ];

    await db.insert(financialRecords).values(recordPayloads);

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();