import { prisma } from '@/app/lib/prisma';
import { ProjectionsChart } from '@/components/ProjectionsChart';
import { addMonths, format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

async function getProjectionData() {
    // 1. Get all active projects
    const projects = await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        include: {
            members: {
                include: {
                    employee: true
                }
            }
        }
    });

    // 2. Generate next 12 months
    const today = new Date();
    const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(today), i));

    const data = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthLabel = format(month, 'MMM yyyy');

        let monthlyRevenue = 0;
        let monthlyCost = 0;

        projects.forEach((project: any) => {
            // Check if project is active in this month
            // If project has no end date, assume active? Or use a default duration.
            const pStart = project.startDate;
            const pEnd = project.endDate || addMonths(pStart, 12); // Default 1 year if undefined

            // Check overlap
            if (pStart <= monthEnd && pEnd >= monthStart) {
                // Determine overlaps
                // Simple logic: If active at all in month, count full month? Or pro-rata?
                // Let's count full month for simplicity of projection visualization

                // Revenue
                if (project.paymentType === 'FIXED' && project.totalPrice) {
                    const durationMonths = Math.max(1, (pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24 * 30));
                    monthlyRevenue += project.totalPrice / durationMonths;
                } else if (project.paymentType === 'HOURLY') {
                    // Estimate: 4 weeks * 40 hours? Or avg logged?
                    // Let's assume hardcoded estimation for hourly: 160 hours * rate
                    monthlyRevenue += 160 * (project.hourlyRate || 0);
                }

                // Costs
                // Fixed Project Costs
                monthlyCost += project.fixedMonthlyCosts;

                // Labor Costs (Members)
                project.members.forEach((member: any) => {
                    // Assume full allocation? Or split by projects?
                    // If employee is on 2 projects, do we double count?
                    // "Costo mensile" is total cost to company.
                    // We should probably partition this.
                    // Implementation Plan said: "Cost of project based on assigned employees".
                    // If an employee is assigned to 2 projects, usually they split time.
                    // Let's assume 100% / number_of_projects_assigned?
                    // That requires knowing all assignments for that employee.
                    // Simplified: Add full monthly cost. (This represents "If I have this project, I need this person").
                    monthlyCost += member.employee.monthlyCost;
                });
            }
        });

        return {
            month: monthLabel,
            revenue: Math.round(monthlyRevenue),
            cost: Math.round(monthlyCost),
            margin: Math.round(monthlyRevenue - monthlyCost)
        };
    });

    return data;
}

export default async function ProjectionsPage() {
    const data = await getProjectionData();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Financial Projections</h2>
            <ProjectionsChart data={data} />

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.month}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.month}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.revenue.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.cost.toLocaleString()}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${row.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${row.margin.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
