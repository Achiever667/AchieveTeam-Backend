import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

function cleanCurrency(value: string) {
  if (!value) return '0.00';
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  if (cleaned === '') return '0.00';
  // Ensure two decimal places
  return Number(cleaned).toFixed(2);
}

async function importStaffs() {
  const path = join(__dirname, '..', 'data', 'staffs.json');
  const raw = readFileSync(path, 'utf-8');
  const staffs = JSON.parse(raw) as Array<any>;

  for (const s of staffs) {
    const roleMap: Record<string, string> = {
      superAdmin: 'SUPER_ADMIN',
      admin: 'ADMIN',
      staff: 'STAFF',
    };

    const role = roleMap[s.role] ?? 'STAFF';
    const password = s.password ?? 'changeme';
    const passwordHash = await bcrypt.hash(password, 10);

    // Upsert user by email
    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        role,
        passwordHash,
      },
      create: {
        name: s.name,
        email: s.email,
        phone: null,
        passwordHash,
        role,
        department: 'Staff',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Imported staff ${s.email} as ${role}`);
  }
}

async function importLoans() {
  const path = join(__dirname, '..', 'data', 'loans.json');
  const raw = readFileSync(path, 'utf-8');
  const loans = JSON.parse(raw) as Array<any>;

  for (const l of loans) {
    const applicant = l.applicant || {};
    const email = applicant.email?.toLowerCase() ?? `user+${l.id}@example.com`;
    const name = applicant.name ?? 'Unknown';
    const phone = applicant.telephone ?? null;

    // Ensure user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash('changeme', 10);
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: 'USER',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });
      console.log(`Created applicant user ${email}`);
    }

    const amount = cleanCurrency(l.amount);
    const status = (l.status || 'PENDING').toString().toUpperCase();
    const createdAt = l.createdAt ? new Date(l.createdAt) : new Date();

    // Upsert loan by loanNumber (legacy id)
    await prisma.loan.upsert({
      where: { loanNumber: l.id },
      update: {
        amount: amount,
        status,
        updatedAt: new Date(),
      },
      create: {
        loanNumber: l.id,
        userId: user.id,
        amount: amount,
        interestRate: '0.00',
        tenureMonths: 12,
        status,
        purpose: l.purpose ?? null,
        disbursedAt: null,
        createdAt,
      },
    });

    console.log(`Imported loan ${l.id} for ${email}`);
  }
}

async function main() {
  try {
    console.log('Starting JSON → Prisma import');
    await importStaffs();
    await importLoans();
    console.log('Import completed');
  } catch (e) {
    console.error('Import failed', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
