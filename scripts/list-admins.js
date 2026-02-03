import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.admin.findMany().then(admins => console.log('Current Admins:', admins)).finally(() => prisma.$disconnect());
