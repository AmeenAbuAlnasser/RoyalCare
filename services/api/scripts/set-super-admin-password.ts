/**
 * One-time maintenance script.
 * Sets the password for super.admin@royalcare.local using the project's
 * password hashing service (scrypt$64$<salt>$<derivedKey>).
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/set-super-admin-password.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@royalcare/db';
//import { PrismaClient } from '../../../packages/database/node_modules/@prisma/client';
import { PrismaPg } from '../node_modules/@prisma/adapter-pg';
import { hashPassword, verifyPassword } from '../src/common/security/password-hashing';

const TARGET_EMAIL = 'super.admin@royalcare.local';
const NEW_PASSWORD = 'Rc!2026#SuperAdmin$91';

// ── .env parser ────────────────────────────────────────────────────────────────

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  const env: Record<string, string> = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const envPath = resolve(__dirname, '../.env');
  const env = parseEnvFile(envPath);
  const connectionString = env['DATABASE_URL'] ?? process.env['DATABASE_URL'];

  if (!connectionString) {
    console.error('FAIL  DATABASE_URL not found in .env or environment.');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

  try {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
      select: { id: true, email: true, status: true, passwordHash: true },
    });

    if (!user) {
      console.error(`FAIL  User not found: ${TARGET_EMAIL}`);
      process.exit(1);
    }

    console.log(`OK    Found user: ${user.email}  id=${user.id}  status=${user.status}`);

    // 2. Hash new password
    const newHash = await hashPassword(NEW_PASSWORD);
    console.log(`OK    Hash generated: ${newHash.slice(0, 30)}…`);

    // 3. Verify the hash round-trips before writing
    const selfCheck = await verifyPassword(NEW_PASSWORD, newHash);
    if (!selfCheck) {
      console.error('FAIL  Hash self-verification failed. Aborting — no changes made.');
      process.exit(1);
    }
    console.log('OK    Hash self-verification passed.');

    // 4. Update only this user
    const result = await prisma.user.updateMany({
      where: { email: TARGET_EMAIL },
      data: { passwordHash: newHash },
    });

    if (result.count !== 1) {
      console.error(`FAIL  Expected 1 updated row, got ${result.count}. Investigate.`);
      process.exit(1);
    }

    // 5. Read back and confirm hash is stored
    const updated = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
      select: { passwordHash: true },
    });

    const confirmCheck = await verifyPassword(NEW_PASSWORD, updated?.passwordHash ?? '');
    if (!confirmCheck) {
      console.error('FAIL  Post-update verification failed. Hash in DB does not match.');
      process.exit(1);
    }

    console.log('OK    Password updated and confirmed in database.');
    console.log(`\n  email   : ${TARGET_EMAIL}`);
    console.log(`  password: ${NEW_PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('FAIL  Unexpected error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
