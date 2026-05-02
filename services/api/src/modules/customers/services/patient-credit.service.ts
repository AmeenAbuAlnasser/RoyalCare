import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import type { AddCreditDto } from '../dto/add-credit.dto';

type CreditManagePermission = 'billing.mark_paid';

const rolePermissions: Record<string, CreditManagePermission[]> = {
  CENTER_OWNER: ['billing.mark_paid'],
  CENTER_MANAGER: ['billing.mark_paid'],
  ACCOUNTANT: ['billing.mark_paid'],
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

@Injectable()
export class PatientCreditService {
  constructor(private readonly prisma: PrismaService) {}

  async addManualCredit(
    centerId: string,
    roleKey: string,
    patientId: string,
    createdByUserId: string,
    dto: AddCreditDto,
  ) {
    this.requirePermission(roleKey, 'billing.mark_paid');

    if (!isValidAmount(dto.amount))
      throw validationFailed({ amount: 'Enter a valid amount greater than zero.' });

    const creditAmount = parseFloat(String(dto.amount));
    const notes =
      typeof dto.notes === 'string' && dto.notes.trim()
        ? dto.notes.trim()
        : null;

    if (!notes)
      throw validationFailed({ notes: 'A reason is required for manual credit adjustments.' });

    const prisma = await this.prisma.getClient();

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, centerId },
      select: { id: true, fullName: true, creditBalance: true },
    });

    if (!patient)
      throw new NotFoundException({
        message: 'Patient not found',
        errors: { patient: 'Patient not found in this center.' },
      });

    await prisma.$transaction([
      prisma.creditTransaction.create({
        data: {
          centerId,
          patientId,
          createdByUserId,
          amount: String(creditAmount),
          type: 'CREDIT_ADD',
          source: 'MANUAL',
          notes,
        },
      }),
      prisma.patient.update({
        where: { id: patientId },
        data: { creditBalance: { increment: creditAmount } },
      }),
    ]);

    const updated = await prisma.patient.findFirst({
      where: { id: patientId, centerId },
      select: { id: true, fullName: true, creditBalance: true },
    });

    return {
      patientId,
      fullName: patient.fullName,
      creditAdded: creditAmount.toFixed(2),
      creditBalance: updated
        ? Number(updated.creditBalance).toFixed(2)
        : (Number(patient.creditBalance) + creditAmount).toFixed(2),
    };
  }

  private requirePermission(roleKey: string, permission: CreditManagePermission) {
    if (!rolePermissions[roleKey]?.includes(permission)) {
      throw new ForbiddenException({
        message: 'Permission denied',
        errors: { permission: `Missing permission: ${permission}` },
      });
    }
  }
}
