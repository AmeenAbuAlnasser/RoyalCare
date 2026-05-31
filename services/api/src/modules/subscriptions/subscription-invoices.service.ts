import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { pathToFileURL } from 'url';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type SubscriptionInvoiceStatus,
} from '@royalcare/db';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateSubscriptionInvoiceDto } from './dto/create-subscription-invoice.dto';
import { ListSubscriptionInvoicesQueryDto } from './dto/list-subscription-invoices-query.dto';
import { UpdateSubscriptionInvoiceStatusDto } from './dto/update-subscription-invoice-status.dto';

const INVOICE_STATUSES: SubscriptionInvoiceStatus[] = [
  'DRAFT',
  'PENDING',
  'PAID',
  'OVERDUE',
  'CANCELLED',
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PrismaClient = Awaited<ReturnType<PrismaService['getClient']>>;
type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

function parsePage(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parseDate(value: string | undefined, field: string) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { [field]: 'Enter a valid date.' },
    });
  }
  return date;
}

function parseMoney(value: string | undefined, field: string, fallback = '0') {
  const raw = value?.trim() || fallback;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: { [field]: 'Enter a valid amount.' },
    });
  }
  return numeric;
}

function toDecimal(value: number) {
  return value.toFixed(2);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function isPastDue(date: Date, today = startOfToday()) {
  return date.getTime() < today.getTime();
}

function serializeInvoice(
  invoice: Prisma.SubscriptionInvoiceGetPayload<{
    include: {
      center: { select: { id: true; name: true; slug: true } };
      subscription: { select: { id: true; planName: true; status: true } };
    };
  }>,
) {
  return {
    ...invoice,
    amount: invoice.amount.toString(),
    discount: invoice.discount.toString(),
    tax: invoice.tax.toString(),
    total: invoice.total.toString(),
  };
}

type PdfLocale = 'en' | 'ar' | 'he';

type HtmlPdfLabels = {
  amount: string;
  amounts: string;
  center: string;
  discount: string;
  dueDate: string;
  invoiceDetails: string;
  invoiceNumber: string;
  plan: string;
  status: string;
  tax: string;
  title: string;
  total: string;
};

const HTML_PDF_LABELS: Record<PdfLocale, HtmlPdfLabels> = {
  en: {
    amount: 'Subtotal',
    amounts: 'Amounts',
    center: 'Center name',
    discount: 'Discount',
    dueDate: 'Due date',
    invoiceDetails: 'Invoice details',
    invoiceNumber: 'Invoice number',
    plan: 'Plan',
    status: 'Status',
    tax: 'Tax',
    title: 'Subscription Invoice',
    total: 'Total',
  },
  ar: {
    amount: 'المبلغ',
    amounts: 'المبالغ',
    center: 'اسم المركز',
    discount: 'الخصم',
    dueDate: 'تاريخ الاستحقاق',
    invoiceDetails: 'تفاصيل الفاتورة',
    invoiceNumber: 'رقم الفاتورة',
    plan: 'الخطة',
    status: 'الحالة',
    tax: 'الضريبة',
    title: 'فاتورة اشتراك',
    total: 'الإجمالي',
  },
  he: {
    amount: 'סכום',
    amounts: 'סכומים',
    center: 'שם המרכז',
    discount: 'הנחה',
    dueDate: 'תאריך לתשלום',
    invoiceDetails: 'פרטי חשבונית',
    invoiceNumber: 'מספר חשבונית',
    plan: 'תוכנית',
    status: 'סטטוס',
    tax: 'מס',
    title: 'חשבונית מינוי',
    total: 'סה"כ',
  },
};

@Injectable()
export class SubscriptionInvoicesService {
  constructor(
    private readonly audit: AuditService,
    private readonly prismaService: PrismaService,
  ) {}

  async list(query: ListSubscriptionInvoicesQueryDto = {}) {
    const prisma = await this.prismaService.getClient();
    await this.syncOverdueInvoices(prisma);
    const page = parsePage(query.page, 1);
    const pageSize = Math.min(100, parsePage(query.pageSize, 25));
    const skip = (page - 1) * pageSize;
    const where: Prisma.SubscriptionInvoiceWhereInput = {};

    if (query.centerId?.trim()) where.centerId = query.centerId.trim();
    if (query.subscriptionId?.trim()) {
      where.subscriptionId = query.subscriptionId.trim();
    }
    if (query.status && query.status !== 'ALL') {
      if (!INVOICE_STATUSES.includes(query.status)) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: { status: 'Enter a valid invoice status.' },
        });
      }
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { center: { name: { contains: search, mode: 'insensitive' } } },
        {
          subscription: { planName: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.subscriptionInvoice.findMany({
        where,
        orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: {
          center: { select: { id: true, name: true, slug: true } },
          subscription: { select: { id: true, planName: true, status: true } },
        },
      }),
      prisma.subscriptionInvoice.count({ where }),
    ]);

    return {
      data: data.map(serializeInvoice),
      pagination: { page, pageSize, total },
    };
  }

  async listForCenter(
    centerId: string,
    query: ListSubscriptionInvoicesQueryDto = {},
  ) {
    return this.list({ ...query, centerId });
  }

  async create(dto: CreateSubscriptionInvoiceDto, actorId?: string) {
    const prisma = await this.prismaService.getClient();

    if (!dto.centerId || !UUID_RE.test(dto.centerId)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { centerId: 'Select a center.' },
      });
    }
    if (!dto.subscriptionId || !UUID_RE.test(dto.subscriptionId)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { subscriptionId: 'Select a subscription.' },
      });
    }
    const centerId = dto.centerId;
    const subscriptionId = dto.subscriptionId;

    let status = dto.status ?? 'PENDING';
    if (!INVOICE_STATUSES.includes(status)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { status: 'Enter a valid invoice status.' },
      });
    }

    const amount = parseMoney(dto.amount, 'amount');
    const discount = parseMoney(dto.discount, 'discount');
    const tax = parseMoney(dto.tax, 'tax');
    const total = amount - discount + tax;
    if (total < 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { total: 'Total cannot be negative.' },
      });
    }

    const issuedAt = parseDate(dto.issuedAt, 'issuedAt') ?? new Date();
    const dueDate = parseDate(dto.dueDate, 'dueDate');
    if (!dueDate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { dueDate: 'Due date is required.' },
      });
    }
    if (status !== 'PAID' && status !== 'CANCELLED' && isPastDue(dueDate)) {
      status = 'OVERDUE';
    }

    const paidAt =
      status === 'PAID'
        ? (parseDate(dto.paidAt, 'paidAt') ?? new Date())
        : null;

    const invoice = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findFirst({
        where: { id: subscriptionId, centerId },
        select: { id: true },
      });
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const invoiceNumber = await this.generateInvoiceNumber(
        tx,
        issuedAt.getFullYear(),
      );

      return tx.subscriptionInvoice.create({
        data: {
          amount: toDecimal(amount),
          centerId,
          currency: dto.currency?.trim().toUpperCase() || 'ILS',
          discount: toDecimal(discount),
          dueDate,
          invoiceNumber,
          issuedAt,
          notes: dto.notes?.trim() || null,
          paidAt,
          paymentMethod: dto.paymentMethod?.trim() || null,
          status,
          subscriptionId,
          tax: toDecimal(tax),
          total: toDecimal(total),
        },
        include: {
          center: { select: { id: true, name: true, slug: true } },
          subscription: { select: { id: true, planName: true, status: true } },
        },
      });
    });

    await this.audit.log({
      action: 'SUBSCRIPTION_INVOICE_CREATED',
      actorUserId: actorId,
      centerId: invoice.centerId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: invoice.total.toString(),
      },
    });

    return serializeInvoice(invoice);
  }

  async markPaid(
    invoiceId: string,
    dto: UpdateSubscriptionInvoiceStatusDto,
    actorId?: string,
  ) {
    return this.updateStatus(invoiceId, 'PAID', dto, actorId);
  }

  async cancel(
    invoiceId: string,
    dto: UpdateSubscriptionInvoiceStatusDto,
    actorId?: string,
  ) {
    return this.updateStatus(invoiceId, 'CANCELLED', dto, actorId);
  }

  async downloadPdf(invoiceId: string, locale = 'en', actorId?: string) {
    const prisma = await this.prismaService.getClient();
    await this.syncOverdueInvoices(prisma);
    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        center: { select: { id: true, name: true, slug: true } },
        subscription: { select: { id: true, planName: true, status: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Subscription invoice not found');
    }

    await this.audit.log({
      action: 'SUBSCRIPTION_INVOICE_DOWNLOADED',
      actorUserId: actorId,
      centerId: invoice.centerId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        locale,
      },
    });

    const pdf = await this.createReadablePdfBuffer(
      serializeInvoice(invoice),
      locale,
    );

    return {
      contentBase64: pdf.toString('base64'),
      fileName: `${invoice.invoiceNumber}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  private async updateStatus(
    invoiceId: string,
    status: SubscriptionInvoiceStatus,
    dto: UpdateSubscriptionInvoiceStatusDto,
    actorId?: string,
  ) {
    const prisma = await this.prismaService.getClient();
    const existing = await prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
      select: { centerId: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Subscription invoice not found');
    }

    const invoice = await prisma.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: {
        notes: dto.notes?.trim() || undefined,
        paidAt:
          status === 'PAID'
            ? (parseDate(dto.paidAt, 'paidAt') ?? new Date())
            : null,
        paymentMethod:
          status === 'PAID' ? dto.paymentMethod?.trim() || 'MANUAL' : null,
        status,
      },
      include: {
        center: { select: { id: true, name: true, slug: true } },
        subscription: { select: { id: true, planName: true, status: true } },
      },
    });

    await this.audit.log({
      action:
        status === 'PAID'
          ? 'SUBSCRIPTION_INVOICE_PAID'
          : 'SUBSCRIPTION_INVOICE_CANCELLED',
      actorUserId: actorId,
      centerId: invoice.centerId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        oldStatus: existing.status,
        newStatus: invoice.status,
      },
    });

    return serializeInvoice(invoice);
  }

  private async generateInvoiceNumber(prisma: PrismaExecutor, year: number) {
    const rows = await prisma.$queryRaw<Array<{ number: bigint | number }>>(
      Prisma.sql`
        INSERT INTO "SubscriptionInvoiceNumberCounter" ("year", "nextNumber", "createdAt", "updatedAt")
        VALUES (${year}, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("year") DO UPDATE
        SET "nextNumber" = "SubscriptionInvoiceNumberCounter"."nextNumber" + 1,
            "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "nextNumber" - 1 AS "number"
      `,
    );
    const nextNumber = Number(rows[0]?.number ?? 1);
    return `SUB-${year}-${String(nextNumber).padStart(6, '0')}`;
  }

  private async syncOverdueInvoices(prisma: PrismaExecutor) {
    await prisma.subscriptionInvoice.updateMany({
      where: {
        dueDate: { lt: startOfToday() },
        paidAt: null,
        status: { in: ['DRAFT', 'PENDING'] },
      },
      data: { status: 'OVERDUE' },
    });
  }

  // ── PDF generation ─────────────────────────────────────────────────────────

  private async createReadablePdfBuffer(
    invoice: ReturnType<typeof serializeInvoice>,
    locale: string,
  ): Promise<Buffer> {
    const safeLocale: PdfLocale =
      locale === 'ar' ? 'ar' : locale === 'he' ? 'he' : 'en';
    const html = this.buildInvoiceHtml(invoice, safeLocale);
    return this.renderHtmlWithChromium(html, invoice.invoiceNumber);
  }

  private buildInvoiceHtml(
    invoice: ReturnType<typeof serializeInvoice>,
    locale: PdfLocale,
  ) {
    const labels = HTML_PDF_LABELS[locale];
    const isRtl = locale !== 'en';
    const direction = isRtl ? 'rtl' : 'ltr';
    const align = isRtl ? 'right' : 'left';
    const amount = (value: string) =>
      `${this.escapeHtml(invoice.currency || 'USD')} ${this.escapeHtml(value)}`;
    const rows = [
      [labels.invoiceNumber, invoice.invoiceNumber],
      [labels.center, invoice.center.name],
      [labels.plan, invoice.subscription.planName],
      [labels.status, invoice.status],
      [labels.dueDate, this.formatPdfDate(invoice.dueDate)],
    ];
    const totals = [
      [labels.amount, amount(invoice.amount), false],
      [labels.tax, amount(invoice.tax), false],
      [labels.discount, amount(invoice.discount), false],
      [labels.total, amount(invoice.total), true],
    ] as const;

    return `<!doctype html>
<html lang="${locale}" dir="${direction}">
<head>
  <meta charset="utf-8" />
  <title>${this.escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #ffffff;
      color: #132238;
      direction: ${direction};
      font-family: Arial, "Noto Sans Arabic", "Noto Sans Hebrew", sans-serif;
      font-size: 14px;
      line-height: 1.55;
      text-align: ${align};
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 22mm 18mm 16mm;
    }
    .header {
      border-bottom: 2px solid #c8a45d;
      padding-bottom: 16px;
      text-align: center;
    }
    h1 {
      color: #0b2d5c;
      font-size: 32px;
      line-height: 1.25;
      margin: 0 0 8px;
      font-weight: 800;
    }
    .invoice-no {
      color: #526176;
      direction: ltr;
      display: inline-block;
      font-size: 15px;
      letter-spacing: .3px;
      unicode-bidi: isolate;
    }
    .grid {
      display: grid;
      gap: 18px;
      grid-template-columns: 1fr 1fr;
      margin-top: 26px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #f8fafc;
      min-height: 280px;
      padding: 20px;
    }
    .card h2 {
      color: #8a681f;
      font-size: 14px;
      letter-spacing: .4px;
      margin: 0 0 18px;
      text-transform: uppercase;
    }
    .row {
      border-bottom: 1px solid #e6ebf1;
      padding: 0 0 11px;
      margin-bottom: 13px;
    }
    .row:last-child { border-bottom: 0; margin-bottom: 0; }
    .label {
      color: #66758a;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .value {
      color: #132238;
      font-size: 15px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .ltr {
      direction: ltr;
      unicode-bidi: isolate;
    }
    .total {
      background: #0b2d5c;
      border-radius: 9px;
      color: white;
      margin-top: 10px;
      padding: 16px;
    }
    .total .label { color: rgba(255,255,255,.72); }
    .total .value {
      color: white;
      direction: ltr;
      font-size: 26px;
      line-height: 1.2;
      unicode-bidi: isolate;
    }
    .notes {
      border-top: 1px solid #e5e7eb;
      color: #526176;
      margin-top: 28px;
      padding-top: 18px;
      white-space: pre-wrap;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      color: #99a8b8;
      font-size: 11px;
      margin-top: 34px;
      padding-top: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <h1>${this.escapeHtml(labels.title)}</h1>
      <div class="invoice-no">${this.escapeHtml(invoice.invoiceNumber)}</div>
    </header>
    <section class="grid">
      <article class="card">
        <h2>${this.escapeHtml(labels.invoiceDetails)}</h2>
        ${rows
          .map(
            ([label, value]) => `<div class="row">
          <div class="label">${this.escapeHtml(label)}</div>
          <div class="value ${value === invoice.invoiceNumber ? 'ltr' : ''}">${this.escapeHtml(value)}</div>
        </div>`,
          )
          .join('')}
      </article>
      <article class="card">
        <h2>${this.escapeHtml(labels.amounts)}</h2>
        ${totals
          .map(([label, value, total]) =>
            total
              ? `<div class="total"><div class="label">${this.escapeHtml(label)}</div><div class="value">${value}</div></div>`
              : `<div class="row"><div class="label">${this.escapeHtml(label)}</div><div class="value ltr">${value}</div></div>`,
          )
          .join('')}
      </article>
    </section>
    ${
      invoice.notes?.trim()
        ? `<section class="notes">${this.escapeHtml(invoice.notes.trim())}</section>`
        : ''
    }
    <footer class="footer"><span class="ltr">RoyalCare - ${this.escapeHtml(invoice.invoiceNumber)}</span></footer>
  </main>
</body>
</html>`;
  }

  private async renderHtmlWithChromium(html: string, invoiceNumber: string) {
    const chromePath = this.resolveChromePath();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'royalcare-pdf-'));
    const htmlPath = path.join(tempDir, `${invoiceNumber}.html`);
    const pdfPath = path.join(tempDir, `${invoiceNumber}.pdf`);

    try {
      fs.writeFileSync(htmlPath, html, 'utf8');
      await this.execFileAsync(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        `--print-to-pdf=${pdfPath}`,
        '--no-pdf-header-footer',
        pathToFileURL(htmlPath).href,
      ]);
      return fs.readFileSync(pdfPath);
    } finally {
      fs.rmSync(tempDir, { force: true, recursive: true });
    }
  }

  private execFileAsync(command: string, args: string[]) {
    return new Promise<void>((resolve, reject) => {
      execFile(command, args, { windowsHide: true }, (error) => {
        if (error) {
          reject(
            error instanceof Error ? error : new Error('Chromium PDF failed'),
          );
        } else {
          resolve();
        }
      });
    });
  }

  private resolveChromePath() {
    const candidates = [
      process.env.CHROME_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ].filter((candidate): candidate is string => Boolean(candidate));

    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (!found) {
      throw new Error('Chromium executable was not found for PDF generation.');
    }
    return found;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatPdfDate(value: Date | string) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }
}
