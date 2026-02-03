import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting role migration...');

    // 1. Update ADMIN to PM in both tables
    // (Employee table uses role "EMPLOYEE" by default, but let's check both for safety)
    const adminToPmCount = await prisma.admin.updateMany({
        where: { role: 'ADMIN' },
        data: { role: 'PM' }
    });
    console.log(`Updated ${adminToPmCount.count} admins from ADMIN to PM`);

    const employeeAdminToPmCount = await prisma.employee.updateMany({
        where: { role: 'ADMIN' },
        data: { role: 'PM' }
    });
    console.log(`Updated ${employeeAdminToPmCount.count} employees from ADMIN to PM`);

    // 2. Update SUPER_ADMIN to ADMIN
    const superAdminToAdminCount = await prisma.admin.updateMany({
        where: { role: 'SUPER_ADMIN' },
        data: { role: 'ADMIN' }
    });
    console.log(`Updated ${superAdminToAdminCount.count} admins from SUPER_ADMIN to ADMIN`);

    const employeeSuperAdminToAdminCount = await prisma.employee.updateMany({
        where: { role: 'SUPER_ADMIN' },
        data: { role: 'ADMIN' }
    });
    console.log(`Updated ${employeeSuperAdminToAdminCount.count} employees from SUPER_ADMIN to ADMIN`);

    console.log('Role migration completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
