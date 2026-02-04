import { prisma } from '@/app/lib/prisma';
import { DashboardContent } from '@/components/DashboardContent';

export const dynamic = 'force-dynamic';

async function getStats() {
    const projectCount = await prisma.project.count({ where: { status: 'ACTIVE' } });
    const employeeCount = await prisma.employee.count();

    // Calculate Estimated Monthly Revenue from Active Fixed Price Projects
    const activeProjects = await prisma.project.findMany({
        where: { status: 'ACTIVE', paymentType: 'FIXED', totalPrice: { not: null } }
    });

    let monthlyRevenue = 0;
    activeProjects.forEach((p: any) => {
        if (p.startDate && p.endDate && p.totalPrice) {
            const months = Math.max(1, (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            monthlyRevenue += p.totalPrice / months;
        }
    });

    return { projectCount, employeeCount, monthlyRevenue };
}

export default async function AdminDashboardPage() {
    const stats = await getStats();

    return <DashboardContent stats={stats} />;
}
