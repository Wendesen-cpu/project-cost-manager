import { getEmployeeSession } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeeDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getEmployeeSession();

    if (!session) {
        redirect('/employee/login');
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {children}
        </div>
    );
}
