import { getEmployees } from '@/app/actions/employees';
import { EmployeesContent } from '@/components/EmployeesContent';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const employees = await getEmployees();

    return <EmployeesContent employees={employees} />;
}
