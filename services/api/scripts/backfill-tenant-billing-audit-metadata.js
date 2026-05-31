const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PrismaClient } = require('../../../packages/database/node_modules/@prisma/client');
const { PrismaPg } = require('../node_modules/@prisma/adapter-pg');

const ACTIONS = [
  'TENANT_INVOICE_CREATED',
  'TENANT_PAYMENT_ADDED',
  'TENANT_CREDIT_CREATED',
  'TENANT_CREDIT_USED',
  'TENANT_INVOICE_CANCELLED',
];

const EXPECTED_DATABASE_URL =
  'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev?schema=public';

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return values;
      const index = trimmed.indexOf('=');
      if (index === -1) return values;
      const key = trimmed.slice(0, index).trim();
      const rawValue = trimmed.slice(index + 1).trim();
      values[key] = rawValue.replace(/^["']|["']$/g, '');
      return values;
    }, {});
}

function getDatabaseUrl() {
  const apiRoot = resolve(__dirname, '..');
  const repoRoot = resolve(apiRoot, '../..');
  return (
    parseEnvFile(resolve(apiRoot, '.env')).DATABASE_URL ||
    parseEnvFile(resolve(repoRoot, '.env')).DATABASE_URL ||
    parseEnvFile(resolve(repoRoot, 'packages/database/.env')).DATABASE_URL ||
    process.env.DATABASE_URL ||
    EXPECTED_DATABASE_URL
  );
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasValue(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value != null;
}

function setIfMissing(target, key, value) {
  if (!hasValue(value) || hasValue(target[key])) return false;
  target[key] = value;
  return true;
}

function setLocalizedSnapshot(target, key, value, fallbackValue) {
  if (!hasValue(value)) return false;
  if (!hasValue(target[key]) || target[key] === fallbackValue) {
    target[key] = value;
    return true;
  }
  return false;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });

  const stats = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    missingInvoiceId: 0,
    invoiceNotFound: 0,
    unchanged: 0,
  };

  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: { in: ACTIONS } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        metadata: true,
      },
    });

    stats.scanned = logs.length;

    for (const log of logs) {
      if (!isRecord(log.metadata)) {
        stats.skipped += 1;
        continue;
      }

      const metadata = { ...log.metadata };
      const invoiceId =
        typeof metadata.invoiceId === 'string' ? metadata.invoiceId : '';

      if (!invoiceId) {
        stats.missingInvoiceId += 1;
        continue;
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          invoiceNumber: true,
          centerId: true,
          patientId: true,
          patient: {
            select: {
              fullName: true,
              fullNameAr: true,
              fullNameEn: true,
              fullNameHe: true,
            },
          },
          center: {
            select: {
              name: true,
              nameAr: true,
              nameEn: true,
              nameHe: true,
            },
          },
        },
      });

      if (!invoice) {
        stats.invoiceNotFound += 1;
        continue;
      }

      let changed = false;
      changed = setIfMissing(metadata, 'invoiceNumber', invoice.invoiceNumber) || changed;
      changed = setIfMissing(metadata, 'patientId', invoice.patientId) || changed;
      changed = setIfMissing(metadata, 'patientName', invoice.patient.fullName) || changed;
      changed = setLocalizedSnapshot(metadata, 'patientNameAr', invoice.patient.fullNameAr, invoice.patient.fullName) || changed;
      changed = setLocalizedSnapshot(metadata, 'patientNameEn', invoice.patient.fullNameEn, invoice.patient.fullName) || changed;
      changed = setLocalizedSnapshot(metadata, 'patientNameHe', invoice.patient.fullNameHe, invoice.patient.fullName) || changed;
      changed = setIfMissing(metadata, 'centerId', invoice.centerId) || changed;
      changed = setIfMissing(metadata, 'centerName', invoice.center.name) || changed;
      changed = setLocalizedSnapshot(metadata, 'centerNameAr', invoice.center.nameAr, invoice.center.name) || changed;
      changed = setLocalizedSnapshot(metadata, 'centerNameEn', invoice.center.nameEn, invoice.center.name) || changed;
      changed = setLocalizedSnapshot(metadata, 'centerNameHe', invoice.center.nameHe, invoice.center.name) || changed;

      if (!changed) {
        stats.unchanged += 1;
        continue;
      }

      await prisma.auditLog.update({
        where: { id: log.id },
        data: { metadata },
      });
      stats.updated += 1;
    }

    console.log(JSON.stringify(stats, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
