import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  PatientGender,
  PatientStatus,
  Prisma,
} from '../../../../../../packages/database/node_modules/@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import type { CreatePatientDto } from '../dto/create-patient.dto';
import type { UpdatePatientStatusDto } from '../dto/update-patient-status.dto';
import type { UpdatePatientDto } from '../dto/update-patient.dto';

const PATIENT_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;
const PATIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

const patientSelect = {
  id: true,
  centerId: true,
  fullName: true,
  phone: true,
  email: true,
  gender: true,
  dateOfBirth: true,
  nationalId: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PatientSelect;

function optionalTrimmed(value?: string | null) {
  return typeof value === 'string' ? value.trim() : value;
}

function optionalLowerTrimmed(value?: string | null) {
  const trimmed = optionalTrimmed(value);

  return typeof trimmed === 'string' ? trimmed.toLowerCase() : trimmed;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+?[0-9][0-9\s().-]{6,24}$/.test(value);
}

function isAllowedValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return typeof value === 'string' && allowedValues.includes(value);
}

function parseDateOfBirth(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value.trim() === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'invalid';
  }

  return parsed;
}

function validationFailed(errors: Record<string, string>) {
  return new BadRequestException({
    message: 'Validation failed',
    errors,
  });
}

function duplicatePhone() {
  return new ConflictException({
    message: 'Validation failed',
    errors: {
      phone: 'A patient with this phone already exists in this center.',
    },
  });
}

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(centerId: string, query?: { search?: string }) {
    const prisma = await this.prisma.getClient();
    const search = optionalTrimmed(query?.search);
    const where: Prisma.PatientWhereInput = {
      centerId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: patientSelect,
        take: 100,
      }),
      prisma.patient.count({ where }),
    ]);

    return { items, total };
  }

  async create(centerId: string, dto: CreatePatientDto) {
    const validated = this.validateCreate(dto);
    const prisma = await this.prisma.getClient();

    try {
      return await prisma.patient.create({
        data: {
          centerId,
          fullName: validated.fullName,
          phone: validated.phone,
          email: validated.email,
          gender: validated.gender,
          dateOfBirth: validated.dateOfBirth,
          nationalId: validated.nationalId,
          notes: validated.notes,
          status: validated.status,
        },
        select: patientSelect,
      });
    } catch (error) {
      if (this.isDuplicatePhoneError(error)) {
        throw duplicatePhone();
      }

      throw error;
    }
  }

  async getById(centerId: string, patientId: string) {
    const prisma = await this.prisma.getClient();
    const patient = await prisma.patient.findFirst({
      where: { centerId, id: patientId },
      select: patientSelect,
    });

    if (!patient) {
      throw new NotFoundException({
        message: 'Patient not found',
        errors: { patient: 'Patient not found.' },
      });
    }

    return patient;
  }

  async update(centerId: string, patientId: string, dto: UpdatePatientDto) {
    await this.getById(centerId, patientId);

    const validated = this.validateUpdate(dto);
    const prisma = await this.prisma.getClient();

    try {
      return await prisma.patient.update({
        where: { id: patientId },
        data: validated,
        select: patientSelect,
      });
    } catch (error) {
      if (this.isDuplicatePhoneError(error)) {
        throw duplicatePhone();
      }

      throw error;
    }
  }

  async updateStatus(
    centerId: string,
    patientId: string,
    dto: UpdatePatientStatusDto,
  ) {
    const status = optionalTrimmed(dto.status);

    if (!isAllowedValue(status, PATIENT_STATUSES)) {
      throw validationFailed({
        status: 'Select a valid patient status.',
      });
    }

    return this.update(centerId, patientId, { status });
  }

  private validateCreate(dto: CreatePatientDto) {
    const errors: Record<string, string> = {};
    const fullName = optionalTrimmed(dto.fullName);
    const phone = optionalTrimmed(dto.phone);
    const email = optionalLowerTrimmed(dto.email);
    const gender = optionalTrimmed(dto.gender) ?? 'UNKNOWN';
    const status = optionalTrimmed(dto.status) ?? 'ACTIVE';
    const dateOfBirth = parseDateOfBirth(dto.dateOfBirth);

    if (!fullName) {
      errors.fullName = 'Patient name is required.';
    }

    if (!phone || !isValidPhone(phone)) {
      errors.phone = 'Enter a valid phone number.';
    }

    if (email && !isValidEmail(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!isAllowedValue(gender, PATIENT_GENDERS)) {
      errors.gender = 'Select a valid gender.';
    }

    if (!isAllowedValue(status, PATIENT_STATUSES)) {
      errors.status = 'Select a valid patient status.';
    }

    if (dateOfBirth === 'invalid') {
      errors.dateOfBirth = 'Enter a valid date of birth.';
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    return {
      fullName: fullName as string,
      phone: phone as string,
      email: email || null,
      gender: gender as PatientGender,
      dateOfBirth: dateOfBirth instanceof Date ? dateOfBirth : null,
      nationalId: optionalTrimmed(dto.nationalId) || null,
      notes: optionalTrimmed(dto.notes) || null,
      status: status as PatientStatus,
    };
  }

  private validateUpdate(dto: UpdatePatientDto) {
    const errors: Record<string, string> = {};
    const data: Prisma.PatientUpdateInput = {};

    if (dto.fullName !== undefined) {
      const fullName = optionalTrimmed(dto.fullName);

      if (!fullName) {
        errors.fullName = 'Patient name is required.';
      } else {
        data.fullName = fullName;
      }
    }

    if (dto.phone !== undefined) {
      const phone = optionalTrimmed(dto.phone);

      if (!phone || !isValidPhone(phone)) {
        errors.phone = 'Enter a valid phone number.';
      } else {
        data.phone = phone;
      }
    }

    if (dto.email !== undefined) {
      const email = optionalLowerTrimmed(dto.email);

      if (email && !isValidEmail(email)) {
        errors.email = 'Enter a valid email address.';
      } else {
        data.email = email || null;
      }
    }

    if (dto.gender !== undefined) {
      const gender = optionalTrimmed(dto.gender);

      if (!isAllowedValue(gender, PATIENT_GENDERS)) {
        errors.gender = 'Select a valid gender.';
      } else {
        data.gender = gender;
      }
    }

    if (dto.status !== undefined) {
      const status = optionalTrimmed(dto.status);

      if (!isAllowedValue(status, PATIENT_STATUSES)) {
        errors.status = 'Select a valid patient status.';
      } else {
        data.status = status;
      }
    }

    if (dto.dateOfBirth !== undefined) {
      const dateOfBirth = parseDateOfBirth(dto.dateOfBirth);

      if (dateOfBirth === 'invalid') {
        errors.dateOfBirth = 'Enter a valid date of birth.';
      } else {
        data.dateOfBirth = dateOfBirth;
      }
    }

    if (dto.nationalId !== undefined) {
      data.nationalId = optionalTrimmed(dto.nationalId) || null;
    }

    if (dto.notes !== undefined) {
      data.notes = optionalTrimmed(dto.notes) || null;
    }

    if (Object.keys(errors).length > 0) {
      throw validationFailed(errors);
    }

    return data;
  }

  private isDuplicatePhoneError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
