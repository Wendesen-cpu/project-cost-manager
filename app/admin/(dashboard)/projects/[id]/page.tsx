import { prisma } from '@/app/lib/prisma';
import { intervalToDuration, formatDuration, differenceInBusinessDays, isAfter, isBefore } from 'date-fns';
import { getSession, SUPER_ADMIN_EMAIL } from '@/app/lib/auth';
import { notFound } from 'next/navigation';
import { ProjectDetailsContent } from '@/components/ProjectDetailsContent';

export const dynamic = 'force-dynamic';

async function getProjectDetails(id: string) {
    return await prisma.project.findUnique({
        where: { id },
        include: {
            owner: true,
            members: {
                include: {
                    employee: true
                }
            },
            workLogs: {
                include: {
                    employee: true
                }
            }
        }
    });
}

async function getAvailableEmployees() {
    return await prisma.employee.findMany();
}

export default async function ProjectDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getSession();
    const project = await getProjectDetails(params.id);
    const employees = await getAvailableEmployees();

    if (!project) notFound();

    // Cost Calculation
    const totalHoursLogged = project.workLogs.reduce((sum: number, log: any) => sum + log.hours, 0);

    // Labor Cost: Sum of (Log.hours * Employee.hourlyCost)
    const laborCost = project.workLogs.reduce((sum: number, log: any) => {
        const hourlyCost = log.employee.monthlyCost / 160;
        return sum + (log.hours * hourlyCost);
    }, 0);

    // Fixed Costs
    const endDate = project.endDate || new Date();
    const durationMonths = Math.max(1, (endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const totalFixedMonthlyCost = project.fixedMonthlyCosts * durationMonths;

    // Estimated Cost Calculation
    const businessDays = differenceInBusinessDays(endDate, project.startDate) + 1;

    // Labor Cost Estimation
    const estimatedLaborCost = project.members.reduce((sum: number, member: any) => {
        const hourlyCost = member.employee.monthlyCost / 160;

        const assignmentStart = new Date(member.startDate);
        const assignmentEnd = member.endDate ? new Date(member.endDate) : endDate;

        const effectiveStart = isAfter(assignmentStart, project.startDate) ? assignmentStart : project.startDate;
        const effectiveEnd = isBefore(assignmentEnd, endDate) ? assignmentEnd : endDate;

        if (isAfter(effectiveStart, effectiveEnd)) return sum;

        const memberDays = differenceInBusinessDays(effectiveEnd, effectiveStart) + 1;
        return sum + (hourlyCost * member.dailyHours * memberDays);
    }, 0);
    const estimatedTotalCost = estimatedLaborCost + totalFixedMonthlyCost + project.fixedTotalCosts;

    const isOwner = session?.id === (project as any).ownerId;
    const isSuperAdmin = session?.email === SUPER_ADMIN_EMAIL;
    const canManage = isOwner || isSuperAdmin;

    // Calculate formatted duration for display
    const durationObj = intervalToDuration({
        start: project.startDate,
        end: endDate
    });
    const formattedDuration = formatDuration(durationObj, { format: ['years', 'months', 'days'] }) || '0 days';
    const totalCost = laborCost + totalFixedMonthlyCost + project.fixedTotalCosts;

    // Revenue
    let revenue = 0;
    if (project.paymentType === 'FIXED') {
        revenue = project.totalPrice || 0;
    } else {
        revenue = totalHoursLogged * (project.hourlyRate || 0);
    }

    const margin = revenue - totalCost;

    return (
        <ProjectDetailsContent
            project={project}
            employees={employees}
            revenue={revenue}
            laborCost={laborCost}
            totalCost={totalCost}
            margin={margin}
            estimatedLaborCost={estimatedLaborCost}
            estimatedTotalCost={estimatedTotalCost}
            totalFixedMonthlyCost={totalFixedMonthlyCost}
            totalHoursLogged={totalHoursLogged}
            formattedDuration={formattedDuration}
            canManage={canManage}
        />
    );
}
