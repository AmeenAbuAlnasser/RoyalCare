import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import type { CreatePaymentDto } from '../dto/create-payment.dto';

type PaymentPermission = 'payments.view' | 'payments.create';

const ALLOWED_METHODS = ['CASH', 'BANK_TRANSFER', 'CHECK', 'OTHER'] as const;
type PaymentMethod = (typeof ALLOWED_METHODS)[number];

const rolePermissions: Record<string, PaymentPermission[]> = {
  CENTER_OWNER: ['payments.view', 'payments.create'],
  CENTER_MANAGER: ['payments.view', 'payments.create'],
  ACCOUNTANT: ['payments.view', 'payments.create'],
  RECEPTIONIST: ['payments.view', 'payments.create'],
  DOCTOR: ['payments.view'],
  STAFF: ['payments.view'],
};

const paymentSelect = {
  id: true,
  centerId: true,
  invoiceId: true,
  patientId: true,
  createdByUserId: true,
  amount: true,
  currency: true,
  method: true,
  notes: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: { id: true, fullName: true, email: true },
  },
};

const creditTxSelect = {
  id: true,
  centerId: true,
  patientId: true,
  createdByUserId: true,
  amount: true,
  type: true,
  source: true,
  relatedInvoiceId: true,
  notes: true,
  createdAt: true,
  createdBy: {
    select: { id: true, fullName: true, email: true },
  },
};

function isValidAmount(value: unknown): boolean {
  if (typeof value === 'number') return isFinite(value) && value > 0;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return !isNaN(n) && isFinite(n) && n > 0;
  }
  return false;
}

function isValidMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (ALLOWED_METHODS as readonly string[]).includes(value);
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({ message: 'Validation failed', errors });
}

function formatPayment(p: {
  id: string;
  centerId: string;
  invoiceId: string;
  patientId: string;
  createdByUserId: string;
  amount: { toString(): string };
  currency: string;
  method: string;
  notes: string | null;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; fullName: string; email: string | null };
}) {
  return {
    id: p.id,
    centerId: p.centerId,
    invoiceId: p.invoiceId,
    patientId: p.patientId,
    createdByUserId: p.createdByUserId,
    amount: p.amount.toString(),
    currency: p.currency,
    method: p.method,
    notes: p.notes,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    createdBy: p.createdBy,
  };
}

function formatCreditTx(t: {
  id: string;
  centerId: string;
  patientId: string;
  createdByUserId: string;
  amount: { toString(): string };
  type: string;
  source: string;
  relatedInvoiceId: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: { id: string; fullName: string; email: string | null };
}) {
  return {
    id: t.id,
    centerId: t.centerId,
    patientId: t.patientId,
    createdByUserId: t.createdByUserId,
    amount: t.amount.toString(),
    type: t.type,
    source: t.source,
    relatedInvoiceId: t.relatedInvoiceId,
    notes: t.notes,
    createdAt: t.createdAt,
    createdBy: t.createdBy,
  };
}

function calcNewStatus(
  paidAmount: number,
  invoiceTotal: number,
): 'PENDING' | 'PARTIAL' | 'PAID' {
  if (paidAmount <= 0) return 'PENDING';
  if (paidAmount >= invoiceTotal) return 'PAID';
  return 'PARTIAL';
}

