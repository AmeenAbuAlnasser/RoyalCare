import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { CenterAuthService } from '../auth/services/center-auth.service';
import {
  centerSessionCookieName,
  verifyCenterSessionToken,
} from '../auth/services/center-session.service';
import { ExpensesService } from './expenses.service';

type UploadedReceiptFile = {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
};

const RECEIPT_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function saveReceipt(file: UploadedReceiptFile | undefined) {
  if (!file?.buffer) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { file: 'Receipt file is required.' },
    });
  }
  const mime = file.mimetype ?? '';
  const ext = RECEIPT_MIME[mime];
  if (!ext) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { file: 'Only PDF, PNG, JPG, and WebP receipts are allowed.' },
    });
  }
  if ((file.size ?? file.buffer.byteLength) > MAX_RECEIPT_BYTES) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { file: 'Receipt must be 10 MB or smaller.' },
    });
  }

  const uploadDir = resolve(
    process.cwd(),
    '..',
    '..',
    'apps',
    'web',
    'public',
    'uploads',
    'expenses',
  );
  await mkdir(uploadDir, { recursive: true });
  const filename = `expense-receipt-${Date.now()}-${randomUUID()}${ext}`;
  await writeFile(join(uploadDir, filename), file.buffer);
  return { url: `/uploads/expenses/${filename}` };
}

@Controller('tenant/expenses')
export class ExpensesController {
  constructor(
    private readonly centerAuthService: CenterAuthService,
    private readonly expensesService: ExpensesService,
  ) {}

  @Get('overview')
  async overview(
    @Req() request: Request,
    @Query() query: Record<string, string>,
  ) {
    const session = await this.getSession(request);
    return this.expensesService.overview(
      session.center.id,
      session.permissions,
      query,
    );
  }

  @Get('options')
  async options(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.expensesService.options(session.center.id, session.permissions);
  }

  @Get()
  async list(@Req() request: Request, @Query() query: Record<string, string>) {
    const session = await this.getSession(request);
    return this.expensesService.list(
      session.center.id,
      session.permissions,
      query,
    );
  }

  @Post()
  async create(@Req() request: Request, @Body() body: Record<string, unknown>) {
    const session = await this.getSession(request);
    return this.expensesService.create(
      session.center.id,
      session.user.id,
      session.permissions,
      body,
    );
  }

  @Patch(':expenseId')
  async update(
    @Req() request: Request,
    @Param('expenseId') expenseId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const session = await this.getSession(request);
    return this.expensesService.update(
      session.center.id,
      session.permissions,
      expenseId,
      body,
    );
  }

  @Delete(':expenseId')
  async delete(@Req() request: Request, @Param('expenseId') expenseId: string) {
    const session = await this.getSession(request);
    return this.expensesService.delete(
      session.center.id,
      session.permissions,
      expenseId,
    );
  }

  @Post('receipt')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_RECEIPT_BYTES } }),
  )
  async uploadReceipt(
    @Req() request: Request,
    @UploadedFile() file?: UploadedReceiptFile,
  ) {
    const session = await this.getSession(request);
    this.expensesService.requireCreatePermission(session.permissions);
    return saveReceipt(file);
  }

  @Get('categories/list')
  async categories(@Req() request: Request) {
    const session = await this.getSession(request);
    return this.expensesService.listCategories(
      session.center.id,
      session.permissions,
    );
  }

  @Post('categories')
  async createCategory(
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const session = await this.getSession(request);
    return this.expensesService.createCategory(
      session.center.id,
      session.permissions,
      body,
    );
  }

  @Patch('categories/:categoryId')
  async updateCategory(
    @Req() request: Request,
    @Param('categoryId') categoryId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const session = await this.getSession(request);
    return this.expensesService.updateCategory(
      session.center.id,
      session.permissions,
      categoryId,
      body,
    );
  }

  private getSession(request: Request) {
    const token = getCookie(request, centerSessionCookieName);
    return this.centerAuthService.getSession(verifyCenterSessionToken(token));
  }
}
