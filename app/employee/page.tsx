import { getEmployeeSession } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeePage() {
    const session = await getEmployeeSession();

    if (session) {
        redirect(`/employee/${session.id}`);
    } else {
        redirect('/employee/login');
    }
}
