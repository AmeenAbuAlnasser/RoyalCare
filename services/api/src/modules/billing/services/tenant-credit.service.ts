import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import type { UseCreditDto } from '../dto/use-credit.dto';

type CreditPermission = 'payments.view' | 'payments.create';

const rolePermissions: Record<string, CreditPermission[]> = {
  CENTER_OWNER: ['payments.view', 'payments.create'],
  CENTER_MANAGER: ['payments.view', 'payments.create'],
  ACCOUNTANT: ['payments.view', 'payments.create'],
  RECEPTIONIST: ['payments.view', 'payments.create'],
  DOCTOR: ['payments.view'],
  STAFF: ['payments.view'],
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

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({ message: 'Validation failed', errors });
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
export class TenantCreditService {
  constructor(private readonly prisma: PrismaService) {}

  async useCredit(
    centerId: string,
    roleKey: string,
    invoiceId: string,
    createdByUserId: string,
    dto: UseCreditDto,
  ) {
    this.requirePermission(roleKey, 'payments.create');

    if (!isValidAmount(dto.amount))
      throw validationFailed({ amount: 'Enter a valid amount greater than zero.' });

    const creditAmount = parseFloat(String(dto.amount));
    const notes =
      typeof dto.notes === 'string' && dto.notes.trim()
        ? dto.notes.trim()
        : null;

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
        errors: { invoice: 'Cannot apply credit to a cancelled invoice. Reopen it first.' },
      });

    if (invoice.status === 'PAID')
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { invoice: 'This invoice is already fully paid.' },
      });

    // Load patient's credit balance
    const patient = await prisma.patient.findFirst({
      where: { id: invoice.patientId, centerId },
      select: { id: true, creditBalance: true },
    });

    if (!patient)
      throw new NotFoundException({
        message: 'Patient not found',
        errors: { patient: 'Patient not found.' },
      });

    const creditBalance = Number(patient.creditBalance);
    if (creditBalance < 0.01)
      throw validationFailed({
        amount: 'This patient has no available credit.',
      });

    // Calculate balance due on invoice
    const [cashAgg, creditUsedAgg] = await Promise.all([
      prisma.payment.aggregate({
        where: { invoiceId, centerId },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { relatedInvoiceId: invoiceId, centerId, type: 'CREDIT_USE' },
        _sum: { amount: true },
      }),
    ]);

    const alreadyPaid =
      Number(cashAgg._sum.amount ?? 0) + Number(creditUsedAgg._sum.amount ?? 0);
    const invoiceTotal = Number(invoice.amount);
    const balanceDue = Math.max(0, invoiceTotal - alreadyPaid);

    if (balanceDue < 0.01)
      throw validationFailed({ amount: 'This invoice is already fully paid.' });

    // Cap at min(creditBalance, balanceDue)
    const maxApplicable = Math.min(creditBalance, balanceDue);
    if (creditAmount > maxApplicable + 0.001)
      throw validationFailed({
        amount: `Cannot apply ${creditAmount.toFixed(2)}. Maximum applicable is ${maxApplicable.toFixed(2)}.`,
      });

    const applied = Math.min(creditAmount, maxApplicable);
    const afterPayment = alreadyPaid + applied;
    const newStatus = calcNewStatus(afterPayment, invoiceTotal);

    await prisma.$transaction([
      prisma.creditTransaction.create({
        data: {
          centerId,
          patientId: invoice.patientId,
          createdByUserId,
          amount: String(applied),
          type: 'CREDIT_USE',
          source: 'OVERPAYMENT',
          relatedInvoiceId: invoiceId,
          notes,
        },
      }),
      prisma.patient.update({
        where: { id: invoice.patientId },
        data: { creditBalance: { decrement: applied } },
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      }),
    ]);

    const updatedPatient = await prisma.patient.findFirst({
      where: { id: invoice.patientId, centerId },
      select: { creditBalance: true },
    });

    return {
      invoiceStatus: newStatus,
      creditApplied: applied.toFixed(2),
      paidAmount: afterPayment.toFixed(2),
      balanceDue: Math.max(0, invoiceTotal - afterPayment).toFixed(2),
      patientCreditBalance: updatedPatient
        ? Number(updatedPatient.creditBalance).toFixed(2)
        : '0.00',
    };
  }

  private requirePermission(roleKey: string, permission: CreditPermission) {
    if (!rolePermissions[roleKey]?.includes(permission)) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: `Missing permission: ${permission}` },
      });
    }
  }
}
