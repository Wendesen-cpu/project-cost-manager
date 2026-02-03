import { getEmployee } from '@/app/actions/employees';
import { EmployeeForm } from '@/components/EmployeeForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditEmployeePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const employee = await getEmployee(params.id);

    if (!employee) notFound();

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Edit Employee: {employee.firstName} {employee.lastName}</h2>
            <EmployeeForm employee={employee} />
        </div>
    );
}
