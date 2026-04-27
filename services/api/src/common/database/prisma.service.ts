import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../../../packages/database/node_modules/@prisma/client';
import { getApiDatabaseUrl } from '../config/database-url';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient | null = null;
  private readonly hasConfiguredDatabaseUrl: boolean;
  private readonly connectionString: string;

  constructor() {
    this.connectionString = getApiDatabaseUrl();
    this.hasConfiguredDatabaseUrl = true;
  }

  async onModuleInit() {
    if (this.hasConfiguredDatabaseUrl) {
      await this.getClient();
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.$disconnect();
    }
  }

  async getClient(): Promise<PrismaClient> {
    if (!this.client) {
      const client = new PrismaClient({
        adapter: new PrismaPg({ connectionString: this.connectionString }),
      });

      this.client = client;

      if (this.hasConfiguredDatabaseUrl) {
        await client.$connect();
      }
    }

    return this.client;
  }
}