@Injectable()
export class TenantPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    centerId: string,
    roleKey: string,
    invoiceId: string,
    createdByUserId: string,
    dto: CreatePaymentDto,
  ) {
    this.requirePermission(roleKey, 'payments.create');

    const errors: Record<string, string> = {};

    const method =
      typeof dto.method === 'string'
        ? dto.method.trim().toUpperCase()
        : 'CASH';
    const currency =
      typeof dto.currency === 'string' && dto.currency.trim()
        ? dto.currency.trim().toUpperCase()
        : null;
    const notes =
      typeof dto.notes === 'string' && dto.notes.trim()
        ? dto.notes.trim()
        : null;

    if (!isValidAmount(dto.amount))
      errors.amount = 'Enter a valid amount greater than zero.';
    if (!isValidMethod(method)) errors.method = 'Select a valid payment method.';
    if (currency && currency.length > 10)
      errors.currency = 'Enter a valid currency code.';

    let paidAt: Date;
    try {
      paidAt = dto.paidAt ? new Date(dto.paidAt as string) : new Date();
      if (isNaN(paidAt.getTime())) throw new Error('invalid');
    } catch {
      errors.paidAt = 'Enter a valid payment date.';
      paidAt = new Date();
    }

    if (Object.keys(errors).length > 0) throw validationFailed(errors);

    const prisma = await this.prisma.getClient();

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, centerId },
      select: { id: true, patientId: true, amount: true, currency: true, status: true },
    });

    if (!invoice)
      throw new NotFoundException({
        message: 'Invoice not found',
        errors: { invoice: 'Invoice not found.' },
      });

    if (invoice.status === 'CANCELLED')
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { invoice: 'Cannot add payment to a cancelled invoice. Reopen it first.' },
      });

    // Current cash payments already applied
    const existingAgg = await prisma.payment.aggregate({
      where: { invoiceId, centerId },
      _sum: { amount: true },
    });
    // Credit already applied to this invoice
    const existingCreditAgg = await prisma.creditTransaction.aggregate({
      where: { relatedInvoiceId: invoiceId, centerId, type: 'CREDIT_USE' },
      _sum: { amount: true },
    });

    const alreadyPaid =
      Number(existingAgg._sum.amount ?? 0) +
      Number(existingCreditAgg._sum.amount ?? 0);
    const invoiceTotal = Number(invoice.amount);
    const newAmount = parseFloat(String(dto.amount));
    const balanceDue = Math.max(0, invoiceTotal - alreadyPaid);

    const resolvedCurrency = currency ?? invoice.currency ?? 'ILS';

    // Split: applied to invoice vs credit
    const appliedToInvoice = Math.min(newAmount, balanceDue);
    const creditToAdd = parseFloat((newAmount - appliedToInvoice).toFixed(2));
    const afterPayment = alreadyPaid + appliedToInvoice;
    const newStatus = calcNewStatus(afterPayment, invoiceTotal);

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          centerId,
          invoiceId,
          patientId: invoice.patientId,
          createdByUserId,
          amount: String(appliedToInvoice),
          currency: resolvedCurrency,
          method: method as PaymentMethod,
          notes,
          paidAt,
        },
        select: paymentSelect,
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
        select: { status: true },
      }),
    ]);

    let creditBalance: number | null = null;

    if (creditToAdd > 0.001) {
      const creditNotes = notes
        ? `Overpayment from payment. ${notes}`
        : 'Overpayment from payment.';
      await prisma.$transaction([
        prisma.creditTransaction.create({
          data: {
            centerId,
            patientId: invoice.patientId,
            createdByUserId,
            amount: String(creditToAdd),
            type: 'CREDIT_ADD',
            source: 'OVERPAYMENT',
            relatedInvoiceId: invoiceId,
            notes: creditNotes,
          },
          select: creditTxSelect,
        }),
        prisma.patient.update({
          where: { id: invoice.patientId },
          data: { creditBalance: { increment: creditToAdd } },
          select: { creditBalance: true },
        }),
      ]);
      const updatedPatient = await prisma.patient.findFirst({
        where: { id: invoice.patientId, centerId },
        select: { creditBalance: true },
      });
      creditBalance = updatedPatient ? Number(updatedPatient.creditBalance) : null;
    }

    return {
      payment: formatPayment(payment),
      invoiceStatus: newStatus,
      paidAmount: afterPayment.toFixed(2),
      balanceDue: Math.max(0, invoiceTotal - afterPayment).toFixed(2),
      creditAdded: creditToAdd > 0.001 ? creditToAdd.toFixed(2) : null,
      patientCreditBalance: creditBalance !== null ? creditBalance.toFixed(2) : null,
    };
  }

  async list(centerId: string, roleKey: string, invoiceId: string) {
    this.requirePermission(roleKey, 'payments.view');

    const prisma = await this.prisma.getClient();

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, centerId },
      select: { id: true, amount: true, currency: true, patientId: true },
    });

    if (!invoice)
      throw new NotFoundException({
        message: 'Invoice not found',
        errors: { invoice: 'Invoice not found.' },
      });

    const [payments, payAgg, creditTxs, creditAgg, patient] = await Promise.all([
      prisma.payment.findMany({
        where: { invoiceId, centerId },
        orderBy: { paidAt: 'asc' },
        select: paymentSelect,
      }),
      prisma.payment.aggregate({
        where: { invoiceId, centerId },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.findMany({
        where: { relatedInvoiceId: invoiceId, centerId, type: 'CREDIT_USE' },
        orderBy: { createdAt: 'asc' },
        select: creditTxSelect,
      }),
      prisma.creditTransaction.aggregate({
        where: { relatedInvoiceId: invoiceId, centerId, type: 'CREDIT_USE' },
        _sum: { amount: true },
      }),
      prisma.patient.findFirst({
        where: { id: invoice.patientId, centerId },
        select: { creditBalance: true },
      }),
    ]);

    const invoiceTotal = Number(invoice.amount);
    const paidCash = Number(payAgg._sum.amount ?? 0);
    const paidCredit = Number(creditAgg._sum.amount ?? 0);
    const paidAmount = paidCash + paidCredit;

    return {
      payments: payments.map(formatPayment),
      creditUsages: creditTxs.map(formatCreditTx),
      invoiceTotal: invoiceTotal.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      balanceDue: Math.max(0, invoiceTotal - paidAmount).toFixed(2),
      currency: invoice.currency,
      patientCreditBalance: patient ? Number(patient.creditBalance).toFixed(2) : '0.00',
    };
  }

  private requirePermission(roleKey: string, permission: PaymentPermission) {
    if (!rolePermissions[roleKey]?.includes(permission)) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: `Missing permission: ${permission}` },
      });
    }
  }
}
