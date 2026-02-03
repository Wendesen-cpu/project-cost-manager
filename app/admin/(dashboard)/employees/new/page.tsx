import { EmployeeForm } from '@/components/EmployeeForm';

export default function NewEmployeePage() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Add New Employee</h2>
            <EmployeeForm />
        </div>
    );
}
