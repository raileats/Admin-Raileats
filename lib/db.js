// lib/db.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // prevent multiple instances of PrismaClient in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
