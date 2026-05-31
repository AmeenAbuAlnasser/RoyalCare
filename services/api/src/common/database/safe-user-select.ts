import type { Prisma } from '@royalcare/db';

export const safeUserSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;
