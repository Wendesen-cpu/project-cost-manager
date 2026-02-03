const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching admins...');
    const admins = await prisma.admin.findMany();
    console.log('Admins found:', admins.map(a => ({ id: a.id, email: a.email })));

    if (admins.length === 0) {
        console.log('No admins found. Cannot create project without an owner.');
        return;
    }

    const ownerId = admins[0].id;
    console.log(`Using ownerId: ${ownerId}`);

    try {
        console.log('Attempting to create project...');
        const project = await prisma.project.create({
            data: {
                name: 'Scripted Test Project',
                description: 'Created by test script',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
                status: 'ACTIVE',
                paymentType: 'FIXED',
                totalPrice: 1000,
                fixedMonthlyCosts: 0,
                fixedTotalCosts: 500,
                ownerId: ownerId,
            },
        });
        console.log('Project created successfully:', project.id);
    } catch (error) {
        console.error('Error creating project:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
