'use client';

import { assignEmployeeToProject } from '@/app/actions/projects';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AssignEmployeeForm({ projectId, employees }: { projectId: string; employees: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    async function onAssign() {
        if (!selectedEmployee) return;
        setLoading(true);
        await assignEmployeeToProject(projectId, selectedEmployee);
        setLoading(false);
        setSelectedEmployee('');
        router.refresh();
    }

    return (
        <div className="flex gap-2 items-end">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Team Member</label>
                <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={onAssign}
                disabled={loading || !selectedEmployee}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
                {loading ? 'Adding...' : 'Add'}
            </button>
        </div>
    );
}
