import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { parsePagination } from '../../common/utils/pagination';
import type { Prisma } from '../../../../../packages/database/node_modules/@prisma/client';
import { AssignCenterRoleDto } from './dto/assign-center-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const ACTIVE_USER_ROLE_STATUS = 'ACTIVE';
const DEFAULT_USER_STATUS = 'INVITED';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const prisma = await this.prisma.getClient();
    const { page, pageSize, skip, take } = parsePagination(query);
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          roles: {
            where: { status: ACTIVE_USER_ROLE_STATUS },
            include: { center: true, role: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      pagination: { page, pageSize, total },
    };
  }

  async getById(userId: string) {
    const prisma = await this.prisma.getClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedCenters: true,
        roles: {
          include: { center: true, role: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const prisma = await this.prisma.getClient();

    return prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash: dto.passwordHash,
        fullName: dto.fullName,
        status: dto.status ?? DEFAULT_USER_STATUS,
      },
    });
  }

  async assignCenterRole(userId: string, dto: AssignCenterRoleDto) {
    await this.getById(userId);
    const prisma = await this.prisma.getClient();

    return prisma.userRole.upsert({
      where: {
        userId_roleId_centerId: {
          userId,
          roleId: dto.roleId,
          centerId: dto.centerId,
        },
      },
      create: {
        userId,
        roleId: dto.roleId,
        centerId: dto.centerId,
        status: ACTIVE_USER_ROLE_STATUS,
      },
      update: {
        status: ACTIVE_USER_ROLE_STATUS,
        revokedAt: null,
      },
      include: {
        center: true,
        role: true,
        user: true,
      },
    });
  }
}
