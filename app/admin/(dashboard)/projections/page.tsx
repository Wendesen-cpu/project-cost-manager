import { prisma } from '@/app/lib/prisma';
import { ProjectionsChart } from '@/components/ProjectionsChart';
import { addMonths, format, startOfMonth, endOfMonth, differenceInBusinessDays, isAfter, isBefore } from 'date-fns';

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

        // Calculate business days in this specific month
        const businessDaysInMonth = differenceInBusinessDays(monthEnd, monthStart) + 1;

        let monthlyRevenue = 0;
        let monthlyCost = 0;

        projects.forEach((project: any) => {
            const pStart = project.startDate;
            const pEnd = project.endDate || addMonths(pStart, 12);

            if (pStart <= monthEnd && pEnd >= monthStart) {
                // Revenue
                if (project.paymentType === 'FIXED' && project.totalPrice) {
                    const durationMonths = Math.max(1, (pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24 * 30));
                    monthlyRevenue += project.totalPrice / durationMonths;
                }

                // Costs
                monthlyCost += project.fixedMonthlyCosts;

                // Labor Costs & Hourly Revenue (Members)
                project.members.forEach((member: any) => {
                    const assignmentStart = new Date(member.startDate);
                    const assignmentEnd = member.endDate ? new Date(member.endDate) : pEnd;

                    // Calculate overlap between month and assignment period
                    const effectiveStart = isAfter(assignmentStart, monthStart) ? assignmentStart : monthStart;
                    const effectiveEnd = isBefore(assignmentEnd, monthEnd) ? assignmentEnd : monthEnd;

                    if (isAfter(effectiveStart, effectiveEnd)) return;

                    const activeDays = differenceInBusinessDays(effectiveEnd, effectiveStart) + 1;
                    const hoursInMonth = member.dailyHours * activeDays;

                    // Cost contribution: (MonthlyCost / 160) * projected_hours
                    const hourlyCost = member.employee.monthlyCost / 160;
                    monthlyCost += hourlyCost * hoursInMonth;

                    // Revenue contribution for hourly projects
                    if (project.paymentType === 'HOURLY') {
                        monthlyRevenue += hoursInMonth * (project.hourlyRate || 0);
                    }
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{row.revenue.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{row.cost.toLocaleString()}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${row.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    €{row.margin.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
