'use client';

import { assignEmployeeToProject } from '@/app/actions/projects';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AssignEmployeeForm({ projectId, employees }: { projectId: string; employees: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [dailyHours, setDailyHours] = useState('8');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    async function onAssign() {
        if (!selectedEmployee) return;
        setLoading(true);
        await assignEmployeeToProject(
            projectId,
            selectedEmployee,
            parseFloat(dailyHours),
            new Date(startDate),
            endDate ? new Date(endDate) : undefined
        );
        setSelectedEmployee('');
        setDailyHours('8');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setLoading(false);
        router.refresh();
    }

    return (
        <div className="flex flex-col gap-4 bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Employee...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Hrs</label>
                    <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={dailyHours}
                        onChange={(e) => setDailyHours(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    onClick={onAssign}
                    disabled={loading || !selectedEmployee}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors duration-200 text-sm font-medium shadow-sm"
                >
                    {loading ? 'Adding...' : 'Add Team Member'}
                </button>
            </div>
        </div>
    );
}
