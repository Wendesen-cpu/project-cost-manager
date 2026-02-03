const { PrismaClient } = require('@prisma/client');
console.log('PrismaClient exported:', !!PrismaClient);
try {
    const prisma = new PrismaClient();
    console.log('PrismaClient instantiated successfully');
} catch (e) {
    console.error('Instantiation failed:', e.message);
}
