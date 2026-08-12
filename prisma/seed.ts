import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (be careful with this!)
  await prisma.user.deleteMany();
  console.log('✓ Cleared existing users');

  // Create seed users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      phone: '+1234567890',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      department: 'Management',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✓ Created SUPER_ADMIN user:', superAdmin.email);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+1234567891',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      department: 'Operations',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✓ Created ADMIN user:', admin.email);

  const staff = await prisma.user.create({
    data: {
      name: 'Staff Member',
      email: 'staff@example.com',
      phone: '+1234567892',
      passwordHash: hashedPassword,
      role: 'STAFF',
      department: 'Loan Operations',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✓ Created STAFF user:', staff.email);

  const normalUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567893',
      passwordHash: hashedPassword,
      role: 'USER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✓ Created USER user:', normalUser.email);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('Email: superadmin@example.com | Role: SUPER_ADMIN | Password: password123');
  console.log('Email: admin@example.com | Role: ADMIN | Password: password123');
  console.log('Email: staff@example.com | Role: STAFF | Password: password123');
  console.log('Email: john@example.com | Role: USER | Password: password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
