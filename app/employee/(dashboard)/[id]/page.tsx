import { getEmployeeDashboardData } from '@/app/actions/worklogs';
import { notFound, redirect } from 'next/navigation';
import { getEmployeeSession } from '@/app/lib/auth';
import { EmployeeDashboardContent } from './EmployeeDashboardContent';

export const dynamic = 'force-dynamic';

export default async function EmployeeDashboardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getEmployeeSession();

    // Safety: Ensure employee can only see THEIR OWN dashboard
    if (!session || session.id !== params.id) {
        redirect('/employee/login');
    }

    const employee = await getEmployeeDashboardData(params.id);

    if (!employee) notFound();

    return <EmployeeDashboardContent employee={employee} />;
}
