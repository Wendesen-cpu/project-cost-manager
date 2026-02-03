import { prisma } from '@/app/lib/prisma';
import { Users, Briefcase, TrendingUp } from 'lucide-react';

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

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Active Projects</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.projectCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Employees</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.employeeCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Est. Mth Revenue</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">€{stats.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                    <a href="/admin/projects/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">New Project</a>
                    <a href="/admin/employees/new" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">New Employee</a>
                </div>
            </div>
        </div>
    );
}
