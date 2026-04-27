import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXPECTED_DATABASE_URL =
  'postgresql://royalcare:royalcare123@localhost:5432/royalcare_dev?schema=public';

function parseEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce<Record<string, string>>((values, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return values;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, '');

      values[key] = value;

      return values;
    }, {});
}

function getApiRoot() {
  return process.cwd().endsWith('services\\api') ||
    process.cwd().endsWith('services/api')
    ? process.cwd()
    : resolve(process.cwd(), 'services/api');
}

function getDatabaseUrlFromEnvFiles() {
  const apiRoot = getApiRoot();
  const repoRoot = resolve(apiRoot, '../..');
  const envFiles = [
    resolve(apiRoot, '.env'),
    resolve(repoRoot, '.env'),
    resolve(repoRoot, 'packages/database/.env'),
  ];

  for (const envFile of envFiles) {
    const databaseUrl = parseEnvFile(envFile).DATABASE_URL;

    if (databaseUrl) {
      return databaseUrl;
    }
  }

  return undefined;
}

function maskDatabaseUrl(databaseUrl: string) {
  return databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

export function getApiDatabaseUrl() {
  const databaseUrl =
    getDatabaseUrlFromEnvFiles() ??
    process.env.DATABASE_URL ??
    EXPECTED_DATABASE_URL;

  if (databaseUrl !== EXPECTED_DATABASE_URL) {
    throw new Error(
      `Invalid DATABASE_URL for services/api. Expected ${maskDatabaseUrl(
        EXPECTED_DATABASE_URL,
      )}. Received ${maskDatabaseUrl(databaseUrl)}.`,
    );
  }

  process.env.DATABASE_URL = databaseUrl;

  return databaseUrl;
}
