import { prisma } from '@/app/lib/prisma';
import { addMonths, format, startOfMonth, endOfMonth, differenceInBusinessDays, isAfter, isBefore } from 'date-fns';
import { ProjectionsContent } from '@/components/ProjectionsContent';

export const dynamic = 'force-dynamic';
// ... existing getProjectionData function ...
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

    return <ProjectionsContent data={data} />;
}
